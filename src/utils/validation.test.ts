/**
 * SSP Validation Tests
 */
import { describe, it, expect } from 'vitest';
import {
  validateSSP,
  getSectionErrors,
  hasFieldError,
  getFieldError,
  formatValidationSummary,
  type ValidationResult
} from './validation';

describe('SSP Validation', () => {
  describe('validateSSP', () => {
    it('should return invalid for empty data', () => {
      const result = validateSSP({});
      expect(result.isValid).toBe(false);
      expect(result.errorCount).toBeGreaterThan(0);
    });

    it('should validate required system info fields', () => {
      const result = validateSSP({
        sysName: 'Test System',
        sysAcronym: 'TST',
        sysDesc: 'A test system',
        authType: 'ato',
        owningAgency: 'Test Agency',
      });

      // Should pass system info section
      expect(result.sectionErrors.system_info).toBeUndefined();
    });

    it('should detect missing FIPS 199 categorization', () => {
      const result = validateSSP({
        sysName: 'Test',
        // Missing FIPS 199 fields
      });

      expect(result.sectionErrors.fips_199).toBeDefined();
      expect(result.errors.some(e => e.section === 'fips_199')).toBe(true);
    });

    it('should pass with complete minimum data', () => {
      const completeData = {
        // System Info
        sysName: 'Test System',
        sysAcronym: 'TST',
        sysDesc: 'Description',
        authType: 'ato',
        owningAgency: 'Test Agency',

        // FIPS 199
        conf: 'moderate',
        integ: 'moderate',
        avail: 'low',

        // Baseline
        ctrlBaseline: 'moderate',

        // RMF
        rmfCurrentStep: 'implement',

        // Boundary
        bndNarr: 'Authorization boundary description',

        // Data flow
        dfNarr: 'Data flow description',

        // Network
        netNarr: 'Network architecture description',

        // Personnel
        soName: 'System Owner',
        aoName: 'Authorizing Official',
        issoName: 'ISSO Name',

        // Digital Identity
        ial: '2',
        aal: '2',

        // Contingency Plan
        rto: '24',
        rpo: '4',

        // IR Plan
        irPurpose: 'IR Purpose',

        // ConMon
        iscmType: 'continuous',
      };

      const result = validateSSP(completeData);
      expect(result.isValid).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    it('should count section errors correctly', () => {
      const partialData = {
        sysName: 'Test',
        // Missing other required fields
      };

      const result = validateSSP(partialData);
      expect(Object.keys(result.sectionErrors).length).toBeGreaterThan(0);
    });

    it('should format errors with field and section info', () => {
      const result = validateSSP({});

      expect(result.errors.length).toBeGreaterThan(0);
      const firstError = result.errors[0];
      expect(firstError).toHaveProperty('field');
      expect(firstError).toHaveProperty('section');
      expect(firstError).toHaveProperty('message');
    });
  });

  describe('getSectionErrors', () => {
    it('should return errors for specific section', () => {
      const result = validateSSP({});
      const systemInfoErrors = getSectionErrors(result, 'system_info');

      expect(Array.isArray(systemInfoErrors)).toBe(true);
      expect(systemInfoErrors.every(e => e.section === 'system_info')).toBe(true);
    });

    it('should return empty array for section without errors', () => {
      const result = validateSSP({
        sysName: 'Test',
        sysAcronym: 'TST',
        sysDesc: 'Desc',
        authType: 'ato',
        owningAgency: 'Agency',
      });
      const systemInfoErrors = getSectionErrors(result, 'system_info');
      expect(systemInfoErrors.length).toBe(0);
    });
  });

  describe('hasFieldError', () => {
    it('should return true for field with error', () => {
      const result = validateSSP({});
      expect(hasFieldError(result, 'sysName')).toBe(true);
    });

    it('should return false for field without error', () => {
      const result = validateSSP({ sysName: 'Test' });
      expect(hasFieldError(result, 'sysName')).toBe(false);
    });
  });

  describe('getFieldError', () => {
    it('should return error message for field', () => {
      const result = validateSSP({});
      const error = getFieldError(result, 'sysName');
      expect(error).toContain('required');
    });

    it('should return undefined for field without error', () => {
      const result = validateSSP({ sysName: 'Test' });
      expect(getFieldError(result, 'sysName')).toBeUndefined();
    });
  });

  describe('formatValidationSummary', () => {
    it('should return success message for valid data', () => {
      const validData = {
        sysName: 'Test System',
        sysAcronym: 'TST',
        sysDesc: 'Description',
        authType: 'ato',
        owningAgency: 'Test Agency',
        conf: 'moderate',
        integ: 'moderate',
        avail: 'low',
        ctrlBaseline: 'moderate',
        rmfCurrentStep: 'implement',
        bndNarr: 'Boundary',
        dfNarr: 'Data flow',
        netNarr: 'Network',
        soName: 'SO',
        aoName: 'AO',
        issoName: 'ISSO',
        ial: '2',
        aal: '2',
        rto: '24',
        rpo: '4',
        irPurpose: 'IR',
        iscmType: 'continuous',
      };
      const result = validateSSP(validData);
      const summary = formatValidationSummary(result);
      expect(summary).toContain('complete');
    });

    it('should return error summary for invalid data', () => {
      const result = validateSSP({});
      const summary = formatValidationSummary(result);
      expect(summary).toContain('missing');
    });
  });

  describe('ValidationResult Structure', () => {
    it('should return proper ValidationResult structure', () => {
      const result: ValidationResult = validateSSP({});

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('errorCount');
      expect(result).toHaveProperty('sectionErrors');

      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(typeof result.errorCount).toBe('number');
      expect(typeof result.sectionErrors).toBe('object');
    });
  });
});
