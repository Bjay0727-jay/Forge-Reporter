/**
 * ForgeComply 360 Reporter - API Client
 * Handles communication with the main ForgeComply 360 backend
 */

// Storage keys
const TOKEN_KEY = 'forgecomply360-reporter-token';
const API_URL_KEY = 'forgecomply360-reporter-api-url';

// Default API URL from environment
const DEFAULT_API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Get the configured API URL
 */
export function getApiUrl(): string {
  return localStorage.getItem(API_URL_KEY) || DEFAULT_API_URL;
}

/**
 * Set the API URL
 */
export function setApiUrl(url: string): void {
  localStorage.setItem(API_URL_KEY, url);
}

/**
 * Get the stored auth token
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store the auth token
 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Clear the auth token
 */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Check if we're in online mode (have API URL and token)
 */
export function isOnlineMode(): boolean {
  return Boolean(getApiUrl() && getToken());
}

/**
 * Decode JWT payload without verification
 */
export function decodeToken(token: string): { exp?: number; sspId?: string; userId?: string; orgId?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
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
  } catch (e) {
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
