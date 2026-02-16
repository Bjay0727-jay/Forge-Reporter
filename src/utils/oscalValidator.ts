/**
 * ForgeComply 360 Reporter - OSCAL Schema Validation
 * Validates OSCAL SSP documents against official NIST JSON schemas
 *
 * @see https://github.com/usnistgov/OSCAL
 * @version OSCAL 1.1.2
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// Import NIST OSCAL 1.1.2 SSP Schema
// Downloaded from: https://github.com/usnistgov/OSCAL/releases/tag/v1.1.2
import sspSchema from '../schemas/oscal/oscal_ssp_schema.json';

// =============================================================================
// Types
// =============================================================================

export interface OscalValidationError {
  path: string;
  message: string;
  keyword: string;
  schemaPath: string;
}

export interface OscalValidationWarning {
  path: string;
  message: string;
  severity: 'info' | 'warning';
}

export interface OscalValidationResult {
  valid: boolean;
  errors: OscalValidationError[];
  warnings: OscalValidationWarning[];
  stats: {
    totalChecks: number;
    passedChecks: number;
    errorCount: number;
    warningCount: number;
  };
}

// =============================================================================
// Validator Instance (cached for performance)
// =============================================================================

let cachedValidator: ReturnType<Ajv['compile']> | null = null;

function getValidator(): ReturnType<Ajv['compile']> {
  if (cachedValidator) {
    return cachedValidator;
  }

  const ajv = new Ajv({
    allErrors: true,        // Report all errors, not just the first one
    strict: 'log',          // Log schema quality warnings (full strict breaks the NIST schema)
    validateFormats: true,  // Validate uri, date-time, uuid formats
    verbose: true,          // Include data in errors for debugging
  });

  // Add format validators (uri, date-time, uuid, email, etc.)
  addFormats(ajv);

  // Compile the NIST OSCAL SSP schema
  cachedValidator = ajv.compile(sspSchema);

  return cachedValidator;
}

// =============================================================================
// Main Validation Function
// =============================================================================

/**
 * Validates an OSCAL SSP document against the official NIST 1.1.2 schema
 *
 * @param document - The OSCAL SSP document to validate
 * @returns Validation result with errors, warnings, and statistics
 */
export function validateOscalSSP(document: unknown): OscalValidationResult {
  const validate = getValidator();
  const valid = validate(document);

  // Parse schema validation errors
  const errors: OscalValidationError[] = (validate.errors || []).map(err => ({
    path: err.instancePath || '/',
    message: err.message || 'Unknown validation error',
    keyword: err.keyword,
    schemaPath: err.schemaPath,
  }));

  // Check for common issues that may not be schema violations but are best practices
  const warnings = checkBestPractices(document);

  // Calculate statistics
  const stats = {
    totalChecks: errors.length + warnings.length + 1, // +1 for base validation
    passedChecks: valid ? 1 : 0,
    errorCount: errors.length,
    warningCount: warnings.length,
  };

  return {
    valid: !!valid,
    errors,
    warnings,
    stats,
  };
}

// =============================================================================
// Best Practice Checks
// =============================================================================

/**
 * Checks for common issues that aren't schema violations but may indicate problems
 */
function checkBestPractices(document: unknown): OscalValidationWarning[] {
  const warnings: OscalValidationWarning[] = [];

  // Type guard for document structure
  if (!document || typeof document !== 'object') {
    return warnings;
  }

  const doc = document as Record<string, unknown>;
  const ssp = doc['system-security-plan'] as Record<string, unknown> | undefined;

  if (!ssp) {
    warnings.push({
      path: '/',
      message: 'Missing system-security-plan root element',
      severity: 'warning',
    });
    return warnings;
  }

  // Check metadata
  const metadata = ssp.metadata as Record<string, unknown> | undefined;
  if (metadata) {
    if (!metadata['last-modified']) {
      warnings.push({
        path: '/system-security-plan/metadata',
        message: 'Missing last-modified timestamp in metadata',
        severity: 'info',
      });
    }

    if (!metadata.version) {
      warnings.push({
        path: '/system-security-plan/metadata',
        message: 'No version specified for the document',
        severity: 'info',
      });
    }

    const parties = metadata.parties as unknown[];
    if (!parties || parties.length === 0) {
      warnings.push({
        path: '/system-security-plan/metadata/parties',
        message: 'No responsible parties defined - consider adding system owner and AO',
        severity: 'warning',
      });
    }
  }

  // Check system characteristics
  const sysChars = ssp['system-characteristics'] as Record<string, unknown> | undefined;
  if (sysChars) {
    const systemIds = sysChars['system-ids'] as unknown[];
    if (!systemIds || systemIds.length === 0) {
      warnings.push({
        path: '/system-security-plan/system-characteristics/system-ids',
        message: 'No system identifiers defined - required for FedRAMP/FISMA',
        severity: 'warning',
      });
    }

    if (!sysChars['authorization-boundary']) {
      warnings.push({
        path: '/system-security-plan/system-characteristics',
        message: 'Authorization boundary not defined',
        severity: 'warning',
      });
    }
  }

  // Check control implementation
  const ctrlImpl = ssp['control-implementation'] as Record<string, unknown> | undefined;
  if (ctrlImpl) {
    const implReqs = ctrlImpl['implemented-requirements'] as unknown[];
    if (!implReqs || implReqs.length === 0) {
      warnings.push({
        path: '/system-security-plan/control-implementation',
        message: 'No control implementations documented',
        severity: 'warning',
      });
    } else if (implReqs.length < 10) {
      warnings.push({
        path: '/system-security-plan/control-implementation',
        message: `Only ${implReqs.length} controls implemented - consider documenting more`,
        severity: 'info',
      });
    }
  }

  // Check for import-profile
  if (!ssp['import-profile']) {
    warnings.push({
      path: '/system-security-plan',
      message: 'No control baseline profile imported',
      severity: 'warning',
    });
  }

  return warnings;
}

// =============================================================================
// Formatting Utilities
// =============================================================================

/**
 * Formats validation errors for display in UI
 */
export function formatValidationErrors(result: OscalValidationResult): string[] {
  return result.errors.map(err => {
    // Make the path more readable
    const readablePath = err.path
      .replace(/\/system-security-plan/g, 'SSP')
      .replace(/\/metadata/g, ' > Metadata')
      .replace(/\/system-characteristics/g, ' > System Characteristics')
      .replace(/\/control-implementation/g, ' > Control Implementation')
      .replace(/\/system-implementation/g, ' > System Implementation')
      .replace(/\//g, ' > ')
      .replace(/^\s*>\s*/, '')
      .trim() || 'Root';

    return `${readablePath}: ${err.message}`;
  });
}

/**
 * Formats validation warnings for display in UI
 */
export function formatValidationWarnings(result: OscalValidationResult): string[] {
  return result.warnings.map(warn => {
    const readablePath = warn.path
      .replace(/\/system-security-plan/g, 'SSP')
      .replace(/\//g, ' > ')
      .replace(/^\s*>\s*/, '')
      .trim() || 'General';

    const prefix = warn.severity === 'warning' ? '⚠️' : 'ℹ️';
    return `${prefix} ${readablePath}: ${warn.message}`;
  });
}

/**
 * Returns a summary string for the validation result
 */
export function getValidationSummary(result: OscalValidationResult): string {
  if (result.valid && result.warnings.length === 0) {
    return '✅ OSCAL document is valid and follows best practices';
  }

  if (result.valid && result.warnings.length > 0) {
    return `✅ OSCAL document is valid with ${result.warnings.length} suggestion(s)`;
  }

  return `❌ OSCAL validation failed with ${result.errors.length} error(s)`;
}
