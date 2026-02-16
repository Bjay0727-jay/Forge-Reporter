/**
 * Extended Validation Tests
 * Tests email format, impact level enum, narrative length, and cross-field rules
 * added as part of field-level validation hardening.
 */
import { describe, it, expect } from 'vitest';
import { validateSSP, getSectionErrors } from './validation';
import type { SSPData } from '../types';

/** Minimum valid SSP data that passes all required-field checks */
const VALID_BASE: SSPData = {
  sysName: 'ForgeComply Test System',
  sysAcronym: 'FTS',
  sysDesc: 'A test system for validation',
  authType: 'FISMA Agency ATO',
  owningAgency: 'Test Agency',
  conf: 'Moderate',
  integ: 'Moderate',
  avail: 'Low',
  ctrlBaseline: 'Moderate',
  rmfCurrentStep: 'Implement',
  bndNarr: 'Boundary narrative',
  dfNarr: 'Data flow narrative',
  netNarr: 'Network narrative',
  soName: 'Jane Doe',
  aoName: 'John Smith',
  issoName: 'Alex Johnson',
  ial: '2',
  aal: '2',
  rto: '4 hours',
  rpo: '1 hour',
  irPurpose: 'Incident response purpose',
  iscmType: 'ongoing',
};

describe('Extended SSP Validation', () => {
  // =========================================================================
  // Email Format Validation
  // =========================================================================
  describe('Email Format Validation', () => {
    it('should accept valid email addresses', () => {
      const data: SSPData = {
        ...VALID_BASE,
        soEmail: 'jane.doe@agency.gov',
        aoEmail: 'john.smith@agency.gov',
        issoEmail: 'alex@example.com',
      };
      const result = validateSSP(data);
      expect(result.isValid).toBe(true);
    });

    it('should reject email without @ symbol', () => {
      const data: SSPData = {
        ...VALID_BASE,
        soEmail: 'not-an-email',
      };
      const result = validateSSP(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'soEmail')).toBe(true);
      expect(result.errors.find(e => e.field === 'soEmail')!.message).toContain('email');
    });

    it('should reject email without domain', () => {
      const data: SSPData = {
        ...VALID_BASE,
        aoEmail: 'user@',
      };
      const result = validateSSP(data);
      expect(result.errors.some(e => e.field === 'aoEmail')).toBe(true);
    });

    it('should reject email with spaces', () => {
      const data: SSPData = {
        ...VALID_BASE,
        issoEmail: 'user name@agency.gov',
      };
      const result = validateSSP(data);
      expect(result.errors.some(e => e.field === 'issoEmail')).toBe(true);
    });

    it('should not validate empty email fields (only when populated)', () => {
      // No email fields set — should not trigger email validation errors
      const result = validateSSP(VALID_BASE);
      expect(result.isValid).toBe(true);
      const emailErrors = result.errors.filter(e => e.message.includes('email'));
      expect(emailErrors).toHaveLength(0);
    });

    it('should validate all 6 email fields independently', () => {
      const data: SSPData = {
        ...VALID_BASE,
        soEmail: 'bad1',
        aoEmail: 'bad2',
        issoEmail: 'bad3',
        issmEmail: 'bad4',
        scaEmail: 'bad5',
        poEmail: 'bad6',
      };
      const result = validateSSP(data);
      const emailErrors = result.errors.filter(e => e.message.includes('email'));
      expect(emailErrors).toHaveLength(6);
    });

    it('should assign email errors to personnel section', () => {
      const data: SSPData = {
        ...VALID_BASE,
        soEmail: 'invalid',
      };
      const result = validateSSP(data);
      const personnelErrors = getSectionErrors(result, 'personnel');
      expect(personnelErrors.some(e => e.field === 'soEmail')).toBe(true);
    });
  });

  // =========================================================================
  // FIPS 199 Impact Level Enum Validation
  // =========================================================================
  describe('Impact Level Enum Validation', () => {
    it('should accept Title Case impact levels', () => {
      const data: SSPData = { ...VALID_BASE, conf: 'Low', integ: 'Moderate', avail: 'High' };
      const result = validateSSP(data);
      const impactErrors = result.errors.filter(e => ['conf', 'integ', 'avail'].includes(e.field));
      expect(impactErrors).toHaveLength(0);
    });

    it('should accept lowercase impact levels (case-insensitive)', () => {
      const data: SSPData = { ...VALID_BASE, conf: 'low', integ: 'moderate', avail: 'high' };
      const result = validateSSP(data);
      const impactErrors = result.errors.filter(e => ['conf', 'integ', 'avail'].includes(e.field));
      expect(impactErrors).toHaveLength(0);
    });

    it('should accept UPPERCASE impact levels', () => {
      const data: SSPData = { ...VALID_BASE, conf: 'LOW', integ: 'MODERATE', avail: 'HIGH' };
      const result = validateSSP(data);
      const impactErrors = result.errors.filter(e => ['conf', 'integ', 'avail'].includes(e.field));
      expect(impactErrors).toHaveLength(0);
    });

    it('should reject invalid impact levels', () => {
      const data: SSPData = { ...VALID_BASE, conf: 'Critical', integ: 'None', avail: 'Medium' };
      const result = validateSSP(data);
      const impactErrors = result.errors.filter(e =>
        e.message.includes('must be one of'),
      );
      expect(impactErrors).toHaveLength(3);
    });

    it('should not validate empty impact fields (handled by required check)', () => {
      // conf/integ/avail empty → only required-field errors, no enum errors
      const data: SSPData = { ...VALID_BASE, conf: '', integ: '', avail: '' };
      const result = validateSSP(data);
      const enumErrors = result.errors.filter(e => e.message.includes('must be one of'));
      expect(enumErrors).toHaveLength(0);
    });

    it('should include valid options in error message', () => {
      const data: SSPData = { ...VALID_BASE, conf: 'Invalid' };
      const result = validateSSP(data);
      const err = result.errors.find(e => e.field === 'conf' && e.message.includes('must be'));
      expect(err).toBeDefined();
      expect(err!.message).toContain('Low');
      expect(err!.message).toContain('Moderate');
      expect(err!.message).toContain('High');
    });
  });

  // =========================================================================
  // Narrative Length Limits
  // =========================================================================
  describe('Narrative Length Limits', () => {
    it('should accept narratives under 50,000 characters', () => {
      const data: SSPData = { ...VALID_BASE, sysDesc: 'x'.repeat(49_999) };
      const result = validateSSP(data);
      expect(result.errors.some(e => e.field === 'sysDesc' && e.message.includes('length'))).toBe(false);
    });

    it('should reject narratives over 50,000 characters', () => {
      const data: SSPData = { ...VALID_BASE, sysDesc: 'x'.repeat(50_001) };
      const result = validateSSP(data);
      expect(result.errors.some(e => e.field === 'sysDesc' && e.message.includes('length'))).toBe(true);
    });

    it('should check all narrative fields', () => {
      const narrativeFields = [
        'sysDesc', 'catJust', 'baseJust', 'bndNarr', 'dfNarr', 'netNarr',
        'cryptoNarr', 'idNarr', 'scrmPlan', 'cpPurpose', 'cpScope',
        'irPurpose', 'irScope', 'cmPurpose', 'cmChangeNarr', 'iscmNarrative',
      ];
      const longContent = 'x'.repeat(50_001);
      const data: SSPData = { ...VALID_BASE };
      for (const field of narrativeFields) {
        (data as Record<string, unknown>)[field] = longContent;
      }
      const result = validateSSP(data);
      const lengthErrors = result.errors.filter(e => e.message.includes('length'));
      expect(lengthErrors.length).toBe(narrativeFields.length);
    });
  });

  // =========================================================================
  // Cross-Field Validation Rules
  // =========================================================================
  describe('Cross-Field Validation', () => {
    it('should require PIA status when PII is collected', () => {
      const data: SSPData = {
        ...VALID_BASE,
        ptaCollectsPii: 'Yes',
        // ptaPiaRequired intentionally omitted
      };
      const result = validateSSP(data);
      expect(result.errors.some(e => e.field === 'ptaPiaRequired')).toBe(true);
      expect(result.errors.find(e => e.field === 'ptaPiaRequired')!.section).toBe('privacy');
    });

    it('should not require PIA status when PII is not collected', () => {
      const data: SSPData = { ...VALID_BASE, ptaCollectsPii: 'No' };
      const result = validateSSP(data);
      expect(result.errors.some(e => e.field === 'ptaPiaRequired')).toBe(false);
    });

    it('should pass PII check when PIA status is specified', () => {
      const data: SSPData = {
        ...VALID_BASE,
        ptaCollectsPii: 'Yes',
        ptaPiaRequired: 'Yes',
      };
      const result = validateSSP(data);
      expect(result.errors.some(e => e.field === 'ptaPiaRequired')).toBe(false);
    });

    it('should warn if RTO has no numeric value', () => {
      const data: SSPData = { ...VALID_BASE, rto: 'As soon as possible' };
      const result = validateSSP(data);
      expect(result.errors.some(e => e.field === 'rto')).toBe(true);
    });

    it('should accept RTO with numeric value', () => {
      const data: SSPData = { ...VALID_BASE, rto: '4 hours' };
      const result = validateSSP(data);
      expect(result.errors.some(e => e.field === 'rto' && e.message.includes('numeric'))).toBe(false);
    });

    it('should warn if RPO has no numeric value', () => {
      const data: SSPData = { ...VALID_BASE, rpo: 'Minimal' };
      const result = validateSSP(data);
      expect(result.errors.some(e => e.field === 'rpo' && e.message.includes('numeric'))).toBe(true);
    });

    it('should accept pure numeric RTO/RPO', () => {
      const data: SSPData = { ...VALID_BASE, rto: '24', rpo: '4' };
      const result = validateSSP(data);
      expect(result.errors.some(e => e.field === 'rto' && e.message.includes('numeric'))).toBe(false);
      expect(result.errors.some(e => e.field === 'rpo' && e.message.includes('numeric'))).toBe(false);
    });
  });

  // =========================================================================
  // Full Validation Pipeline
  // =========================================================================
  describe('Full Validation Pipeline', () => {
    it('should report zero errors for a complete, well-formed SSP', () => {
      const data: SSPData = {
        ...VALID_BASE,
        soEmail: 'so@agency.gov',
        aoEmail: 'ao@agency.gov',
        issoEmail: 'isso@agency.gov',
      };
      const result = validateSSP(data);
      expect(result.isValid).toBe(true);
      expect(result.errorCount).toBe(0);
      expect(Object.keys(result.sectionErrors)).toHaveLength(0);
    });

    it('should accumulate errors across all validation passes', () => {
      const data: SSPData = {
        // Missing required fields (Pass 1)
        // + bad email (Pass 2)
        // + bad impact (Pass 2)
        // + PII without PIA (Pass 3)
        soEmail: 'not-email',
        conf: 'Invalid',
        ptaCollectsPii: 'Yes',
      };
      const result = validateSSP(data);
      // At minimum: many required fields missing + email error + impact error + PIA error
      expect(result.errorCount).toBeGreaterThan(10);
      expect(result.errors.some(e => e.message.includes('required'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('email'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('must be one of'))).toBe(true);
      expect(result.errors.some(e => e.field === 'ptaPiaRequired')).toBe(true);
    });
  });
});
