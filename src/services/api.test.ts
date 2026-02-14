/**
 * API Service Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getToken,
  setToken,
  clearToken,
  getApiUrl,
  setApiUrl,
  isOnlineMode,
  decodeToken,
  isTokenExpired,
  parseUrlHash,
  api,
  ApiError,
} from './api';

// Mock localStorage (for API URL - non-sensitive)
const localStorageMock = {
  data: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.data[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.data[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.data[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.data = {};
  }),
  length: 0,
  key: vi.fn(),
};

// Mock sessionStorage (for tokens - secure)
const sessionStorageMock = {
  data: {} as Record<string, string>,
  getItem: vi.fn((key: string) => sessionStorageMock.data[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    sessionStorageMock.data[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete sessionStorageMock.data[key];
  }),
  clear: vi.fn(() => {
    sessionStorageMock.data = {};
  }),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(global, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock });

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.data = {};
    sessionStorageMock.data = {};
  });

  describe('Token Management', () => {
    it('should store and retrieve token from sessionStorage', () => {
      const token = 'test-token-123';
      setToken(token);
      expect(getToken()).toBe(token);
      // Verify it's in sessionStorage, not localStorage
      expect(sessionStorageMock.data['forgecomply360-reporter-token']).toBe(token);
      expect(localStorageMock.data['forgecomply360-reporter-token']).toBeUndefined();
    });

    it('should return null when no token exists', () => {
      expect(getToken()).toBeNull();
    });

    it('should clear token from both storage locations', () => {
      setToken('test-token');
      clearToken();
      expect(getToken()).toBeNull();
    });

    it('should migrate token from localStorage to sessionStorage', () => {
      // Simulate old token in localStorage (from older version)
      localStorageMock.data['forgecomply360-reporter-token'] = 'old-token';

      // getToken should migrate it
      const token = getToken();
      expect(token).toBe('old-token');

      // Should now be in sessionStorage
      expect(sessionStorageMock.data['forgecomply360-reporter-token']).toBe('old-token');
      // And removed from localStorage
      expect(localStorageMock.data['forgecomply360-reporter-token']).toBeUndefined();
    });

    it('should prefer sessionStorage over localStorage', () => {
      sessionStorageMock.data['forgecomply360-reporter-token'] = 'session-token';
      localStorageMock.data['forgecomply360-reporter-token'] = 'local-token';

      expect(getToken()).toBe('session-token');
    });
  });

  describe('API URL Management', () => {
    it('should store and retrieve API URL', () => {
      const url = 'https://api.example.com';
      setApiUrl(url);
      expect(getApiUrl()).toBe(url);
    });
  });

  describe('Online Mode Detection', () => {
    it('should return true when both token and API URL exist', () => {
      setApiUrl('https://api.example.com');
      setToken('test-token');
      expect(isOnlineMode()).toBe(true);
    });

    it('should return false when token is missing', () => {
      setApiUrl('https://api.example.com');
      expect(isOnlineMode()).toBe(false);
    });

    it('should return false when API URL is missing', () => {
      setToken('test-token');
      expect(isOnlineMode()).toBe(false);
    });
  });

  describe('JWT Decoding', () => {
    // Create a valid JWT for testing
    const createTestJWT = (payload: object, exp?: number) => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify({ ...payload, exp }));
      const signature = 'test-signature';
      return `${header}.${body}.${signature}`;
    };

    it('should decode valid JWT payload', () => {
      const payload = { userId: 'user-123', orgId: 'org-456', sspId: 'ssp-789' };
      const token = createTestJWT(payload, Math.floor(Date.now() / 1000) + 3600);

      const decoded = decodeToken(token);
      expect(decoded).toMatchObject(payload);
    });

    it('should return null for invalid token', () => {
      expect(decodeToken('invalid-token')).toBeNull();
      expect(decodeToken('')).toBeNull();
      expect(decodeToken('a.b')).toBeNull(); // Too few parts
    });

    it('should return null for malformed JWT', () => {
      expect(decodeToken('a.!!!invalid-base64!!!.c')).toBeNull();
    });
  });

  describe('Token Expiry Check', () => {
    const createTestJWT = (exp: number) => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify({ exp }));
      const signature = 'test';
      return `${header}.${body}.${signature}`;
    };

    it('should return true for expired token', () => {
      const expiredToken = createTestJWT(Math.floor(Date.now() / 1000) - 3600);
      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it('should return true for token expiring soon (within buffer)', () => {
      const soonExpiredToken = createTestJWT(Math.floor(Date.now() / 1000) + 60);
      expect(isTokenExpired(soonExpiredToken, 300)).toBe(true);
    });

    it('should return false for valid token with time remaining', () => {
      const validToken = createTestJWT(Math.floor(Date.now() / 1000) + 3600);
      expect(isTokenExpired(validToken)).toBe(false);
    });

    it('should return true for token without exp claim', () => {
      // Create token without exp
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify({ userId: 'test' }));
      const noExpToken = `${header}.${body}.signature`;
      expect(isTokenExpired(noExpToken)).toBe(true);
    });
  });

  describe('URL Hash Parsing', () => {
    it('should parse token from hash', () => {
      Object.defineProperty(window, 'location', {
        value: { hash: '#token=abc123' },
        writable: true,
      });
      const result = parseUrlHash();
      expect(result?.token).toBe('abc123');
    });

    it('should parse multiple parameters', () => {
      Object.defineProperty(window, 'location', {
        value: { hash: '#token=abc&ssp=ssp-123&api=https://api.test.com' },
        writable: true,
      });
      const result = parseUrlHash();
      expect(result).toEqual({
        token: 'abc',
        sspId: 'ssp-123',
        apiUrl: 'https://api.test.com',
      });
    });

    it('should return null for empty hash', () => {
      Object.defineProperty(window, 'location', {
        value: { hash: '' },
        writable: true,
      });
      expect(parseUrlHash()).toBeNull();
    });

    it('should return null for hash with no relevant params', () => {
      Object.defineProperty(window, 'location', {
        value: { hash: '#other=value' },
        writable: true,
      });
      expect(parseUrlHash()).toBeNull();
    });
  });

  describe('ApiError', () => {
    it('should create error with status and data', () => {
      const error = new ApiError('Test error', 404, { detail: 'Not found' });
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(404);
      expect(error.data).toEqual({ detail: 'Not found' });
      expect(error.name).toBe('ApiError');
    });
  });

  describe('API Fetch', () => {
    beforeEach(() => {
      vi.mocked(global.fetch).mockReset();
    });

    it('should throw when API URL not configured', async () => {
      // Clear any stored API URL
      localStorageMock.data = {};

      await expect(api('/test')).rejects.toThrow('API URL not configured');
    });

    it('should make authenticated request with token', async () => {
      setApiUrl('https://api.example.com');
      const validToken = (() => {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const body = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
        return `${header}.${body}.sig`;
      })();
      setToken(validToken);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      } as Response);

      await api('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Bearer /),
          }),
        })
      );
    });

    it('should parse JSON response', async () => {
      setApiUrl('https://api.example.com');

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'test' }),
      } as Response);

      const result = await api('/test');
      expect(result).toEqual({ data: 'test' });
    });

    it('should throw ApiError on failed response', async () => {
      setApiUrl('https://api.example.com');

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Server error' }),
      } as Response);

      await expect(api('/test')).rejects.toThrow('Server error');
    });
  });
});
