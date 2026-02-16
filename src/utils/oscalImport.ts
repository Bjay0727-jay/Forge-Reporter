/**
 * ForgeComply 360 Reporter - OSCAL SSP Import
 * Parses NIST OSCAL 1.1.2 SSP JSON/XML and maps to Reporter SSPData
 *
 * @see https://github.com/usnistgov/OSCAL
 */

import type { SSPData, InfoType, BoundaryComponent, PPSRow, SepDutyRow } from '../types';
import { validateOscalSSP, type OscalValidationResult } from './oscalValidator';

// =============================================================================
// Types
// =============================================================================

export interface OscalImportResult {
  success: boolean;
  data: SSPData | null;
  validation: OscalValidationResult;
  warnings: string[];
  sourceFormat: 'json' | 'xml';
  documentInfo: {
    title: string;
    version: string;
    lastModified: string;
    oscalVersion: string;
  };
}

export interface ImportError {
  message: string;
  details?: string;
}

// =============================================================================
// Main Import Function
// =============================================================================

/** Maximum file size for OSCAL import: 50 MB */
const MAX_IMPORT_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Import an OSCAL SSP document (JSON or XML) and convert to SSPData
 */
export async function importOscalSSP(file: File): Promise<OscalImportResult> {
  // Validate file size before reading to prevent DoS from oversized files
  if (file.size > MAX_IMPORT_FILE_SIZE) {
    throw new Error(
      `File too large (${formatFileSize(file.size)}). Maximum allowed size is ${formatFileSize(MAX_IMPORT_FILE_SIZE)}.`
    );
  }

  if (file.size === 0) {
    throw new Error('File is empty.');
  }

  const warnings: string[] = [];

  // Determine format from file extension or content
  const isXml = file.name.toLowerCase().endsWith('.xml') ||
    file.type === 'application/xml' ||
    file.type === 'text/xml';

  const content = await file.text();

  let oscalDoc: unknown;
  let sourceFormat: 'json' | 'xml' = 'json';

  if (isXml) {
    // Parse XML to JSON-like structure
    sourceFormat = 'xml';
    oscalDoc = parseOscalXml(content);
    warnings.push('Imported from XML format - some formatting may differ');
  } else {
    // Parse JSON directly
    try {
      oscalDoc = JSON.parse(content);
    } catch {
      throw new Error('Invalid JSON format. Please ensure the file is valid OSCAL JSON.');
    }
  }

  // Validate against OSCAL schema
  const validation = validateOscalSSP(oscalDoc);

  if (!validation.valid) {
    // Still try to parse, but warn user
    warnings.push(`Document has ${validation.errors.length} schema validation error(s)`);
  }

  // Extract SSP data
  const doc = oscalDoc as Record<string, unknown>;
  const ssp = doc['system-security-plan'] as Record<string, unknown> | undefined;

  if (!ssp) {
    throw new Error('No system-security-plan element found. Is this an OSCAL SSP document?');
  }

  // Parse the OSCAL SSP into our data model
  const data = parseOscalToSSPData(ssp, warnings);

  // Extract document info
  const metadata = ssp.metadata as Record<string, unknown> | undefined;
  const documentInfo = {
    title: (metadata?.title as string) || 'Untitled SSP',
    version: (metadata?.version as string) || '1.0',
    lastModified: (metadata?.['last-modified'] as string) || new Date().toISOString(),
    oscalVersion: (metadata?.['oscal-version'] as string) || '1.1.2',
  };

  return {
    success: true,
    data,
    validation,
    warnings,
    sourceFormat,
    documentInfo,
  };
}

// =============================================================================
// OSCAL to SSPData Parser
// =============================================================================

function parseOscalToSSPData(ssp: Record<string, unknown>, warnings: string[]): SSPData {
  const data: SSPData = {};

  // Parse metadata
  const metadata = ssp.metadata as Record<string, unknown> | undefined;
  if (metadata) {
    parseMetadata(metadata, data, warnings);
  }

  // Parse system characteristics
  const sysChars = ssp['system-characteristics'] as Record<string, unknown> | undefined;
  if (sysChars) {
    parseSystemCharacteristics(sysChars, data, warnings);
  }

  // Parse system implementation
  const sysImpl = ssp['system-implementation'] as Record<string, unknown> | undefined;
  if (sysImpl) {
    parseSystemImplementation(sysImpl, data, warnings);
  }

  // Parse control implementation
  const ctrlImpl = ssp['control-implementation'] as Record<string, unknown> | undefined;
  if (ctrlImpl) {
    parseControlImplementation(ctrlImpl, data, warnings);
  }

  return data;
}

// =============================================================================
// Section Parsers
// =============================================================================

function parseMetadata(metadata: Record<string, unknown>, data: SSPData, _warnings: string[]): void {
  // Parse parties (personnel)
  const parties = metadata.parties as Array<Record<string, unknown>> | undefined;
  const responsibleParties = metadata['responsible-parties'] as Array<Record<string, unknown>> | undefined;

  if (parties && responsibleParties) {
    // Build a UUID -> party map
    const partyMap = new Map<string, Record<string, unknown>>();
    for (const party of parties) {
      if (party.uuid) {
        partyMap.set(party.uuid as string, party);
      }
    }

    // Map responsible parties to personnel fields
    for (const rp of responsibleParties) {
      const roleId = rp['role-id'] as string;
      const partyUuids = rp['party-uuids'] as string[] | undefined;

      if (partyUuids && partyUuids.length > 0) {
        const party = partyMap.get(partyUuids[0]);
        if (party) {
          const name = party.name as string;
          const emails = party['email-addresses'] as string[] | undefined;
          const email = emails?.[0];

          switch (roleId) {
            case 'system-owner':
              data.soName = name;
              data.soEmail = email;
              break;
            case 'authorizing-official':
              data.aoName = name;
              data.aoEmail = email;
              break;
            case 'information-system-security-officer':
              data.issoName = name;
              data.issoEmail = email;
              break;
            case 'information-system-security-manager':
              data.issmName = name;
              data.issmEmail = email;
              break;
            case 'security-control-assessor':
              data.scaName = name;
              data.scaEmail = email;
              break;
            case 'privacy-official':
              data.poName = name;
              data.poEmail = email;
              break;
          }
        }
      }
    }
  }

  // Parse organization from parties
  if (parties) {
    const orgParty = parties.find(p => p.type === 'organization');
    if (orgParty) {
      data.owningAgency = orgParty.name as string;
      data.agencyComp = orgParty['short-name'] as string;
    }
  }
}

function parseSystemCharacteristics(sysChars: Record<string, unknown>, data: SSPData, warnings: string[]): void {
  // Basic system info
  data.sysName = sysChars['system-name'] as string;
  data.sysAcronym = sysChars['system-name-short'] as string;
  data.sysDesc = sysChars.description as string;

  // System IDs
  const systemIds = sysChars['system-ids'] as Array<Record<string, unknown>> | undefined;
  if (systemIds && systemIds.length > 0) {
    const primaryId = systemIds[0];
    const idType = primaryId['identifier-type'] as string;

    if (idType?.includes('fedramp')) {
      data.fedrampId = primaryId.id as string;
    } else {
      data.fismaId = primaryId.id as string;
    }
  }

  // Security sensitivity level (overall impact)
  const sensitivityLevel = sysChars['security-sensitivity-level'] as string;

  // Security impact levels
  const securityImpact = sysChars['security-impact-level'] as Record<string, unknown> | undefined;
  if (securityImpact) {
    data.conf = securityImpact['security-objective-confidentiality'] as string;
    data.integ = securityImpact['security-objective-integrity'] as string;
    data.avail = securityImpact['security-objective-availability'] as string;
  } else if (sensitivityLevel) {
    // Use overall level if specific ones not provided
    data.conf = sensitivityLevel;
    data.integ = sensitivityLevel;
    data.avail = sensitivityLevel;
  }

  // Parse props for additional fields
  const props = sysChars.props as Array<Record<string, unknown>> | undefined;
  if (props) {
    for (const prop of props) {
      const name = prop.name as string;
      const value = prop.value as string;

      switch (name) {
        case 'cloud-service-model':
          data.cloudModel = value;
          break;
        case 'cloud-deployment-model':
          data.deployModel = value;
          break;
        case 'authorization-type':
          data.authType = value;
          break;
        case 'authorization-duration':
          data.authDuration = value;
          break;
        case 'operational-date':
          data.opDate = value;
          break;
        case 'fedramp-id':
          data.fedrampId = value;
          break;
      }
    }
  }

  // Parse information types
  const sysInfo = sysChars['system-information'] as Record<string, unknown> | undefined;
  if (sysInfo) {
    const infoTypes = sysInfo['information-types'] as Array<Record<string, unknown>> | undefined;
    if (infoTypes && infoTypes.length > 0) {
      data.infoTypes = infoTypes.map((it): InfoType => {
        const categorizations = it.categorizations as Array<Record<string, unknown>> | undefined;
        const firstCat = categorizations?.[0];
        const typeIds = firstCat?.['information-type-ids'] as string[] | undefined;
        const nistId = typeIds?.[0];

        const confImpact = it['confidentiality-impact'] as Record<string, unknown> | undefined;
        const integImpact = it['integrity-impact'] as Record<string, unknown> | undefined;
        const availImpact = it['availability-impact'] as Record<string, unknown> | undefined;

        return {
          name: it.title as string,
          nistId,
          c: confImpact?.base as string,
          i: integImpact?.base as string,
          a: availImpact?.base as string,
        };
      });
    }
  }

  // Parse authorization boundary
  const authBoundary = sysChars['authorization-boundary'] as Record<string, unknown> | undefined;
  if (authBoundary) {
    data.bndNarr = authBoundary.description as string;
  }

  // Parse network architecture
  const netArch = sysChars['network-architecture'] as Record<string, unknown> | undefined;
  if (netArch) {
    data.netNarr = netArch.description as string;
  }

  // Parse data flow
  const dataFlow = sysChars['data-flow'] as Record<string, unknown> | undefined;
  if (dataFlow) {
    data.dfNarr = dataFlow.description as string;
  }

  // Parse status
  const status = sysChars.status as Record<string, unknown> | undefined;
  if (status?.state === 'operational' && !data.opDate) {
    // System is operational but no date specified
    warnings.push('System marked as operational but no operational date specified');
  }
}

function parseSystemImplementation(sysImpl: Record<string, unknown>, data: SSPData, _warnings: string[]): void {
  // Parse users/roles for separation of duties
  const users = sysImpl.users as Array<Record<string, unknown>> | undefined;
  if (users && users.length > 0) {
    data.sepDutyMatrix = users.map((user): SepDutyRow => {
      const privileges = user['authorized-privileges'] as Array<Record<string, unknown>> | undefined;
      const functions = privileges?.[0]?.['functions-performed'] as string[] | undefined;

      return {
        role: user.title as string,
        justification: user.description as string,
        access: functions?.join(', '),
      };
    });
  }

  // Parse components for boundary components
  const components = sysImpl.components as Array<Record<string, unknown>> | undefined;
  if (components && components.length > 0) {
    const bndComps: BoundaryComponent[] = [];
    const ppsRows: PPSRow[] = [];

    for (const comp of components) {
      const compType = comp.type as string;

      // Skip "this-system" component
      if (compType === 'this-system') continue;

      // Add as boundary component
      const compProps = comp.props as Array<Record<string, unknown>> | undefined;
      const zoneProp = compProps?.find(p => p.name === 'security-zone');

      bndComps.push({
        name: comp.title as string,
        type: compType,
        purpose: comp.description as string,
        zone: zoneProp?.value as string,
      });

      // Parse protocols for ports/protocols/services
      const protocols = comp.protocols as Array<Record<string, unknown>> | undefined;
      if (protocols) {
        for (const proto of protocols) {
          const portRanges = proto['port-ranges'] as Array<Record<string, unknown>> | undefined;
          const portRange = portRanges?.[0];

          ppsRows.push({
            svc: proto.title as string || proto.name as string,
            proto: proto.name as string,
            port: portRange?.start?.toString(),
          });
        }
      }
    }

    if (bndComps.length > 0) {
      data.bndComps = bndComps;
    }

    if (ppsRows.length > 0) {
      data.ppsRows = ppsRows;
    }
  }
}

function parseControlImplementation(ctrlImpl: Record<string, unknown>, data: SSPData, warnings: string[]): void {
  const implReqs = ctrlImpl['implemented-requirements'] as Array<Record<string, unknown>> | undefined;

  if (implReqs && implReqs.length > 0) {
    const ctrlData: Record<string, Record<string, string>> = {};

    for (const req of implReqs) {
      const controlId = (req['control-id'] as string)?.toUpperCase();
      if (!controlId) continue;

      // Get implementation details from by-components
      const byComponents = req['by-components'] as Array<Record<string, unknown>> | undefined;
      const firstComponent = byComponents?.[0];

      const description = firstComponent?.description as string || req.remarks as string || '';
      const implStatus = firstComponent?.['implementation-status'] as Record<string, unknown> | undefined;
      const status = mapOscalStatusToApp(implStatus?.state as string);

      ctrlData[controlId] = {
        implementation: description,
        status,
      };
    }

    if (Object.keys(ctrlData).length > 0) {
      data.ctrlData = ctrlData;
      warnings.push(`Imported ${Object.keys(ctrlData).length} control implementation(s)`);
    }
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Map OSCAL implementation status to app status format
 */
function mapOscalStatusToApp(oscalStatus: string | undefined): string {
  if (!oscalStatus) return 'planned';

  switch (oscalStatus.toLowerCase()) {
    case 'implemented':
      return 'implemented';
    case 'partial':
    case 'partially-implemented':
      return 'partial';
    case 'planned':
      return 'planned';
    case 'alternative':
      return 'alternative';
    case 'not-applicable':
      return 'not_applicable';
    default:
      return 'planned';
  }
}

/**
 * Parse OSCAL XML to JSON-like structure
 * Uses DOMParser for browser compatibility
 */
function parseOscalXml(xmlContent: string): Record<string, unknown> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'application/xml');

  // Check for parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML format: ' + parseError.textContent);
  }

  // Convert XML DOM to JSON-like object
  return xmlToJson(doc.documentElement);
}

/**
 * Convert XML Element to JSON object
 * Handles OSCAL's hyphenated element names
 */
function xmlToJson(element: Element): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Handle attributes
  if (element.attributes.length > 0) {
    for (const attr of Array.from(element.attributes)) {
      result[attr.name] = attr.value;
    }
  }

  // Handle child elements
  const children = Array.from(element.children);

  if (children.length === 0) {
    // Text content only
    const text = element.textContent?.trim();
    if (text) {
      return text as unknown as Record<string, unknown>;
    }
    return result;
  }

  // Group children by tag name
  const childGroups = new Map<string, Element[]>();
  for (const child of children) {
    const tagName = child.tagName;
    if (!childGroups.has(tagName)) {
      childGroups.set(tagName, []);
    }
    childGroups.get(tagName)!.push(child);
  }

  // Convert each group
  for (const [tagName, elements] of childGroups) {
    if (elements.length === 1) {
      result[tagName] = xmlToJson(elements[0]);
    } else {
      // Multiple elements with same name -> array
      result[tagName] = elements.map(el => xmlToJson(el));
    }
  }

  return result;
}

// =============================================================================
// File Validation
// =============================================================================

/**
 * Check if a file is a valid OSCAL SSP document
 */
export function isValidOscalFile(file: File): boolean {
  const validExtensions = ['.json', '.xml', '.oscal'];
  const validTypes = [
    'application/json',
    'application/xml',
    'text/xml',
    'application/oscal+json',
    'application/oscal+xml',
  ];

  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  return validExtensions.includes(ext) || validTypes.includes(file.type);
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
