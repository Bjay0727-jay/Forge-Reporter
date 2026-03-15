/**
 * "Open in Reporter" button for use in FC360's SSP page.
 *
 * Generates a deep-link URL that opens the Reporter at a specific section,
 * optionally with embedded auth (token + sspId + apiUrl).
 *
 * Usage from FC360:
 *   <OpenInReporterButton
 *     section="vulns"
 *     sspId={currentSspId}
 *     token={jwtToken}
 *     apiUrl="https://forge-comply360-api.stanley-riley.workers.dev"
 *   />
 */
import { C } from '../config/colors';
import { buildReporterUrl } from '../services/api';
import { SECTIONS } from '../config/sections';

/** Default Reporter base URL; overridable via prop. */
const DEFAULT_REPORTER_URL = import.meta.env.VITE_REPORTER_URL || window.location.origin;

interface Props {
  /** Reporter section to deep-link to (e.g. 'vulns', 'controls', 'sysinfo') */
  section: string;
  /** JWT token for authenticated embedding */
  token?: string;
  /** SSP document ID */
  sspId?: string;
  /** Backend API URL */
  apiUrl?: string;
  /** Override the Reporter base URL */
  reporterUrl?: string;
  /** Optional label override */
  label?: string;
  /** Compact mode: icon-only button */
  compact?: boolean;
}

export const OpenInReporterButton: React.FC<Props> = ({
  section,
  token,
  sspId,
  apiUrl,
  reporterUrl,
  label,
  compact = false,
}) => {
  const sectionConfig = SECTIONS.find((s) => s.id === section);
  const sectionLabel = sectionConfig?.label || section;
  const buttonLabel = label || (compact ? '' : `Open ${sectionLabel} in Reporter`);

  const handleClick = () => {
    const url = buildReporterUrl(reporterUrl || DEFAULT_REPORTER_URL, {
      token,
      sspId,
      apiUrl,
      section,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      title={`Open ${sectionLabel} in Reporter`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 0 : 6,
        padding: compact ? '6px 8px' : '8px 14px',
        fontSize: 13,
        fontWeight: 500,
        color: C.primary,
        background: C.primaryLight,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = C.surfaceHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = C.primaryLight;
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
      {buttonLabel && <span>{buttonLabel}</span>}
    </button>
  );
};
