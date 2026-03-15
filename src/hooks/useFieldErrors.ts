/**
 * Hook for extracting inline field-level validation errors from a ValidationResult.
 * Used by section components to show errors on individual form fields.
 */
import { useMemo } from 'react';
import type { ValidationResult } from '../utils/validation';

export interface FieldErrors {
  /** Get error message for a field (undefined if valid) */
  get: (field: string) => string | undefined;
  /** Check if a field has an error */
  has: (field: string) => boolean;
  /** Total error count for a given section */
  count: number;
}

/**
 * Extracts field errors from a ValidationResult for a specific validation section.
 * Returns a lightweight accessor for wiring into FF `error` props.
 *
 * @param validation - The full ValidationResult (optional; undefined = no errors)
 * @param section - The validation section key (e.g., 'system_info', 'fips_199')
 */
export function useFieldErrors(
  validation: ValidationResult | undefined,
  section: string,
): FieldErrors {
  return useMemo(() => {
    if (!validation || validation.isValid) {
      return { get: () => undefined, has: () => false, count: 0 };
    }
    const sectionErrors = validation.errors.filter((e) => e.section === section);
    const errorMap = new Map(sectionErrors.map((e) => [e.field, e.message]));
    return {
      get: (field: string) => errorMap.get(field),
      has: (field: string) => errorMap.has(field),
      count: sectionErrors.length,
    };
  }, [validation, section]);
}
