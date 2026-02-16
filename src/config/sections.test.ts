/**
 * Section Configuration Tests
 * Tests RMF step coverage, section IDs, and section structure.
 */
import { describe, it, expect } from 'vitest';
import { SECTIONS, SECTION_GROUPS, RMF_STEPS, type RMFStep } from './sections';

describe('Section Configuration', () => {
  // =========================================================================
  // RMF Step Coverage
  // =========================================================================
  describe('RMF Step Coverage', () => {
    it('should have all 7 RMF steps defined', () => {
      expect(RMF_STEPS).toEqual([
        'Prepare', 'Categorize', 'Select', 'Implement',
        'Assess', 'Authorize', 'Monitor',
      ]);
    });

    it('should have at least one section for each RMF step', () => {
      const coveredSteps = new Set(
        SECTIONS.map((s) => s.rmf).filter((rmf): rmf is RMFStep => rmf !== 'All Steps'),
      );

      for (const step of RMF_STEPS) {
        expect(coveredSteps.has(step)).toBe(true);
      }
    });

    it('should have an Assess section for RMF Step 5', () => {
      const assessSections = SECTIONS.filter((s) => s.rmf === 'Assess');
      expect(assessSections.length).toBeGreaterThanOrEqual(1);
      expect(assessSections.some((s) => s.id === 'assess')).toBe(true);
    });

    it('should have an Authorize section for RMF Step 6', () => {
      const authSections = SECTIONS.filter((s) => s.rmf === 'Authorize');
      expect(authSections.length).toBeGreaterThanOrEqual(1);
      expect(authSections.some((s) => s.id === 'authorize')).toBe(true);
    });

    it('should have a Monitor section for RMF Step 7', () => {
      const monSections = SECTIONS.filter((s) => s.rmf === 'Monitor');
      expect(monSections.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // Section Structure
  // =========================================================================
  describe('Section Structure', () => {
    it('should have unique section IDs', () => {
      const ids = SECTIONS.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all required fields on every section', () => {
      for (const section of SECTIONS) {
        expect(section.id).toBeTruthy();
        expect(section.label).toBeTruthy();
        expect(section.icon).toBeTruthy();
        expect(section.ref).toBeTruthy();
        expect(section.grp).toBeTruthy();
        expect(section.tag).toBeTruthy();
        expect(section.rmf).toBeTruthy();
      }
    });

    it('should have valid group assignments', () => {
      for (const section of SECTIONS) {
        expect(SECTION_GROUPS).toContain(section.grp);
      }
    });

    it('should have valid tag values', () => {
      const validTags = ['original', 'fedramp', 'fisma'];
      for (const section of SECTIONS) {
        expect(validTags).toContain(section.tag);
      }
    });

    it('should have valid RMF step values', () => {
      const validSteps = [...RMF_STEPS, 'All Steps'];
      for (const section of SECTIONS) {
        expect(validSteps).toContain(section.rmf);
      }
    });
  });

  // =========================================================================
  // Section Count & Groups
  // =========================================================================
  describe('Section Counts', () => {
    it('should have at least 23 sections (original 21 + assess + authorize)', () => {
      expect(SECTIONS.length).toBeGreaterThanOrEqual(23);
    });

    it('should have 6 section groups', () => {
      expect(SECTION_GROUPS).toHaveLength(6);
      expect(SECTION_GROUPS).toEqual([
        'Frontmatter', 'Architecture', 'Personnel', 'Controls', 'Plans', 'Post-Auth',
      ]);
    });

    it('should have Post-Auth sections for assess, authorize, conmon, and poam', () => {
      const postAuth = SECTIONS.filter((s) => s.grp === 'Post-Auth');
      const postAuthIds = postAuth.map((s) => s.id);
      expect(postAuthIds).toContain('assess');
      expect(postAuthIds).toContain('authorize');
      expect(postAuthIds).toContain('conmon');
      expect(postAuthIds).toContain('poam');
    });
  });

  // =========================================================================
  // New Assess Section Details
  // =========================================================================
  describe('Assess Section', () => {
    const assess = SECTIONS.find((s) => s.id === 'assess')!;

    it('should reference SP 800-53A', () => {
      expect(assess.ref).toContain('800-53A');
    });

    it('should be tagged as FISMA', () => {
      expect(assess.tag).toBe('fisma');
    });

    it('should be in Post-Auth group', () => {
      expect(assess.grp).toBe('Post-Auth');
    });

    it('should have a banner text', () => {
      expect(assess.bannerText).toBeTruthy();
      expect(assess.bannerText).toContain('SAP');
      expect(assess.bannerText).toContain('SAR');
    });
  });

  // =========================================================================
  // New Authorize Section Details
  // =========================================================================
  describe('Authorize Section', () => {
    const authorize = SECTIONS.find((s) => s.id === 'authorize')!;

    it('should reference SP 800-37', () => {
      expect(authorize.ref).toContain('800-37');
    });

    it('should be tagged as FISMA', () => {
      expect(authorize.tag).toBe('fisma');
    });

    it('should be in Post-Auth group', () => {
      expect(authorize.grp).toBe('Post-Auth');
    });

    it('should have a banner text mentioning AO', () => {
      expect(authorize.bannerText).toBeTruthy();
      expect(authorize.bannerText).toContain('Authorizing Official');
    });
  });
});
