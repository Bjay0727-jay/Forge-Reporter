/**
 * ForgeComply 360 Reporter - OSCAL SSP Export
 * Generates NIST OSCAL 1.1.2 compliant SSP JSON from Reporter SSPData
 */

import type { SSPData } from '../types';
import type {
  OscalSSPDocument,
  OscalSystemSecurityPlan,
  OscalMetadata,
  OscalRole,
  OscalParty,
  OscalResponsibleParty,
  OscalSystemCharacteristics,
  OscalInformationType,
  OscalSystemImplementation,
  OscalUser,
  OscalComponent,
  OscalProtocol,
  OscalControlImplementation,
  OscalImplementedRequirement,
  OscalByComponent,
} from '../types/oscal';

// =============================================================================
// UUID Generation
// =============================================================================

function generateUUID(): string {
  // Use crypto.randomUUID if available, fallback to manual generation
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// =============================================================================
// Export Options Interface
// =============================================================================

export interface OscalExportOptions {
  data: SSPData;
  documentTitle?: string;
  orgName?: string;
  version?: string;
  profileRef?: string;
}

// =============================================================================
// Main Export Function
// =============================================================================

/**
 * Generate OSCAL SSP JSON document from Reporter SSPData
 */
export function generateOscalSSP(options: OscalExportOptions): OscalSSPDocument {
  const { data, documentTitle, orgName, version = '1.0', profileRef } = options;

  const systemUuid = generateUUID();
  const orgUuid = generateUUID();
  const timestamp = new Date().toISOString();

  // Determine impact level for profile reference
  const impactLevel = determineImpactLevel(data);
  const defaultProfileRef = profileRef || `#nist-sp-800-53-rev5-${impactLevel}`;

  const ssp: OscalSystemSecurityPlan = {
    uuid: generateUUID(),
    metadata: buildMetadata(data, documentTitle, timestamp, version, orgName, orgUuid),
    'import-profile': { href: defaultProfileRef },
    'system-characteristics': buildSystemCharacteristics(data, systemUuid, impactLevel),
    'system-implementation': buildSystemImplementation(data),
    'control-implementation': buildControlImplementation(data, systemUuid),
  };

  return { 'system-security-plan': ssp };
}

// =============================================================================
// Metadata Builder
// =============================================================================

function buildMetadata(
  data: SSPData,
  documentTitle: string | undefined,
  timestamp: string,
  version: string,
  orgName: string | undefined,
  orgUuid: string
): OscalMetadata {
  const title = documentTitle || `System Security Plan - ${data.sysName || 'Untitled System'}`;

  const roles: OscalRole[] = [
    { id: 'system-owner', title: 'System Owner' },
    { id: 'authorizing-official', title: 'Authorizing Official' },
    { id: 'information-system-security-officer', title: 'Information System Security Officer (ISSO)' },
    { id: 'information-system-security-manager', title: 'Information System Security Manager (ISSM)' },
    { id: 'security-control-assessor', title: 'Security Control Assessor' },
    { id: 'privacy-official', title: 'Privacy Official' },
  ];

  const parties: OscalParty[] = [];
  const responsibleParties: OscalResponsibleParty[] = [];

  // Add organization
  if (orgName || data.owningAgency) {
    parties.push({
      uuid: orgUuid,
      type: 'organization',
      name: orgName || data.owningAgency || 'Organization',
      'short-name': data.agencyComp,
    });
  }

  // Add personnel parties
  if (data.soName) {
    const soUuid = generateUUID();
    parties.push({
      uuid: soUuid,
      type: 'person',
      name: data.soName,
      'email-addresses': data.soEmail ? [data.soEmail] : undefined,
    });
    responsibleParties.push({ 'role-id': 'system-owner', 'party-uuids': [soUuid] });
  }

  if (data.aoName) {
    const aoUuid = generateUUID();
    parties.push({
      uuid: aoUuid,
      type: 'person',
      name: data.aoName,
      'email-addresses': data.aoEmail ? [data.aoEmail] : undefined,
    });
    responsibleParties.push({ 'role-id': 'authorizing-official', 'party-uuids': [aoUuid] });
  }

  if (data.issoName) {
    const issoUuid = generateUUID();
    parties.push({
      uuid: issoUuid,
      type: 'person',
      name: data.issoName,
      'email-addresses': data.issoEmail ? [data.issoEmail] : undefined,
    });
    responsibleParties.push({ 'role-id': 'information-system-security-officer', 'party-uuids': [issoUuid] });
  }

  if (data.issmName) {
    const issmUuid = generateUUID();
    parties.push({
      uuid: issmUuid,
      type: 'person',
      name: data.issmName,
      'email-addresses': data.issmEmail ? [data.issmEmail] : undefined,
    });
    responsibleParties.push({ 'role-id': 'information-system-security-manager', 'party-uuids': [issmUuid] });
  }

  if (data.scaName) {
    const scaUuid = generateUUID();
    parties.push({
      uuid: scaUuid,
      type: 'person',
      name: data.scaName,
      'email-addresses': data.scaEmail ? [data.scaEmail] : undefined,
    });
    responsibleParties.push({ 'role-id': 'security-control-assessor', 'party-uuids': [scaUuid] });
  }

  if (data.poName) {
    const poUuid = generateUUID();
    parties.push({
      uuid: poUuid,
      type: 'person',
      name: data.poName,
      'email-addresses': data.poEmail ? [data.poEmail] : undefined,
    });
    responsibleParties.push({ 'role-id': 'privacy-official', 'party-uuids': [poUuid] });
  }

  return {
    title,
    'last-modified': timestamp,
    version,
    'oscal-version': '1.1.2',
    roles,
    parties: parties.length > 0 ? parties : undefined,
    'responsible-parties': responsibleParties.length > 0 ? responsibleParties : undefined,
  };
}

// =============================================================================
// System Characteristics Builder
// =============================================================================

function buildSystemCharacteristics(
  data: SSPData,
  _systemUuid: string,
  impactLevel: string
): OscalSystemCharacteristics {
  // Build information types
  const informationTypes: OscalInformationType[] = [];

  if (data.infoTypes && data.infoTypes.length > 0) {
    for (const it of data.infoTypes) {
      informationTypes.push({
        uuid: generateUUID(),
        title: it.name || 'Information Type',
        categorizations: it.nistId
          ? [
              {
                system: 'https://doi.org/10.6028/NIST.SP.800-60v2r1',
                'information-type-ids': [it.nistId],
              },
            ]
          : undefined,
        'confidentiality-impact': { base: it.c || impactLevel },
        'integrity-impact': { base: it.i || impactLevel },
        'availability-impact': { base: it.a || impactLevel },
      });
    }
  } else {
    // Default information type if none specified
    informationTypes.push({
      uuid: generateUUID(),
      title: 'System Information',
      'confidentiality-impact': { base: impactLevel },
      'integrity-impact': { base: impactLevel },
      'availability-impact': { base: impactLevel },
    });
  }

  // Determine system status
  const statusState = data.opDate ? 'operational' : 'under-development';

  return {
    'system-ids': data.fismaId
      ? [{ 'identifier-type': 'https://fedramp.gov', id: data.fismaId }]
      : undefined,
    'system-name': data.sysName || 'Untitled System',
    'system-name-short': data.sysAcronym,
    description: data.sysDesc || 'No description provided.',
    props: buildSystemProps(data),
    'security-sensitivity-level': impactLevel,
    'system-information': { 'information-types': informationTypes },
    'security-impact-level': {
      'security-objective-confidentiality': data.conf || impactLevel,
      'security-objective-integrity': data.integ || impactLevel,
      'security-objective-availability': data.avail || impactLevel,
    },
    status: { state: statusState },
    'authorization-boundary': {
      description: data.bndNarr || 'Authorization boundary not yet defined.',
    },
    'network-architecture': data.netNarr
      ? { description: data.netNarr }
      : undefined,
    'data-flow': data.dfNarr
      ? { description: data.dfNarr }
      : undefined,
  };
}

function buildSystemProps(data: SSPData): Array<{ name: string; value: string }> {
  const props: Array<{ name: string; value: string }> = [];

  if (data.cloudModel) props.push({ name: 'cloud-service-model', value: data.cloudModel });
  if (data.deployModel) props.push({ name: 'cloud-deployment-model', value: data.deployModel });
  if (data.authType) props.push({ name: 'authorization-type', value: data.authType });
  if (data.authDuration) props.push({ name: 'authorization-duration', value: data.authDuration });
  if (data.opDate) props.push({ name: 'operational-date', value: data.opDate });
  if (data.fedrampId) props.push({ name: 'fedramp-id', value: data.fedrampId });

  return props.length > 0 ? props : [];
}

// =============================================================================
// System Implementation Builder
// =============================================================================

function buildSystemImplementation(data: SSPData): OscalSystemImplementation {
  const users: OscalUser[] = [];
  const components: OscalComponent[] = [];

  // Build users from separation of duties matrix
  if (data.sepDutyMatrix && data.sepDutyMatrix.length > 0) {
    for (const duty of data.sepDutyMatrix) {
      if (duty.role) {
        users.push({
          uuid: generateUUID(),
          title: duty.role,
          description: duty.justification,
          'authorized-privileges': duty.access
            ? [
                {
                  title: 'Role Access',
                  'functions-performed': [duty.access],
                },
              ]
            : undefined,
        });
      }
    }
  }

  // Ensure at least one user
  if (users.length === 0) {
    users.push({
      uuid: generateUUID(),
      title: 'System User',
      description: 'General system user',
    });
  }

  // Add system component
  components.push({
    uuid: generateUUID(),
    type: 'this-system',
    title: data.sysName || 'System',
    description: data.sysDesc || 'The information system.',
    status: { state: 'operational' },
  });

  // Add boundary components
  if (data.bndComps && data.bndComps.length > 0) {
    for (const comp of data.bndComps) {
      if (comp.name) {
        components.push({
          uuid: generateUUID(),
          type: comp.type || 'software',
          title: comp.name,
          description: comp.purpose || 'System component',
          status: { state: 'operational' },
          props: comp.zone ? [{ name: 'security-zone', value: comp.zone }] : undefined,
        });
      }
    }
  }

  // Add crypto modules as components
  if (data.cryptoMods && data.cryptoMods.length > 0) {
    for (const crypto of data.cryptoMods) {
      if (crypto.mod) {
        components.push({
          uuid: generateUUID(),
          type: 'validation',
          title: crypto.mod,
          description: crypto.usage || 'Cryptographic module',
          purpose: `FIPS 140 Level ${crypto.level || 'N/A'} - Certificate: ${crypto.cert || 'N/A'}`,
          status: { state: 'operational' },
        });
      }
    }
  }

  // Add services from ports/protocols
  if (data.ppsRows && data.ppsRows.length > 0) {
    const serviceComponent: OscalComponent = {
      uuid: generateUUID(),
      type: 'service',
      title: 'Network Services',
      description: 'Network services utilized by the system',
      status: { state: 'operational' },
      protocols: buildProtocols(data.ppsRows),
    };
    components.push(serviceComponent);
  }

  return {
    users,
    components,
  };
}

function buildProtocols(ppsRows: NonNullable<SSPData['ppsRows']>): OscalProtocol[] {
  const protocols: OscalProtocol[] = [];

  for (const pps of ppsRows) {
    if (pps.svc || pps.proto) {
      const portNum = parseInt(pps.port || '0', 10);
      protocols.push({
        uuid: generateUUID(),
        name: pps.proto?.toUpperCase() || 'TCP',
        title: pps.svc || 'Service',
        'port-ranges': portNum > 0
          ? [
              {
                start: portNum,
                transport: (pps.proto?.toUpperCase() === 'UDP' ? 'UDP' : 'TCP') as 'TCP' | 'UDP',
              },
            ]
          : undefined,
      });
    }
  }

  return protocols;
}

// =============================================================================
// Control Implementation Builder
// =============================================================================

function buildControlImplementation(data: SSPData, systemUuid: string): OscalControlImplementation {
  const implementedRequirements: OscalImplementedRequirement[] = [];

  // Build from control data if present
  if (data.ctrlData && typeof data.ctrlData === 'object') {
    for (const [controlId, controlInfo] of Object.entries(data.ctrlData)) {
      if (typeof controlInfo === 'object' && controlInfo !== null) {
        const info = controlInfo as Record<string, string>;
        const description = info.implementation || info.description || '';
        const status = mapControlStatus(info.status);

        if (description || status) {
          const byComponents: OscalByComponent[] = [
            {
              'component-uuid': systemUuid,
              uuid: generateUUID(),
              description: description || 'Implementation not yet documented.',
              'implementation-status': { state: status },
            },
          ];

          implementedRequirements.push({
            uuid: generateUUID(),
            'control-id': controlId.toLowerCase(),
            'by-components': byComponents,
          });
        }
      }
    }
  }

  // If no controls documented, add a placeholder
  if (implementedRequirements.length === 0) {
    implementedRequirements.push({
      uuid: generateUUID(),
      'control-id': 'ac-1',
      remarks: 'Control implementations have not yet been documented.',
    });
  }

  return {
    description: `Control implementation details for ${data.sysName || 'the system'}`,
    'implemented-requirements': implementedRequirements,
  };
}

function mapControlStatus(status: string | undefined): 'implemented' | 'partial' | 'planned' | 'alternative' | 'not-applicable' {
  if (!status) return 'planned';

  const normalized = status.toLowerCase().replace(/[_-]/g, '');

  switch (normalized) {
    case 'implemented':
    case 'complete':
    case 'completed':
      return 'implemented';
    case 'partial':
    case 'partiallyimplemented':
    case 'inprogress':
      return 'partial';
    case 'planned':
    case 'notstarted':
    case 'underdevelopment':
      return 'planned';
    case 'alternative':
    case 'compensating':
      return 'alternative';
    case 'notapplicable':
    case 'na':
      return 'not-applicable';
    default:
      return 'planned';
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function determineImpactLevel(data: SSPData): string {
  // Determine highest impact from CIA triad
  const levels = ['low', 'moderate', 'high'];
  const conf = levels.indexOf(data.conf?.toLowerCase() || 'moderate');
  const integ = levels.indexOf(data.integ?.toLowerCase() || 'moderate');
  const avail = levels.indexOf(data.avail?.toLowerCase() || 'moderate');

  const maxIndex = Math.max(conf, integ, avail);
  return levels[maxIndex] || 'moderate';
}

// =============================================================================
// Export Utilities
// =============================================================================

/**
 * Convert OSCAL document to formatted JSON string
 */
export function oscalToJson(doc: OscalSSPDocument): string {
  return JSON.stringify(doc, null, 2);
}

/**
 * Download OSCAL JSON as file
 */
export function downloadOscalJson(doc: OscalSSPDocument, filename?: string): void {
  const json = oscalToJson(doc);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `ssp-oscal-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

/**
 * Generate and download OSCAL SSP in one step
 */
export function exportToOscalJson(options: OscalExportOptions, filename?: string): void {
  const doc = generateOscalSSP(options);
  const defaultFilename = `${options.data.sysAcronym || 'SSP'}_OSCAL_${new Date().toISOString().split('T')[0]}.json`;
  downloadOscalJson(doc, filename || defaultFilename);
}
