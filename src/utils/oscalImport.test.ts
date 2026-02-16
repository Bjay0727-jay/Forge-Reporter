/**
 * OSCAL Import Tests
 * Tests file size validation, empty file rejection, format detection,
 * and parsing robustness for the ForgeComply 360 import pipeline.
 */
import { describe, it, expect } from 'vitest';
import { importOscalSSP, isValidOscalFile, formatFileSize } from './oscalImport';

/**
 * Create a mock File with given content and metadata.
 * jsdom's File does not implement .text(), so we build a plain object
 * that satisfies the File interface used by importOscalSSP.
 */
function mockFile(content: string, name = 'ssp.json', type = 'application/json'): File {
  const blob = new Blob([content], { type });
  return {
    name,
    type,
    size: blob.size,
    lastModified: Date.now(),
    webkitRelativePath: '',
    text: () => Promise.resolve(content),
    arrayBuffer: () => blob.arrayBuffer(),
    slice: (start?: number, end?: number, contentType?: string) => blob.slice(start, end, contentType),
    stream: () => blob.stream(),
  } as unknown as File;
}

describe('OSCAL Import', () => {
  // =========================================================================
  // File Size Validation (DoS prevention)
  // =========================================================================
  describe('File Size Validation', () => {
    it('should reject files larger than 50 MB', async () => {
      // Create a mock File that reports a large size without actually allocating memory
      const bigFile = mockFile('{}', 'huge.json');
      Object.defineProperty(bigFile, 'size', { value: 51 * 1024 * 1024 });

      await expect(importOscalSSP(bigFile)).rejects.toThrow('File too large');
    });

    it('should include file size in error message', async () => {
      const bigFile = mockFile('{}', 'huge.json');
      Object.defineProperty(bigFile, 'size', { value: 60 * 1024 * 1024 });

      await expect(importOscalSSP(bigFile)).rejects.toThrow('60.0 MB');
    });

    it('should include max size in error message', async () => {
      const bigFile = mockFile('{}', 'huge.json');
      Object.defineProperty(bigFile, 'size', { value: 60 * 1024 * 1024 });

      await expect(importOscalSSP(bigFile)).rejects.toThrow('50.0 MB');
    });

    it('should reject empty files (0 bytes)', async () => {
      const emptyFile = mockFile('', 'empty.json');
      Object.defineProperty(emptyFile, 'size', { value: 0 });

      await expect(importOscalSSP(emptyFile)).rejects.toThrow('empty');
    });

    it('should accept files at exactly 50 MB', async () => {
      // File at the limit — should not be rejected for size
      const limitFile = mockFile('{"system-security-plan":{}}', 'limit.json');
      Object.defineProperty(limitFile, 'size', { value: 50 * 1024 * 1024 });

      // Will fail for missing metadata, but NOT for file size
      await expect(importOscalSSP(limitFile)).resolves.toBeDefined();
    });

    it('should accept normal-sized files', async () => {
      const minimalSSP = JSON.stringify({
        'system-security-plan': {
          uuid: '00000000-0000-0000-0000-000000000000',
          metadata: {
            title: 'Test SSP',
            'last-modified': '2025-01-01T00:00:00Z',
            version: '1.0',
            'oscal-version': '1.1.2',
          },
          'import-profile': { href: '#' },
          'system-characteristics': {
            'system-name': 'Test',
            'system-ids': [{ id: 'test-001' }],
            description: 'Test system',
            'security-sensitivity-level': 'moderate',
            'security-impact-level': {
              'security-objective-confidentiality': 'moderate',
              'security-objective-integrity': 'moderate',
              'security-objective-availability': 'low',
            },
            'authorization-boundary': { description: 'Boundary' },
            status: { state: 'operational' },
          },
          'system-implementation': {
            users: [],
            components: [{
              uuid: '11111111-1111-1111-1111-111111111111',
              type: 'this-system',
              title: 'This System',
              description: 'The system itself',
              status: { state: 'operational' },
            }],
          },
          'control-implementation': {
            description: 'Control implementation',
            'implemented-requirements': [],
          },
        },
      });
      const file = mockFile(minimalSSP, 'valid.json');

      const result = await importOscalSSP(file);
      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.data!.sysName).toBe('Test');
    });
  });

  // =========================================================================
  // Format Detection
  // =========================================================================
  describe('Format Detection', () => {
    it('should detect JSON format from .json extension', async () => {
      const file = mockFile('{"system-security-plan":{}}', 'ssp.json');
      const result = await importOscalSSP(file);
      expect(result.sourceFormat).toBe('json');
    });

    it('should detect XML format from .xml extension', async () => {
      // parseOscalXml returns xmlToJson(documentElement) — the root element's
      // tag name is NOT used as a key, so we must wrap it in an outer element
      // whose child is <system-security-plan>.
      const xml = '<root><system-security-plan><metadata><title>Test</title></metadata></system-security-plan></root>';
      const file = mockFile(xml, 'ssp.xml', 'application/xml');
      const result = await importOscalSSP(file);
      expect(result.sourceFormat).toBe('xml');
    });

    it('should reject invalid JSON', async () => {
      const file = mockFile('{ invalid json }}}', 'bad.json');
      await expect(importOscalSSP(file)).rejects.toThrow('Invalid JSON');
    });
  });

  // =========================================================================
  // SSP Structure Validation
  // =========================================================================
  describe('SSP Structure Validation', () => {
    it('should reject JSON without system-security-plan root', async () => {
      const file = mockFile('{"catalog": {}}', 'catalog.json');
      await expect(importOscalSSP(file)).rejects.toThrow('No system-security-plan');
    });

    it('should extract document info from metadata', async () => {
      const ssp = JSON.stringify({
        'system-security-plan': {
          metadata: {
            title: 'My SSP',
            version: '2.0',
            'last-modified': '2025-06-15T12:00:00Z',
            'oscal-version': '1.1.2',
          },
        },
      });
      const file = mockFile(ssp, 'doc.json');
      const result = await importOscalSSP(file);
      expect(result.documentInfo.title).toBe('My SSP');
      expect(result.documentInfo.version).toBe('2.0');
      expect(result.documentInfo.oscalVersion).toBe('1.1.2');
    });
  });

  // =========================================================================
  // File Type Validation
  // =========================================================================
  describe('File Type Validation', () => {
    it('should accept .json files', () => {
      const file = mockFile('{}', 'ssp.json');
      expect(isValidOscalFile(file)).toBe(true);
    });

    it('should accept .xml files', () => {
      const file = mockFile('<xml/>', 'ssp.xml', 'application/xml');
      expect(isValidOscalFile(file)).toBe(true);
    });

    it('should accept .oscal files', () => {
      const file = mockFile('{}', 'ssp.oscal');
      expect(isValidOscalFile(file)).toBe(true);
    });

    it('should reject .pdf files', () => {
      const file = mockFile('', 'ssp.pdf', 'application/pdf');
      expect(isValidOscalFile(file)).toBe(false);
    });

    it('should reject .docx files', () => {
      const file = mockFile('', 'ssp.docx', 'application/vnd.openxmlformats');
      expect(isValidOscalFile(file)).toBe(false);
    });
  });

  // =========================================================================
  // formatFileSize Utility
  // =========================================================================
  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
    });
  });
});
