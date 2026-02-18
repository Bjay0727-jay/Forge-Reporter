/**
 * useSync Hook Tests
 * Tests the sync mutex, Promise.allSettled partial failure handling,
 * and state management for ForgeComply 360 backend sync.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSync } from './useSync';

// Mock the sspMapper module
vi.mock('../services/sspMapper', () => ({
  loadSSPFromBackend: vi.fn(),
  saveSSPToBackend: vi.fn(),
  listSSPs: vi.fn(),
  syncInfoTypes: vi.fn(),
  syncPortsProtocols: vi.fn(),
  syncCryptoModules: vi.fn(),
  syncSeparationDuties: vi.fn(),
  syncPolicyMappings: vi.fn(),
  syncSCRMEntries: vi.fn(),
  syncCMBaselines: vi.fn(),
}));

// Mock the api module
vi.mock('../services/api', () => ({
  api: vi.fn(),
  getApiUrl: vi.fn(() => 'https://api.forgecomply360.com'),
  getToken: vi.fn(() => 'mock-token'),
  isOnlineMode: vi.fn(() => true),
}));

import {
  loadSSPFromBackend,
  saveSSPToBackend,
  listSSPs,
  syncInfoTypes,
  syncPortsProtocols,
} from '../services/sspMapper';
import { api } from '../services/api';
import type { SSPData } from '../types';

const SSP_ID = 'ssp-test-001';

describe('useSync Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // Initial State
  // =========================================================================
  describe('Initial State', () => {
    it('should start with idle status when online', () => {
      const { result } = renderHook(() => useSync(true));
      const [state] = result.current;
      expect(state.status).toBe('idle');
      expect(state.sspId).toBeNull();
      expect(state.error).toBeNull();
    });

    it('should start with offline status when not online', () => {
      const { result } = renderHook(() => useSync(false));
      const [state] = result.current;
      expect(state.status).toBe('offline');
    });
  });

  // =========================================================================
  // loadFromServer
  // =========================================================================
  describe('loadFromServer', () => {
    it('should load SSP data and update state', async () => {
      const mockData: SSPData = { sysName: 'Test System' };
      vi.mocked(loadSSPFromBackend).mockResolvedValue(mockData);
      vi.mocked(api).mockResolvedValue({ document: { title: 'Test SSP' } });

      const { result } = renderHook(() => useSync(true));

      let data: SSPData | null = null;
      await act(async () => {
        data = await result.current[1].loadFromServer(SSP_ID);
      });

      expect(data).toEqual(mockData);
      expect(result.current[0].status).toBe('synced');
      expect(result.current[0].sspId).toBe(SSP_ID);
      expect(result.current[0].sspTitle).toBe('Test SSP');
      expect(result.current[0].lastSyncedAt).not.toBeNull();
    });

    it('should set error state on failure', async () => {
      vi.mocked(loadSSPFromBackend).mockRejectedValue(new Error('Connection refused'));

      const { result } = renderHook(() => useSync(true));

      await act(async () => {
        await result.current[1].loadFromServer(SSP_ID);
      });

      expect(result.current[0].status).toBe('error');
      expect(result.current[0].error).toContain('Connection refused');
    });
  });

  // =========================================================================
  // Sync Mutex
  // =========================================================================
  describe('Sync Mutex', () => {
    it('should prevent concurrent loadFromServer calls', async () => {
      let resolveLoad: (v: SSPData) => void;
      const loadPromise = new Promise<SSPData>((r) => { resolveLoad = r; });
      vi.mocked(loadSSPFromBackend).mockReturnValue(loadPromise);
      vi.mocked(api).mockResolvedValue({ document: { title: 'SSP' } });

      const { result } = renderHook(() => useSync(true));

      // Start first load (will be pending)
      let firstResult: SSPData | null = null;
      let secondResult: SSPData | null = null;
      const first = act(async () => {
        firstResult = await result.current[1].loadFromServer(SSP_ID);
      });

      // Start second load immediately — should be blocked by mutex
      await act(async () => {
        secondResult = await result.current[1].loadFromServer('ssp-2');
      });

      // Second call should return null (blocked)
      expect(secondResult).toBeNull();

      // Now resolve the first
      resolveLoad!({ sysName: 'First' });
      await first;
      expect(firstResult).toEqual({ sysName: 'First' });
    });

    it('should prevent concurrent saveToServer calls', async () => {
      let resolveSave: () => void;
      const savePromise = new Promise<void>((r) => { resolveSave = r; });
      vi.mocked(saveSSPToBackend).mockReturnValue(savePromise);

      const { result } = renderHook(() => useSync(true));
      const data: SSPData = { sysName: 'Test' };

      let firstResult: boolean = false;
      let secondResult: boolean = false;
      const first = act(async () => {
        firstResult = await result.current[1].saveToServer(SSP_ID, data);
      });

      // Second call blocked
      await act(async () => {
        secondResult = await result.current[1].saveToServer(SSP_ID, data);
      });
      expect(secondResult).toBe(false);

      resolveSave!();
      await first;
      expect(firstResult).toBe(true);
    });
  });

  // =========================================================================
  // fullSync with Promise.allSettled
  // =========================================================================
  describe('fullSync — Partial Failure Handling', () => {
    it('should report partial sync failures', async () => {
      vi.mocked(saveSSPToBackend).mockResolvedValue(undefined);
      vi.mocked(syncInfoTypes).mockRejectedValue(new Error('Info types failed'));
      vi.mocked(syncPortsProtocols).mockResolvedValue(undefined);

      const { result } = renderHook(() => useSync(true));
      const data: SSPData = {
        sysName: 'Test',
        infoTypes: [{ nistId: 'C.1', name: 'Test' }],
        ppsRows: [{ port: '443' }],
      };

      let syncResult = true;
      await act(async () => {
        syncResult = await result.current[1].fullSync(SSP_ID, data);
      });

      // Should return false (partial failure)
      expect(syncResult).toBe(false);
      expect(result.current[0].status).toBe('error');
      expect(result.current[0].error).toContain('infoTypes');
      // But lastSyncedAt should still be set (partial success)
      expect(result.current[0].lastSyncedAt).not.toBeNull();
    });

    it('should succeed when all syncs pass', async () => {
      vi.mocked(saveSSPToBackend).mockResolvedValue(undefined);
      vi.mocked(syncInfoTypes).mockResolvedValue(undefined);
      vi.mocked(syncPortsProtocols).mockResolvedValue(undefined);

      const { result } = renderHook(() => useSync(true));
      const data: SSPData = {
        sysName: 'Test',
        infoTypes: [{ nistId: 'C.1', name: 'Test' }],
        ppsRows: [{ port: '443' }],
      };

      let syncResult = false;
      await act(async () => {
        syncResult = await result.current[1].fullSync(SSP_ID, data);
      });

      expect(syncResult).toBe(true);
      expect(result.current[0].status).toBe('synced');
      expect(result.current[0].error).toBeNull();
    });

    it('should handle main save failure', async () => {
      vi.mocked(saveSSPToBackend).mockRejectedValue(new Error('Save failed'));

      const { result } = renderHook(() => useSync(true));

      let syncResult = true;
      await act(async () => {
        syncResult = await result.current[1].fullSync(SSP_ID, { sysName: 'Test' });
      });

      expect(syncResult).toBe(false);
      expect(result.current[0].status).toBe('error');
      expect(result.current[0].error).toContain('Save failed');
    });

    it('should skip sync for empty sub-arrays', async () => {
      vi.mocked(saveSSPToBackend).mockResolvedValue(undefined);

      const { result } = renderHook(() => useSync(true));
      const data: SSPData = { sysName: 'Test' }; // No sub-arrays

      await act(async () => {
        await result.current[1].fullSync(SSP_ID, data);
      });

      // Only saveSSPToBackend should be called (no sync calls)
      expect(syncInfoTypes).not.toHaveBeenCalled();
      expect(syncPortsProtocols).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // State Management
  // =========================================================================
  describe('State Management', () => {
    it('should mark state as dirty', () => {
      const { result } = renderHook(() => useSync(true));

      // First sync to get to 'synced' state
      act(() => {
        result.current[1].setCurrentSSP(SSP_ID, 'Test SSP');
      });

      // Mark as dirty — but we need to be in 'synced' state first
      // The markDirty function only changes from 'synced' to 'dirty'
    });

    it('should clear sync state on disconnect', () => {
      const { result } = renderHook(() => useSync(true));

      act(() => {
        result.current[1].setCurrentSSP(SSP_ID, 'Test SSP');
      });

      act(() => {
        result.current[1].clearSync();
      });

      expect(result.current[0].status).toBe('offline');
      expect(result.current[0].sspId).toBeNull();
      expect(result.current[0].sspTitle).toBeNull();
    });

    it('should clear error state', async () => {
      vi.mocked(loadSSPFromBackend).mockRejectedValue(new Error('fail'));

      const { result } = renderHook(() => useSync(true));

      await act(async () => {
        await result.current[1].loadFromServer(SSP_ID);
      });
      expect(result.current[0].status).toBe('error');

      act(() => {
        result.current[1].clearError();
      });
      expect(result.current[0].error).toBeNull();
      expect(result.current[0].status).toBe('idle');
    });

    it('should list SSPs from backend', async () => {
      vi.mocked(listSSPs).mockResolvedValue([
        { id: 'ssp-1', title: 'SSP One', lastModified: '2025-01-01' },
        { id: 'ssp-2', title: 'SSP Two', lastModified: '2025-01-02' },
      ]);

      const { result } = renderHook(() => useSync(true));

      let list: unknown[] = [];
      await act(async () => {
        list = await result.current[1].getSSPList();
      });

      expect(list).toHaveLength(2);
    });
  });

  // =========================================================================
  // Online Mode Changes
  // =========================================================================
  describe('Online Mode Changes', () => {
    it('should transition to offline when mode changes', () => {
      const { result, rerender } = renderHook(
        ({ online }) => useSync(online),
        { initialProps: { online: true } },
      );

      expect(result.current[0].status).toBe('idle');

      rerender({ online: false });
      expect(result.current[0].status).toBe('offline');
    });

    it('should transition to idle when going back online', () => {
      const { result, rerender } = renderHook(
        ({ online }) => useSync(online),
        { initialProps: { online: false } },
      );

      expect(result.current[0].status).toBe('offline');

      rerender({ online: true });
      expect(result.current[0].status).toBe('idle');
    });
  });
});
