/**
 * API Service Security Tests
 * Tests JWT payload validation, token handling hardening, and API integration
 * with the ForgeComply 360 backend.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  decodeToken,
  isTokenExpired,
  setToken,
  setApiUrl,
  clearToken,
  getToken,
  api,
  ApiError as _ApiError,
  isOnlineMode,
} from './api';

// --- Storage mocks ---
const localStorageMock = {
  data: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.data[key] || null),
  setItem: vi.fn((key: string, value: string) => { localStorageMock.data[key] = value; }),
  removeItem: vi.fn((key: string) => { delete localStorageMock.data[key]; }),
  clear: vi.fn(() => { localStorageMock.data = {}; }),
  length: 0,
  key: vi.fn(),
};

const sessionStorageMock = {
  data: {} as Record<string, string>,
  getItem: vi.fn((key: string) => sessionStorageMock.data[key] || null),
  setItem: vi.fn((key: string, value: string) => { sessionStorageMock.data[key] = value; }),
  removeItem: vi.fn((key: string) => { delete sessionStorageMock.data[key]; }),
  clear: vi.fn(() => { sessionStorageMock.data = {}; }),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(global, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock });

// --- Helpers ---
function createJWT(payload: object, exp?: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, exp }));
  return `${header}.${body}.test-sig`;
}

function validJWT(extra: object = {}): string {
  return createJWT(
    { userId: 'u-1', orgId: 'o-1', sspId: 'ssp-1', ...extra },
    Math.floor(Date.now() / 1000) + 3600,
  );
}

describe('API Service — Security Hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.data = {};
    sessionStorageMock.data = {};
  });

  // =========================================================================
  // JWT Payload Validation (C1 fix — only known fields extracted)
  // =========================================================================
  describe('JWT Payload Validation', () => {
    it('should extract only known fields from the payload', () => {
      const token = createJWT(
        { userId: 'u-1', orgId: 'o-1', sspId: 'ssp-1', admin: true, role: 'superadmin' },
        Math.floor(Date.now() / 1000) + 3600,
      );
      const decoded = decodeToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded).toEqual({
        exp: expect.any(Number),
        userId: 'u-1',
        orgId: 'o-1',
        sspId: 'ssp-1',
      });
      // Unknown fields must not leak through
      expect(decoded).not.toHaveProperty('admin');
      expect(decoded).not.toHaveProperty('role');
    });

    it('should reject payload that is a JSON array', () => {
      // An array is valid JSON but not a valid JWT payload object
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify([1, 2, 3]));
      const token = `${header}.${body}.sig`;
      expect(decodeToken(token)).toBeNull();
    });

    it('should reject payload that is a JSON primitive', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify('just-a-string'));
      const token = `${header}.${body}.sig`;
      expect(decodeToken(token)).toBeNull();
    });

    it('should coerce non-string sspId to undefined', () => {
      const token = createJWT({ sspId: 12345, userId: null }, Math.floor(Date.now() / 1000) + 3600);
      const decoded = decodeToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded!.sspId).toBeUndefined();
      expect(decoded!.userId).toBeUndefined();
    });

    it('should coerce non-number exp to undefined', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify({ exp: 'not-a-number' }));
      const token = `${header}.${body}.sig`;
      const decoded = decodeToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded!.exp).toBeUndefined();
    });

    it('should reject tokens with fewer than 3 parts', () => {
      expect(decodeToken('only.two')).toBeNull();
      expect(decodeToken('one')).toBeNull();
      expect(decodeToken('')).toBeNull();
    });

    it('should reject tokens with invalid base64 in payload', () => {
      expect(decodeToken('aaa.!!!.ccc')).toBeNull();
    });

    it('should handle very large payloads gracefully', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256' }));
      const bigPayload = btoa(JSON.stringify({ userId: 'x'.repeat(10000) }));
      const token = `${header}.${bigPayload}.sig`;
      const decoded = decodeToken(token);
      // Should still decode — just a large userId
      expect(decoded).not.toBeNull();
      expect(decoded!.userId).toHaveLength(10000);
    });
  });

  // =========================================================================
  // Token Expiry Edge Cases
  // =========================================================================
  describe('Token Expiry Edge Cases', () => {
    it('should treat exp=0 as expired', () => {
      const token = createJWT({ userId: 'u-1' }, 0);
      expect(isTokenExpired(token)).toBe(true);
    });

    it('should handle negative exp', () => {
      const token = createJWT({ userId: 'u-1' }, -1000);
      expect(isTokenExpired(token)).toBe(true);
    });

    it('should use default buffer of 300s', () => {
      // Token expires in 200 seconds — within default 300s buffer
      const token = createJWT({}, Math.floor(Date.now() / 1000) + 200);
      expect(isTokenExpired(token)).toBe(true);
    });

    it('should allow custom buffer of 0', () => {
      // Token expires in 1 second — not expired with 0 buffer
      const token = createJWT({}, Math.floor(Date.now() / 1000) + 1);
      expect(isTokenExpired(token, 0)).toBe(false);
    });
  });

  // =========================================================================
  // API Fetch with ForgeComply 360 Backend
  // =========================================================================
  describe('ForgeComply 360 API Integration', () => {
    beforeEach(() => {
      vi.mocked(global.fetch).mockReset();
      setApiUrl('https://forgecomply.example.com');
    });

    it('should send Bearer token in Authorization header', async () => {
      const token = validJWT();
      setToken(token);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ ssp_id: 'ssp-1' }),
      } as Response);

      await api('/api/v1/ssp/ssp-1');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://forgecomply.example.com/api/v1/ssp/ssp-1',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        }),
      );
    });

    it('should auto-clear expired token and throw 401', async () => {
      const expired = createJWT({ userId: 'u-1' }, Math.floor(Date.now() / 1000) - 100);
      setToken(expired);

      await expect(api('/api/v1/ssp/ssp-1')).rejects.toThrow('Session expired');
      expect(getToken()).toBeNull();
    });

    it('should handle 409 Conflict from backend', async () => {
      setToken(validJWT());

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 409,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Duplicate entry' }),
      } as Response);

      await expect(api('/api/v1/ssp/ssp-1/info-types', {
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      })).rejects.toThrow('Duplicate entry');
    });

    it('should handle network failures gracefully', async () => {
      setToken(validJWT());

      vi.mocked(global.fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(api('/api/v1/ssp/ssp-1')).rejects.toThrow('Network error');
    });

    it('should set Content-Type for JSON body', async () => {
      setToken(validJWT());

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ ok: true }),
      } as Response);

      await api('/api/v1/ssp/ssp-1', {
        method: 'PUT',
        body: JSON.stringify({ system_name: 'Test' }),
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should handle text responses from backend', async () => {
      setToken(validJWT());

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'OK',
      } as Response);

      const result = await api<string>('/api/v1/health');
      expect(result).toBe('OK');
    });

    it('should not send auth header when no token is stored', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ public: true }),
      } as Response);

      await api('/api/v1/public');

      const callArgs = vi.mocked(global.fetch).mock.calls[0][1] as RequestInit;
      const headers = callArgs.headers as Record<string, string>;
      expect(headers.Authorization).toBeUndefined();
    });
  });

  // =========================================================================
  // Online mode detection with ForgeComply 360
  // =========================================================================
  describe('Online Mode Detection', () => {
    it('should return false after clearToken', () => {
      setApiUrl('https://forgecomply.example.com');
      setToken(validJWT());
      expect(isOnlineMode()).toBe(true);

      clearToken();
      expect(isOnlineMode()).toBe(false);
    });
  });
});
