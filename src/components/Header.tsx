/**
 * ForgeComply 360 Reporter - Header Component (Light Theme)
 */
import { C } from '../config/colors';
import type { Section } from '../config/sections';
import type { SyncStatus } from '../hooks/useSync';
import { getSyncStatusDisplay } from '../hooks/useSync';

interface HeaderProps {
  currentSection: Section | undefined;
  saving: boolean;
  lastSaved: Date | null;
  onExport: () => void;
  onImport: () => void;
  onValidate: () => void;
  onClearData?: () => void;
  // Sync props
  syncStatus?: SyncStatus;
  sspTitle?: string | null;
  onSync?: () => void;
  onDisconnect?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  saving,
  lastSaved,
  onExport,
  onImport,
  onValidate,
  onClearData,
  syncStatus,
  sspTitle,
  onSync,
  onDisconnect,
}) => {
  const syncDisplay = syncStatus ? getSyncStatusDisplay(syncStatus) : null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 28px',
      borderBottom: `1px solid ${C.border}`,
      background: C.bg,
      flexShrink: 0,
    }}>
      {/* Breadcrumb */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{ fontSize: 10.5, color: C.textMuted }}>ForgeComply 360</span>
        <span style={{ color: C.borderDark }}>›</span>
        <span style={{ fontSize: 10.5, color: C.textSecondary, fontWeight: 600 }}>FISMA SSP</span>
        {sspTitle && (
          <>
            <span style={{ color: C.borderDark }}>›</span>
            <span style={{
              fontSize: 10.5,
              color: C.primary,
              fontWeight: 600,
              maxWidth: 180,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {sspTitle}
            </span>
          </>
        )}
        <span style={{ color: C.borderDark }}>›</span>
        <span style={{ fontSize: 10.5, color: C.primary, fontWeight: 600 }}>
          {currentSection?.label}
        </span>
        <span style={{
          fontSize: 8.5,
          color: C.textMuted,
          fontFamily: "'Fira Code', monospace",
          background: C.surfaceAlt,
          padding: '2px 5px',
          borderRadius: 3,
        }}>
          {currentSection?.ref}
        </span>
        <span style={{
          fontSize: 8.5,
          color: C.textSecondary,
          fontFamily: "'Fira Code', monospace",
          background: C.surfaceAlt,
          padding: '2px 5px',
          borderRadius: 3,
        }}>
          RMF: {currentSection?.rmf}
        </span>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        {/* Sync Status Indicator */}
        {syncDisplay && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: `${syncDisplay.color}15`,
            borderRadius: 6,
            border: `1px solid ${syncDisplay.color}30`,
          }}>
            <span style={{ fontSize: 12 }}>{syncDisplay.icon}</span>
            <span style={{
              fontSize: 10.5,
              color: syncDisplay.color,
              fontWeight: 600,
            }}>
              {syncDisplay.label}
            </span>
            {/* Sync button for dirty/error states */}
            {(syncStatus === 'dirty' || syncStatus === 'error') && onSync && (
              <button
                onClick={onSync}
                style={{
                  padding: '2px 6px',
                  background: syncDisplay.color,
                  border: 'none',
                  borderRadius: 4,
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginLeft: 4,
                }}
              >
                Sync
              </button>
            )}
            {/* Disconnect button when connected */}
            {syncStatus !== 'offline' && onDisconnect && (
              <button
                onClick={onDisconnect}
                style={{
                  padding: '2px 6px',
                  background: 'none',
                  border: 'none',
                  color: C.textMuted,
                  fontSize: 9,
                  cursor: 'pointer',
                  marginLeft: 2,
                }}
                title="Disconnect and work offline"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Save Status (local) */}
        {saving ? (
          <span style={{
            fontSize: 10.5,
            color: C.warning,
            animation: 'pulse 1s infinite',
          }}>
            ● Saving…
          </span>
        ) : lastSaved ? (
          <span style={{ fontSize: 10.5, color: C.success }}>
            ✓ {lastSaved.toLocaleTimeString()}
          </span>
        ) : null}

        {/* Clear Data Button */}
        {onClearData && (
          <button
            onClick={onClearData}
            style={{
              padding: '5px 10px',
              background: 'none',
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              color: C.textMuted,
              fontSize: 11,
              cursor: 'pointer',
            }}
            title="Clear all SSP data"
          >
            🗑️ Clear
          </button>
        )}

        {/* Import Button */}
        <button
          onClick={onImport}
          style={{
            padding: '5px 12px',
            background: 'none',
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            color: C.textSecondary,
            fontSize: 11.5,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          title="Import OSCAL SSP"
        >
          📤 Import
        </button>

        {/* Export Button */}
        <button
          onClick={onExport}
          style={{
            padding: '5px 12px',
            background: 'none',
            border: `1px solid ${C.primary}40`,
            borderRadius: 6,
            color: C.primary,
            fontSize: 11.5,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          📥 Export
        </button>

        {/* Validate Button */}
        <button
          onClick={onValidate}
          style={{
            padding: '5px 12px',
            background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            fontSize: 11.5,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          🔍 Validate
        </button>
      </div>
    </div>
  );
};
