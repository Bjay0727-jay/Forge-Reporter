/**
 * ForgeComply 360 Reporter - Validation Utility
 * Defines required fields and validation rules for SSP data
 */

import type { SSPData } from '../types';

// Required fields per section
export const REQUIRED_FIELDS: Record<string, { field: keyof SSPData; label: string }[]> = {
  system_info: [
    { field: 'sysName', label: 'System Name' },
    { field: 'sysAcronym', label: 'System Acronym' },
    { field: 'owningAgency', label: 'Owning Agency' },
    { field: 'sysDesc', label: 'System Description' },
    { field: 'authType', label: 'Authorization Type' },
  ],
  fips_199: [
    { field: 'conf', label: 'Confidentiality Level' },
    { field: 'integ', label: 'Integrity Level' },
    { field: 'avail', label: 'Availability Level' },
  ],
  control_baseline: [
    { field: 'ctrlBaseline', label: 'Control Baseline' },
  ],
  rmf_lifecycle: [
    { field: 'rmfCurrentStep', label: 'Current RMF Step' },
  ],
  authorization_boundary: [
    { field: 'bndNarr', label: 'Boundary Narrative' },
  ],
  data_flow: [
    { field: 'dfNarr', label: 'Data Flow Narrative' },
  ],
  network_architecture: [
    { field: 'netNarr', label: 'Network Narrative' },
  ],
  personnel: [
    { field: 'soName', label: 'System Owner Name' },
    { field: 'aoName', label: 'Authorizing Official Name' },
    { field: 'issoName', label: 'ISSO Name' },
  ],
  digital_identity: [
    { field: 'ial', label: 'Identity Assurance Level (IAL)' },
    { field: 'aal', label: 'Authenticator Assurance Level (AAL)' },
  ],
  contingency_plan: [
    { field: 'rto', label: 'Recovery Time Objective (RTO)' },
    { field: 'rpo', label: 'Recovery Point Objective (RPO)' },
  ],
  incident_response: [
    { field: 'irPurpose', label: 'IR Plan Purpose' },
  ],
  continuous_monitoring: [
    { field: 'iscmType', label: 'ISCM Strategy Type' },
  ],
};

// Field labels for error messages
export const FIELD_LABELS: Partial<Record<keyof SSPData, string>> = {
  sysName: 'System Name',
  sysAcronym: 'System Acronym',
  owningAgency: 'Owning Agency',
  sysDesc: 'System Description',
  authType: 'Authorization Type',
  conf: 'Confidentiality',
  integ: 'Integrity',
  avail: 'Availability',
  ctrlBaseline: 'Control Baseline',
  rmfCurrentStep: 'Current RMF Step',
  bndNarr: 'Boundary Narrative',
  dfNarr: 'Data Flow Narrative',
  netNarr: 'Network Narrative',
  soName: 'System Owner Name',
  aoName: 'Authorizing Official Name',
  issoName: 'ISSO Name',
  ial: 'IAL',
  aal: 'AAL',
  rto: 'RTO',
  rpo: 'RPO',
  irPurpose: 'IR Purpose',
  iscmType: 'ISCM Type',
};

export interface ValidationError {
  field: string;
  message: string;
  section: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  errorCount: number;
  sectionErrors: Record<string, number>;
}

// =============================================================================
// Field-level validation rules
// =============================================================================

const VALID_IMPACT_LEVELS = ['Low', 'Moderate', 'High'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Fields that must contain a valid email address */
const EMAIL_FIELDS: ReadonlySet<keyof SSPData> = new Set([
  'soEmail', 'aoEmail', 'issoEmail', 'issmEmail', 'scaEmail', 'poEmail',
]);

/** Fields constrained to FIPS 199 impact levels */
const IMPACT_LEVEL_FIELDS: ReadonlySet<keyof SSPData> = new Set([
  'conf', 'integ', 'avail',
]);

/** Maximum character length for narrative fields */
const MAX_NARRATIVE_LENGTH = 50_000;

const NARRATIVE_FIELDS: ReadonlySet<keyof SSPData> = new Set([
  'sysDesc', 'catJust', 'baseJust', 'bndNarr', 'dfNarr', 'netNarr',
  'cryptoNarr', 'idNarr', 'scrmPlan', 'cpPurpose', 'cpScope',
  'irPurpose', 'irScope', 'cmPurpose', 'cmChangeNarr', 'iscmNarrative',
]);

/**
 * Validates SSP data against required fields, format rules, and cross-field constraints
 */
export function validateSSP(data: SSPData): ValidationResult {
  const errors: ValidationError[] = [];
  const sectionErrors: Record<string, number> = {};

  // --- Pass 1: Required field checks ---
  for (const [section, fields] of Object.entries(REQUIRED_FIELDS)) {
    let sectionErrorCount = 0;

    for (const { field, label } of fields) {
      const value = data[field];

      // Check if field is empty
      if (value === undefined || value === null || value === '') {
        errors.push({
          field: field as string,
          message: `${label} is required`,
          section,
        });
        sectionErrorCount++;
      }
    }

    if (sectionErrorCount > 0) {
      sectionErrors[section] = sectionErrorCount;
    }
  }

  // --- Pass 2: Format validation (only on populated fields) ---

  // Email format
  for (const field of EMAIL_FIELDS) {
    const value = data[field];
    if (typeof value === 'string' && value.trim().length > 0 && !EMAIL_REGEX.test(value)) {
      const label = FIELD_LABELS[field] || field;
      const section = sectionForField(field);
      errors.push({ field: field as string, message: `${label} must be a valid email address`, section });
      sectionErrors[section] = (sectionErrors[section] || 0) + 1;
    }
  }

  // Impact level enum (case-insensitive — user input may vary)
  const validImpactLower = VALID_IMPACT_LEVELS.map((l) => l.toLowerCase());
  for (const field of IMPACT_LEVEL_FIELDS) {
    const value = data[field];
    if (typeof value === 'string' && value.trim().length > 0 && !validImpactLower.includes(value.toLowerCase())) {
      const label = FIELD_LABELS[field] || field;
      errors.push({
        field: field as string,
        message: `${label} must be one of: ${VALID_IMPACT_LEVELS.join(', ')}`,
        section: 'fips_199',
      });
      sectionErrors['fips_199'] = (sectionErrors['fips_199'] || 0) + 1;
    }
  }

  // Narrative length limits
  for (const field of NARRATIVE_FIELDS) {
    const value = data[field];
    if (typeof value === 'string' && value.length > MAX_NARRATIVE_LENGTH) {
      const label = FIELD_LABELS[field] || field;
      const section = sectionForField(field);
      errors.push({
        field: field as string,
        message: `${label} exceeds maximum length of ${MAX_NARRATIVE_LENGTH.toLocaleString()} characters`,
        section,
      });
      sectionErrors[section] = (sectionErrors[section] || 0) + 1;
    }
  }

  // --- Pass 3: Cross-field rules ---

  // If PII is collected, PIA required status must be specified
  if (data.ptaCollectsPii === 'Yes' && !data.ptaPiaRequired) {
    errors.push({
      field: 'ptaPiaRequired',
      message: 'PIA Required status must be specified when system collects PII',
      section: 'privacy',
    });
    sectionErrors['privacy'] = (sectionErrors['privacy'] || 0) + 1;
  }

  // RTO and RPO should be numeric-like if provided
  for (const field of ['rto', 'rpo'] as const) {
    const value = data[field];
    if (typeof value === 'string' && value.trim().length > 0 && !/\d/.test(value)) {
      const label = FIELD_LABELS[field] || field;
      errors.push({
        field,
        message: `${label} should include a numeric value (e.g., "4 hours")`,
        section: 'contingency_plan',
      });
      sectionErrors['contingency_plan'] = (sectionErrors['contingency_plan'] || 0) + 1;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    errorCount: errors.length,
    sectionErrors,
  };
}

/** Map a field name to its containing validation section */
function sectionForField(field: keyof SSPData): string {
  for (const [section, fields] of Object.entries(REQUIRED_FIELDS)) {
    if (fields.some((f) => f.field === field)) return section;
  }
  // Infer from field prefix for non-required fields
  if (field.startsWith('so') || field.startsWith('ao') || field.startsWith('isso') || field.startsWith('issm') || field.startsWith('sca') || field.startsWith('po')) return 'personnel';
  if (field.startsWith('pta') || field.startsWith('pia') || field.startsWith('sorn')) return 'privacy';
  if (field.startsWith('cp') || field === 'rto' || field === 'rpo') return 'contingency_plan';
  if (field.startsWith('ir')) return 'incident_response';
  if (field.startsWith('cm')) return 'configuration_management';
  if (field.startsWith('iscm')) return 'continuous_monitoring';
  return 'system_info';
}

/**
 * Get errors for a specific section
 */
export function getSectionErrors(
  validation: ValidationResult,
  section: string
): ValidationError[] {
  return validation.errors.filter((e) => e.section === section);
}

/**
 * Check if a specific field has an error
 */
export function hasFieldError(
  validation: ValidationResult,
  field: string
): boolean {
  return validation.errors.some((e) => e.field === field);
}

/**
 * Get error message for a specific field
 */
export function getFieldError(
  validation: ValidationResult,
  field: string
): string | undefined {
  const error = validation.errors.find((e) => e.field === field);
  return error?.message;
}

/**
 * Format validation summary for display
 */
export function formatValidationSummary(validation: ValidationResult): string {
  if (validation.isValid) {
    return 'All required fields are complete.';
  }

  const sectionCount = Object.keys(validation.sectionErrors).length;
  return `${validation.errorCount} required field${validation.errorCount > 1 ? 's' : ''} missing across ${sectionCount} section${sectionCount > 1 ? 's' : ''}.`;
}
