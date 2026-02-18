/**
 * ForgeComply 360 Reporter — Deploy & Data Input Tests
 *
 * End-to-end pipeline: data entry → validation → state management →
 * backend deployment → OSCAL export.  Covers every stage that SSP data
 * flows through when a user fills out the Reporter and syncs to the
 * ForgeComply 360 backend.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SSPData, InfoType, PPSRow, CryptoModule, SepDutyRow, PolicyDoc, SCRMSupplier, CMBaseline } from '../types';
import { isValidatedSSPData } from '../types';
import { validateSSP, getSectionErrors, hasFieldError, getFieldError, formatValidationSummary } from '../utils/validation';
import {
  generateOscalSSP,
  generateValidatedOscalSSP,
  oscalToJson,
} from '../utils/oscalExport';
import {
  saveSSPToBackend,
  loadSSPFromBackend,
  syncInfoTypes,
  syncPortsProtocols,
  syncCryptoModules,
  syncSeparationDuties,
  syncPolicyMappings,
  syncSCRMEntries,
  syncCMBaselines,
} from '../services/sspMapper';

// ---------------------------------------------------------------------------
// Mock the low-level API client so no real HTTP calls are made
// ---------------------------------------------------------------------------
vi.mock('../services/api', () => {
  const captured: Array<{ path: string; method: string; body?: unknown }> = [];
  return {
    api: vi.fn(async (path: string, options?: RequestInit) => {
      const method = options?.method || 'GET';
      const body = options?.body ? JSON.parse(options.body as string) : undefined;
      captured.push({ path, method, body });

      // --- loadSSPFromBackend stubs (GET) ---
      if (method === 'GET' && path.endsWith('/info-types'))
        return { info_types: [] };
      if (method === 'GET' && path.endsWith('/rmf-tracking'))
        return { rmf_tracking: null };
      if (method === 'GET' && path.endsWith('/ports-protocols'))
        return { ports_protocols: [] };
      if (method === 'GET' && path.endsWith('/crypto-modules'))
        return { crypto_modules: [] };
      if (method === 'GET' && path.endsWith('/digital-identity'))
        return { digital_identity: null };
      if (method === 'GET' && path.endsWith('/separation-duties'))
        return { separation_duties: [] };
      if (method === 'GET' && path.endsWith('/policy-mappings'))
        return { policy_mappings: [] };
      if (method === 'GET' && path.endsWith('/scrm'))
        return { scrm_entries: [] };
      if (method === 'GET' && path.endsWith('/scrm-plan'))
        return { scrm_plan: null };
      if (method === 'GET' && path.endsWith('/privacy-analysis'))
        return { privacy_analysis: null };
      if (method === 'GET' && path.endsWith('/config-management'))
        return { config_management: null };
      if (method === 'GET' && path.endsWith('/cm-baselines'))
        return { cm_baselines: [] };
      if (method === 'GET' && path.endsWith('/poam-summary'))
        return { poam_summary: null };

      // Main SSP document GET
      if (method === 'GET' && /\/api\/v1\/ssp\/[^/]+$/.test(path))
        return {
          document: {
            id: 'ssp-001',
            title: 'Test SSP',
            system_id: 'SYS-001',
            framework_id: 'FW-001',
            status: 'draft',
            ssp_type: 'fisma',
            system_name: 'Loaded System',
            system_acronym: 'LS',
            system_description: 'A system loaded from backend',
            impact_level: 'Moderate',
            oscal_json: {
              _authoring: {
                sections: {},
                fisma: {
                  owning_agency: 'Test Agency',
                  auth_type: 'fedramp-jab',
                  confidentiality: 'Moderate',
                  integrity: 'Moderate',
                  availability: 'Low',
                  control_baseline: 'Moderate',
                },
              },
            },
          },
        };

      // Default success for PUT/POST/DELETE
      return {};
    }),
    // Expose captured requests for assertions
    __captured: captured,
  };
});

// Access the captured calls array from the mock
type CapturedCall = { path: string; method: string; body?: unknown };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { __captured: captured } = vi.mocked(await import('../services/api')) as any as { __captured: CapturedCall[] };

beforeEach(() => {
  (captured as Array<unknown>).length = 0;
  vi.clearAllMocks();
});

// ===========================================================================
// 1. COMPLETE SSP DATA FIXTURES
// ===========================================================================

/** Minimal valid SSP data — satisfies all 22 required fields */
function buildMinimalSSP(): SSPData {
  return {
    sysName: 'ForgeTest System',
    sysAcronym: 'FTS',
    owningAgency: 'Department of Testing',
    sysDesc: 'An SSP for automated deployment testing.',
    authType: 'fedramp-agency',
    conf: 'Moderate',
    integ: 'Moderate',
    avail: 'Low',
    ctrlBaseline: 'Moderate',
    rmfCurrentStep: 'Implement',
    bndNarr: 'The system boundary includes all cloud-hosted components.',
    dfNarr: 'Data flows from users through a TLS-encrypted API gateway.',
    netNarr: 'The network is segmented into public, private, and management zones.',
    soName: 'Alice Owner',
    soEmail: 'alice@agency.gov',
    aoName: 'Bob Official',
    aoEmail: 'bob@agency.gov',
    issoName: 'Carol Security',
    issoEmail: 'carol@agency.gov',
    ial: '2',
    aal: '2',
    rto: '4 hours',
    rpo: '1 hour',
    irPurpose: 'Detect, contain, and recover from security incidents.',
    iscmType: 'Hybrid',
  };
}

/** Fully-populated SSP data with collections for comprehensive testing */
function buildFullSSP(): SSPData {
  return {
    ...buildMinimalSSP(),
    fismaId: 'FISMA-2025-001',
    fedrampId: 'FR-2025-0042',
    agencyComp: 'Bureau of Testing',
    cloudModel: 'IaaS',
    deployModel: 'Government',
    authDuration: '3 years',
    authSystem: 'CyberFramework v2',
    opDate: '2025-01-15',
    catJust: 'Impact levels derived from NIST SP 800-60 analysis.',
    baseJust: 'Moderate baseline selected per FIPS 199 categorization.',
    tailoring: 'Tailored: removed PE controls for cloud-only deployment.',

    // Information Types
    infoTypes: [
      { nistId: 'C.2.8.1', name: 'System Development', c: 'Moderate', i: 'Moderate', a: 'Low' },
      { nistId: 'D.1.1', name: 'Administrative Management', c: 'Moderate', i: 'Moderate', a: 'Moderate' },
    ],
    infoTypeJust: 'Categorized per NIST SP 800-60 Volume II.',

    // RMF
    rmfTargetAto: '2025-12-01',

    // Architecture
    bndComps: [
      { name: 'API Gateway', type: 'software', purpose: 'Ingress proxy', zone: 'DMZ' },
      { name: 'App Server', type: 'software', purpose: 'Business logic', zone: 'Private' },
    ],
    encRest: 'AES-256-GCM via AWS KMS',
    encTransit: 'TLS 1.3 for all external traffic',
    keyMgmt: 'Keys managed in AWS KMS with automatic annual rotation.',
    dataDisposal: 'Crypto-shredding upon decommission.',
    netZones: [{ name: 'DMZ', desc: 'Public-facing zone' }, { name: 'Private', desc: 'Internal workloads' }],
    primaryDC: 'us-east-1',
    secondaryDC: 'us-west-2',

    // Ports / Protocols / Services
    ppsRows: [
      { port: '443', proto: 'TCP', svc: 'HTTPS', purpose: 'Web traffic', dir: 'inbound' },
      { port: '5432', proto: 'TCP', svc: 'PostgreSQL', purpose: 'Database', dir: 'internal' },
    ],

    // Crypto Modules
    cryptoNarr: 'All crypto operations use FIPS 140-2 Level 1 validated modules.',
    cryptoMods: [
      { mod: 'OpenSSL 3.0', cert: '4282', level: '1', usage: 'TLS termination', where: 'API Gateway' },
    ],

    // Personnel
    issmName: 'Dave Manager',
    issmEmail: 'dave@agency.gov',
    scaName: 'Eve Assessor',
    scaEmail: 'eve@agency.gov',
    poName: 'Frank Privacy',
    poEmail: 'frank@agency.gov',

    // Digital Identity
    fal: '2',
    mfaMethods: 'PIV + TOTP',
    idNarr: 'Users authenticate via PIV smart card or TOTP MFA.',

    // Separation of Duties
    sepDutyMatrix: [
      { role: 'System Admin', access: 'Full access', justification: 'Manages infrastructure' },
      { role: 'Developer', access: 'Deploy access', justification: 'Deploys application code' },
      { role: 'Auditor', access: 'Read-only', justification: 'Monitors compliance' },
    ],
    dualControl: 'Production deployments require two-person approval.',
    privAccess: 'Privileged access is time-limited and logged.',

    // Controls
    ctrlData: {
      'AC-1': { implementation: 'Access control policy published and reviewed annually.', status: 'implemented' },
      'AC-2': { implementation: 'Account management via centralized IAM.', status: 'implemented' },
      'CM-1': { implementation: 'Configuration management policy in place.', status: 'partial' },
      'IR-1': { implementation: 'Incident response plan drafted.', status: 'planned' },
    },

    // Policies
    policyDocs: [
      { family: 'AC', title: 'Access Control Policy', version: '3.0', owner: 'CISO', lastReview: '2025-06-01', status: 'Active' },
      { family: 'CM', title: 'Configuration Management Policy', version: '2.1', owner: 'CISO', lastReview: '2025-05-01', status: 'Active' },
    ],
    policyReviewCycle: 'Annual review with interim updates as needed.',
    policyException: 'Exception process documented in GRC tool.',

    // SCRM
    scrmPlan: 'Supply chain risk managed per NIST SP 800-161.',
    scrmSuppliers: [
      { supplier: 'AWS', type: 'IaaS', criticality: 'High', sbom: 'Yes', riskLevel: 'Low' },
      { supplier: 'Datadog', type: 'SaaS', criticality: 'Medium', sbom: 'No', riskLevel: 'Medium' },
    ],
    sbomFormat: 'CycloneDX 1.5',
    provenance: 'All third-party components tracked in dependency graph.',

    // Privacy
    ptaCollectsPii: 'Yes',
    ptaPiiTypes: 'Name, email, phone',
    ptaRecordCount: '10000',
    ptaPiaRequired: 'Yes',
    piaAuthority: 'Privacy Act of 1974',
    piaPurpose: 'Contact information for system notifications.',
    piaMinimization: 'Only essential contact data collected.',
    piaRetention: '3 years after account closure.',
    piaSharing: 'Not shared externally.',
    piaConsent: 'Collected at account creation via consent form.',
    sornStatus: 'Published',
    sornNumber: 'SORN-2025-001',

    // Contingency Plan
    cpPurpose: 'Ensure continuity of operations during service disruptions.',
    cpScope: 'Covers all production services.',
    mtd: '24 hours',
    backupFreq: 'Daily incremental, weekly full',
    cpTestDate: '2025-09-15',
    cpTestType: 'Tabletop exercise',

    // Incident Response
    irScope: 'All production systems and PII-holding databases.',
    irSeverity: [
      { level: 'Critical', response: '15 minutes', notify: 'CISO + AO' },
      { level: 'High', response: '1 hour', notify: 'ISSO' },
    ],
    certTime: '1 hour',
    irTestDate: '2025-10-01',

    // Configuration Management
    cmPurpose: 'Maintain secure baselines for all system components.',
    cmBaselines: [
      { comp: 'Amazon Linux 2', bench: 'CIS L1', ver: '2.0.0', pct: '98', scan: 'Weekly' },
      { comp: 'PostgreSQL 15', bench: 'CIS', ver: '1.0', pct: '95', scan: 'Monthly' },
    ],
    cmChangeNarr: 'All changes go through CAB review.',

    // Continuous Monitoring
    ctrlRotation: 'Monthly rotation of 1/3 of controls.',
    iscmNarrative: 'ISCM leverages automated scanning and manual reviews.',
    cmTools: [{ name: 'Nessus', purpose: 'Vulnerability scanning' }],
    sigChangeCriteria: 'Architecture changes, new data types, new interconnections.',
    iscmCadence: [{ activity: 'Vuln scan', freq: 'Weekly' }],
    atoExpiry: '2028-01-15',
    nextAssessment: '2026-06-01',

    // POA&M
    poamRows: [
      { id: 'POAM-001', weakness: 'TLS 1.0 still enabled on legacy endpoint', risk: 'High', milestone: 'Disable by Q3', status: 'Open' },
    ],
    poamFreq: 'Monthly',
    poamWf: 'Tracked in JIRA with automated escalation.',

    // Assess & Authorize (Post-Auth)
    assessType: 'Full',
    assessOrg: 'Third-Party Assessor Inc.',
    assessStart: '2025-11-01',
    assessEnd: '2025-12-15',
    sapSummary: 'Assessment plan covers all 325 moderate-baseline controls.',
    sarSummary: '3 findings, 0 critical.',
    assessCtrlCount: '325',
    assessFindingsCount: '3',
    authDecision: 'ATO',
    authDate: '2026-01-10',
    authAoName: 'Bob Official',
    authExpiry: '2028-01-10',
    authConditions: 'Remediate POA&M items within 90 days.',
    riskAcceptance: 'Residual risk accepted by AO.',
  };
}

// ===========================================================================
// 2. DATA INPUT → STATE MANAGEMENT
// ===========================================================================

describe('Data Input & State Management', () => {
  describe('setField pattern (simulated)', () => {
    it('should update individual scalar fields', () => {
      let data: SSPData = {};
      const setField = (key: string, value: unknown) => {
        data = { ...data, [key]: value };
      };

      setField('sysName', 'TestSys');
      setField('conf', 'High');
      setField('soEmail', 'owner@agency.gov');

      expect(data.sysName).toBe('TestSys');
      expect(data.conf).toBe('High');
      expect(data.soEmail).toBe('owner@agency.gov');
    });

    it('should update collection fields immutably', () => {
      let data: SSPData = {};
      const setField = (key: string, value: unknown) => {
        data = { ...data, [key]: value };
      };

      const rows: PPSRow[] = [
        { port: '443', proto: 'TCP', svc: 'HTTPS' },
        { port: '22', proto: 'TCP', svc: 'SSH' },
      ];

      setField('ppsRows', rows);
      expect(data.ppsRows).toHaveLength(2);
      expect(data.ppsRows![0].port).toBe('443');
    });

    it('should preserve existing fields when updating one field', () => {
      let data: SSPData = { sysName: 'Existing', conf: 'Low' };
      const setField = (key: string, value: unknown) => {
        data = { ...data, [key]: value };
      };

      setField('conf', 'High');
      expect(data.sysName).toBe('Existing');
      expect(data.conf).toBe('High');
    });

    it('should handle the complete progressive build-up of SSPData', () => {
      let data: SSPData = {};
      const setField = (key: string, value: unknown) => {
        data = { ...data, [key]: value };
      };

      // Simulate filling sections sequentially
      setField('sysName', 'Progressive System');
      setField('sysAcronym', 'PS');
      setField('owningAgency', 'Dept of Progressive Testing');
      setField('sysDesc', 'Built field by field.');
      setField('authType', 'fedramp-agency');
      setField('conf', 'Moderate');
      setField('integ', 'Moderate');
      setField('avail', 'Low');
      setField('ctrlBaseline', 'Moderate');
      setField('soName', 'Alice');
      setField('aoName', 'Bob');
      setField('issoName', 'Carol');

      expect(Object.keys(data).length).toBe(12);
      expect(data.sysName).toBe('Progressive System');
      expect(data.ctrlBaseline).toBe('Moderate');
    });
  });

  describe('useDT (Dynamic Table) pattern', () => {
    it('should add rows', () => {
      let data: SSPData = { ppsRows: [] };
      const setField = (_key: string, value: unknown) => {
        data = { ...data, ppsRows: value as PPSRow[] };
      };

      const rows = data.ppsRows || [];
      const newRows = [...rows, {} as PPSRow];
      setField('ppsRows', newRows);

      expect(data.ppsRows).toHaveLength(1);
    });

    it('should update a specific row field', () => {
      const initial: PPSRow[] = [
        { port: '80', proto: 'TCP', svc: 'HTTP' },
        { port: '443', proto: 'TCP', svc: 'HTTPS' },
      ];
      let data: SSPData = { ppsRows: initial };
      const setField = (_key: string, value: unknown) => {
        data = { ...data, ppsRows: value as PPSRow[] };
      };

      // Simulate useDT.upd(0, 'port', '8080')
      const rows = [...data.ppsRows!];
      rows[0] = { ...rows[0], port: '8080' };
      setField('ppsRows', rows);

      expect(data.ppsRows![0].port).toBe('8080');
      expect(data.ppsRows![1].port).toBe('443'); // unchanged
    });

    it('should delete a row by index', () => {
      const initial: InfoType[] = [
        { nistId: 'C.2.8.1', name: 'Type A' },
        { nistId: 'D.1.1', name: 'Type B' },
        { nistId: 'D.2.1', name: 'Type C' },
      ];
      let data: SSPData = { infoTypes: initial };
      const setField = (_key: string, value: unknown) => {
        data = { ...data, infoTypes: value as InfoType[] };
      };

      // Delete index 1 ("Type B")
      const rows = data.infoTypes!.filter((_, x) => x !== 1);
      setField('infoTypes', rows);

      expect(data.infoTypes).toHaveLength(2);
      expect(data.infoTypes![0].name).toBe('Type A');
      expect(data.infoTypes![1].name).toBe('Type C');
    });
  });

  describe('LocalStorage persistence simulation', () => {
    it('should round-trip SSPData through JSON serialization', () => {
      const original = buildFullSSP();
      const json = JSON.stringify(original);
      const restored: SSPData = JSON.parse(json);

      expect(restored.sysName).toBe(original.sysName);
      expect(restored.infoTypes).toHaveLength(original.infoTypes!.length);
      expect(restored.ctrlData).toEqual(original.ctrlData);
      expect(restored.ppsRows).toEqual(original.ppsRows);
      expect(restored.sepDutyMatrix).toEqual(original.sepDutyMatrix);
      expect(restored.scrmSuppliers).toEqual(original.scrmSuppliers);
    });

    it('should handle empty SSPData', () => {
      const empty: SSPData = {};
      const json = JSON.stringify(empty);
      const restored: SSPData = JSON.parse(json);
      expect(Object.keys(restored)).toHaveLength(0);
    });
  });
});

// ===========================================================================
// 3. VALIDATION PIPELINE
// ===========================================================================

describe('Validation Pipeline', () => {
  it('should pass validation with all required fields', () => {
    const data = buildMinimalSSP();
    const result = validateSSP(data);

    expect(result.isValid).toBe(true);
    expect(result.errorCount).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail on empty data with all required fields missing', () => {
    const result = validateSSP({});

    expect(result.isValid).toBe(false);
    expect(result.errorCount).toBeGreaterThan(0);

    // All sections with required fields should have errors
    expect(result.sectionErrors['system_info']).toBeGreaterThan(0);
    expect(result.sectionErrors['fips_199']).toBeGreaterThan(0);
    expect(result.sectionErrors['personnel']).toBeGreaterThan(0);
  });

  it('should detect invalid email format', () => {
    const data: SSPData = {
      ...buildMinimalSSP(),
      soEmail: 'not-an-email',
    };
    const result = validateSSP(data);

    const emailError = result.errors.find(e => e.field === 'soEmail');
    expect(emailError).toBeDefined();
    expect(emailError!.message).toContain('valid email');
  });

  it('should accept valid email addresses', () => {
    const data: SSPData = {
      ...buildMinimalSSP(),
      soEmail: 'alice@agency.gov',
      aoEmail: 'bob@example.com',
    };
    const result = validateSSP(data);
    const emailErrors = result.errors.filter(e => e.field.endsWith('Email'));
    expect(emailErrors).toHaveLength(0);
  });

  it('should reject invalid impact levels', () => {
    const data: SSPData = {
      ...buildMinimalSSP(),
      conf: 'Critical' as string, // not a valid FIPS 199 level
    };
    const result = validateSSP(data);

    const confError = result.errors.find(e => e.field === 'conf');
    expect(confError).toBeDefined();
    expect(confError!.message).toContain('Low, Moderate, High');
  });

  it('should accept impact levels case-insensitively', () => {
    const data: SSPData = {
      ...buildMinimalSSP(),
      conf: 'moderate',
      integ: 'LOW',
      avail: 'High',
    };
    const result = validateSSP(data);
    const impactErrors = result.errors.filter(e =>
      ['conf', 'integ', 'avail'].includes(e.field)
    );
    expect(impactErrors).toHaveLength(0);
  });

  it('should enforce narrative length limits', () => {
    const data: SSPData = {
      ...buildMinimalSSP(),
      sysDesc: 'x'.repeat(50_001),
    };
    const result = validateSSP(data);

    const lengthError = result.errors.find(e => e.field === 'sysDesc');
    expect(lengthError).toBeDefined();
    expect(lengthError!.message).toContain('50,000');
  });

  it('should enforce PII → PIA cross-field rule', () => {
    const data: SSPData = {
      ...buildMinimalSSP(),
      ptaCollectsPii: 'Yes',
      // ptaPiaRequired intentionally omitted
    };
    const result = validateSSP(data);

    const piaError = result.errors.find(e => e.field === 'ptaPiaRequired');
    expect(piaError).toBeDefined();
    expect(piaError!.message).toContain('PII');
  });

  it('should not flag PIA when PII is not collected', () => {
    const data: SSPData = {
      ...buildMinimalSSP(),
      ptaCollectsPii: 'No',
    };
    const result = validateSSP(data);
    const piaError = result.errors.find(e => e.field === 'ptaPiaRequired');
    expect(piaError).toBeUndefined();
  });

  it('should flag non-numeric RTO/RPO', () => {
    const data: SSPData = {
      ...buildMinimalSSP(),
      rto: 'as fast as possible', // no digits
      rpo: 'minimal',
    };
    const result = validateSSP(data);

    expect(result.errors.some(e => e.field === 'rto')).toBe(true);
    expect(result.errors.some(e => e.field === 'rpo')).toBe(true);
  });

  describe('Validation helper functions', () => {
    it('getSectionErrors returns only errors for a given section', () => {
      const result = validateSSP({});
      const sysErrors = getSectionErrors(result, 'system_info');
      expect(sysErrors.length).toBeGreaterThan(0);
      sysErrors.forEach(e => expect(e.section).toBe('system_info'));
    });

    it('hasFieldError detects specific field errors', () => {
      const result = validateSSP({});
      expect(hasFieldError(result, 'sysName')).toBe(true);
    });

    it('getFieldError returns error message', () => {
      const result = validateSSP({});
      const msg = getFieldError(result, 'sysName');
      expect(msg).toContain('required');
    });

    it('formatValidationSummary returns success message for valid data', () => {
      const result = validateSSP(buildMinimalSSP());
      expect(formatValidationSummary(result)).toContain('complete');
    });

    it('formatValidationSummary returns error count for invalid data', () => {
      const result = validateSSP({});
      expect(formatValidationSummary(result)).toContain('missing');
    });
  });

  describe('Type guard: isValidatedSSPData', () => {
    it('should pass for fully-populated data', () => {
      expect(isValidatedSSPData(buildMinimalSSP())).toBe(true);
    });

    it('should fail for empty data', () => {
      expect(isValidatedSSPData({})).toBe(false);
    });

    it('should fail when required field is empty string', () => {
      const data = { ...buildMinimalSSP(), sysName: '' };
      expect(isValidatedSSPData(data)).toBe(false);
    });
  });
});

// ===========================================================================
// 4. BACKEND DEPLOYMENT — saveSSPToBackend
// ===========================================================================

describe('Backend Deployment via ForgeComply 360 API', () => {
  describe('saveSSPToBackend — first save (no previous data)', () => {
    it('should send PUT requests for all section groups', async () => {
      const data = buildFullSSP();
      await saveSSPToBackend('ssp-001', data);

      const puts = captured.filter(c => c.method === 'PUT');
      expect(puts.length).toBeGreaterThan(0);

      // Verify key endpoints were called
      const paths = puts.map(p => p.path);
      expect(paths.some(p => p.includes('/sections/system_info'))).toBe(true);
      expect(paths.some(p => p.includes('/sections/fips_199'))).toBe(true);
      expect(paths.some(p => p.includes('/rmf-tracking'))).toBe(true);
      expect(paths.some(p => p.includes('/digital-identity'))).toBe(true);
      expect(paths.some(p => p.includes('/privacy-analysis'))).toBe(true);
      expect(paths.some(p => p.includes('/config-management'))).toBe(true);
      expect(paths.some(p => p.includes('/scrm-plan'))).toBe(true);
      expect(paths.some(p => p.includes('/poam-summary'))).toBe(true);
    });

    it('should send correct payload for RMF tracking', async () => {
      const data: SSPData = {
        ...buildMinimalSSP(),
        rmfTargetAto: '2026-06-01',
      };
      await saveSSPToBackend('ssp-001', data);

      const rmfCall = captured.find(c => c.path.includes('/rmf-tracking'));
      expect(rmfCall).toBeDefined();
      expect(rmfCall!.body).toMatchObject({
        current_step: 'Implement',
        target_ato_date: '2026-06-01',
      });
    });

    it('should send correct payload for digital identity', async () => {
      const data = buildMinimalSSP();
      await saveSSPToBackend('ssp-001', data);

      const idCall = captured.find(c => c.path.includes('/digital-identity'));
      expect(idCall).toBeDefined();
      expect(idCall!.body).toMatchObject({
        ial: '2',
        aal: '2',
      });
    });

    it('should send correct payload for privacy analysis', async () => {
      const data: SSPData = {
        ...buildMinimalSSP(),
        ptaCollectsPii: 'Yes',
        ptaPiiTypes: 'Name, email',
        ptaPiaRequired: 'Yes',
      };
      await saveSSPToBackend('ssp-001', data);

      const privacyCall = captured.find(c => c.path.includes('/privacy-analysis'));
      expect(privacyCall).toBeDefined();
      expect(privacyCall!.body).toMatchObject({
        collects_pii: 'Yes',
        pii_types: 'Name, email',
        pia_required: 'Yes',
      });
    });

    it('should send section narrative updates', async () => {
      const data = buildMinimalSSP();
      await saveSSPToBackend('ssp-001', data);

      const boundaryCall = captured.find(c =>
        c.path.includes('/sections/authorization_boundary')
      );
      expect(boundaryCall).toBeDefined();
      expect(boundaryCall!.body).toMatchObject({
        content: data.bndNarr,
      });
    });
  });

  describe('saveSSPToBackend — change detection (with previous data)', () => {
    it('should only send changed sections', async () => {
      const previous = buildMinimalSSP();
      const current = {
        ...previous,
        conf: 'High', // only FIPS 199 changed
      };

      await saveSSPToBackend('ssp-001', current, previous);

      const puts = captured.filter(c => c.method === 'PUT');
      const paths = puts.map(p => p.path);

      // FIPS section should be updated
      expect(paths.some(p => p.includes('/sections/fips_199'))).toBe(true);

      // Unchanged sections should NOT be sent
      expect(paths.some(p => p.includes('/rmf-tracking'))).toBe(false);
      expect(paths.some(p => p.includes('/digital-identity'))).toBe(false);
      expect(paths.some(p => p.includes('/privacy-analysis'))).toBe(false);
    });

    it('should detect no changes and send nothing', async () => {
      const data = buildMinimalSSP();
      await saveSSPToBackend('ssp-001', data, data);

      const puts = captured.filter(c => c.method === 'PUT');
      expect(puts).toHaveLength(0);
    });

    it('should detect collection changes via JSON comparison', async () => {
      const previous: SSPData = {
        ...buildMinimalSSP(),
        cpPurpose: 'Old purpose',
      };
      const current: SSPData = {
        ...previous,
        cpPurpose: 'New purpose',
      };

      await saveSSPToBackend('ssp-001', current, previous);

      const contCall = captured.find(c =>
        c.path.includes('/sections/contingency_plan_purpose')
      );
      expect(contCall).toBeDefined();
      expect(contCall!.body).toMatchObject({ content: 'New purpose' });
    });
  });

  describe('loadSSPFromBackend — data retrieval', () => {
    it('should return SSPData with mapped fields from backend', async () => {
      const data = await loadSSPFromBackend('ssp-001');

      expect(data.sysName).toBe('Loaded System');
      expect(data.sysAcronym).toBe('LS');
      expect(data.sysDesc).toBe('A system loaded from backend');
      expect(data.owningAgency).toBe('Test Agency');
      expect(data.authType).toBe('fedramp-jab');
      expect(data.conf).toBe('Moderate');
      expect(data.integ).toBe('Moderate');
      expect(data.avail).toBe('Low');
      expect(data.ctrlBaseline).toBe('Moderate');
    });

    it('should make parallel requests to all 14 backend endpoints', async () => {
      await loadSSPFromBackend('ssp-001');

      const gets = captured.filter(c => c.method === 'GET');
      expect(gets.length).toBe(14);
    });

    it('should return empty arrays for missing collection data', async () => {
      const data = await loadSSPFromBackend('ssp-001');

      expect(data.infoTypes).toEqual([]);
      expect(data.ppsRows).toEqual([]);
      expect(data.cryptoMods).toEqual([]);
      expect(data.sepDutyMatrix).toEqual([]);
      expect(data.policyDocs).toEqual([]);
      expect(data.scrmSuppliers).toEqual([]);
      expect(data.cmBaselines).toEqual([]);
    });
  });
});

// ===========================================================================
// 5. COLLECTION SYNC — syncXxx Functions (Deploy list items)
// ===========================================================================

describe('Collection Item Deployment', () => {
  describe('syncInfoTypes', () => {
    it('should deploy info types with correct payload mapping', async () => {
      const items: InfoType[] = [
        { nistId: 'C.2.8.1', name: 'Development', c: 'Moderate', i: 'Moderate', a: 'Low' },
      ];
      await syncInfoTypes('ssp-001', items, []);

      const posts = captured.filter(c => c.method === 'POST');
      expect(posts.length).toBe(1);
      expect(posts[0].body).toMatchObject({
        nist_id: 'C.2.8.1',
        name: 'Development',
        confidentiality: 'Moderate',
        integrity: 'Moderate',
        availability: 'Low',
      });
    });

    it('should skip items without nistId or name', async () => {
      const items: InfoType[] = [
        { nistId: '', name: '' },
        { nistId: 'C.2.8.1', name: 'Valid' },
      ];
      await syncInfoTypes('ssp-001', items, []);

      const posts = captured.filter(c => c.method === 'POST');
      expect(posts.length).toBe(1);
    });

    it('should DELETE before POST (replace pattern)', async () => {
      const items: InfoType[] = [
        { nistId: 'C.2.8.1', name: 'Type A' },
      ];
      await syncInfoTypes('ssp-001', items, []);

      const deletes = captured.filter(c => c.method === 'DELETE');
      const posts = captured.filter(c => c.method === 'POST');
      expect(deletes.length).toBe(1);
      expect(posts.length).toBe(1);

      // DELETE should happen before POST
      const deleteIdx = captured.findIndex(c => c.method === 'DELETE');
      const postIdx = captured.findIndex(c => c.method === 'POST');
      expect(deleteIdx).toBeLessThan(postIdx);
    });
  });

  describe('syncPortsProtocols', () => {
    it('should deploy port/protocol rows', async () => {
      const items: PPSRow[] = [
        { port: '443', proto: 'TCP', svc: 'HTTPS', purpose: 'Web', dir: 'inbound', dit: 'DIT-001' },
      ];
      await syncPortsProtocols('ssp-001', items);

      const posts = captured.filter(c => c.method === 'POST');
      expect(posts[0].body).toMatchObject({
        port: '443',
        protocol: 'TCP',
        service: 'HTTPS',
        purpose: 'Web',
        direction: 'inbound',
        dit_ref: 'DIT-001',
      });
    });

    it('should skip rows without a port', async () => {
      const items: PPSRow[] = [
        { port: '', proto: 'TCP', svc: 'Unknown' },
        { port: '22', proto: 'TCP', svc: 'SSH' },
      ];
      await syncPortsProtocols('ssp-001', items);

      const posts = captured.filter(c => c.method === 'POST');
      expect(posts.length).toBe(1);
    });
  });

  describe('syncCryptoModules', () => {
    it('should deploy crypto modules with correct field mapping', async () => {
      const items: CryptoModule[] = [
        { mod: 'OpenSSL 3.0', cert: '4282', level: '1', usage: 'TLS', where: 'Gateway' },
      ];
      await syncCryptoModules('ssp-001', items);

      const posts = captured.filter(c => c.method === 'POST');
      expect(posts[0].body).toMatchObject({
        module_name: 'OpenSSL 3.0',
        certificate_number: '4282',
        fips_level: '1',
        usage: 'TLS',
        deployment_location: 'Gateway',
      });
    });
  });

  describe('syncSeparationDuties', () => {
    it('should deploy separation of duties rows', async () => {
      const items: SepDutyRow[] = [
        { role: 'Admin', access: 'Full', prohibited: 'Deploy code', justification: 'SoD requirement' },
      ];
      await syncSeparationDuties('ssp-001', items);

      const posts = captured.filter(c => c.method === 'POST');
      expect(posts[0].body).toMatchObject({
        role: 'Admin',
        access_level: 'Full',
        prohibited_actions: 'Deploy code',
        justification: 'SoD requirement',
      });
    });
  });

  describe('syncPolicyMappings', () => {
    it('should deploy policy documents', async () => {
      const items: PolicyDoc[] = [
        { family: 'AC', title: 'Access Control', version: '3.0', owner: 'CISO', lastReview: '2025-06-01', status: 'Active' },
      ];
      await syncPolicyMappings('ssp-001', items);

      const posts = captured.filter(c => c.method === 'POST');
      expect(posts[0].body).toMatchObject({
        control_family: 'AC',
        policy_title: 'Access Control',
        policy_version: '3.0',
        policy_owner: 'CISO',
        last_review_date: '2025-06-01',
        status: 'Active',
      });
    });
  });

  describe('syncSCRMEntries', () => {
    it('should deploy SCRM supplier entries', async () => {
      const items: SCRMSupplier[] = [
        { supplier: 'AWS', type: 'IaaS', criticality: 'High', sbom: 'Yes', riskLevel: 'Low' },
      ];
      await syncSCRMEntries('ssp-001', items);

      const posts = captured.filter(c => c.method === 'POST');
      expect(posts[0].body).toMatchObject({
        supplier_name: 'AWS',
        supplier_type: 'IaaS',
        criticality: 'High',
        sbom_available: 'Yes',
        risk_level: 'Low',
      });
    });
  });

  describe('syncCMBaselines', () => {
    it('should deploy CM baseline entries', async () => {
      const items: CMBaseline[] = [
        { comp: 'Amazon Linux 2', bench: 'CIS L1', ver: '2.0.0', pct: '98', scan: 'Weekly' },
      ];
      await syncCMBaselines('ssp-001', items);

      const posts = captured.filter(c => c.method === 'POST');
      expect(posts[0].body).toMatchObject({
        component_name: 'Amazon Linux 2',
        benchmark: 'CIS L1',
        version: '2.0.0',
        compliance_pct: '98',
        scan_frequency: 'Weekly',
      });
    });
  });
});

// ===========================================================================
// 6. END-TO-END: DATA INPUT → VALIDATION → OSCAL EXPORT
// ===========================================================================

describe('End-to-End: Input → Validate → Export', () => {
  it('should produce valid OSCAL SSP from fully-populated data', () => {
    const data = buildFullSSP();
    const result = generateValidatedOscalSSP({ data });

    expect(result.document).toBeDefined();
    expect(result.document['system-security-plan']).toBeDefined();

    const ssp = result.document['system-security-plan'];
    expect(ssp.metadata.title).toContain('ForgeTest System');
    expect(ssp.metadata['oscal-version']).toBe('1.1.2');
    expect(ssp['system-characteristics']['system-name']).toBe('ForgeTest System');
  });

  it('should embed impact levels in OSCAL system-characteristics', () => {
    const data = buildMinimalSSP();
    const doc = generateOscalSSP({ data });
    const sc = doc['system-security-plan']['system-characteristics'];

    expect(sc['security-impact-level']['security-objective-confidentiality']).toBe('Moderate');
    expect(sc['security-impact-level']['security-objective-integrity']).toBe('Moderate');
    expect(sc['security-impact-level']['security-objective-availability']).toBe('Low');
  });

  it('should map information types to OSCAL format', () => {
    const data = buildFullSSP();
    const doc = generateOscalSSP({ data });
    const infoTypes = doc['system-security-plan']['system-characteristics']['system-information']['information-types'];

    expect(infoTypes.length).toBe(2);
    expect(infoTypes[0].title).toBe('System Development');
    expect(infoTypes[0].categorizations![0]['information-type-ids']).toContain('C.2.8.1');
    expect(infoTypes[0]['confidentiality-impact'].base).toBe('Moderate');
  });

  it('should map personnel to OSCAL parties', () => {
    const data = buildFullSSP();
    const doc = generateOscalSSP({ data });
    const meta = doc['system-security-plan'].metadata;

    // Should have organization + 6 personnel parties
    expect(meta.parties!.length).toBe(7);

    // Verify org party
    const orgParty = meta.parties!.find(p => p.type === 'organization');
    expect(orgParty).toBeDefined();
    expect(orgParty!.name).toBe('Department of Testing');

    // Verify responsible parties map to correct roles
    const rpIds = meta['responsible-parties']!.map(rp => rp['role-id']);
    expect(rpIds).toContain('system-owner');
    expect(rpIds).toContain('authorizing-official');
    expect(rpIds).toContain('information-system-security-officer');
    expect(rpIds).toContain('information-system-security-manager');
    expect(rpIds).toContain('security-control-assessor');
    expect(rpIds).toContain('privacy-official');
  });

  it('should map controls to OSCAL implemented-requirements', () => {
    const data = buildFullSSP();
    const doc = generateOscalSSP({ data });
    const ctrlImpl = doc['system-security-plan']['control-implementation'];

    expect(ctrlImpl['implemented-requirements'].length).toBe(4);

    const ac1 = ctrlImpl['implemented-requirements'].find(r => r['control-id'] === 'ac-1');
    expect(ac1).toBeDefined();
    expect(ac1!['by-components']![0].description).toContain('Access control policy');
    expect(ac1!['by-components']![0]['implementation-status']!.state).toBe('implemented');
  });

  it('should map boundary components to OSCAL components', () => {
    const data = buildFullSSP();
    const doc = generateOscalSSP({ data });
    const impl = doc['system-security-plan']['system-implementation'];

    // this-system + 2 boundary comps + 1 crypto module + 1 service component = 5
    expect(impl.components.length).toBe(5);

    const apiGw = impl.components.find(c => c.title === 'API Gateway');
    expect(apiGw).toBeDefined();
    expect(apiGw!.type).toBe('software');
    expect(apiGw!.props![0]).toMatchObject({ name: 'security-zone', value: 'DMZ' });
  });

  it('should map ports/protocols to OSCAL protocols', () => {
    const data = buildFullSSP();
    const doc = generateOscalSSP({ data });
    const impl = doc['system-security-plan']['system-implementation'];

    const svcComp = impl.components.find(c => c.type === 'service');
    expect(svcComp).toBeDefined();
    expect(svcComp!.protocols!.length).toBe(2);

    const https = svcComp!.protocols!.find(p => p.title === 'HTTPS');
    expect(https).toBeDefined();
    expect(https!['port-ranges']![0].start).toBe(443);
    expect(https!['port-ranges']![0].transport).toBe('TCP');
  });

  it('should produce valid JSON output', () => {
    const data = buildFullSSP();
    const doc = generateOscalSSP({ data });
    const json = oscalToJson(doc);

    // Should be valid JSON
    const parsed = JSON.parse(json);
    expect(parsed['system-security-plan']).toBeDefined();
    expect(parsed['system-security-plan'].metadata['oscal-version']).toBe('1.1.2');
  });

  it('should embed system props in OSCAL', () => {
    const data = buildFullSSP();
    const doc = generateOscalSSP({ data });
    const sc = doc['system-security-plan']['system-characteristics'];

    expect(sc.props).toBeDefined();
    const propNames = sc.props!.map(p => p.name);
    expect(propNames).toContain('cloud-service-model');
    expect(propNames).toContain('cloud-deployment-model');
    expect(propNames).toContain('authorization-type');
    expect(propNames).toContain('fedramp-id');
  });

  it('should handle minimal data gracefully (defaults + placeholders)', () => {
    const data: SSPData = { sysName: 'Bare Minimum' };
    const doc = generateOscalSSP({ data });

    expect(doc['system-security-plan']['system-characteristics']['system-name']).toBe('Bare Minimum');
    // Should still generate a valid structure with defaults
    expect(doc['system-security-plan']['control-implementation']['implemented-requirements'].length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// 7. FULL ROUND-TRIP: Input → Validate → Deploy → Export
// ===========================================================================

describe('Full Round-Trip Deployment Pipeline', () => {
  it('should successfully validate, deploy, and export a complete SSP', async () => {
    const data = buildFullSSP();

    // Step 1: Validate
    const validation = validateSSP(data);
    expect(validation.isValid).toBe(true);

    // Step 2: Type guard check
    expect(isValidatedSSPData(data)).toBe(true);

    // Step 3: Deploy to backend
    await saveSSPToBackend('ssp-001', data);
    const savePuts = captured.filter(c => c.method === 'PUT');
    expect(savePuts.length).toBeGreaterThan(0);

    // Step 4: Deploy collections
    captured.length = 0;
    await syncInfoTypes('ssp-001', data.infoTypes!, []);
    await syncPortsProtocols('ssp-001', data.ppsRows!);
    await syncCryptoModules('ssp-001', data.cryptoMods!);
    await syncSeparationDuties('ssp-001', data.sepDutyMatrix!);
    await syncPolicyMappings('ssp-001', data.policyDocs!);
    await syncSCRMEntries('ssp-001', data.scrmSuppliers!);
    await syncCMBaselines('ssp-001', data.cmBaselines!);

    const syncDeletes = captured.filter(c => c.method === 'DELETE');
    const syncPosts = captured.filter(c => c.method === 'POST');
    expect(syncDeletes.length).toBe(7); // one DELETE per collection
    expect(syncPosts.length).toBe(14); // 2 info + 2 pps + 1 crypto + 3 sep + 2 policy + 2 scrm + 2 cm

    // Step 5: Export to OSCAL
    const exportResult = generateValidatedOscalSSP({ data });
    expect(exportResult.document['system-security-plan']).toBeDefined();
    expect(exportResult.document['system-security-plan'].metadata['oscal-version']).toBe('1.1.2');

    // Step 6: Verify OSCAL JSON is parseable
    const json = oscalToJson(exportResult.document);
    const reparsed = JSON.parse(json);
    expect(reparsed['system-security-plan']['system-characteristics']['system-name']).toBe('ForgeTest System');
  });

  it('should handle incremental data input and re-deployment', async () => {
    // Phase 1: Initial minimal data
    const phase1: SSPData = buildMinimalSSP();
    await saveSSPToBackend('ssp-001', phase1);

    const phase1Calls = captured.filter(c => c.method === 'PUT').length;
    expect(phase1Calls).toBeGreaterThan(0);

    // Phase 2: Add more data incrementally
    captured.length = 0;
    const phase2: SSPData = {
      ...phase1,
      infoTypes: [{ nistId: 'C.2.8.1', name: 'Development' }],
      ppsRows: [{ port: '443', proto: 'TCP', svc: 'HTTPS' }],
    };
    await saveSSPToBackend('ssp-001', phase2, phase1);

    // Only changed sections should be sent
    const phase2Puts = captured.filter(c => c.method === 'PUT');
    // infoTypes and ppsRows are synced via collection endpoints, not PUT
    // But system_info didn't change, so it should not be sent
    expect(phase2Puts.every(p => !p.path.includes('/rmf-tracking'))).toBe(true);

    // Phase 3: Deploy collections
    captured.length = 0;
    await syncInfoTypes('ssp-001', phase2.infoTypes!, []);
    await syncPortsProtocols('ssp-001', phase2.ppsRows!);

    const posts = captured.filter(c => c.method === 'POST');
    expect(posts.length).toBe(2);
  });

  it('should detect and report validation errors before deployment', () => {
    const badData: SSPData = {
      sysName: 'Missing Lots',
      soEmail: 'bad-email',
      conf: 'Invalid',
      ptaCollectsPii: 'Yes',
      rto: 'ASAP', // no digits
    };

    const result = validateSSP(badData);
    expect(result.isValid).toBe(false);

    // Should have errors for: missing required fields + bad email + bad impact + PIA + RTO
    expect(result.errors.some(e => e.field === 'soEmail')).toBe(true);
    expect(result.errors.some(e => e.field === 'conf')).toBe(true);
    expect(result.errors.some(e => e.field === 'ptaPiaRequired')).toBe(true);
    expect(result.errors.some(e => e.field === 'rto')).toBe(true);

    // Should NOT proceed to deploy (application logic would check validation first)
    expect(isValidatedSSPData(badData)).toBe(false);
  });
});
