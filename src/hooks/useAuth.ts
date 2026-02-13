/**
 * ForgeComply 360 Reporter - Authentication Hook
 * Manages token-based authentication from URL hash or manual connection
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getToken,
  setToken,
  clearToken,
  getApiUrl,
  setApiUrl,
  isOnlineMode,
  decodeToken,
  isTokenExpired,
  initFromUrlHash,
  onApiError,
} from '../services/api';

export interface AuthState {
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
  /**
   * Connect to the API with a token
   */
  connect: (apiUrl: string, token: string) => Promise<{ success: boolean; error?: string; sspId?: string }>;

  /**
   * Disconnect and clear credentials
   */
  disconnect: () => void;

  /**
   * Refresh authentication state
   */
  refresh: () => void;

  /**
   * Check if token is still valid
   */
  isValid: () => boolean;
}

/**
 * Hook for managing authentication state
 */
export function useAuth(): [AuthState, AuthActions] {
  const [state, setState] = useState<AuthState>(() => {
    // Initialize state from stored credentials
    const token = getToken();
    const apiUrl = getApiUrl();
    const isOnline = isOnlineMode();

    if (token && !isTokenExpired(token)) {
      const payload = decodeToken(token);
      return {
        isAuthenticated: true,
        isOnlineMode: isOnline,
        isLoading: false,
        sspId: payload?.sspId || null,
        userId: payload?.userId || null,
        orgId: payload?.orgId || null,
        apiUrl: apiUrl || null,
        error: null,
        tokenExpiresAt: payload?.exp ? new Date(payload.exp * 1000) : null,
      };
    }

    return {
      isAuthenticated: false,
      isOnlineMode: false,
      isLoading: true, // Will check URL hash on mount
      sspId: null,
      userId: null,
      orgId: null,
      apiUrl: null,
      error: null,
      tokenExpiresAt: null,
    };
  });

  // Check URL hash for embedded token on mount
  useEffect(() => {
    const result = initFromUrlHash();

    if (result.connected) {
      const token = getToken();
      const payload = token ? decodeToken(token) : null;

      setState({
        isAuthenticated: true,
        isOnlineMode: true,
        isLoading: false,
        sspId: result.sspId || payload?.sspId || null,
        userId: payload?.userId || null,
        orgId: payload?.orgId || null,
        apiUrl: getApiUrl() || null,
        error: null,
        tokenExpiresAt: payload?.exp ? new Date(payload.exp * 1000) : null,
      });
    } else {
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, []);

  // Listen for API errors (401 = token expired)
  useEffect(() => {
    const unsubscribe = onApiError((error) => {
      if (error.status === 401) {
        setState((prev) => ({
          ...prev,
          isAuthenticated: false,
          isOnlineMode: false,
          error: 'Session expired. Please reconnect.',
        }));
      }
    });

    return unsubscribe;
  }, []);

  // Token expiry watcher
  useEffect(() => {
    if (!state.tokenExpiresAt) return;

    const checkExpiry = () => {
      const now = new Date();
      const expiresAt = state.tokenExpiresAt;

      if (expiresAt && now >= expiresAt) {
        clearToken();
        setState((prev) => ({
          ...prev,
          isAuthenticated: false,
          isOnlineMode: false,
          error: 'Session expired. Please reconnect.',
        }));
      }
    };

    // Check every minute
    const interval = setInterval(checkExpiry, 60000);
    return () => clearInterval(interval);
  }, [state.tokenExpiresAt]);

  const connect = useCallback(
    async (
      apiUrlParam: string,
      tokenParam: string
    ): Promise<{ success: boolean; error?: string; sspId?: string }> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Validate token format
        const payload = decodeToken(tokenParam);
        if (!payload) {
          throw new Error('Invalid token format');
        }

        // Check if token is expired
        if (isTokenExpired(tokenParam, 60)) {
          throw new Error('Token is expired');
        }

        // Store credentials
        setApiUrl(apiUrlParam);
        setToken(tokenParam);

        setState({
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
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  const disconnect = useCallback(() => {
    clearToken();
    setState({
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
      setState({
        isAuthenticated: true,
        isOnlineMode: isOnlineMode(),
        isLoading: false,
        sspId: payload?.sspId || null,
        userId: payload?.userId || null,
        orgId: payload?.orgId || null,
        apiUrl: apiUrl || null,
        error: null,
        tokenExpiresAt: payload?.exp ? new Date(payload.exp * 1000) : null,
      });
    } else {
      clearToken();
      setState({
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
    }
  }, []);

  const isValid = useCallback(() => {
    const token = getToken();
    return token ? !isTokenExpired(token) : false;
  }, []);

  const actions: AuthActions = {
    connect,
    disconnect,
    refresh,
    isValid,
  };

  return [state, actions];
}
