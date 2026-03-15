/**
 * DOCX Export Tests
 * Validates Word document generation from SSPData
 */
import { describe, it, expect } from 'vitest';
import { generateDOCX } from './docxExport';
import type { SSPData } from '../types';

const SAMPLE_DATA: SSPData = {
  sysName: 'Test System',
  sysAcronym: 'TST',
  owningAgency: 'Test Agency',
  authType: 'FISMA Agency ATO',
  conf: 'Moderate',
  integ: 'Moderate',
  avail: 'Low',
  ctrlBaseline: 'Moderate',
  sysDesc: 'A test system for unit tests.',
  fismaId: 'TST-001',
  fedrampId: 'FR-001',
  catJust: 'Based on NIST SP 800-60.',
  bndNarr: 'Boundary includes app server and database.',
  dfNarr: 'Data flows from users through the web tier.',
  encRest: 'AES-256',
  encTransit: 'TLS 1.3',
  netNarr: 'Single-tier architecture.',
  primaryDC: 'AWS us-east-1',
  soName: 'Jane Doe',
  soEmail: 'jane@example.com',
  aoName: 'John Smith',
  ial: '2',
  aal: '2',
  fal: '2',
  cpPurpose: 'Ensure continuity of operations.',
  rto: '4 hours',
  rpo: '1 hour',
  irPurpose: 'Respond to security incidents.',
  cmPurpose: 'Manage configuration baselines.',
  iscmType: 'Ongoing Assessment',
  poamFreq: 'Monthly',
  ptaCollectsPii: 'Yes',
  infoTypes: [
    { nistId: 'C.2.8.1', name: 'Financial', c: 'Moderate', i: 'Moderate', a: 'Low' },
  ],
  ppsRows: [
    { port: '443', proto: 'TCP', svc: 'HTTPS', purpose: 'Web traffic', dir: 'Inbound' },
  ],
  icRows: [
    { sys: 'External System', org: 'Partner Agency', conn: 'VPN', dir: 'Bidirectional' },
  ],
  cryptoMods: [
    { mod: 'OpenSSL 3.0', cert: '#4282', level: 'Level 1', usage: 'TLS' },
  ],
  sepDutyMatrix: [
    { role: 'Admin', access: 'Full', prohibited: 'Self-audit' },
  ],
  policyDocs: [
    { family: 'AC', title: 'Access Control Policy', version: '2.0', status: 'Active' },
  ],
  bndComps: [
    { name: 'Web Server', type: 'Software', zone: 'DMZ' },
  ],
  ctrlData: {
    'AC-1': { status: 'implemented', implementation: 'Access control policy documented and enforced.' },
    'CM-1': { status: 'partial', implementation: 'Config management in progress.' },
  },
  poamRows: [
    { id: 'POAM-001', weakness: 'Missing MFA', sev: 'High', ctrl: 'IA-2', status: 'Open', due: '2026-06-01' },
  ],
  scrmSuppliers: [
    { supplier: 'AWS', type: 'IaaS', criticality: 'High', riskLevel: 'Low' },
  ],
  cmBaselines: [
    { comp: 'RHEL 9', bench: 'CIS Level 1', ver: '1.0', pct: '95' },
  ],
};

const SAMPLE_PROGRESS: Record<string, number> = {
  sysinfo: 100,
  fips199: 80,
  infotypes: 50,
  baseline: 100,
  rmf: 0,
  boundary: 60,
  dataflow: 40,
  network: 30,
  pps: 100,
  intercon: 50,
  crypto: 70,
  personnel: 90,
  identity: 60,
  sepduty: 100,
  controls: 20,
  policies: 80,
  scrm: 50,
  privacy: 40,
  conplan: 70,
  irplan: 30,
  cmplan: 60,
  conmon: 50,
  poam: 40,
};

describe('DOCX Export', () => {
  it('should generate a valid DOCX blob from full SSP data', async () => {
    const blob = await generateDOCX({ data: SAMPLE_DATA, progress: SAMPLE_PROGRESS });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(1000); // Should be a non-trivial document
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  });

  it('should generate a DOCX from minimal/empty data', async () => {
    const blob = await generateDOCX({ data: {}, progress: {} });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(500);
  });

  it('should handle data with only system info', async () => {
    const blob = await generateDOCX({
      data: { sysName: 'Minimal System', sysDesc: 'A minimal system.' },
      progress: { sysinfo: 50 },
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(500);
  });

  it('should handle large control datasets', async () => {
    const ctrlData: Record<string, { status: string; implementation: string }> = {};
    for (let i = 1; i <= 100; i++) {
      ctrlData[`AC-${i}`] = { status: 'implemented', implementation: `Control AC-${i} implementation.` };
    }

    const blob = await generateDOCX({
      data: { ...SAMPLE_DATA, ctrlData },
      progress: SAMPLE_PROGRESS,
    });

    expect(blob).toBeInstanceOf(Blob);
    // With 100 controls (capped at 50 in table), should still be reasonable
    expect(blob.size).toBeGreaterThan(2000);
  });

  it('should handle all table-based sections with empty arrays', async () => {
    const blob = await generateDOCX({
      data: {
        sysName: 'Empty Tables Test',
        infoTypes: [],
        ppsRows: [],
        icRows: [],
        cryptoMods: [],
        sepDutyMatrix: [],
        policyDocs: [],
        poamRows: [],
        scrmSuppliers: [],
        cmBaselines: [],
        ctrlData: {},
      },
      progress: {},
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(500);
  });
});
