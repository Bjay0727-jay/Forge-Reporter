/**
 * ForgeComply 360 Reporter - API Client
 * Handles communication with the main ForgeComply 360 backend
 *
 * Security: Auth tokens are stored in sessionStorage (not localStorage) to reduce
 * XSS vulnerability. sessionStorage is cleared when the tab closes and is not
 * accessible from other tabs, limiting the attack surface.
 */

// Storage keys
const TOKEN_KEY = 'forgecomply360-reporter-token';
const API_URL_KEY = 'forgecomply360-reporter-api-url';

// Default API URL from environment
const DEFAULT_API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Get the configured API URL (stored in localStorage for persistence)
 */
export function getApiUrl(): string {
  return localStorage.getItem(API_URL_KEY) || DEFAULT_API_URL;
}

/**
 * Set the API URL (non-sensitive, can persist in localStorage)
 */
export function setApiUrl(url: string): void {
  localStorage.setItem(API_URL_KEY, url);
}

/**
 * Get the stored auth token (from sessionStorage for security)
 * Falls back to localStorage for migration from older versions
 */
export function getToken(): string | null {
  // Check sessionStorage first (secure)
  const sessionToken = sessionStorage.getItem(TOKEN_KEY);
  if (sessionToken) return sessionToken;

  // Fallback: migrate from localStorage if present (older versions)
  const localToken = localStorage.getItem(TOKEN_KEY);
  if (localToken) {
    // Migrate to sessionStorage and remove from localStorage
    sessionStorage.setItem(TOKEN_KEY, localToken);
    localStorage.removeItem(TOKEN_KEY);
    return localToken;
  }

  return null;
}

/**
 * Store the auth token (in sessionStorage for XSS protection)
 */
export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  // Ensure old localStorage token is cleared
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Clear the auth token (from both storage locations)
 */
export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY); // Clear any migrated tokens
}

/**
 * Check if we're in online mode (have API URL and token)
 */
export function isOnlineMode(): boolean {
  return Boolean(getApiUrl() && getToken());
}

/**
 * Decode a JWT payload for client-side display and expiry checks.
 *
 * SECURITY NOTE: This intentionally does NOT verify the signature because the
 * signing secret lives on the server. All trust decisions (authorization,
 * data access) are made server-side where the token IS verified. Client-side
 * decoding is only used for UI hints (user name, expiry countdown) and for
 * deciding when to prompt re-authentication.
 */
export function decodeToken(token: string): { exp?: number; sspId?: string; userId?: string; orgId?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Validate base64 / base64url encoding before decoding
    if (!/^[A-Za-z0-9_+/=-]+$/.test(parts[1])) return null;

    const payload = JSON.parse(atob(parts[1]));

    // Validate payload is a plain object with expected shape
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      return null;
    }

    // Only extract known fields — ignore anything unexpected
    return {
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
      sspId: typeof payload.sspId === 'string' ? payload.sspId : undefined,
      userId: typeof payload.userId === 'string' ? payload.userId : undefined,
      orgId: typeof payload.orgId === 'string' ? payload.orgId : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Check if token is expired or will expire soon
 */
export function isTokenExpired(token: string, bufferSeconds = 300): boolean {
  const payload = decodeToken(token);
  if (!payload?.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp - now < bufferSeconds;
}

/**
 * API error class
 */
export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Event listeners for API errors
 */
type ErrorListener = (error: ApiError) => void;
const errorListeners: ErrorListener[] = [];

export function onApiError(listener: ErrorListener): () => void {
  errorListeners.push(listener);
  return () => {
    const idx = errorListeners.indexOf(listener);
    if (idx >= 0) errorListeners.splice(idx, 1);
  };
}

function notifyError(error: ApiError): void {
  errorListeners.forEach((listener) => {
    try {
      listener(error);
    } catch (e) {
      console.error('Error listener failed:', e);
    }
  });
}

/**
 * Main API fetch wrapper
 */
export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    throw new ApiError('API URL not configured', 0);
  }

  const token = getToken();

  // Build headers
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Add auth header if we have a token
  if (token) {
    // Check if token is expired
    if (isTokenExpired(token)) {
      clearToken();
      throw new ApiError('Session expired', 401);
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add content-type for JSON bodies
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  // Make request
  const url = path.startsWith('http') ? path : `${apiUrl}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    const error = new ApiError('Network error - unable to reach server', 0);
    notifyError(error);
    throw error;
  }

  // Parse response
  let data: unknown;
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  // Handle errors
  if (!response.ok) {
    const message = typeof data === 'object' && data && 'error' in data
      ? String((data as { error: string }).error)
      : `Request failed with status ${response.status}`;

    const error = new ApiError(message, response.status, data);
    notifyError(error);
    throw error;
  }

  return data as T;
}

/**
 * Parse connection info from URL hash
 * Format: #token=xxx&ssp=yyy&api=zzz
 */
export function parseUrlHash(): { token?: string; sspId?: string; apiUrl?: string } | null {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return null;

  const params = new URLSearchParams(hash.slice(1));
  const token = params.get('token') || undefined;
  const sspId = params.get('ssp') || undefined;
  const apiUrl = params.get('api') || undefined;

  if (!token && !sspId && !apiUrl) return null;

  return { token, sspId, apiUrl };
}

/**
 * Initialize connection from URL hash
 * Returns true if successfully connected
 */
export function initFromUrlHash(): { connected: boolean; sspId?: string } {
  const hashParams = parseUrlHash();
  if (!hashParams) {
    return { connected: false };
  }

  // Store API URL if provided
  if (hashParams.apiUrl) {
    setApiUrl(hashParams.apiUrl);
  }

  // Store and validate token
  if (hashParams.token) {
    if (isTokenExpired(hashParams.token, 60)) {
      console.warn('Token from URL is expired');
      return { connected: false };
    }
    setToken(hashParams.token);
  }

  // Extract SSP ID from token or URL
  let sspId = hashParams.sspId;
  if (!sspId && hashParams.token) {
    const payload = decodeToken(hashParams.token);
    sspId = payload?.sspId;
  }

  // Clear URL hash for security
  if (window.history.replaceState) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  return {
    connected: isOnlineMode(),
    sspId,
  };
}

/**
 * Disconnect from API
 */
export function disconnect(): void {
  clearToken();
}
