/**
 * API Service Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getToken,
  setToken,
  setTokens,
  clearToken,
  clearTokens,
  getApiUrl,
  setApiUrl,
  isOnlineMode,
  decodeToken,
  isTokenExpired,
  parseUrlHash,
  initFromUrlHash,
  api,
  ApiError,
  onApiError,
  onAuthFailure,
  disconnect,
} from './api';

// Mock localStorage (for API URL and refresh token persistence)
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

// Mock sessionStorage (no longer used for tokens, but keep for test environment)
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
    // Clear in-memory token between tests
    clearTokens();
  });

  describe('Token Management', () => {
    it('should store and retrieve token from in-memory storage', () => {
      const token = 'test-token-123';
      setToken(token);
      expect(getToken()).toBe(token);
      // Verify token is NOT in localStorage or sessionStorage (in-memory only)
      expect(localStorageMock.data['forgecomply360-reporter-token']).toBeUndefined();
      expect(sessionStorageMock.data['forgecomply360-reporter-token']).toBeUndefined();
    });

    it('should return null when no token exists', () => {
      expect(getToken()).toBeNull();
    });

    it('should clear token', () => {
      setToken('test-token');
      clearToken();
      expect(getToken()).toBeNull();
    });
  });

  describe('API URL Management', () => {
    it('should store and retrieve API URL from allowed domains', () => {
      const url = 'https://forge-comply360-api.stanley-riley.workers.dev';
      setApiUrl(url);
      expect(getApiUrl()).toBe(url);
    });

    it('should reject API URL not in allowlist', () => {
      expect(() => setApiUrl('https://evil.example.com')).toThrow(
        'API URL is not in the trusted domain allowlist'
      );
    });

    it('should allow localhost URLs', () => {
      setApiUrl('http://localhost:3000');
      expect(getApiUrl()).toBe('http://localhost:3000');
    });
  });

  describe('Online Mode Detection', () => {
    it('should return true when token exists', () => {
      setToken('test-token');
      expect(isOnlineMode()).toBe(true);
    });

    it('should return false when token is missing', () => {
      expect(isOnlineMode()).toBe(false);
    });

    it('should return true when API URL falls back to default', () => {
      setToken('test-token');
      // Default API URL is always present as a hardcoded fallback
      expect(isOnlineMode()).toBe(true);
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

    it('should use default API URL when none stored in localStorage', async () => {
      // Clear stored API URL — default fallback URL is still present
      localStorageMock.data = {};

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      } as Response);

      const result = await api('/test');
      expect(result).toEqual({ success: true });
      // Should have called fetch with the default API URL
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('forge-comply360-api.stanley-riley.workers.dev/test'),
        expect.any(Object),
      );
    });

    it('should make authenticated request with token', async () => {
      setApiUrl('https://forge-comply360-api.stanley-riley.workers.dev');
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
        'https://forge-comply360-api.stanley-riley.workers.dev/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Bearer /),
          }),
        })
      );
    });

    it('should parse JSON response', async () => {
      setApiUrl('https://forge-comply360-api.stanley-riley.workers.dev');

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'test' }),
      } as Response);

      const result = await api('/test');
      expect(result).toEqual({ data: 'test' });
    });

    it('should throw ApiError on failed response', async () => {
      setApiUrl('https://forge-comply360-api.stanley-riley.workers.dev');

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Server error' }),
      } as Response);

      await expect(api('/test')).rejects.toThrow('Server error');
    });

    it('should handle network errors', async () => {
      setApiUrl('https://forge-comply360-api.stanley-riley.workers.dev');

      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network failed'));

      await expect(api('/test')).rejects.toThrow('Network error - unable to reach server');
    });

    it('should handle 401 without refresh token by clearing tokens', async () => {
      setApiUrl('https://forge-comply360-api.stanley-riley.workers.dev');
      const validToken = (() => {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const body = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
        return `${header}.${body}.sig`;
      })();
      setToken(validToken);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Unauthorized' }),
      } as Response);

      await expect(api('/test')).rejects.toThrow('Session expired');
      expect(getToken()).toBeNull();
    });

    it('should handle non-JSON response', async () => {
      setApiUrl('https://forge-comply360-api.stanley-riley.workers.dev');

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'plain text response',
      } as Response);

      const result = await api('/test');
      expect(result).toBe('plain text response');
    });

    it('should add Content-Type for JSON body', async () => {
      setApiUrl('https://forge-comply360-api.stanley-riley.workers.dev');

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ ok: true }),
      } as Response);

      await api('/test', { method: 'POST', body: JSON.stringify({ key: 'value' }) });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://forge-comply360-api.stanley-riley.workers.dev/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('Token Pair Management', () => {
    it('should store access token in memory and refresh token in localStorage', () => {
      setTokens('access-token-123', 'refresh-token-456');
      expect(getToken()).toBe('access-token-123');
      // Access token should NOT be in localStorage (in-memory only)
      expect(localStorageMock.data['forgecomply360-reporter-token']).toBeUndefined();
      // Refresh token persists in localStorage
      expect(localStorageMock.data['forgecomply360-reporter-refresh-token']).toBe('refresh-token-456');
    });

    it('should overwrite previous in-memory token when setTokens is called', () => {
      setToken('old-token');
      expect(getToken()).toBe('old-token');

      setTokens('new-access', 'new-refresh');
      expect(getToken()).toBe('new-access');
    });

    it('should clearTokens from all storage', () => {
      setTokens('access', 'refresh');
      clearTokens();
      expect(getToken()).toBeNull();
      expect(localStorageMock.data['forgecomply360-reporter-refresh-token']).toBeUndefined();
    });
  });

  describe('Auth Failure Listener', () => {
    it('should register and fire auth failure listener', () => {
      const listener = vi.fn();
      const unsubscribe = onAuthFailure(listener);

      // Trigger a 401 with no refresh token to fire the listener
      setApiUrl('https://forge-comply360-api.stanley-riley.workers.dev');
      const validToken = (() => {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const body = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
        return `${header}.${body}.sig`;
      })();
      setToken(validToken);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Unauthorized' }),
      } as Response);

      // The listener should fire when 401 triggers session expired
      api('/test').catch(() => {});

      // Wait for async
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(listener).toHaveBeenCalled();
          unsubscribe();
          resolve();
        }, 50);
      });
    });
  });

  describe('API Error Listener', () => {
    it('should register and fire error listeners', async () => {
      const listener = vi.fn();
      const unsubscribe = onApiError(listener);

      setApiUrl('https://forge-comply360-api.stanley-riley.workers.dev');
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Internal error' }),
      } as Response);

      await api('/test').catch(() => {});
      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0].status).toBe(500);

      unsubscribe();
    });
  });

  describe('Disconnect', () => {
    it('should clear all tokens on disconnect', () => {
      setTokens('access', 'refresh');
      disconnect();
      expect(getToken()).toBeNull();
    });
  });

  describe('Default API URL', () => {
    it('should return default ForgeComply 360 URL when no stored URL', () => {
      localStorageMock.data = {};
      expect(getApiUrl()).toBe('https://forge-comply360-api.stanley-riley.workers.dev');
    });

    it('should fall back to default when stored URL is not in allowlist', () => {
      // Manually inject a non-allowed URL into localStorage
      localStorageMock.data['forgecomply360-reporter-api-url'] = 'https://evil.example.com';
      expect(getApiUrl()).toBe('https://forge-comply360-api.stanley-riley.workers.dev');
    });
  });

  describe('API Error Handling', () => {
    beforeEach(() => {
      vi.mocked(global.fetch).mockReset();
    });

    it('should handle 403 forbidden response', async () => {
      setApiUrl('https://forge-comply360-api.stanley-riley.workers.dev');
      const validToken = (() => {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const body = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
        return `${header}.${body}.sig`;
      })();
      setToken(validToken);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Forbidden' }),
      } as Response);

      await expect(api('/test')).rejects.toThrow();
    });

    it('should handle 404 not found response', async () => {
      setApiUrl('https://forge-comply360-api.stanley-riley.workers.dev');
      const validToken = (() => {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const body = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
        return `${header}.${body}.sig`;
      })();
      setToken(validToken);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Not found' }),
      } as Response);

      await expect(api('/test')).rejects.toThrow();
    });

    it('should send POST request with body', async () => {
      setApiUrl('https://forge-comply360-api.stanley-riley.workers.dev');
      const validToken = (() => {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const body = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
        return `${header}.${body}.sig`;
      })();
      setToken(validToken);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ created: true }),
      } as Response);

      const result = await api('/test', {
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      });
      expect(result).toEqual({ created: true });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('initFromUrlHash', () => {
    it('should return connected: false when no hash', () => {
      Object.defineProperty(window, 'location', {
        value: { hash: '', pathname: '/', search: '' },
        writable: true,
      });
      const result = initFromUrlHash();
      expect(result.connected).toBe(false);
    });

    it('should connect with valid token in hash', () => {
      const validToken = (() => {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const body = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, sspId: 'ssp-123' }));
        return `${header}.${body}.sig`;
      })();

      Object.defineProperty(window, 'location', {
        value: {
          hash: `#token=${validToken}&api=https://forge-comply360-api.stanley-riley.workers.dev&ssp=ssp-123`,
          pathname: '/',
          search: '',
        },
        writable: true,
      });

      window.history.replaceState = vi.fn();

      const result = initFromUrlHash();
      expect(result.connected).toBe(true);
      expect(result.sspId).toBe('ssp-123');
    });

    it('should reject expired token in hash', () => {
      const expiredToken = (() => {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const body = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }));
        return `${header}.${body}.sig`;
      })();

      Object.defineProperty(window, 'location', {
        value: {
          hash: `#token=${expiredToken}&api=https://forge-comply360-api.stanley-riley.workers.dev`,
          pathname: '/',
          search: '',
        },
        writable: true,
      });

      const result = initFromUrlHash();
      expect(result.connected).toBe(false);
    });

    it('should extract sspId from token when not in URL', () => {
      const validToken = (() => {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const body = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, sspId: 'from-token' }));
        return `${header}.${body}.sig`;
      })();

      Object.defineProperty(window, 'location', {
        value: {
          hash: `#token=${validToken}&api=https://forge-comply360-api.stanley-riley.workers.dev`,
          pathname: '/',
          search: '',
        },
        writable: true,
      });

      window.history.replaceState = vi.fn();

      const result = initFromUrlHash();
      expect(result.sspId).toBe('from-token');
    });
  });
});
