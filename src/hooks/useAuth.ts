/**
 * ForgeComply 360 Reporter - Authentication Hook
 * Context-based auth with email/password login, registration, MFA, and URL hash support
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  api,
  getToken,
  setToken,
  setTokens,
  clearTokens,
  getApiUrl,
  setApiUrl,
  isOnlineMode,
  decodeToken,
  isTokenExpired,
  initFromUrlHash,
  onApiError,
  onAuthFailure,
} from '../services/api';

// =============================================================================
// Types
// =============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  onboarding_completed?: number;
  mfa_enabled?: number;
}

export interface Org {
  id: string;
  name: string;
  industry?: string;
  subscription_tier?: string;
  subscription_status?: string;
}

export interface MFAResponse {
  mfa_required?: boolean;
  mfa_token?: string;
  mfa_setup_required?: boolean;
  message?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  organizationName?: string;
  industry?: string;
  size?: string;
}

export interface AuthState {
  user: User | null;
  org: Org | null;
  isAuthenticated: boolean;
  isOnlineMode: boolean;
  isLoading: boolean;
  sspId: string | null;
  userId: string | null;
  orgId: string | null;
  apiUrl: string | null;
  error: string | null;
  tokenExpiresAt: Date | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<MFAResponse>;
  verifyMFA: (mfaToken: string, code: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  /** Legacy: connect via API URL + token (URL hash flow) */
  connect: (apiUrl: string, token: string) => Promise<{ success: boolean; error?: string; sspId?: string }>;
  disconnect: () => void;
  refresh: () => void;
  isValid: () => boolean;
}

type AuthContextType = [AuthState, AuthActions];

// =============================================================================
// Context
// =============================================================================

const AuthContext = createContext<AuthContextType | null>(null);

// =============================================================================
// Provider
// =============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    // Check for existing token (from previous login or URL hash)
    const token = getToken();
    const apiUrl = getApiUrl();

    if (token && !isTokenExpired(token)) {
      const payload = decodeToken(token);
      return {
        user: null,
        org: null,
        isAuthenticated: true,
        isOnlineMode: Boolean(apiUrl && token),
        isLoading: true, // Will verify with server
        sspId: payload?.sspId || null,
        userId: payload?.userId || null,
        orgId: payload?.orgId || null,
        apiUrl: apiUrl || null,
        error: null,
        tokenExpiresAt: payload?.exp ? new Date(payload.exp * 1000) : null,
      };
    }

    return {
      user: null,
      org: null,
      isAuthenticated: false,
      isOnlineMode: false,
      isLoading: true,
      sspId: null,
      userId: null,
      orgId: null,
      apiUrl: null,
      error: null,
      tokenExpiresAt: null,
    };
  });

  // Restore session on mount: check URL hash, then try /auth/me
  useEffect(() => {
    const init = async () => {
      // 1. Check URL hash for embedded token
      const hashResult = initFromUrlHash();
      if (hashResult.connected) {
        const token = getToken();
        const payload = token ? decodeToken(token) : null;
        setState((prev) => ({
          ...prev,
          isAuthenticated: true,
          isOnlineMode: true,
          isLoading: false,
          sspId: hashResult.sspId || payload?.sspId || null,
          userId: payload?.userId || null,
          orgId: payload?.orgId || null,
          apiUrl: getApiUrl() || null,
          tokenExpiresAt: payload?.exp ? new Date(payload.exp * 1000) : null,
        }));
        return;
      }

      // 2. If we have a stored token, try to restore session via /auth/me
      const token = getToken();
      if (token && !isTokenExpired(token)) {
        try {
          const data = await api<{ user: User; org: Org }>('/api/v1/auth/me');
          setState({
            user: data.user,
            org: data.org,
            isAuthenticated: true,
            isOnlineMode: true,
            isLoading: false,
            sspId: null,
            userId: data.user.id,
            orgId: data.org.id,
            apiUrl: getApiUrl() || null,
            error: null,
            tokenExpiresAt: decodeToken(token)?.exp ? new Date(decodeToken(token)!.exp! * 1000) : null,
          });
          return;
        } catch {
          clearTokens();
        }
      }

      // 3. Not authenticated
      setState((prev) => ({
        ...prev,
        isAuthenticated: false,
        isOnlineMode: false,
        isLoading: false,
      }));
    };

    init();
  }, []);

  // Listen for auth failures (refresh token expired)
  useEffect(() => {
    return onAuthFailure(() => {
      setState((prev) => ({
        ...prev,
        user: null,
        org: null,
        isAuthenticated: false,
        isOnlineMode: false,
        error: 'Session expired. Please sign in again.',
      }));
    });
  }, []);

  // Listen for 401 API errors
  useEffect(() => {
    return onApiError((error) => {
      if (error.status === 401) {
        setState((prev) => ({
          ...prev,
          isAuthenticated: false,
          isOnlineMode: false,
          error: 'Session expired. Please reconnect.',
        }));
      }
    });
  }, []);

  // Token expiry watcher (checks every 60s)
  useEffect(() => {
    if (!state.tokenExpiresAt) return;

    const checkExpiry = () => {
      if (state.tokenExpiresAt && new Date() >= state.tokenExpiresAt) {
        clearTokens();
        setState((prev) => ({
          ...prev,
          user: null,
          org: null,
          isAuthenticated: false,
          isOnlineMode: false,
          error: 'Session expired. Please sign in again.',
        }));
      }
    };

    const interval = setInterval(checkExpiry, 60000);
    return () => clearInterval(interval);
  }, [state.tokenExpiresAt]);

  // --- Actions ---

  const login = useCallback(async (email: string, password: string): Promise<MFAResponse> => {
    const apiUrl = getApiUrl();
    if (!apiUrl) throw new Error('API URL not configured');

    const data = await api<{
      access_token?: string;
      refresh_token?: string;
      user?: User;
      org?: Org;
      mfa_required?: boolean;
      mfa_token?: string;
      mfa_setup_required?: boolean;
      message?: string;
    }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.mfa_required) {
      return { mfa_required: true, mfa_token: data.mfa_token };
    }
    if (data.mfa_setup_required) {
      return { mfa_setup_required: true, message: data.message };
    }

    if (data.access_token && data.refresh_token) {
      setTokens(data.access_token, data.refresh_token);
      const payload = decodeToken(data.access_token);
      setState({
        user: data.user || null,
        org: data.org || null,
        isAuthenticated: true,
        isOnlineMode: true,
        isLoading: false,
        sspId: payload?.sspId || null,
        userId: data.user?.id || payload?.userId || null,
        orgId: data.org?.id || payload?.orgId || null,
        apiUrl,
        error: null,
        tokenExpiresAt: payload?.exp ? new Date(payload.exp * 1000) : null,
      });
    }

    return {};
  }, []);

  const verifyMFA = useCallback(async (mfaToken: string, code: string): Promise<void> => {
    const data = await api<{
      access_token: string;
      refresh_token: string;
      user: User;
      org: Org;
    }>('/api/v1/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ mfa_token: mfaToken, code }),
    });

    setTokens(data.access_token, data.refresh_token);
    const payload = decodeToken(data.access_token);
    setState({
      user: data.user,
      org: data.org,
      isAuthenticated: true,
      isOnlineMode: true,
      isLoading: false,
      sspId: payload?.sspId || null,
      userId: data.user.id,
      orgId: data.org.id,
      apiUrl: getApiUrl() || null,
      error: null,
      tokenExpiresAt: payload?.exp ? new Date(payload.exp * 1000) : null,
    });
  }, []);

  const register = useCallback(async (regData: RegisterData): Promise<void> => {
    const data = await api<{
      access_token: string;
      refresh_token: string;
      user: User;
      org: Org;
    }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(regData),
    });

    setTokens(data.access_token, data.refresh_token);
    const payload = decodeToken(data.access_token);
    setState({
      user: data.user,
      org: data.org,
      isAuthenticated: true,
      isOnlineMode: true,
      isLoading: false,
      sspId: payload?.sspId || null,
      userId: data.user.id,
      orgId: data.org.id,
      apiUrl: getApiUrl() || null,
      error: null,
      tokenExpiresAt: payload?.exp ? new Date(payload.exp * 1000) : null,
    });
  }, []);

  const logout = useCallback(() => {
    // Fire-and-forget server logout
    api('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
    clearTokens();
    setState({
      user: null,
      org: null,
      isAuthenticated: false,
      isOnlineMode: false,
      isLoading: false,
      sspId: null,
      userId: null,
      orgId: null,
      apiUrl: null,
      error: null,
      tokenExpiresAt: null,
    });
  }, []);

  // Legacy: connect via API URL + token (URL hash flow)
  const connect = useCallback(async (
    apiUrlParam: string,
    tokenParam: string
  ): Promise<{ success: boolean; error?: string; sspId?: string }> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const payload = decodeToken(tokenParam);
      if (!payload) throw new Error('Invalid token format');
      if (isTokenExpired(tokenParam, 60)) throw new Error('Token is expired');

      setApiUrl(apiUrlParam);
      setToken(tokenParam);

      // Verify server-side
      try {
        await api<{ ok: boolean }>('/api/v1/auth/verify', { method: 'GET' });
      } catch (verifyError) {
        clearTokens();
        const status = (verifyError as { status?: number })?.status;
        if (status === 401 || status === 403) {
          throw new Error('Token rejected by server');
        }
        console.warn('Could not verify token (network error), proceeding with local validation');
      }

      setState({
        user: null,
        org: null,
        isAuthenticated: true,
        isOnlineMode: true,
        isLoading: false,
        sspId: payload.sspId || null,
        userId: payload.userId || null,
        orgId: payload.orgId || null,
        apiUrl: apiUrlParam,
        error: null,
        tokenExpiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
      });

      return { success: true, sspId: payload.sspId };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Connection failed';
      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const disconnectAction = useCallback(() => {
    clearTokens();
    setState({
      user: null,
      org: null,
      isAuthenticated: false,
      isOnlineMode: false,
      isLoading: false,
      sspId: null,
      userId: null,
      orgId: null,
      apiUrl: null,
      error: null,
      tokenExpiresAt: null,
    });
  }, []);

  const refresh = useCallback(() => {
    const token = getToken();
    const apiUrl = getApiUrl();

    if (token && !isTokenExpired(token)) {
      const payload = decodeToken(token);
      setState((prev) => ({
        ...prev,
        isAuthenticated: true,
        isOnlineMode: isOnlineMode(),
        isLoading: false,
        sspId: payload?.sspId || prev.sspId,
        userId: payload?.userId || prev.userId,
        orgId: payload?.orgId || prev.orgId,
        apiUrl: apiUrl || null,
        tokenExpiresAt: payload?.exp ? new Date(payload.exp * 1000) : null,
      }));
    } else {
      clearTokens();
      setState((prev) => ({
        ...prev,
        user: null,
        org: null,
        isAuthenticated: false,
        isOnlineMode: false,
        isLoading: false,
        sspId: null,
        userId: null,
        orgId: null,
        apiUrl: null,
        error: null,
        tokenExpiresAt: null,
      }));
    }
  }, []);

  const isValid = useCallback(() => {
    const token = getToken();
    return token ? !isTokenExpired(token) : false;
  }, []);

  const actions: AuthActions = {
    login,
    verifyMFA,
    register,
    logout,
    connect,
    disconnect: disconnectAction,
    refresh,
    isValid,
  };

  return React.createElement(AuthContext.Provider, { value: [state, actions] }, children);
}

/**
 * Hook for accessing authentication state and actions.
 * Must be used within an AuthProvider.
 */
export function useAuth(): [AuthState, AuthActions] {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
