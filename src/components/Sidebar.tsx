/**
 * Forge Cyber Defense - ForgeReporter Sidebar
 * Clean, professional navigation matching ForgeComply 360 design
 */
import { useMemo } from 'react';
import { C } from '../config/colors';
import { SECTIONS } from '../config/sections';
import type { Section } from '../config/sections';

interface SidebarProps {
  currentSection: string;
  onSectionChange: (sectionId: string) => void;
  progress: Record<string, number>;
  overall: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  documentName?: string;
  lastSaved?: string;
}

// Navigation group configuration - clean labels, no clutter
const NAV_GROUPS = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    sectionIds: ['sysinfo', 'fips199', 'infotypes', 'baseline', 'rmf'],
  },
  {
    id: 'architecture',
    label: 'Architecture',
    sectionIds: ['boundary', 'dataflow', 'network', 'pps', 'intercon', 'crypto'],
  },
  {
    id: 'security',
    label: 'Security Controls',
    sectionIds: ['personnel', 'identity', 'sepduty', 'controls'],
  },
  {
    id: 'policies',
    label: 'Policies & Plans',
    sectionIds: ['policies', 'scrm', 'privacy', 'conplan', 'irplan', 'cmplan', 'conmon', 'poam'],
  },
];

// SVG Icons for navigation items
const NavIcon: React.FC<{ sectionId: string; isActive: boolean }> = ({ sectionId, isActive }) => {
  const color = isActive ? C.teal : C.sidebarTextMuted;
  const iconMap: Record<string, React.ReactElement> = {
    sysinfo: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4M12 8h.01"/>
      </svg>
    ),
    fips199: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    infotypes: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7"/>
        <ellipse cx="12" cy="7" rx="8" ry="4"/>
      </svg>
    ),
    baseline: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    rmf: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 11-6.219-8.56"/>
        <polyline points="21 3 21 9 15 9"/>
      </svg>
    ),
    boundary: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
        <polyline points="2 17 12 22 22 17"/>
        <polyline points="2 12 12 17 22 12"/>
      </svg>
    ),
    dataflow: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
    ),
    network: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
      </svg>
    ),
    pps: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="M6 8h.01M10 8h.01M14 8h.01"/>
      </svg>
    ),
    intercon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
      </svg>
    ),
    crypto: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
      </svg>
    ),
    personnel: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    identity: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2"/>
        <circle cx="9" cy="10" r="2"/>
        <path d="M15 8h2M15 12h2M7 16h10"/>
      </svg>
    ),
    sepduty: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <line x1="19" y1="8" x2="19" y2="14"/>
        <line x1="22" y1="11" x2="16" y2="11"/>
      </svg>
    ),
    controls: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    policies: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    scrm: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 16v1a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h2m5.66 0H14a2 2 0 012 2v1"/>
        <path d="M12 11V3l4 4-4 4"/>
        <path d="M20 15h-6"/>
      </svg>
    ),
    privacy: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    conplan: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/>
        <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
      </svg>
    ),
    irplan: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    cmplan: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
    conmon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    poam: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  };
  return iconMap[sectionId] || iconMap.sysinfo;
};

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
  cmplan: 'Configuration Mgmt',
  conmon: 'Continuous Monitoring',
  poam: 'POA&M',
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSectionChange,
  progress,
  overall,
  collapsed,
  onToggleCollapse,
  documentName = 'SSP-2024-FISMA-001',
  lastSaved = 'Auto-saved',
}) => {
  // Create a lookup map for sections
  const sectionMap = useMemo(() => {
    return SECTIONS.reduce<Record<string, Section>>((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {});
  }, []);

  // Calculate sections complete
  const sectionsComplete = useMemo(() => {
    return Object.values(progress).filter(p => p === 100).length;
  }, [progress]);

  return (
    <aside
      style={{
        width: collapsed ? 72 : 280,
        flexShrink: 0,
        background: C.navy,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        overflow: 'hidden',
      }}
    >
      {/* Logo Section */}
      <div
        style={{
          padding: collapsed ? '20px 12px' : '20px',
          borderBottom: `1px solid ${C.navyLight}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        {/* Forge Cyber Defense Shield Logo */}
        <div
          style={{
            width: 44,
            height: 44,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <defs>
              <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#5eead4" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
            {/* Outer shield */}
            <path
              d="M22 3 L40 10 L40 22 C40 32 31 39 22 42 C13 39 4 32 4 22 L4 10 Z"
              fill="url(#shieldGradient)"
            />
            {/* Inner dark shield */}
            <path
              d="M22 7 L36 13 L36 22 C36 30 28 36 22 38 C16 36 8 30 8 22 L8 13 Z"
              fill="#1e3a5f"
            />
            {/* Small shield icon */}
            <path
              d="M22 12 L30 16 L30 22 C30 27 26 30 22 31 C18 30 14 27 14 22 L14 16 Z"
              fill="none"
              stroke="#14b8a6"
              strokeWidth="1.5"
            />
            {/* Speed lines */}
            <g stroke="#a0a0a0" strokeWidth="1" strokeLinecap="round">
              <line x1="11" y1="26" x2="17" y2="26" />
              <line x1="12" y1="29" x2="18" y2="29" />
              <line x1="11" y1="32" x2="16" y2="32" />
            </g>
            {/* Lock icon */}
            <g transform="translate(22, 35)">
              <rect x="-4" y="-2" width="8" height="6" rx="1" fill="#14b8a6" />
              <path d="M-2 -2 L-2 -4 C-2 -6 2 -6 2 -4 L2 -2" fill="none" stroke="#14b8a6" strokeWidth="1.2" strokeLinecap="round" />
            </g>
          </svg>
        </div>
        {!collapsed && (
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#e0e0e0',
                letterSpacing: '0.05em',
                lineHeight: 1.2,
              }}
            >
              FORGE
            </div>
            <div
              style={{
                fontSize: 10,
                color: C.teal,
                fontWeight: 600,
                marginTop: 1,
                letterSpacing: '0.03em',
              }}
            >
              CYBER DEFENSE
            </div>
            <div
              style={{
                fontSize: 9,
                color: C.sidebarTextMuted,
                marginTop: 4,
              }}
            >
              ForgeReporter • SSP Builder
            </div>
          </div>
        )}
      </div>

      {/* Current Document Card */}
      {!collapsed && (
        <div
          style={{
            margin: '16px 12px 0',
            padding: '12px 14px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 10,
            border: `1px solid ${C.navyLight}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: C.sidebarTextMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 4,
              fontWeight: 500,
            }}
          >
            Current SSP
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: C.sidebarText,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {documentName}
          </div>
          <div
            style={{
              fontSize: 11,
              color: C.sidebarTextMuted,
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: C.success,
              }}
            />
            {lastSaved}
          </div>
        </div>
      )}

      {/* Navigation Groups */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: collapsed ? '16px 8px' : '16px 12px',
        }}
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.id} style={{ marginBottom: 20 }}>
            {/* Group Label */}
            {!collapsed && (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: C.sidebarTextMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '0 12px 8px',
                }}
              >
                {group.label}
              </div>
            )}

            {/* Group Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {group.sectionIds.map((sectionId) => {
                const section = sectionMap[sectionId];
                if (!section) return null;

                const isActive = currentSection === sectionId;
                const pct = progress[sectionId] || 0;

                return (
                  <button
                    key={sectionId}
                    onClick={() => onSectionChange(sectionId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: collapsed ? '10px 0' : '10px 12px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      cursor: 'pointer',
                      background: isActive ? 'rgba(20, 184, 166, 0.15)' : 'transparent',
                      borderLeft: isActive ? `3px solid ${C.teal}` : '3px solid transparent',
                      borderRadius: '0 8px 8px 0',
                      marginLeft: collapsed ? 0 : -12,
                      paddingLeft: collapsed ? 0 : 12,
                      transition: 'all 0.15s ease',
                      border: 'none',
                      width: '100%',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <NavIcon sectionId={sectionId} isActive={isActive} />
                    {!collapsed && (
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: isActive ? 500 : 400,
                          color: isActive ? C.sidebarText : C.sidebarTextSecondary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1,
                        }}
                      >
                        {SECTION_LABELS[sectionId] || section.label}
                      </span>
                    )}
                    {!collapsed && pct === 100 && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill={C.success} fillOpacity="0.2" />
                        <path
                          d="M9 12l2 2 4-4"
                          stroke={C.success}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Progress Section (at bottom) */}
      {!collapsed && (
        <div
          style={{
            padding: '16px',
            borderTop: `1px solid ${C.navyLight}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: C.sidebarTextMuted,
              }}
            >
              Overall Progress
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: overall === 100 ? C.success : C.teal,
              }}
            >
              {overall}%
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 6,
              background: C.navyLight,
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${overall}%`,
                height: '100%',
                borderRadius: 3,
                background: overall === 100
                  ? C.success
                  : `linear-gradient(90deg, ${C.teal}, ${C.tealLight})`,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          <div
            style={{
              fontSize: 11,
              color: C.sidebarTextMuted,
              marginTop: 6,
            }}
          >
            {sectionsComplete} of {SECTIONS.length} sections complete
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <div
        style={{
          borderTop: `1px solid ${C.navyLight}`,
          padding: '12px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={onToggleCollapse}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: 8,
            color: C.sidebarTextMuted,
            cursor: 'pointer',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: collapsed ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.25s ease',
            }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>
    </aside>
  );
};
