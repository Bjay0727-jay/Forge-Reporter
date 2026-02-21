/**
 * ForgeComply 360 Reporter - SSP Data Mapper
 * Maps between Reporter's flat SSPData and Backend's multi-endpoint structure
 */

import { api } from './api';
import type { SSPData, InfoType, PPSRow, CryptoModule, SepDutyRow, PolicyDoc, SCRMSupplier, CMBaseline } from '../types';

// =============================================================================
// Backend Response Types
// =============================================================================

interface BackendSSPDocument {
  id: string;
  title: string;
  system_id: string;
  framework_id: string;
  status: string;
  ssp_type: string;
  oscal_json: {
    _authoring?: {
      sections: Record<string, {
        content: string;
        status: string;
        ai_generated: boolean;
        last_edited_at: string;
      }>;
      fisma?: {
        fisma_id?: string;
        fedramp_id?: string;
        owning_agency?: string;
        agency_component?: string;
        cloud_model?: string;
        deployment_model?: string;
        auth_type?: string;
        auth_duration?: string;
        auth_system?: string;
        operational_date?: string;
        confidentiality?: string;
        integrity?: string;
        availability?: string;
        categorization_justification?: string;
        control_baseline?: string;
        tailoring_applied?: string;
        baseline_justification?: string;
      };
    };
  };
  system_name?: string;
  system_acronym?: string;
  system_description?: string;
  impact_level?: string;
  metadata?: Record<string, unknown>;
}

interface BackendInfoType {
  id: string;
  nist_id: string;
  name: string;
  confidentiality?: string;
  integrity?: string;
  availability?: string;
  justification?: string;
}

interface BackendRMFTracking {
  current_step?: string;
  target_ato_date?: string;
  prepare_tasks?: string;
  categorize_tasks?: string;
  select_tasks?: string;
  implement_tasks?: string;
  assess_tasks?: string;
  authorize_tasks?: string;
  monitor_tasks?: string;
  artifacts_completed?: string;
}

interface BackendPortProtocol {
  id: string;
  port: string;
  protocol?: string;
  service?: string;
  purpose?: string;
  direction?: string;
  dit_ref?: string;
}

interface BackendCryptoModule {
  id: string;
  module_name: string;
  certificate_number?: string;
  fips_level?: string;
  usage?: string;
  deployment_location?: string;
  cnsa_suite?: string;
  pqc_algorithm?: string;
  pqc_parameter_set?: string;
  fips_standard?: string;
  hybrid_mode?: string;
}

interface BackendDigitalIdentity {
  ial?: string;
  aal?: string;
  fal?: string;
  mfa_methods?: string;
  identity_narrative?: string;
}

interface BackendSeparationDuty {
  id: string;
  role: string;
  access_level?: string;
  prohibited_actions?: string;
  justification?: string;
}

interface BackendPolicyMapping {
  id: string;
  control_family: string;
  policy_title?: string;
  policy_version?: string;
  policy_owner?: string;
  last_review_date?: string;
  status?: string;
}

interface BackendSCRMEntry {
  id: string;
  supplier_name: string;
  supplier_type?: string;
  criticality?: string;
  sbom_available?: string;
  risk_level?: string;
}

interface BackendSCRMPlan {
  scrm_narrative?: string;
  sbom_format?: string;
  provenance_tracking?: string;
}

interface BackendPrivacyAnalysis {
  collects_pii?: string;
  pii_types?: string;
  record_count?: string;
  pia_required?: string;
  pia_authority?: string;
  pia_purpose?: string;
  pia_minimization?: string;
  pia_retention?: string;
  pia_sharing?: string;
  pia_consent?: string;
  sorn_status?: string;
  sorn_number?: string;
}

interface BackendConfigManagement {
  cm_purpose?: string;
  change_control_narrative?: string;
}

interface BackendCMBaseline {
  id: string;
  component_name: string;
  benchmark?: string;
  version?: string;
  compliance_pct?: string;
  scan_frequency?: string;
}

interface BackendPOAMSummary {
  review_frequency?: string;
  remediation_workflow?: string;
}

// =============================================================================
// Load SSP from Backend
// =============================================================================

/**
 * Load all SSP data from the backend and map to Reporter's SSPData format
 */
export async function loadSSPFromBackend(sspId: string): Promise<SSPData> {
  // Fetch all data in parallel
  const [
    docRes,
    infoTypesRes,
    rmfRes,
    portsRes,
    cryptoRes,
    identityRes,
    sepDutiesRes,
    policiesRes,
    scrmRes,
    scrmPlanRes,
    privacyRes,
    configMgmtRes,
    cmBaselinesRes,
    poamRes,
  ] = await Promise.all([
    api<{ document: BackendSSPDocument }>(`/api/v1/ssp/${sspId}`),
    api<{ info_types: BackendInfoType[] }>(`/api/v1/ssp/${sspId}/info-types`).catch(() => ({ info_types: [] })),
    api<{ rmf_tracking: BackendRMFTracking | null }>(`/api/v1/ssp/${sspId}/rmf-tracking`).catch(() => ({ rmf_tracking: null })),
    api<{ ports_protocols: BackendPortProtocol[] }>(`/api/v1/ssp/${sspId}/ports-protocols`).catch(() => ({ ports_protocols: [] })),
    api<{ crypto_modules: BackendCryptoModule[] }>(`/api/v1/ssp/${sspId}/crypto-modules`).catch(() => ({ crypto_modules: [] })),
    api<{ digital_identity: BackendDigitalIdentity | null }>(`/api/v1/ssp/${sspId}/digital-identity`).catch(() => ({ digital_identity: null })),
    api<{ separation_duties: BackendSeparationDuty[] }>(`/api/v1/ssp/${sspId}/separation-duties`).catch(() => ({ separation_duties: [] })),
    api<{ policy_mappings: BackendPolicyMapping[] }>(`/api/v1/ssp/${sspId}/policy-mappings`).catch(() => ({ policy_mappings: [] })),
    api<{ scrm_entries: BackendSCRMEntry[] }>(`/api/v1/ssp/${sspId}/scrm`).catch(() => ({ scrm_entries: [] })),
    api<{ scrm_plan: BackendSCRMPlan | null }>(`/api/v1/ssp/${sspId}/scrm-plan`).catch(() => ({ scrm_plan: null })),
    api<{ privacy_analysis: BackendPrivacyAnalysis | null }>(`/api/v1/ssp/${sspId}/privacy-analysis`).catch(() => ({ privacy_analysis: null })),
    api<{ config_management: BackendConfigManagement | null }>(`/api/v1/ssp/${sspId}/config-management`).catch(() => ({ config_management: null })),
    api<{ cm_baselines: BackendCMBaseline[] }>(`/api/v1/ssp/${sspId}/cm-baselines`).catch(() => ({ cm_baselines: [] })),
    api<{ poam_summary: BackendPOAMSummary | null }>(`/api/v1/ssp/${sspId}/poam-summary`).catch(() => ({ poam_summary: null })),
  ]);

  const doc = docRes.document;
  const authoring = doc.oscal_json?._authoring;
  const fisma = authoring?.fisma || {};
  const sections = authoring?.sections || {};

  // Map to SSPData
  const data: SSPData = {
    // System Information
    sysName: doc.system_name || doc.title,
    sysAcronym: doc.system_acronym,
    sysDesc: doc.system_description || sections.system_info?.content,
    fismaId: fisma.fisma_id,
    fedrampId: fisma.fedramp_id,
    owningAgency: fisma.owning_agency,
    agencyComp: fisma.agency_component,
    cloudModel: fisma.cloud_model,
    deployModel: fisma.deployment_model,
    authType: fisma.auth_type,
    authDuration: fisma.auth_duration,
    authSystem: fisma.auth_system,
    opDate: fisma.operational_date,

    // FIPS 199
    conf: fisma.confidentiality || doc.impact_level,
    integ: fisma.integrity || doc.impact_level,
    avail: fisma.availability || doc.impact_level,
    catJust: fisma.categorization_justification || sections.fips_199?.content,

    // Control Baseline
    ctrlBaseline: fisma.control_baseline || doc.impact_level,
    tailoring: fisma.tailoring_applied,
    baseJust: fisma.baseline_justification || sections.control_baseline?.content,

    // Information Types
    infoTypes: infoTypesRes.info_types.map((it): InfoType => ({
      nistId: it.nist_id,
      name: it.name,
      c: it.confidentiality,
      i: it.integrity,
      a: it.availability,
    })),
    infoTypeJust: sections.information_types?.content,

    // RMF Tracking
    rmfCurrentStep: rmfRes.rmf_tracking?.current_step,
    rmfTargetAto: rmfRes.rmf_tracking?.target_ato_date,
    rmf_prepare: parseJSON(rmfRes.rmf_tracking?.prepare_tasks),
    rmf_categorize: parseJSON(rmfRes.rmf_tracking?.categorize_tasks),
    rmf_select: parseJSON(rmfRes.rmf_tracking?.select_tasks),
    rmf_implement: parseJSON(rmfRes.rmf_tracking?.implement_tasks),
    rmf_assess: parseJSON(rmfRes.rmf_tracking?.assess_tasks),
    rmf_authorize: parseJSON(rmfRes.rmf_tracking?.authorize_tasks),
    rmf_monitor: parseJSON(rmfRes.rmf_tracking?.monitor_tasks),
    rmfArtifacts: parseJSON(rmfRes.rmf_tracking?.artifacts_completed),

    // Boundary
    bndNarr: sections.authorization_boundary?.content,

    // Data Flow
    dfNarr: sections.data_flow?.content,
    encRest: sections.data_flow_encryption_rest?.content,
    encTransit: sections.data_flow_encryption_transit?.content,
    keyMgmt: sections.data_flow_key_mgmt?.content,
    dataDisposal: sections.data_flow_disposal?.content,

    // Network
    netNarr: sections.network_architecture?.content,
    primaryDC: sections.network_primary_dc?.content,
    secondaryDC: sections.network_secondary_dc?.content,

    // Ports, Protocols, Services
    ppsRows: portsRes.ports_protocols.map((pp): PPSRow => ({
      port: pp.port,
      proto: pp.protocol,
      svc: pp.service,
      purpose: pp.purpose,
      dir: pp.direction,
      dit: pp.dit_ref,
    })),

    // Crypto Modules
    cryptoNarr: sections.cryptographic_protection?.content,
    cryptoMods: cryptoRes.crypto_modules.map((cm): CryptoModule => ({
      mod: cm.module_name,
      cert: cm.certificate_number,
      level: cm.fips_level,
      usage: cm.usage,
      where: cm.deployment_location,
      cnsaSuite: cm.cnsa_suite,
      pqcAlgorithm: cm.pqc_algorithm,
      pqcParameterSet: cm.pqc_parameter_set,
      fipsStandard: cm.fips_standard,
      hybridMode: cm.hybrid_mode,
    })),

    // CNSA 2.0 Readiness
    cnsaVersion: sections.cnsa_suite_version?.content,
    pqcMigrationStatus: sections.pqc_migration_status?.content,
    pqcTargetDate: sections.pqc_target_date?.content,
    pqcKeyExchange: sections.pqc_key_exchange?.content,
    pqcDigitalSig: sections.pqc_digital_signature?.content,
    pqcHashAlgo: sections.pqc_hash_algorithm?.content,
    pqcSymmetricAlgo: sections.pqc_symmetric_algorithm?.content,
    pqcNotes: sections.pqc_migration_notes?.content,

    // Personnel (from sections)
    soName: sections.personnel_so_name?.content,
    soEmail: sections.personnel_so_email?.content,
    aoName: sections.personnel_ao_name?.content,
    aoEmail: sections.personnel_ao_email?.content,
    issoName: sections.personnel_isso_name?.content,
    issoEmail: sections.personnel_isso_email?.content,
    issmName: sections.personnel_issm_name?.content,
    issmEmail: sections.personnel_issm_email?.content,
    scaName: sections.personnel_sca_name?.content,
    scaEmail: sections.personnel_sca_email?.content,
    poName: sections.personnel_po_name?.content,
    poEmail: sections.personnel_po_email?.content,

    // Digital Identity
    ial: identityRes.digital_identity?.ial,
    aal: identityRes.digital_identity?.aal,
    fal: identityRes.digital_identity?.fal,
    mfaMethods: identityRes.digital_identity?.mfa_methods,
    idNarr: identityRes.digital_identity?.identity_narrative,

    // Separation of Duties
    sepDutyMatrix: sepDutiesRes.separation_duties.map((sd): SepDutyRow => ({
      role: sd.role,
      access: sd.access_level,
      prohibited: sd.prohibited_actions,
      justification: sd.justification,
    })),
    dualControl: sections.separation_duties_dual?.content,
    privAccess: sections.separation_duties_priv?.content,

    // Policies
    policyDocs: policiesRes.policy_mappings.map((pm): PolicyDoc => ({
      family: pm.control_family,
      title: pm.policy_title,
      version: pm.policy_version,
      owner: pm.policy_owner,
      lastReview: pm.last_review_date,
      status: pm.status,
    })),
    policyReviewCycle: sections.policy_review_cycle?.content,
    policyException: sections.policy_exception?.content,

    // SCRM
    scrmPlan: scrmPlanRes.scrm_plan?.scrm_narrative,
    sbomFormat: scrmPlanRes.scrm_plan?.sbom_format,
    provenance: scrmPlanRes.scrm_plan?.provenance_tracking,
    scrmSuppliers: scrmRes.scrm_entries.map((se): SCRMSupplier => ({
      supplier: se.supplier_name,
      type: se.supplier_type,
      criticality: se.criticality,
      sbom: se.sbom_available,
      riskLevel: se.risk_level,
    })),

    // Privacy
    ptaCollectsPii: privacyRes.privacy_analysis?.collects_pii,
    ptaPiiTypes: privacyRes.privacy_analysis?.pii_types,
    ptaRecordCount: privacyRes.privacy_analysis?.record_count,
    ptaPiaRequired: privacyRes.privacy_analysis?.pia_required,
    piaAuthority: privacyRes.privacy_analysis?.pia_authority,
    piaPurpose: privacyRes.privacy_analysis?.pia_purpose,
    piaMinimization: privacyRes.privacy_analysis?.pia_minimization,
    piaRetention: privacyRes.privacy_analysis?.pia_retention,
    piaSharing: privacyRes.privacy_analysis?.pia_sharing,
    piaConsent: privacyRes.privacy_analysis?.pia_consent,
    sornStatus: privacyRes.privacy_analysis?.sorn_status,
    sornNumber: privacyRes.privacy_analysis?.sorn_number,

    // Contingency Plan
    cpPurpose: sections.contingency_plan_purpose?.content,
    cpScope: sections.contingency_plan_scope?.content,
    rto: sections.contingency_plan_rto?.content,
    rpo: sections.contingency_plan_rpo?.content,
    mtd: sections.contingency_plan_mtd?.content,
    backupFreq: sections.contingency_plan_backup?.content,
    cpTestDate: sections.contingency_plan_test_date?.content,
    cpTestType: sections.contingency_plan_test_type?.content,

    // Incident Response
    irPurpose: sections.incident_response_purpose?.content,
    irScope: sections.incident_response_scope?.content,
    certTime: sections.incident_response_cert_time?.content,
    irTestDate: sections.incident_response_test_date?.content,

    // Configuration Management
    cmPurpose: configMgmtRes.config_management?.cm_purpose,
    cmChangeNarr: configMgmtRes.config_management?.change_control_narrative,
    cmBaselines: cmBaselinesRes.cm_baselines.map((cb): CMBaseline => ({
      comp: cb.component_name,
      bench: cb.benchmark,
      ver: cb.version,
      pct: cb.compliance_pct,
      scan: cb.scan_frequency,
    })),

    // Continuous Monitoring
    iscmType: sections.continuous_monitoring_type?.content,
    ctrlRotation: sections.continuous_monitoring_rotation?.content,
    iscmNarrative: sections.continuous_monitoring_narrative?.content,
    sigChangeCriteria: sections.continuous_monitoring_change?.content,
    atoExpiry: sections.continuous_monitoring_ato_expiry?.content,
    nextAssessment: sections.continuous_monitoring_next_assess?.content,

    // POA&M
    poamFreq: poamRes.poam_summary?.review_frequency,
    poamWf: poamRes.poam_summary?.remediation_workflow,
  };

  return data;
}

// =============================================================================
// Save SSP to Backend
// =============================================================================

/**
 * Save Reporter's SSPData to the backend
 * Only saves fields that have changed (dirty tracking)
 */
export async function saveSSPToBackend(sspId: string, data: SSPData, previousData?: SSPData): Promise<void> {
  const changes = detectChanges(data, previousData);
  const promises: Promise<unknown>[] = [];

  // System Info section (via PUT /ssp/{id}/sections/system_info)
  if (changes.systemInfo) {
    promises.push(
      api(`/api/v1/ssp/${sspId}/sections/system_info`, {
        method: 'PUT',
        body: JSON.stringify({ content: data.sysDesc || '' }),
      })
    );
  }

  // FIPS 199 section
  if (changes.fips199) {
    promises.push(
      api(`/api/v1/ssp/${sspId}/sections/fips_199`, {
        method: 'PUT',
        body: JSON.stringify({ content: data.catJust || '' }),
      })
    );
  }

  // RMF Tracking
  if (changes.rmfTracking) {
    promises.push(
      api(`/api/v1/ssp/${sspId}/rmf-tracking`, {
        method: 'PUT',
        body: JSON.stringify({
          current_step: data.rmfCurrentStep,
          target_ato_date: data.rmfTargetAto,
          prepare_tasks: data.rmf_prepare,
          categorize_tasks: data.rmf_categorize,
          select_tasks: data.rmf_select,
          implement_tasks: data.rmf_implement,
          assess_tasks: data.rmf_assess,
          authorize_tasks: data.rmf_authorize,
          monitor_tasks: data.rmf_monitor,
          artifacts_completed: data.rmfArtifacts,
        }),
      })
    );
  }

  // Digital Identity
  if (changes.digitalIdentity) {
    promises.push(
      api(`/api/v1/ssp/${sspId}/digital-identity`, {
        method: 'PUT',
        body: JSON.stringify({
          ial: data.ial,
          aal: data.aal,
          fal: data.fal,
          mfa_methods: data.mfaMethods,
          identity_narrative: data.idNarr,
        }),
      })
    );
  }

  // Privacy Analysis
  if (changes.privacy) {
    promises.push(
      api(`/api/v1/ssp/${sspId}/privacy-analysis`, {
        method: 'PUT',
        body: JSON.stringify({
          collects_pii: data.ptaCollectsPii,
          pii_types: data.ptaPiiTypes,
          record_count: data.ptaRecordCount,
          pia_required: data.ptaPiaRequired,
          pia_authority: data.piaAuthority,
          pia_purpose: data.piaPurpose,
          pia_minimization: data.piaMinimization,
          pia_retention: data.piaRetention,
          pia_sharing: data.piaSharing,
          pia_consent: data.piaConsent,
          sorn_status: data.sornStatus,
          sorn_number: data.sornNumber,
        }),
      })
    );
  }

  // Config Management
  if (changes.configMgmt) {
    promises.push(
      api(`/api/v1/ssp/${sspId}/config-management`, {
        method: 'PUT',
        body: JSON.stringify({
          cm_purpose: data.cmPurpose,
          change_control_narrative: data.cmChangeNarr,
        }),
      })
    );
  }

  // SCRM Plan
  if (changes.scrmPlan) {
    promises.push(
      api(`/api/v1/ssp/${sspId}/scrm-plan`, {
        method: 'PUT',
        body: JSON.stringify({
          scrm_narrative: data.scrmPlan,
          sbom_format: data.sbomFormat,
          provenance_tracking: data.provenance,
        }),
      })
    );
  }

  // POA&M Summary
  if (changes.poam) {
    promises.push(
      api(`/api/v1/ssp/${sspId}/poam-summary`, {
        method: 'PUT',
        body: JSON.stringify({
          review_frequency: data.poamFreq,
          remediation_workflow: data.poamWf,
        }),
      })
    );
  }

  // Section-based fields
  const sectionUpdates: Array<{ key: string; content: string }> = [];

  if (changes.boundary) sectionUpdates.push({ key: 'authorization_boundary', content: data.bndNarr || '' });
  if (changes.dataFlow) sectionUpdates.push({ key: 'data_flow', content: data.dfNarr || '' });
  if (changes.network) sectionUpdates.push({ key: 'network_architecture', content: data.netNarr || '' });
  if (changes.crypto) {
    sectionUpdates.push({ key: 'cryptographic_protection', content: data.cryptoNarr || '' });
    sectionUpdates.push({ key: 'cnsa_suite_version', content: data.cnsaVersion || '' });
    sectionUpdates.push({ key: 'pqc_migration_status', content: data.pqcMigrationStatus || '' });
    sectionUpdates.push({ key: 'pqc_target_date', content: data.pqcTargetDate || '' });
    sectionUpdates.push({ key: 'pqc_key_exchange', content: data.pqcKeyExchange || '' });
    sectionUpdates.push({ key: 'pqc_digital_signature', content: data.pqcDigitalSig || '' });
    sectionUpdates.push({ key: 'pqc_hash_algorithm', content: data.pqcHashAlgo || '' });
    sectionUpdates.push({ key: 'pqc_symmetric_algorithm', content: data.pqcSymmetricAlgo || '' });
    sectionUpdates.push({ key: 'pqc_migration_notes', content: data.pqcNotes || '' });
  }
  if (changes.contingency) {
    sectionUpdates.push({ key: 'contingency_plan_purpose', content: data.cpPurpose || '' });
    sectionUpdates.push({ key: 'contingency_plan_scope', content: data.cpScope || '' });
  }
  if (changes.incident) {
    sectionUpdates.push({ key: 'incident_response_purpose', content: data.irPurpose || '' });
    sectionUpdates.push({ key: 'incident_response_scope', content: data.irScope || '' });
  }
  if (changes.conmon) {
    sectionUpdates.push({ key: 'continuous_monitoring_type', content: data.iscmType || '' });
    sectionUpdates.push({ key: 'continuous_monitoring_narrative', content: data.iscmNarrative || '' });
  }

  for (const update of sectionUpdates) {
    promises.push(
      api(`/api/v1/ssp/${sspId}/sections/${update.key}`, {
        method: 'PUT',
        body: JSON.stringify({ content: update.content }),
      })
    );
  }

  // Execute all updates
  await Promise.all(promises);
}

// =============================================================================
// Sync List Items (Info Types, Ports, Crypto, etc.)
// =============================================================================

/**
 * Returns true if the error is a 409 Conflict (duplicate), which is safe
 * to ignore during sync. All other errors are re-thrown.
 */
function isDuplicateError(error: unknown): boolean {
  if (error instanceof Error) {
    // API errors typically include status code in the message
    return error.message.includes('409') || error.message.toLowerCase().includes('duplicate');
  }
  return false;
}

/**
 * POST a single item to the backend, ignoring 409 Conflict (duplicate) errors.
 * All other errors propagate to the caller.
 */
async function postIgnoringDuplicates(url: string, body: Record<string, unknown>): Promise<void> {
  try {
    await api(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (!isDuplicateError(error)) {
      throw error;
    }
  }
}

/**
 * Delete all remote items for a resource and re-create from local state.
 * Falls back to add-only if the DELETE endpoint returns 404 (not implemented).
 */
async function replaceRemoteCollection(
  sspId: string,
  endpoint: string,
  items: Array<Record<string, unknown>>,
): Promise<void> {
  // Attempt to clear existing remote items first
  try {
    await api(`/api/v1/ssp/${sspId}/${endpoint}`, { method: 'DELETE' });
  } catch (error) {
    // If DELETE not supported (404/405), fall back to add-only
    const msg = error instanceof Error ? error.message : '';
    if (!msg.includes('404') && !msg.includes('405')) {
      throw error;
    }
  }

  // Re-create all local items
  for (const item of items) {
    await postIgnoringDuplicates(`/api/v1/ssp/${sspId}/${endpoint}`, item);
  }
}

/**
 * Sync info types between Reporter and Backend
 */
export async function syncInfoTypes(
  sspId: string,
  localItems: InfoType[],
  _remoteItems: BackendInfoType[]
): Promise<void> {
  const items = localItems
    .filter((item) => item.nistId && item.name)
    .map((item) => ({
      nist_id: item.nistId,
      name: item.name,
      confidentiality: item.c,
      integrity: item.i,
      availability: item.a,
    }));

  await replaceRemoteCollection(sspId, 'info-types', items);
}

/**
 * Sync ports/protocols between Reporter and Backend
 */
export async function syncPortsProtocols(
  sspId: string,
  localItems: PPSRow[]
): Promise<void> {
  const items = localItems
    .filter((item) => item.port)
    .map((item) => ({
      port: item.port,
      protocol: item.proto,
      service: item.svc,
      purpose: item.purpose,
      direction: item.dir,
      dit_ref: item.dit,
    }));

  await replaceRemoteCollection(sspId, 'ports-protocols', items);
}

/**
 * Sync crypto modules between Reporter and Backend
 */
export async function syncCryptoModules(
  sspId: string,
  localItems: CryptoModule[]
): Promise<void> {
  const items = localItems
    .filter((item) => item.mod)
    .map((item) => ({
      module_name: item.mod,
      certificate_number: item.cert,
      fips_level: item.level,
      usage: item.usage,
      deployment_location: item.where,
      cnsa_suite: item.cnsaSuite,
      pqc_algorithm: item.pqcAlgorithm,
      pqc_parameter_set: item.pqcParameterSet,
      fips_standard: item.fipsStandard,
      hybrid_mode: item.hybridMode,
    }));

  await replaceRemoteCollection(sspId, 'crypto-modules', items);
}

/**
 * Sync separation duties between Reporter and Backend
 */
export async function syncSeparationDuties(
  sspId: string,
  localItems: SepDutyRow[]
): Promise<void> {
  const items = localItems
    .filter((item) => item.role)
    .map((item) => ({
      role: item.role,
      access_level: item.access,
      prohibited_actions: item.prohibited,
      justification: item.justification,
    }));

  await replaceRemoteCollection(sspId, 'separation-duties', items);
}

/**
 * Sync policy mappings between Reporter and Backend
 */
export async function syncPolicyMappings(
  sspId: string,
  localItems: PolicyDoc[]
): Promise<void> {
  const items = localItems
    .filter((item) => item.family)
    .map((item) => ({
      control_family: item.family,
      policy_title: item.title,
      policy_version: item.version,
      policy_owner: item.owner,
      last_review_date: item.lastReview,
      status: item.status,
    }));

  await replaceRemoteCollection(sspId, 'policy-mappings', items);
}

/**
 * Sync SCRM entries between Reporter and Backend
 */
export async function syncSCRMEntries(
  sspId: string,
  localItems: SCRMSupplier[]
): Promise<void> {
  const items = localItems
    .filter((item) => item.supplier)
    .map((item) => ({
      supplier_name: item.supplier,
      supplier_type: item.type,
      criticality: item.criticality,
      sbom_available: item.sbom,
      risk_level: item.riskLevel,
    }));

  await replaceRemoteCollection(sspId, 'scrm', items);
}

/**
 * Sync CM baselines between Reporter and Backend
 */
export async function syncCMBaselines(
  sspId: string,
  localItems: CMBaseline[]
): Promise<void> {
  const items = localItems
    .filter((item) => item.comp)
    .map((item) => ({
      component_name: item.comp,
      benchmark: item.bench,
      version: item.ver,
      compliance_pct: item.pct,
      scan_frequency: item.scan,
    }));

  await replaceRemoteCollection(sspId, 'cm-baselines', items);
}

// =============================================================================
// Helper Functions
// =============================================================================

function parseJSON<T>(value: string | undefined): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

interface ChangeFlags {
  systemInfo: boolean;
  fips199: boolean;
  rmfTracking: boolean;
  digitalIdentity: boolean;
  privacy: boolean;
  configMgmt: boolean;
  scrmPlan: boolean;
  poam: boolean;
  boundary: boolean;
  dataFlow: boolean;
  network: boolean;
  crypto: boolean;
  contingency: boolean;
  incident: boolean;
  conmon: boolean;
}

function detectChanges(current: SSPData, previous?: SSPData): ChangeFlags {
  if (!previous) {
    // No previous data, assume everything changed
    return {
      systemInfo: true,
      fips199: true,
      rmfTracking: true,
      digitalIdentity: true,
      privacy: true,
      configMgmt: true,
      scrmPlan: true,
      poam: true,
      boundary: true,
      dataFlow: true,
      network: true,
      crypto: true,
      contingency: true,
      incident: true,
      conmon: true,
    };
  }

  const changed = (keys: (keyof SSPData)[]): boolean => {
    return keys.some((key) => {
      const a = current[key];
      const b = previous[key];
      if (Array.isArray(a) && Array.isArray(b)) {
        return JSON.stringify(a) !== JSON.stringify(b);
      }
      if (typeof a === 'object' && typeof b === 'object') {
        return JSON.stringify(a) !== JSON.stringify(b);
      }
      return a !== b;
    });
  };

  return {
    systemInfo: changed(['sysName', 'sysAcronym', 'sysDesc', 'fismaId', 'fedrampId', 'owningAgency', 'agencyComp', 'cloudModel', 'deployModel', 'authType', 'opDate']),
    fips199: changed(['conf', 'integ', 'avail', 'catJust']),
    rmfTracking: changed(['rmfCurrentStep', 'rmfTargetAto', 'rmf_prepare', 'rmf_categorize', 'rmf_select', 'rmf_implement', 'rmf_assess', 'rmf_authorize', 'rmf_monitor', 'rmfArtifacts']),
    digitalIdentity: changed(['ial', 'aal', 'fal', 'mfaMethods', 'idNarr']),
    privacy: changed(['ptaCollectsPii', 'ptaPiiTypes', 'ptaRecordCount', 'ptaPiaRequired', 'piaAuthority', 'piaPurpose', 'piaMinimization', 'piaRetention', 'piaSharing', 'piaConsent', 'sornStatus', 'sornNumber']),
    configMgmt: changed(['cmPurpose', 'cmChangeNarr']),
    scrmPlan: changed(['scrmPlan', 'sbomFormat', 'provenance']),
    poam: changed(['poamFreq', 'poamWf']),
    boundary: changed(['bndNarr']),
    dataFlow: changed(['dfNarr', 'encRest', 'encTransit', 'keyMgmt', 'dataDisposal']),
    network: changed(['netNarr', 'primaryDC', 'secondaryDC']),
    crypto: changed(['cryptoNarr', 'cnsaVersion', 'pqcMigrationStatus', 'pqcTargetDate', 'pqcKeyExchange', 'pqcDigitalSig', 'pqcHashAlgo', 'pqcSymmetricAlgo', 'pqcNotes']),
    contingency: changed(['cpPurpose', 'cpScope', 'rto', 'rpo', 'mtd', 'backupFreq', 'cpTestDate', 'cpTestType']),
    incident: changed(['irPurpose', 'irScope', 'certTime', 'irTestDate']),
    conmon: changed(['iscmType', 'ctrlRotation', 'iscmNarrative', 'sigChangeCriteria', 'atoExpiry', 'nextAssessment']),
  };
}

// =============================================================================
// List SSPs
// =============================================================================

export interface SSPListItem {
  id: string;
  title: string;
  status: string;
  ssp_type: string;
  system_name?: string;
  system_acronym?: string;
  impact_level?: string;
  updated_at: string;
}

/**
 * Get list of available SSPs from backend
 */
export async function listSSPs(): Promise<SSPListItem[]> {
  const res = await api<{ documents: SSPListItem[] }>('/api/v1/ssp');
  return res.documents || [];
}
