/**
 * Type Guard and Validation Type Tests
 * Tests isValidatedSSPData, RequiredSSPFields, and constrained types.
 */
import { describe, it, expect } from 'vitest';
import { isValidatedSSPData } from './index';
import type { SSPData } from './index';

describe('SSPData Type Guards', () => {
  describe('isValidatedSSPData', () => {
    it('should return true for a fully populated SSPData', () => {
      const data: SSPData = {
        sysName: 'ForgeComply 360 Reporter',
        sysDesc: 'Security compliance reporting tool',
        conf: 'Moderate',
        integ: 'Moderate',
        avail: 'Low',
        ctrlBaseline: 'Moderate',
        authType: 'FISMA Agency ATO',
        owningAgency: 'Department of Testing',
      };
      expect(isValidatedSSPData(data)).toBe(true);
    });

    it('should return false for empty SSPData', () => {
      const data: SSPData = {};
      expect(isValidatedSSPData(data)).toBe(false);
    });

    it('should return false when sysName is missing', () => {
      const data: SSPData = {
        sysDesc: 'Description',
        conf: 'Moderate',
        integ: 'Moderate',
        avail: 'Low',
        ctrlBaseline: 'Moderate',
        authType: 'ATO',
        owningAgency: 'Agency',
      };
      expect(isValidatedSSPData(data)).toBe(false);
    });

    it('should return false when sysName is whitespace only', () => {
      const data: SSPData = {
        sysName: '   ',
        sysDesc: 'Description',
        conf: 'Moderate',
        integ: 'Moderate',
        avail: 'Low',
        ctrlBaseline: 'Moderate',
        authType: 'ATO',
        owningAgency: 'Agency',
      };
      expect(isValidatedSSPData(data)).toBe(false);
    });

    it('should return false for invalid impact level', () => {
      const data: SSPData = {
        sysName: 'Test',
        sysDesc: 'Description',
        conf: 'Critical', // Not a valid ImpactLevel
        integ: 'Moderate',
        avail: 'Low',
        ctrlBaseline: 'Moderate',
        authType: 'ATO',
        owningAgency: 'Agency',
      };
      expect(isValidatedSSPData(data)).toBe(false);
    });

    it('should return false for lowercase impact level (strict check)', () => {
      const data: SSPData = {
        sysName: 'Test',
        sysDesc: 'Description',
        conf: 'moderate', // lowercase — isValidatedSSPData uses strict ImpactLevel type
        integ: 'Moderate',
        avail: 'Low',
        ctrlBaseline: 'Moderate',
        authType: 'ATO',
        owningAgency: 'Agency',
      };
      // The type guard checks exact match against 'Low' | 'Moderate' | 'High'
      expect(isValidatedSSPData(data)).toBe(false);
    });

    it('should accept all three valid impact levels', () => {
      for (const level of ['Low', 'Moderate', 'High'] as const) {
        const data: SSPData = {
          sysName: 'Test',
          sysDesc: 'Description',
          conf: level,
          integ: level,
          avail: level,
          ctrlBaseline: level,
          authType: 'ATO',
          owningAgency: 'Agency',
        };
        expect(isValidatedSSPData(data)).toBe(true);
      }
    });

    it('should return false when ctrlBaseline is invalid', () => {
      const data: SSPData = {
        sysName: 'Test',
        sysDesc: 'Description',
        conf: 'Moderate',
        integ: 'Moderate',
        avail: 'Low',
        ctrlBaseline: 'None', // invalid
        authType: 'ATO',
        owningAgency: 'Agency',
      };
      expect(isValidatedSSPData(data)).toBe(false);
    });

    it('should return false when authType is empty string', () => {
      const data: SSPData = {
        sysName: 'Test',
        sysDesc: 'Description',
        conf: 'Moderate',
        integ: 'Moderate',
        avail: 'Low',
        ctrlBaseline: 'Moderate',
        authType: '',
        owningAgency: 'Agency',
      };
      expect(isValidatedSSPData(data)).toBe(false);
    });

    it('should return false when owningAgency is missing', () => {
      const data: SSPData = {
        sysName: 'Test',
        sysDesc: 'Description',
        conf: 'Moderate',
        integ: 'Moderate',
        avail: 'Low',
        ctrlBaseline: 'Moderate',
        authType: 'ATO',
      };
      expect(isValidatedSSPData(data)).toBe(false);
    });
  });
});
