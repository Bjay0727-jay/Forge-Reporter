/**
 * ForgeComply 360 Reporter - Import Modal Component
 * Supports drag & drop import of OSCAL SSP files (JSON/XML)
 */
import React, { useState, useRef, useCallback } from 'react';
import { C } from '../config/colors';
import {
  importOscalSSP,
  isValidOscalFile,
  type OscalImportResult,
} from '../utils/oscalImport';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (result: OscalImportResult) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OscalImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  }, []);

  const processFile = async (file: File) => {
    setError(null);
    setResult(null);

    // Validate file type
    if (!isValidOscalFile(file)) {
      setError('Invalid file type. Please upload an OSCAL SSP file (.json or .xml)');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }

    setImporting(true);

    try {
      const importResult = await importOscalSSP(file);
      setResult(importResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import file');
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = () => {
    if (result) {
      onImport(result);
      handleClose();
    }
  };

  const handleClose = () => {
    setError(null);
    setResult(null);
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

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
          width: result ? 520 : 440,
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
          {result ? 'Import Preview' : 'Import OSCAL SSP'}
        </h3>

        <p style={{
          margin: '0 0 20px',
          fontSize: 12,
          color: C.textMuted,
        }}>
          {result
            ? 'Review the imported data before applying'
            : 'Import an existing System Security Plan from another tool'}
        </p>

        {/* Error Display */}
        {error && (
          <div style={{
            background: `${C.error}10`,
            border: `1px solid ${C.error}30`,
            borderRadius: 8,
            padding: '12px 14px',
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
            <div style={{ fontSize: 12, color: C.error }}>
              {error}
            </div>
          </div>
        )}

        {/* Import Result Preview */}
        {result && (
          <div style={{ marginBottom: 20 }}>
            {/* Document Info */}
            <div style={{
              background: C.surface,
              borderRadius: 10,
              padding: 16,
              marginBottom: 12,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 8 }}>
                {result.documentInfo.title}
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 11, color: C.textMuted }}>
                  <span style={{ fontWeight: 600 }}>Version:</span> {result.documentInfo.version}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted }}>
                  <span style={{ fontWeight: 600 }}>OSCAL:</span> {result.documentInfo.oscalVersion}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted }}>
                  <span style={{ fontWeight: 600 }}>Format:</span> {result.sourceFormat.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Validation Status */}
            {result.validation.valid ? (
              <div style={{
                background: `${C.success}10`,
                border: `1px solid ${C.success}30`,
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.success }}>
                  Valid OSCAL 1.1.2 document
                </span>
              </div>
            ) : (
              <div style={{
                background: `${C.warning}10`,
                border: `1px solid ${C.warning}30`,
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.warning }}>
                    ⚠️ {result.validation.errors.length} validation issue(s)
                  </span>
                </div>
                <div style={{ fontSize: 11, color: C.textMuted }}>
                  Document can still be imported, but may have missing or invalid data.
                </div>
              </div>
            )}

            {/* Import Warnings */}
            {result.warnings.length > 0 && (
              <div style={{
                background: C.surface,
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 8 }}>
                  Import Notes:
                </div>
                {result.warnings.map((warn, i) => (
                  <div key={i} style={{ fontSize: 11, color: C.textMuted, padding: '3px 0' }}>
                    • {warn}
                  </div>
                ))}
              </div>
            )}

            {/* Data Summary */}
            {result.data && (
              <div style={{
                background: C.surface,
                borderRadius: 8,
                padding: 12,
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 8 }}>
                  Data to Import:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {result.data.sysName && (
                    <div style={{ fontSize: 11, color: C.text }}>
                      <span style={{ color: C.textMuted }}>System:</span> {result.data.sysName}
                    </div>
                  )}
                  {result.data.conf && (
                    <div style={{ fontSize: 11, color: C.text }}>
                      <span style={{ color: C.textMuted }}>Impact:</span> {result.data.conf}/{result.data.integ}/{result.data.avail}
                    </div>
                  )}
                  {result.data.infoTypes && (
                    <div style={{ fontSize: 11, color: C.text }}>
                      <span style={{ color: C.textMuted }}>Info Types:</span> {result.data.infoTypes.length}
                    </div>
                  )}
                  {result.data.ctrlData && (
                    <div style={{ fontSize: 11, color: C.text }}>
                      <span style={{ color: C.textMuted }}>Controls:</span> {Object.keys(result.data.ctrlData).length}
                    </div>
                  )}
                  {result.data.bndComps && (
                    <div style={{ fontSize: 11, color: C.text }}>
                      <span style={{ color: C.textMuted }}>Components:</span> {result.data.bndComps.length}
                    </div>
                  )}
                  {result.data.sepDutyMatrix && (
                    <div style={{ fontSize: 11, color: C.text }}>
                      <span style={{ color: C.textMuted }}>Roles:</span> {result.data.sepDutyMatrix.length}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Drop Zone (only show when no result) */}
        {!result && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? C.primary : C.border}`,
              borderRadius: 12,
              padding: 40,
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragging ? `${C.primary}08` : 'transparent',
              transition: 'all 0.2s',
              marginBottom: 16,
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.xml,.oscal,application/json,application/xml"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {importing ? (
              <div>
                <div style={{ fontSize: 32, marginBottom: 12, animation: 'spin 1s linear infinite' }}>
                  ⟳
                </div>
                <div style={{ fontSize: 13, color: C.textMuted }}>
                  Processing file...
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>
                  📥
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                  Drop OSCAL SSP file here
                </div>
                <div style={{ fontSize: 11, color: C.textMuted }}>
                  or click to browse • JSON or XML format
                </div>
              </>
            )}
          </div>
        )}

        {/* Supported Formats */}
        {!result && (
          <div style={{
            background: C.surface,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 8 }}>
              Supported Formats:
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ fontSize: 11, color: C.text }}>
                <span style={{ fontFamily: "'Fira Code', monospace" }}>{'{ }'}</span> OSCAL JSON
              </div>
              <div style={{ fontSize: 11, color: C.text }}>
                <span style={{ fontFamily: "'Fira Code', monospace" }}>{'< >'}</span> OSCAL XML
              </div>
            </div>
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 8 }}>
              Import from eMASS, CSAM, RegScale, Telos Xacta, and other OSCAL-compliant tools
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {result ? (
            <>
              <button
                onClick={handleClose}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: 'transparent',
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: C.textSecondary,
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                style={{
                  flex: 1,
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
                Import SSP Data
              </button>
            </>
          ) : (
            <button
              onClick={handleClose}
              disabled={importing}
              style={{
                width: '100%',
                padding: 10,
                background: 'transparent',
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.textSecondary,
                fontWeight: 600,
                fontSize: 12,
                cursor: importing ? 'not-allowed' : 'pointer',
                opacity: importing ? 0.6 : 1,
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
