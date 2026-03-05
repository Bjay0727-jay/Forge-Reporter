/**
 * Forge Cyber Defense - ForgeReporter Header
 * Clean, professional header with dark mode toggle.
 * Migrated from inline styles to Tailwind utility classes.
 */
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
  syncStatus?: SyncStatus;
  sspTitle?: string | null;
  onSync?: () => void;
  onDisconnect?: () => void;
  themeMode?: ThemeMode;
  onToggleTheme?: () => void;
  isOfflineMode?: boolean;
  onSignIn?: () => void;
}

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

const btnBase = 'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-150 ease-in-out';
const btnOutline = `${btnBase} bg-transparent border border-[var(--navy-light)] text-[var(--sidebar-text-secondary)] hover:bg-white/10`;
const btnIcon = `${btnBase} bg-transparent border border-[var(--navy-light)] text-[var(--sidebar-text-secondary)] hover:bg-white/10 hover:border-[var(--teal)] p-2`;

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
  isOfflineMode,
  onSignIn,
  onToggleTheme,
}) => {
  const syncDisplay = syncStatus ? getSyncStatusDisplay(syncStatus) : null;
  const sectionLabel = currentSection?.id
    ? SECTION_LABELS[currentSection.id] || currentSection.label
    : currentSection?.label;

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--navy-light)] bg-[var(--navy)] shrink-0">
      {/* Left: Title and Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          {sspTitle && (
            <>
              <span className="text-[13px] text-[var(--sidebar-text-muted)] max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                {sspTitle}
              </span>
              <span className="text-[var(--navy-light)] text-xs">/</span>
            </>
          )}
          <span className="text-[13px] text-[var(--sidebar-text-muted)]">
            {sectionLabel}
          </span>
        </div>
        <h1 className="text-xl font-semibold text-white m-0 leading-snug">
          {sectionLabel}
        </h1>
      </div>

      {/* Right: Status and Actions */}
      <div className="flex items-center gap-3">
        {/* Sync Status Indicator — uses dynamic colors from syncDisplay */}
        {syncDisplay && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
            style={{
              background: `${syncDisplay.color}10`,
              borderColor: `${syncDisplay.color}25`,
            }}
          >
            <span className="text-sm">{syncDisplay.icon}</span>
            <span className="text-xs font-medium" style={{ color: syncDisplay.color }}>
              {syncDisplay.label}
            </span>
            {(syncStatus === 'dirty' || syncStatus === 'error') && onSync && (
              <button
                onClick={onSync}
                className="px-2 py-0.5 border-none rounded text-white text-[11px] font-medium cursor-pointer ml-1"
                style={{ background: syncDisplay.color }}
              >
                Sync
              </button>
            )}
            {syncStatus !== 'offline' && onDisconnect && (
              <button
                onClick={onDisconnect}
                className="px-1.5 py-0.5 bg-transparent border-none text-[var(--sidebar-text-muted)] text-xs cursor-pointer"
                title="Disconnect and work offline"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Save Status */}
        <div className="flex items-center gap-1.5 text-[13px]">
          <span
            className={`w-2 h-2 rounded-full ${saving ? 'animate-pulse' : ''}`}
            style={{ background: saving ? 'var(--warning)' : 'var(--success)' }}
          />
          <span className="text-[var(--sidebar-text-secondary)]">
            {saving ? 'Saving...' : lastSaved ? 'Auto-saved' : 'Ready'}
          </span>
        </div>

        {/* Sign In button for offline users */}
        {isOfflineMode && onSignIn && (
          <button
            onClick={onSignIn}
            className={`${btnOutline} hover:border-[var(--teal)]`}
            title="Sign in to sync with ForgeComply 360"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
            </svg>
            Sign In
          </button>
        )}

        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className={btnIcon}
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
            className={`${btnOutline} text-[var(--sidebar-text-muted)] hover:border-[var(--error)] hover:text-[var(--error)]`}
            title="Clear all SSP data"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
            Clear
          </button>
        )}

        {/* Import Button */}
        <button onClick={onImport} className={btnOutline} title="Import OSCAL SSP">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          Import
        </button>

        {/* Validate Button */}
        <button onClick={onValidate} className={btnOutline}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4"/>
            <circle cx="12" cy="12" r="10"/>
          </svg>
          Validate
        </button>

        {/* Export Button - Primary Action */}
        <button
          onClick={onExport}
          className={`${btnBase} bg-[var(--navy)] border-none text-white px-4 hover:bg-[var(--navy-dark)]`}
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
