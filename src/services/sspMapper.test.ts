/**
 * SSP Mapper Tests
 * Tests the sync logic including delete-then-recreate, duplicate error handling,
 * and ForgeComply 360 backend API interactions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  syncInfoTypes,
  syncPortsProtocols,
  syncCryptoModules,
  syncSeparationDuties,
  syncPolicyMappings,
  syncSCRMEntries,
  syncCMBaselines,
} from './sspMapper';
import { api } from './api';

// Mock the API module
vi.mock('./api', () => ({
  api: vi.fn(),
  getApiUrl: vi.fn(() => 'https://api.forgecomply360.com'),
  getToken: vi.fn(() => 'mock-token'),
  isOnlineMode: vi.fn(() => true),
}));

const SSP_ID = 'ssp-test-001';

describe('SSP Mapper — Sync Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // Delete-then-recreate Pattern
  // =========================================================================
  describe('Delete-then-Recreate Pattern', () => {
    it('should DELETE existing items before POSTing new ones', async () => {
      vi.mocked(api)
        .mockResolvedValueOnce(undefined) // DELETE /info-types
        .mockResolvedValueOnce(undefined) // POST item 1
        .mockResolvedValueOnce(undefined); // POST item 2

      await syncInfoTypes(SSP_ID, [
        { nistId: 'C.2.8.1', name: 'Financial', c: 'Moderate', i: 'Moderate', a: 'Low' },
        { nistId: 'C.3.5.1', name: 'Health', c: 'High', i: 'High', a: 'Low' },
      ], []);

      // First call = DELETE, subsequent = POST
      expect(api).toHaveBeenCalledTimes(3);
      expect(api).toHaveBeenNthCalledWith(1,
        `/api/v1/ssp/${SSP_ID}/info-types`,
        expect.objectContaining({ method: 'DELETE' }),
      );
      expect(api).toHaveBeenNthCalledWith(2,
        `/api/v1/ssp/${SSP_ID}/info-types`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should fall back to add-only if DELETE returns 404', async () => {
      vi.mocked(api)
        .mockRejectedValueOnce(new Error('404 Not Found')) // DELETE fails
        .mockResolvedValueOnce(undefined); // POST succeeds

      await syncPortsProtocols(SSP_ID, [
        { port: '443', proto: 'TCP', svc: 'HTTPS' },
      ]);

      // DELETE failed (ignored), POST succeeded
      expect(api).toHaveBeenCalledTimes(2);
    });

    it('should fall back to add-only if DELETE returns 405', async () => {
      vi.mocked(api)
        .mockRejectedValueOnce(new Error('405 Method Not Allowed'))
        .mockResolvedValueOnce(undefined);

      await syncCryptoModules(SSP_ID, [
        { mod: 'OpenSSL', cert: '12345', level: '1' },
      ]);

      expect(api).toHaveBeenCalledTimes(2);
    });

    it('should propagate DELETE errors that are not 404/405', async () => {
      vi.mocked(api).mockRejectedValueOnce(new Error('500 Internal Server Error'));

      await expect(
        syncInfoTypes(SSP_ID, [{ nistId: 'C.1', name: 'Test' }], []),
      ).rejects.toThrow('500');
    });
  });

  // =========================================================================
  // Duplicate Error Handling (409 Conflict)
  // =========================================================================
  describe('Duplicate Error Handling', () => {
    it('should silently ignore 409 Conflict on POST', async () => {
      vi.mocked(api)
        .mockResolvedValueOnce(undefined) // DELETE
        .mockRejectedValueOnce(new Error('409 Conflict: duplicate')) // POST item 1 = dup
        .mockResolvedValueOnce(undefined); // POST item 2

      await syncPortsProtocols(SSP_ID, [
        { port: '80', proto: 'TCP', svc: 'HTTP' },
        { port: '443', proto: 'TCP', svc: 'HTTPS' },
      ]);

      // Should not throw — 409 is silently swallowed
      expect(api).toHaveBeenCalledTimes(3);
    });

    it('should also catch "duplicate" keyword in error message', async () => {
      vi.mocked(api)
        .mockResolvedValueOnce(undefined) // DELETE
        .mockRejectedValueOnce(new Error('Duplicate entry for key')); // POST

      await expect(
        syncCryptoModules(SSP_ID, [{ mod: 'Test', cert: '1' }]),
      ).resolves.toBeUndefined();
    });

    it('should propagate non-duplicate POST errors', async () => {
      vi.mocked(api)
        .mockResolvedValueOnce(undefined) // DELETE
        .mockRejectedValueOnce(new Error('500 Internal Server Error')); // POST fails

      await expect(
        syncSeparationDuties(SSP_ID, [{ role: 'Admin' }]),
      ).rejects.toThrow('500');
    });
  });

  // =========================================================================
  // Item Filtering (skip incomplete items)
  // =========================================================================
  describe('Item Filtering', () => {
    it('should skip info types without nistId or name', async () => {
      vi.mocked(api).mockResolvedValue(undefined);

      await syncInfoTypes(SSP_ID, [
        { nistId: '', name: '' },           // Skip: both empty
        { nistId: 'C.1', name: '' },        // Skip: no name
        { name: 'Valid' },                  // Skip: no nistId
        { nistId: 'C.2', name: 'Valid' },   // Keep
      ], []);

      // DELETE + 1 POST (only the valid item)
      expect(api).toHaveBeenCalledTimes(2);
    });

    it('should skip ports without port number', async () => {
      vi.mocked(api).mockResolvedValue(undefined);

      await syncPortsProtocols(SSP_ID, [
        { port: '', proto: 'TCP' },         // Skip
        { port: '443', proto: 'TCP' },      // Keep
      ]);

      expect(api).toHaveBeenCalledTimes(2); // DELETE + 1 POST
    });

    it('should skip crypto modules without module name', async () => {
      vi.mocked(api).mockResolvedValue(undefined);

      await syncCryptoModules(SSP_ID, [
        { mod: '', cert: '123' },            // Skip
        { mod: 'OpenSSL', cert: '456' },     // Keep
      ]);

      expect(api).toHaveBeenCalledTimes(2); // DELETE + 1 POST
    });

    it('should skip separation duties without role', async () => {
      vi.mocked(api).mockResolvedValue(undefined);

      await syncSeparationDuties(SSP_ID, [
        { role: '' },                        // Skip
        { role: 'Admin', access: 'Full' },   // Keep
      ]);

      expect(api).toHaveBeenCalledTimes(2);
    });

    it('should skip policies without family', async () => {
      vi.mocked(api).mockResolvedValue(undefined);

      await syncPolicyMappings(SSP_ID, [
        { family: '' },                                     // Skip
        { family: 'AC', title: 'Access Control Policy' },   // Keep
      ]);

      expect(api).toHaveBeenCalledTimes(2);
    });

    it('should skip SCRM entries without supplier', async () => {
      vi.mocked(api).mockResolvedValue(undefined);

      await syncSCRMEntries(SSP_ID, [
        { supplier: '' },                    // Skip
        { supplier: 'AWS', type: 'IaaS' },   // Keep
      ]);

      expect(api).toHaveBeenCalledTimes(2);
    });

    it('should skip CM baselines without component name', async () => {
      vi.mocked(api).mockResolvedValue(undefined);

      await syncCMBaselines(SSP_ID, [
        { comp: '' },                              // Skip
        { comp: 'RHEL 9', bench: 'CIS Level 1' }, // Keep
      ]);

      expect(api).toHaveBeenCalledTimes(2);
    });
  });

  // =========================================================================
  // Payload Structure
  // =========================================================================
  describe('Payload Structure sent to ForgeComply 360 API', () => {
    it('should map info type fields to backend schema', async () => {
      vi.mocked(api).mockResolvedValue(undefined);

      await syncInfoTypes(SSP_ID, [
        { nistId: 'C.2.8.1', name: 'Financial', c: 'Moderate', i: 'Moderate', a: 'Low' },
      ], []);

      const postCall = vi.mocked(api).mock.calls[1]; // [1] = POST after DELETE
      const body = JSON.parse(postCall[1]!.body as string);
      expect(body).toEqual({
        nist_id: 'C.2.8.1',
        name: 'Financial',
        confidentiality: 'Moderate',
        integrity: 'Moderate',
        availability: 'Low',
      });
    });

    it('should map port/protocol fields to backend schema', async () => {
      vi.mocked(api).mockResolvedValue(undefined);

      await syncPortsProtocols(SSP_ID, [
        { port: '443', proto: 'TCP', svc: 'HTTPS', purpose: 'Web traffic', dir: 'Inbound', dit: 'DIT-001' },
      ]);

      const postCall = vi.mocked(api).mock.calls[1];
      const body = JSON.parse(postCall[1]!.body as string);
      expect(body).toEqual({
        port: '443',
        protocol: 'TCP',
        service: 'HTTPS',
        purpose: 'Web traffic',
        direction: 'Inbound',
        dit_ref: 'DIT-001',
      });
    });

    it('should map crypto module fields to backend schema', async () => {
      vi.mocked(api).mockResolvedValue(undefined);

      await syncCryptoModules(SSP_ID, [
        { mod: 'OpenSSL 3.0', cert: '#4282', level: 'Level 1', usage: 'TLS', where: 'App Server' },
      ]);

      const postCall = vi.mocked(api).mock.calls[1];
      const body = JSON.parse(postCall[1]!.body as string);
      expect(body).toEqual({
        module_name: 'OpenSSL 3.0',
        certificate_number: '#4282',
        fips_level: 'Level 1',
        usage: 'TLS',
        deployment_location: 'App Server',
      });
    });

    it('should map SCRM fields to backend schema', async () => {
      vi.mocked(api).mockResolvedValue(undefined);

      await syncSCRMEntries(SSP_ID, [
        { supplier: 'AWS', type: 'IaaS', criticality: 'High', sbom: 'Yes', riskLevel: 'Low' },
      ]);

      const postCall = vi.mocked(api).mock.calls[1];
      const body = JSON.parse(postCall[1]!.body as string);
      expect(body).toEqual({
        supplier_name: 'AWS',
        supplier_type: 'IaaS',
        criticality: 'High',
        sbom_available: 'Yes',
        risk_level: 'Low',
      });
    });
  });

  // =========================================================================
  // Empty arrays (no items to sync)
  // =========================================================================
  describe('Empty Arrays', () => {
    it('should only call DELETE when no valid items exist', async () => {
      vi.mocked(api).mockResolvedValue(undefined);

      await syncInfoTypes(SSP_ID, [], []);

      // Only DELETE, no POSTs
      expect(api).toHaveBeenCalledTimes(1);
      expect(api).toHaveBeenCalledWith(
        `/api/v1/ssp/${SSP_ID}/info-types`,
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });
});
