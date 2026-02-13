/**
 * NIST OSCAL 1.1.2 System Security Plan (SSP) Types
 * Based on: https://pages.nist.gov/OSCAL/reference/latest/system-security-plan/json-outline/
 */

// =============================================================================
// Root Document
// =============================================================================

export interface OscalSSPDocument {
  'system-security-plan': OscalSystemSecurityPlan;
}

export interface OscalSystemSecurityPlan {
  uuid: string;
  metadata: OscalMetadata;
  'import-profile': OscalImportProfile;
  'system-characteristics': OscalSystemCharacteristics;
  'system-implementation': OscalSystemImplementation;
  'control-implementation': OscalControlImplementation;
  'back-matter'?: OscalBackMatter;
}

// =============================================================================
// Metadata
// =============================================================================

export interface OscalMetadata {
  title: string;
  'last-modified': string;
  version: string;
  'oscal-version': string;
  roles?: OscalRole[];
  parties?: OscalParty[];
  'responsible-parties'?: OscalResponsibleParty[];
  remarks?: string;
}

export interface OscalRole {
  id: string;
  title: string;
  description?: string;
}

export interface OscalParty {
  uuid: string;
  type: 'person' | 'organization';
  name?: string;
  'short-name'?: string;
  'email-addresses'?: string[];
  'telephone-numbers'?: OscalTelephoneNumber[];
  addresses?: OscalAddress[];
  remarks?: string;
}

export interface OscalTelephoneNumber {
  type?: string;
  number: string;
}

export interface OscalAddress {
  type?: string;
  'addr-lines'?: string[];
  city?: string;
  state?: string;
  'postal-code'?: string;
  country?: string;
}

export interface OscalResponsibleParty {
  'role-id': string;
  'party-uuids': string[];
}

// =============================================================================
// Import Profile
// =============================================================================

export interface OscalImportProfile {
  href: string;
  remarks?: string;
}

// =============================================================================
// System Characteristics
// =============================================================================

export interface OscalSystemCharacteristics {
  'system-ids'?: OscalSystemId[];
  'system-name': string;
  'system-name-short'?: string;
  description: string;
  props?: OscalProperty[];
  'security-sensitivity-level'?: string;
  'system-information': OscalSystemInformation;
  'security-impact-level': OscalSecurityImpactLevel;
  status: OscalSystemStatus;
  'authorization-boundary': OscalAuthorizationBoundary;
  'network-architecture'?: OscalNetworkArchitecture;
  'data-flow'?: OscalDataFlow;
  'responsible-parties'?: OscalResponsibleParty[];
  remarks?: string;
}

export interface OscalSystemId {
  'identifier-type'?: string;
  id: string;
}

export interface OscalProperty {
  name: string;
  value: string;
  class?: string;
  remarks?: string;
}

export interface OscalSystemInformation {
  'information-types': OscalInformationType[];
}

export interface OscalInformationType {
  uuid?: string;
  title: string;
  description?: string;
  categorizations?: OscalCategorization[];
  props?: OscalProperty[];
  'confidentiality-impact': OscalImpact;
  'integrity-impact': OscalImpact;
  'availability-impact': OscalImpact;
}

export interface OscalCategorization {
  system: string;
  'information-type-ids'?: string[];
}

export interface OscalImpact {
  base: string;
  selected?: string;
  'adjustment-justification'?: string;
}

export interface OscalSecurityImpactLevel {
  'security-objective-confidentiality': string;
  'security-objective-integrity': string;
  'security-objective-availability': string;
}

export interface OscalSystemStatus {
  state: 'operational' | 'under-development' | 'under-major-modification' | 'disposition' | 'other';
  remarks?: string;
}

export interface OscalAuthorizationBoundary {
  description: string;
  props?: OscalProperty[];
  diagrams?: OscalDiagram[];
  remarks?: string;
}

export interface OscalDiagram {
  uuid: string;
  description?: string;
  caption?: string;
  links?: OscalLink[];
}

export interface OscalLink {
  href: string;
  rel?: string;
  'media-type'?: string;
  text?: string;
}

export interface OscalNetworkArchitecture {
  description: string;
  props?: OscalProperty[];
  diagrams?: OscalDiagram[];
  remarks?: string;
}

export interface OscalDataFlow {
  description: string;
  props?: OscalProperty[];
  diagrams?: OscalDiagram[];
  remarks?: string;
}

// =============================================================================
// System Implementation
// =============================================================================

export interface OscalSystemImplementation {
  props?: OscalProperty[];
  users: OscalUser[];
  components: OscalComponent[];
  'inventory-items'?: OscalInventoryItem[];
  remarks?: string;
}

export interface OscalUser {
  uuid: string;
  title?: string;
  'short-name'?: string;
  description?: string;
  props?: OscalProperty[];
  'role-ids'?: string[];
  'authorized-privileges'?: OscalAuthorizedPrivilege[];
  remarks?: string;
}

export interface OscalAuthorizedPrivilege {
  title: string;
  description?: string;
  'functions-performed': string[];
}

export interface OscalComponent {
  uuid: string;
  type: string;
  title: string;
  description: string;
  purpose?: string;
  props?: OscalProperty[];
  links?: OscalLink[];
  status: OscalComponentStatus;
  'responsible-roles'?: OscalResponsibleRole[];
  protocols?: OscalProtocol[];
  remarks?: string;
}

export interface OscalComponentStatus {
  state: 'operational' | 'under-development' | 'disposition' | 'other';
  remarks?: string;
}

export interface OscalResponsibleRole {
  'role-id': string;
  'party-uuids'?: string[];
  props?: OscalProperty[];
  remarks?: string;
}

export interface OscalProtocol {
  uuid?: string;
  name: string;
  title?: string;
  'port-ranges'?: OscalPortRange[];
}

export interface OscalPortRange {
  start: number;
  end?: number;
  transport: 'TCP' | 'UDP';
}

export interface OscalInventoryItem {
  uuid: string;
  description: string;
  props?: OscalProperty[];
  links?: OscalLink[];
  'responsible-parties'?: OscalResponsibleParty[];
  'implemented-components'?: OscalImplementedComponent[];
  remarks?: string;
}

export interface OscalImplementedComponent {
  'component-uuid': string;
  props?: OscalProperty[];
  links?: OscalLink[];
  'responsible-parties'?: OscalResponsibleParty[];
  remarks?: string;
}

// =============================================================================
// Control Implementation
// =============================================================================

export interface OscalControlImplementation {
  description: string;
  'set-parameters'?: OscalSetParameter[];
  'implemented-requirements': OscalImplementedRequirement[];
}

export interface OscalSetParameter {
  'param-id': string;
  values: string[];
  remarks?: string;
}

export interface OscalImplementedRequirement {
  uuid: string;
  'control-id': string;
  props?: OscalProperty[];
  links?: OscalLink[];
  'set-parameters'?: OscalSetParameter[];
  'responsible-roles'?: OscalResponsibleRole[];
  statements?: OscalStatement[];
  'by-components'?: OscalByComponent[];
  remarks?: string;
}

export interface OscalStatement {
  'statement-id': string;
  uuid: string;
  props?: OscalProperty[];
  links?: OscalLink[];
  'responsible-roles'?: OscalResponsibleRole[];
  'by-components'?: OscalByComponent[];
  remarks?: string;
}

export interface OscalByComponent {
  'component-uuid': string;
  uuid: string;
  description: string;
  props?: OscalProperty[];
  links?: OscalLink[];
  'set-parameters'?: OscalSetParameter[];
  'implementation-status'?: OscalImplementationStatus;
  'responsible-roles'?: OscalResponsibleRole[];
  remarks?: string;
}

export interface OscalImplementationStatus {
  state: 'implemented' | 'partial' | 'planned' | 'alternative' | 'not-applicable';
  remarks?: string;
}

// =============================================================================
// Back Matter
// =============================================================================

export interface OscalBackMatter {
  resources?: OscalResource[];
}

export interface OscalResource {
  uuid: string;
  title?: string;
  description?: string;
  props?: OscalProperty[];
  'document-ids'?: OscalDocumentId[];
  citation?: OscalCitation;
  rlinks?: OscalRlink[];
  'base64'?: OscalBase64;
  remarks?: string;
}

export interface OscalDocumentId {
  scheme?: string;
  identifier: string;
}

export interface OscalCitation {
  text: string;
  props?: OscalProperty[];
  links?: OscalLink[];
}

export interface OscalRlink {
  href: string;
  'media-type'?: string;
  hashes?: OscalHash[];
}

export interface OscalHash {
  algorithm: string;
  value: string;
}

export interface OscalBase64 {
  filename?: string;
  'media-type'?: string;
  value: string;
}
