/**
 * Forge Cyber Defense - ForgeReporter Footer
 * Clean section navigation matching ForgeComply 360 design
 */
import React from 'react';
import { C } from '../config/colors';
import { SECTIONS } from '../config/sections';

interface FooterProps {
  currentIndex: number;
  onPrevious: () => void;
  onNext: () => void;
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

export const Footer: React.FC<FooterProps> = ({
  currentIndex,
  onPrevious,
  onNext,
}) => {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === SECTIONS.length - 1;
  const nextSection = !isLast ? SECTIONS[currentIndex + 1] : null;

  return (
    <footer
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        borderTop: `1px solid ${C.border}`,
        background: C.surface,
        flexShrink: 0,
      }}
    >
      {/* Previous Button */}
      <button
        disabled={isFirst}
        onClick={onPrevious}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          cursor: isFirst ? 'default' : 'pointer',
          background: 'none',
          border: 'none',
          color: isFirst ? C.textLight : C.textSecondary,
          opacity: isFirst ? 0.5 : 1,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!isFirst) {
            e.currentTarget.style.color = C.text;
          }
        }}
        onMouseLeave={(e) => {
          if (!isFirst) {
            e.currentTarget.style.color = C.textSecondary;
          }
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
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span>Previous Section</span>
      </button>

      {/* Section Counter */}
      <span
        style={{
          fontSize: 13,
          color: C.textMuted,
        }}
      >
        Section {currentIndex + 1} of {SECTIONS.length}
      </span>

      {/* Next Button */}
      <button
        onClick={onNext}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 20px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          background: isLast ? C.bg : C.navy,
          border: isLast ? `1px solid ${C.border}` : 'none',
          color: isLast ? C.textSecondary : '#fff',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!isLast) {
            e.currentTarget.style.background = C.navyDark;
          } else {
            e.currentTarget.style.background = C.surfaceAlt;
          }
        }}
        onMouseLeave={(e) => {
          if (!isLast) {
            e.currentTarget.style.background = C.navy;
          } else {
            e.currentTarget.style.background = C.bg;
          }
        }}
      >
        <span>
          {isLast
            ? 'Complete'
            : `Next: ${SECTION_LABELS[nextSection?.id || ''] || nextSection?.label || ''}`}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </footer>
  );
};
