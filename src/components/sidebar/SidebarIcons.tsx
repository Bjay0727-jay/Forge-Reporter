/**
 * Sidebar navigation icons — extracted from Sidebar.tsx for maintainability.
 * Each icon is a consistent 20x20 SVG with dynamic stroke color.
 */
import React from 'react';

const svgProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const iconMap: Record<string, (color: string) => React.ReactElement> = {
  sysinfo: (c) => (
    <svg {...svgProps} stroke={c}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4M12 8h.01"/>
    </svg>
  ),
  fips199: (c) => (
    <svg {...svgProps} stroke={c}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  infotypes: (c) => (
    <svg {...svgProps} stroke={c}>
      <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7"/>
      <ellipse cx="12" cy="7" rx="8" ry="4"/>
    </svg>
  ),
  baseline: (c) => (
    <svg {...svgProps} stroke={c}>
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  rmf: (c) => (
    <svg {...svgProps} stroke={c}>
      <path d="M21 12a9 9 0 11-6.219-8.56"/>
      <polyline points="21 3 21 9 15 9"/>
    </svg>
  ),
  boundary: (c) => (
    <svg {...svgProps} stroke={c}>
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  dataflow: (c) => (
    <svg {...svgProps} stroke={c}>
      <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
    </svg>
  ),
  network: (c) => (
    <svg {...svgProps} stroke={c}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
    </svg>
  ),
  pps: (c) => (
    <svg {...svgProps} stroke={c}>
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M6 8h.01M10 8h.01M14 8h.01"/>
    </svg>
  ),
  intercon: (c) => (
    <svg {...svgProps} stroke={c}>
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
    </svg>
  ),
  crypto: (c) => (
    <svg {...svgProps} stroke={c}>
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  ),
  personnel: (c) => (
    <svg {...svgProps} stroke={c}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  identity: (c) => (
    <svg {...svgProps} stroke={c}>
      <rect x="3" y="4" width="18" height="16" rx="2"/>
      <circle cx="9" cy="10" r="2"/>
      <path d="M15 8h2M15 12h2M7 16h10"/>
    </svg>
  ),
  sepduty: (c) => (
    <svg {...svgProps} stroke={c}>
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/>
      <line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  ),
  controls: (c) => (
    <svg {...svgProps} stroke={c}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  policies: (c) => (
    <svg {...svgProps} stroke={c}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  scrm: (c) => (
    <svg {...svgProps} stroke={c}>
      <path d="M16 16v1a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h2m5.66 0H14a2 2 0 012 2v1"/>
      <path d="M12 11V3l4 4-4 4"/>
      <path d="M20 15h-6"/>
    </svg>
  ),
  privacy: (c) => (
    <svg {...svgProps} stroke={c}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  conplan: (c) => (
    <svg {...svgProps} stroke={c}>
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
    </svg>
  ),
  irplan: (c) => (
    <svg {...svgProps} stroke={c}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  cmplan: (c) => (
    <svg {...svgProps} stroke={c}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  conmon: (c) => (
    <svg {...svgProps} stroke={c}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  poam: (c) => (
    <svg {...svgProps} stroke={c}>
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
};

export const NavIcon: React.FC<{ sectionId: string; isActive: boolean; color: string }> = ({
  sectionId,
  color,
}) => {
  const renderer = iconMap[sectionId] || iconMap.sysinfo;
  return renderer(color);
};

/** Checkmark icon shown when a section is 100% complete */
export const CompletionIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.2" />
    <path
      d="M9 12l2 2 4-4"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Chevron icon for collapse toggle */
export const CollapseIcon: React.FC<{ collapsed: boolean }> = ({ collapsed }) => (
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
);
