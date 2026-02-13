/**
 * ForgeComply 360 Reporter - Export Modal Component (Light Theme)
 * Updated with validation status, loading states, and actual export handling
 */
import React, { useState } from 'react';
import { C } from '../config/colors';
import type { ValidationResult } from '../utils/validation';

interface ExportFormat {
  format: string;
  icon: string;
  description: string;
  primary?: boolean;
  enabled: boolean;
}

const EXPORT_FORMATS: ExportFormat[] = [
  { format: 'OSCAL JSON', icon: '{ }', description: 'Primary \u2014 eMASS/CSAM/FedRAMP', primary: true, enabled: true },
  { format: 'OSCAL XML', icon: '< >', description: 'Alternative OSCAL', enabled: false },
  { format: 'OSCAL YAML', icon: '---', description: 'Human-readable', enabled: false },
  { format: 'PDF Report', icon: '\ud83d\udcc4', description: 'Print-ready SSP', enabled: true },
  { format: 'Word (DOCX)', icon: '\ud83d\udcdd', description: 'Editable FISMA/FedRAMP template', enabled: false },
];

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: string) => Promise<void>;
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

  if (!isOpen) return null;

  const handleExport = async (format: string) => {
    setExporting(format);
    setError(null);
    try {
      await onExport(format);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(null);
    }
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
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.bg,
          borderRadius: 14,
          padding: 28,
          width: 420,
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
          Export SSP Package
        </h3>

        {/* Validation Status */}
        {!validation.isValid && (
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

        {validation.isValid && (
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

        {/* Export Formats */}
        {EXPORT_FORMATS.map((o) => (
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

        <button
          onClick={onClose}
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
      </div>
    </div>
  );
};
