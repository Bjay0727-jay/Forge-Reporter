/**
 * ForgeComply 360 Reporter - Sync Hook
 * Manages bidirectional synchronization between Reporter and Backend
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { SSPData } from '../types';
import {
  loadSSPFromBackend,
  saveSSPToBackend,
  listSSPs,
  syncInfoTypes,
  syncPortsProtocols,
  syncCryptoModules,
  syncSeparationDuties,
  syncPolicyMappings,
  syncSCRMEntries,
  syncCMBaselines,
  type SSPListItem,
} from '../services/sspMapper';
import { api } from '../services/api';

export type SyncStatus = 'offline' | 'idle' | 'syncing' | 'synced' | 'error' | 'dirty';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  sspId: string | null;
  sspTitle: string | null;
  error: string | null;
  pendingChanges: boolean;
}

export interface SyncActions {
  /**
   * Load SSP data from the backend
   */
  loadFromServer: (sspId: string) => Promise<SSPData | null>;

  /**
   * Save current SSP data to the backend
   */
  saveToServer: (sspId: string, data: SSPData) => Promise<boolean>;

  /**
   * Full sync: save all data including list items
   */
  fullSync: (sspId: string, data: SSPData) => Promise<boolean>;

  /**
   * Get list of available SSPs
   */
  getSSPList: () => Promise<SSPListItem[]>;

  /**
   * Set the current SSP being edited
   */
  setCurrentSSP: (sspId: string, title?: string) => void;

  /**
   * Mark data as having pending changes
   */
  markDirty: () => void;

  /**
   * Clear sync state (go offline)
   */
  clearSync: () => void;

  /**
   * Reset error state
   */
  clearError: () => void;
}

/**
 * Hook for managing sync state with backend
 */
export function useSync(isOnlineMode: boolean): [SyncState, SyncActions] {
  const [state, setState] = useState<SyncState>(() => ({
    status: isOnlineMode ? 'idle' : 'offline',
    lastSyncedAt: null,
    sspId: null,
    sspTitle: null,
    error: null,
    pendingChanges: false,
  }));

  // Track previous data for change detection
  const previousDataRef = useRef<SSPData | null>(null);

  // Mutex: prevent concurrent sync operations from clobbering each other
  const syncInProgressRef = useRef(false);

  // Respond to online mode changes via useEffect (not during render)
  useEffect(() => {
    if (!isOnlineMode) {
      setState((prev) => (prev.status !== 'offline' ? { ...prev, status: 'offline' } : prev));
    } else {
      setState((prev) => (prev.status === 'offline' ? { ...prev, status: 'idle' } : prev));
    }
  }, [isOnlineMode]);

  const loadFromServer = useCallback(async (sspId: string): Promise<SSPData | null> => {
    if (syncInProgressRef.current) return null;
    syncInProgressRef.current = true;
    setState((prev) => ({ ...prev, status: 'syncing', error: null }));

    try {
      const data = await loadSSPFromBackend(sspId);
      previousDataRef.current = data;

      // Get SSP title
      const res = await api<{ document: { title: string } }>(`/api/v1/ssp/${sspId}`);
      const title = res.document?.title || 'Untitled SSP';

      setState({
        status: 'synced',
        lastSyncedAt: new Date(),
        sspId,
        sspTitle: title,
        error: null,
        pendingChanges: false,
      });

      return data;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load SSP';
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: errorMessage,
      }));
      return null;
    } finally {
      syncInProgressRef.current = false;
    }
  }, []);

  const saveToServer = useCallback(async (sspId: string, data: SSPData): Promise<boolean> => {
    if (syncInProgressRef.current) return false;
    syncInProgressRef.current = true;
    setState((prev) => ({ ...prev, status: 'syncing', error: null }));

    try {
      await saveSSPToBackend(sspId, data, previousDataRef.current || undefined);
      previousDataRef.current = data;

      setState((prev) => ({
        ...prev,
        status: 'synced',
        lastSyncedAt: new Date(),
        pendingChanges: false,
        error: null,
      }));

      return true;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to save SSP';
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: errorMessage,
      }));
      return false;
    } finally {
      syncInProgressRef.current = false;
    }
  }, []);

  const fullSync = useCallback(async (sspId: string, data: SSPData): Promise<boolean> => {
    if (syncInProgressRef.current) return false;
    syncInProgressRef.current = true;
    setState((prev) => ({ ...prev, status: 'syncing', error: null }));

    try {
      // Save main SSP data
      await saveSSPToBackend(sspId, data, previousDataRef.current || undefined);

      // Sync list items in parallel — use allSettled so partial failures
      // don't discard successfully synced items
      const syncPromises: Array<{ label: string; promise: Promise<void> }> = [];

      if (data.infoTypes?.length) {
        syncPromises.push({ label: 'infoTypes', promise: syncInfoTypes(sspId, data.infoTypes, []) });
      }
      if (data.ppsRows?.length) {
        syncPromises.push({ label: 'portsProtocols', promise: syncPortsProtocols(sspId, data.ppsRows) });
      }
      if (data.cryptoMods?.length) {
        syncPromises.push({ label: 'cryptoModules', promise: syncCryptoModules(sspId, data.cryptoMods) });
      }
      if (data.sepDutyMatrix?.length) {
        syncPromises.push({ label: 'separationDuties', promise: syncSeparationDuties(sspId, data.sepDutyMatrix) });
      }
      if (data.policyDocs?.length) {
        syncPromises.push({ label: 'policyMappings', promise: syncPolicyMappings(sspId, data.policyDocs) });
      }
      if (data.scrmSuppliers?.length) {
        syncPromises.push({ label: 'scrmEntries', promise: syncSCRMEntries(sspId, data.scrmSuppliers) });
      }
      if (data.cmBaselines?.length) {
        syncPromises.push({ label: 'cmBaselines', promise: syncCMBaselines(sspId, data.cmBaselines) });
      }

      const results = await Promise.allSettled(syncPromises.map((s) => s.promise));

      // Collect partial failures
      const failures = results
        .map((r, i) => (r.status === 'rejected' ? syncPromises[i].label : null))
        .filter(Boolean);

      previousDataRef.current = data;

      if (failures.length > 0) {
        console.error('Partial sync failures:', failures);
        setState((prev) => ({
          ...prev,
          status: 'error',
          lastSyncedAt: new Date(),
          pendingChanges: true,
          error: `Sync partially failed for: ${failures.join(', ')}`,
        }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        status: 'synced',
        lastSyncedAt: new Date(),
        pendingChanges: false,
        error: null,
      }));

      return true;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Sync failed';
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: errorMessage,
      }));
      return false;
    } finally {
      syncInProgressRef.current = false;
    }
  }, []);

  const getSSPList = useCallback(async (): Promise<SSPListItem[]> => {
    try {
      return await listSSPs();
    } catch (e) {
      console.error('Failed to get SSP list:', e);
      return [];
    }
  }, []);

  const setCurrentSSP = useCallback((sspId: string, title?: string) => {
    setState((prev) => ({
      ...prev,
      sspId,
      sspTitle: title || null,
      pendingChanges: false,
    }));
  }, []);

  const markDirty = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: prev.status === 'synced' ? 'dirty' : prev.status,
      pendingChanges: true,
    }));
  }, []);

  const clearSync = useCallback(() => {
    previousDataRef.current = null;
    setState({
      status: 'offline',
      lastSyncedAt: null,
      sspId: null,
      sspTitle: null,
      error: null,
      pendingChanges: false,
    });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: prev.pendingChanges ? 'dirty' : 'idle',
      error: null,
    }));
  }, []);

  const actions: SyncActions = {
    loadFromServer,
    saveToServer,
    fullSync,
    getSSPList,
    setCurrentSSP,
    markDirty,
    clearSync,
    clearError,
  };

  return [state, actions];
}

/**
 * Get status display info
 */
export function getSyncStatusDisplay(status: SyncStatus): {
  icon: string;
  label: string;
  color: string;
} {
  switch (status) {
    case 'offline':
      return { icon: '📴', label: 'Offline', color: '#64748b' };
    case 'idle':
      return { icon: '☁️', label: 'Connected', color: '#0ea5e9' };
    case 'syncing':
      return { icon: '🔄', label: 'Syncing...', color: '#f59e0b' };
    case 'synced':
      return { icon: '✓', label: 'Synced', color: '#22c55e' };
    case 'dirty':
      return { icon: '⚠️', label: 'Unsaved', color: '#f59e0b' };
    case 'error':
      return { icon: '❌', label: 'Error', color: '#ef4444' };
  }
}
