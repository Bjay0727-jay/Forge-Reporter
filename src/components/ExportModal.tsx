/**
 * ForgeComply 360 Reporter - Export Modal Component (Light Theme)
 * Updated with OSCAL schema validation, loading states, and actual export handling
 */
import React, { useState } from 'react';
import { C } from '../config/colors';
import type { ValidationResult } from '../utils/validation';
import type { ValidatedOscalExportResult } from '../utils/oscalExport';

interface ExportFormat {
  format: string;
  icon: string;
  description: string;
  primary?: boolean;
  enabled: boolean;
}

const EXPORT_FORMATS: ExportFormat[] = [
  { format: 'OSCAL JSON', icon: '{ }', description: 'Primary — eMASS/CSAM/FedRAMP (NIST validated)', primary: true, enabled: true },
  { format: 'OSCAL XML', icon: '< >', description: 'Alternative OSCAL format (NIST validated)', enabled: true },
  { format: 'OSCAL YAML', icon: '---', description: 'Human-readable', enabled: false },
  { format: 'PDF Report', icon: '📄', description: 'Print-ready SSP', enabled: true },
  { format: 'Word (DOCX)', icon: '📝', description: 'Editable FISMA/FedRAMP template', enabled: false },
];

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: string) => Promise<ValidatedOscalExportResult | void>;
  validation: ValidationResult;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  validation,
}) => {
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [oscalValidation, setOscalValidation] = useState<ValidatedOscalExportResult | null>(null);
  const [lastExportFormat, setLastExportFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async (format: string) => {
    setExporting(format);
    setError(null);
    setOscalValidation(null);
    setLastExportFormat(format);

    try {
      const result = await onExport(format);

      // Handle OSCAL validation results
      if (result && 'validation' in result) {
        setOscalValidation(result);

        if (!result.success) {
          // Show validation errors but don't close modal
          setExporting(null);
          return;
        }
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  // Handle "Export Anyway" for invalid OSCAL
  const handleExportAnyway = async () => {
    if (oscalValidation && lastExportFormat) {
      // Determine which format to force export
      const forceFormat = lastExportFormat.includes('XML') ? 'OSCAL XML (force)' : 'OSCAL JSON (force)';
      setExporting(lastExportFormat);
      try {
        await onExport(forceFormat);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed');
      } finally {
        setExporting(null);
      }
    }
  };

  // Reset state when closing
  const handleClose = () => {
    setOscalValidation(null);
    setError(null);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.bg,
          borderRadius: 14,
          padding: 28,
          width: oscalValidation && !oscalValidation.success ? 520 : 420,
          maxHeight: '85vh',
          overflow: 'auto',
          border: `1px solid ${C.border}`,
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.15)',
        }}
      >
        <h3 style={{
          margin: '0 0 8px',
          fontSize: 17,
          fontWeight: 700,
          color: C.text,
        }}>
          {oscalValidation && !oscalValidation.success ? 'OSCAL Validation Failed' : 'Export SSP Package'}
        </h3>

        {/* OSCAL Schema Validation Results */}
        {oscalValidation && !oscalValidation.success && (
          <div style={{
            background: `${C.error}08`,
            border: `1px solid ${C.error}30`,
            borderRadius: 10,
            padding: 16,
            marginBottom: 16,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 12,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.error} strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.error }}>
                  NIST OSCAL 1.1.2 Schema Validation Failed
                </div>
                <div style={{ fontSize: 11, color: C.textMuted }}>
                  {oscalValidation.validation.stats.errorCount} error(s), {oscalValidation.validation.stats.warningCount} warning(s)
                </div>
              </div>
            </div>

            {/* Validation Errors */}
            <div style={{
              background: C.bg,
              borderRadius: 8,
              padding: 12,
              maxHeight: 200,
              overflow: 'auto',
              fontSize: 11,
              fontFamily: "'Fira Code', monospace",
            }}>
              {oscalValidation.formattedErrors.slice(0, 10).map((err, i) => (
                <div key={i} style={{
                  padding: '6px 0',
                  borderBottom: i < oscalValidation.formattedErrors.length - 1 ? `1px solid ${C.border}` : 'none',
                  color: C.error,
                }}>
                  {err}
                </div>
              ))}
              {oscalValidation.formattedErrors.length > 10 && (
                <div style={{ padding: '8px 0', color: C.textMuted, fontStyle: 'italic' }}>
                  ... and {oscalValidation.formattedErrors.length - 10} more errors
                </div>
              )}
            </div>

            {/* Warnings */}
            {oscalValidation.formattedWarnings.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.warning, marginBottom: 6 }}>
                  Warnings:
                </div>
                <div style={{
                  background: C.bg,
                  borderRadius: 6,
                  padding: 8,
                  fontSize: 10,
                }}>
                  {oscalValidation.formattedWarnings.slice(0, 5).map((warn, i) => (
                    <div key={i} style={{ padding: '4px 0', color: C.textMuted }}>
                      {warn}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: 10,
              marginTop: 16,
            }}>
              <button
                onClick={handleExportAnyway}
                disabled={exporting !== null}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: `${C.warning}15`,
                  border: `1px solid ${C.warning}40`,
                  borderRadius: 8,
                  color: C.warning,
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: exporting ? 'not-allowed' : 'pointer',
                }}
              >
                {exporting ? 'Exporting...' : '⚠️ Export Anyway (Not Recommended)'}
              </button>
              <button
                onClick={handleClose}
                style={{
                  padding: '10px 16px',
                  background: C.primary,
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Fix Errors
              </button>
            </div>

            <div style={{
              marginTop: 12,
              fontSize: 10,
              color: C.textMuted,
              textAlign: 'center',
            }}>
              Invalid OSCAL may be rejected by eMASS, CSAM, or FedRAMP systems
            </div>
          </div>
        )}

        {/* OSCAL Validation Success */}
        {oscalValidation && oscalValidation.success && (
          <div style={{
            background: `${C.success}10`,
            border: `1px solid ${C.success}30`,
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.success }}>
              ✓ OSCAL document validated against NIST 1.1.2 schema
            </span>
          </div>
        )}

        {/* Form Validation Status (only show if not showing OSCAL errors) */}
        {!oscalValidation && !validation.isValid && (
          <div style={{
            background: `${C.error}10`,
            border: `1px solid ${C.error}30`,
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.error} strokeWidth="2" style={{ marginTop: 2, flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.error }}>
                {validation.errorCount} required field{validation.errorCount > 1 ? 's' : ''} missing
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                Export will proceed, but the SSP may be incomplete.
              </div>
            </div>
          </div>
        )}

        {!oscalValidation && validation.isValid && (
          <div style={{
            background: `${C.success}10`,
            border: `1px solid ${C.success}30`,
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.success }}>
              All required fields are complete
            </span>
          </div>
        )}

        {/* Export Error */}
        {error && (
          <div style={{
            background: `${C.error}10`,
            border: `1px solid ${C.error}30`,
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
            fontSize: 12,
            color: C.error,
          }}>
            {error}
          </div>
        )}

        {/* Export Formats - only show if not displaying OSCAL validation errors */}
        {(!oscalValidation || oscalValidation.success) && EXPORT_FORMATS.map((o) => (
          <button
            key={o.format}
            onClick={() => o.enabled && handleExport(o.format)}
            disabled={!o.enabled || exporting !== null}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '11px 14px',
              marginBottom: 6,
              borderRadius: 9,
              background: o.primary && o.enabled ? `${C.primary}10` : 'transparent',
              border: `1px solid ${o.primary && o.enabled ? `${C.primary}40` : C.border}`,
              cursor: o.enabled ? 'pointer' : 'not-allowed',
              textAlign: 'left',
              color: o.enabled ? C.text : C.textMuted,
              transition: 'all 0.15s',
              opacity: o.enabled ? 1 : 0.6,
            }}
          >
            <span style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              background: C.surface,
              color: o.enabled ? C.primary : C.textMuted,
              fontFamily: "'Fira Code', monospace",
              fontWeight: 600,
              flexShrink: 0,
            }}>
              {exporting === o.format ? (
                <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
              ) : (
                o.icon
              )}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: o.enabled ? C.text : C.textMuted,
              }}>
                {o.format}
                {!o.enabled && <span style={{ fontWeight: 400, marginLeft: 6 }}>(Coming Soon)</span>}
              </div>
              <div style={{
                fontSize: 10.5,
                color: C.textMuted,
              }}>
                {exporting === o.format ? 'Generating...' : o.description}
              </div>
            </div>
            {o.primary && o.enabled && (
              <span style={{
                fontSize: 8.5,
                color: C.primary,
                fontWeight: 700,
              }}>
                REC
              </span>
            )}
          </button>
        ))}

        {/* Only show export formats if not showing OSCAL validation errors */}
        {(!oscalValidation || oscalValidation.success) && (
          <button
            onClick={handleClose}
            disabled={exporting !== null}
            style={{
              width: '100%',
              padding: 8,
              marginTop: 6,
              background: 'none',
              border: `1px solid ${C.border}`,
              borderRadius: 7,
              color: C.textSecondary,
              cursor: exporting ? 'not-allowed' : 'pointer',
              fontSize: 11.5,
              opacity: exporting ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};
