/**
 * Forge Cyber Defense - ForgeReporter Header
 * Clean, professional header with dark mode toggle
 */
import { C } from '../config/colors';
import type { Section } from '../config/sections';
import type { SyncStatus } from '../hooks/useSync';
import { getSyncStatusDisplay } from '../hooks/useSync';
import type { ThemeMode } from '../config/colors';

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
  // Theme props
  themeMode?: ThemeMode;
  onToggleTheme?: () => void;
}

// Clean section label mapping
const SECTION_LABELS: Record<string, string> = {
  sysinfo: 'System Information',
  fips199: 'Security Categorization',
  infotypes: 'Information Types',
  baseline: 'Control Baseline',
  rmf: 'RMF Lifecycle',
  boundary: 'Authorization Boundary',
  dataflow: 'Data Flow',
  network: 'Network Architecture',
  pps: 'Ports & Protocols',
  intercon: 'Interconnections',
  crypto: 'Cryptography',
  personnel: 'Personnel Security',
  identity: 'Identity Management',
  sepduty: 'Separation of Duties',
  controls: 'Security Controls',
  policies: 'Security Policies',
  scrm: 'Supply Chain Risk',
  privacy: 'Privacy Analysis',
  conplan: 'Contingency Plan',
  irplan: 'Incident Response',
  cmplan: 'Configuration Management',
  conmon: 'Continuous Monitoring',
  poam: 'POA&M',
};

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
  themeMode,
  onToggleTheme,
}) => {
  const syncDisplay = syncStatus ? getSyncStatusDisplay(syncStatus) : null;
  const sectionLabel = currentSection?.id
    ? SECTION_LABELS[currentSection.id] || currentSection.label
    : currentSection?.label;

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        flexShrink: 0,
      }}
    >
      {/* Left: Title and Breadcrumb */}
      <div>
        {/* Breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
          }}
        >
          {sspTitle && (
            <>
              <span
                style={{
                  fontSize: 13,
                  color: C.textMuted,
                  maxWidth: 200,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {sspTitle}
              </span>
              <span style={{ color: C.border, fontSize: 12 }}>/</span>
            </>
          )}
          <span style={{ fontSize: 13, color: C.textMuted }}>
            {sectionLabel}
          </span>
        </div>

        {/* Page Title */}
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: C.text,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {sectionLabel}
        </h1>
      </div>

      {/* Right: Status and Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Sync Status Indicator */}
        {syncDisplay && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              background: `${syncDisplay.color}10`,
              borderRadius: 8,
              border: `1px solid ${syncDisplay.color}25`,
            }}
          >
            <span style={{ fontSize: 14 }}>{syncDisplay.icon}</span>
            <span
              style={{
                fontSize: 12,
                color: syncDisplay.color,
                fontWeight: 500,
              }}
            >
              {syncDisplay.label}
            </span>
            {(syncStatus === 'dirty' || syncStatus === 'error') && onSync && (
              <button
                onClick={onSync}
                style={{
                  padding: '3px 8px',
                  background: syncDisplay.color,
                  border: 'none',
                  borderRadius: 4,
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  marginLeft: 4,
                }}
              >
                Sync
              </button>
            )}
            {syncStatus !== 'offline' && onDisconnect && (
              <button
                onClick={onDisconnect}
                style={{
                  padding: '2px 6px',
                  background: 'none',
                  border: 'none',
                  color: C.textMuted,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
                title="Disconnect and work offline"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Save Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: saving ? C.warning : C.success,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: saving ? C.warning : C.success,
              animation: saving ? 'pulse 1s infinite' : 'none',
            }}
          />
          <span style={{ color: C.textSecondary }}>
            {saving ? 'Saving...' : lastSaved ? 'Auto-saved' : 'Ready'}
          </span>
        </div>

        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            style={{
              padding: '8px',
              background: 'none',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.textSecondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.bg;
              e.currentTarget.style.borderColor = C.teal;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.borderColor = C.border;
            }}
            title={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {themeMode === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        )}

        {/* Clear Data Button */}
        {onClearData && (
          <button
            onClick={onClearData}
            style={{
              padding: '8px 14px',
              background: 'none',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.textMuted,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.error;
              e.currentTarget.style.color = C.error;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = C.textMuted;
            }}
            title="Clear all SSP data"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
            Clear
          </button>
        )}

        {/* Import Button */}
        <button
          onClick={onImport}
          style={{
            padding: '8px 14px',
            background: 'none',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            color: C.textSecondary,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = C.bg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
          }}
          title="Import OSCAL SSP"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          Import
        </button>

        {/* Preview Button */}
        <button
          onClick={onValidate}
          style={{
            padding: '8px 14px',
            background: 'none',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            color: C.textSecondary,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = C.bg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4"/>
            <circle cx="12" cy="12" r="10"/>
          </svg>
          Validate
        </button>

        {/* Export Button - Primary Action */}
        <button
          onClick={onExport}
          style={{
            padding: '8px 16px',
            background: C.navy,
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = C.navyDark;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = C.navy;
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          Export SSP
        </button>
      </div>
    </header>
  );
};
