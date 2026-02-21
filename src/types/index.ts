/**
 * ForgeComply 360 Reporter - Type Definitions
 */

// =============================================================================
// Constrained value types
// =============================================================================

/** FIPS 199 impact levels — the only valid values for C/I/A categorization */
export type ImpactLevel = 'Low' | 'Moderate' | 'High';

/** NIST SP 800-53 control baselines */
export type ControlBaseline = 'Low' | 'Moderate' | 'High';

/**
 * Core fields that must be populated for a valid SSP export.
 * Use this at export/validation boundaries to assert completeness.
 */
export interface RequiredSSPFields {
  sysName: string;
  sysDesc: string;
  conf: ImpactLevel;
  integ: ImpactLevel;
  avail: ImpactLevel;
  ctrlBaseline: ControlBaseline;
  authType: string;
  owningAgency: string;
}

/**
 * A fully-validated SSPData suitable for OSCAL export.
 * Combines the required core fields with the rest of SSPData.
 */
export type ValidatedSSPData = RequiredSSPFields & Omit<SSPData, keyof RequiredSSPFields>;

/**
 * Type guard: checks whether an SSPData has all required fields populated.
 */
export function isValidatedSSPData(data: SSPData): data is ValidatedSSPData {
  return (
    typeof data.sysName === 'string' && data.sysName.trim().length > 0 &&
    typeof data.sysDesc === 'string' && data.sysDesc.trim().length > 0 &&
    isImpactLevel(data.conf) &&
    isImpactLevel(data.integ) &&
    isImpactLevel(data.avail) &&
    isControlBaseline(data.ctrlBaseline) &&
    typeof data.authType === 'string' && data.authType.trim().length > 0 &&
    typeof data.owningAgency === 'string' && data.owningAgency.trim().length > 0
  );
}

function isImpactLevel(v: unknown): v is ImpactLevel {
  return v === 'Low' || v === 'Moderate' || v === 'High';
}

function isControlBaseline(v: unknown): v is ControlBaseline {
  return v === 'Low' || v === 'Moderate' || v === 'High';
}

// =============================================================================
// SSP Data — the runtime form state (all fields optional for progressive entry)
// =============================================================================

export interface SSPData {
  // System Information
  sysName?: string;
  sysAcronym?: string;
  fismaId?: string;
  fedrampId?: string;
  owningAgency?: string;
  agencyComp?: string;
  sysDesc?: string;
  cloudModel?: string;
  deployModel?: string;
  authType?: string;
  authDuration?: string;
  authSystem?: string;
  opDate?: string;
  levAuths?: LeveragedAuth[];

  // FIPS 199
  conf?: string;
  integ?: string;
  avail?: string;
  catJust?: string;

  // Information Types
  infoTypes?: InfoType[];
  infoTypeJust?: string;

  // Control Baseline
  ctrlBaseline?: string;
  tailoring?: string;
  baseJust?: string;
  tailorRows?: TailoringRow[];

  // RMF Lifecycle
  rmfCurrentStep?: string;
  rmfTargetAto?: string;
  rmfArtifacts?: string[];
  rmf_prepare?: Record<string, boolean>;
  rmf_categorize?: Record<string, boolean>;
  rmf_select?: Record<string, boolean>;
  rmf_implement?: Record<string, boolean>;
  rmf_assess?: Record<string, boolean>;
  rmf_authorize?: Record<string, boolean>;
  rmf_monitor?: Record<string, boolean>;

  // Authorization Boundary
  bndNarr?: string;
  bndComps?: BoundaryComponent[];

  // Data Flow
  dfNarr?: string;
  encRest?: string;
  encTransit?: string;
  keyMgmt?: string;
  dataDisposal?: string;

  // Network
  netNarr?: string;
  netZones?: NetworkZone[];
  primaryDC?: string;
  secondaryDC?: string;

  // Ports, Protocols, Services
  ppsRows?: PPSRow[];

  // Interconnections
  icRows?: InterconnectionRow[];
  icNotes?: string;

  // Crypto
  cryptoNarr?: string;
  cryptoMods?: CryptoModule[];

  // CNSA 2.0 Readiness
  cnsaVersion?: string;
  pqcMigrationStatus?: string;
  pqcTargetDate?: string;
  pqcKeyExchange?: string;
  pqcDigitalSig?: string;
  pqcHashAlgo?: string;
  pqcSymmetricAlgo?: string;
  pqcNotes?: string;

  // Personnel
  soName?: string;
  soEmail?: string;
  aoName?: string;
  aoEmail?: string;
  issoName?: string;
  issoEmail?: string;
  issmName?: string;
  issmEmail?: string;
  scaName?: string;
  scaEmail?: string;
  poName?: string;
  poEmail?: string;
  addContacts?: Contact[];

  // Digital Identity
  ial?: string;
  aal?: string;
  fal?: string;
  mfaMethods?: string;
  idNarr?: string;

  // Separation of Duties
  sepDutyMatrix?: SepDutyRow[];
  dualControl?: string;
  privAccess?: string;

  // Controls
  ctrlData?: Record<string, Record<string, string>>;

  // Policies
  policyDocs?: PolicyDoc[];
  policyReviewCycle?: string;
  policyException?: string;

  // SCRM
  scrmPlan?: string;
  scrmSuppliers?: SCRMSupplier[];
  sbomFormat?: string;
  provenance?: string;

  // Privacy
  ptaCollectsPii?: string;
  ptaPiiTypes?: string;
  ptaRecordCount?: string;
  ptaPiaRequired?: string;
  piaAuthority?: string;
  piaPurpose?: string;
  piaMinimization?: string;
  piaRetention?: string;
  piaSharing?: string;
  piaConsent?: string;
  sornStatus?: string;
  sornNumber?: string;

  // Contingency Plan
  cpPurpose?: string;
  cpScope?: string;
  rto?: string;
  rpo?: string;
  mtd?: string;
  backupFreq?: string;
  cpTestDate?: string;
  cpTestType?: string;

  // Incident Response
  irPurpose?: string;
  irScope?: string;
  irSeverity?: IRSeverityRow[];
  certTime?: string;
  irTestDate?: string;

  // Configuration Management
  cmPurpose?: string;
  cmBaselines?: CMBaseline[];
  cmChangeNarr?: string;

  // Security Assessment (RMF Step 5)
  assessType?: string;
  assessOrg?: string;
  assessStart?: string;
  assessEnd?: string;
  sapSummary?: string;
  sarSummary?: string;
  assessCtrlCount?: string;
  assessFindingsCount?: string;

  // Authorization Decision (RMF Step 6)
  authDecision?: string;
  authDate?: string;
  authAoName?: string;
  authExpiry?: string;
  authConditions?: string;
  riskAcceptance?: string;

  // Continuous Monitoring
  iscmType?: string;
  ctrlRotation?: string;
  iscmNarrative?: string;
  cmTools?: CMTool[];
  sigChangeCriteria?: string;
  iscmCadence?: string[];
  atoExpiry?: string;
  nextAssessment?: string;

  // POA&M
  poamRows?: POAMRow[];
  poamFreq?: string;
  poamWf?: string;
}

// Table row types
export interface LeveragedAuth {
  name?: string;
  id?: string;
  type?: string;
  impact?: string;
}

export interface InfoType {
  nistId?: string;
  name?: string;
  c?: string;
  i?: string;
  a?: string;
}

/** An InfoType with the minimum fields needed for OSCAL export */
export interface ValidInfoType {
  nistId: string;
  name: string;
  c: string;
  i: string;
  a: string;
}

export interface TailoringRow {
  ctrl?: string;
  dec?: string;
  rat?: string;
}

export interface BoundaryComponent {
  name?: string;
  type?: string;
  zone?: string;
  purpose?: string;
}

export interface NetworkZone {
  zone?: string;
  purpose?: string;
  controls?: string;
  subnet?: string;
}

export interface PPSRow {
  port?: string;
  proto?: string;
  svc?: string;
  purpose?: string;
  dir?: string;
  dit?: string;
}

export interface InterconnectionRow {
  sys?: string;
  org?: string;
  conn?: string;
  dir?: string;
  data?: string;
  isa?: string;
}

export interface CryptoModule {
  mod?: string;
  cert?: string;
  level?: string;
  usage?: string;
  where?: string;
  // CNSA 2.0 fields
  cnsaSuite?: string;
  pqcAlgorithm?: string;
  pqcParameterSet?: string;
  fipsStandard?: string;
  hybridMode?: string;
}

export interface Contact {
  /** At least name or email should be populated for a usable contact */
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
}

/** A contact with at least a name — the minimum for OSCAL party generation */
export interface ValidContact {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
}

export interface SepDutyRow {
  role?: string;
  access?: string;
  prohibited?: string;
  justification?: string;
}

export interface PolicyDoc {
  family?: string;
  title?: string;
  version?: string;
  owner?: string;
  lastReview?: string;
  status?: string;
}

export interface SCRMSupplier {
  supplier?: string;
  type?: string;
  criticality?: string;
  sbom?: string;
  riskLevel?: string;
}

export interface IRSeverityRow {
  level?: string;
  desc?: string;
  sla?: string;
  notify?: string;
}

export interface CMBaseline {
  comp?: string;
  bench?: string;
  ver?: string;
  pct?: string;
  scan?: string;
}

export interface CMTool {
  tool?: string;
  purpose?: string;
  freq?: string;
  ctrls?: string;
}

export interface POAMRow {
  id?: string;
  weakness?: string;
  sev?: string;
  ctrl?: string;
  status?: string;
  due?: string;
}
