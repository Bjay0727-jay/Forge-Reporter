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

/**
 * Validates SSP data against required fields
 */
export function validateSSP(data: SSPData): ValidationResult {
  const errors: ValidationError[] = [];
  const sectionErrors: Record<string, number> = {};

  // Check each section's required fields
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

  return {
    isValid: errors.length === 0,
    errors,
    errorCount: errors.length,
    sectionErrors,
  };
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
