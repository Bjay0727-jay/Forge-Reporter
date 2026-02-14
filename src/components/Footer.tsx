/**
 * ForgeComply 360 Reporter - Footer Component (Light Theme)
 */
import React from 'react';
import { C } from '../config/colors';
import { SECTIONS } from '../config/sections';

interface FooterProps {
  currentIndex: number;
  onPrevious: () => void;
  onNext: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  currentIndex,
  onPrevious,
  onNext,
}) => {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === SECTIONS.length - 1;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '11px 34px',
      borderTop: `1px solid ${C.border}`,
      background: C.bg,
      flexShrink: 0,
    }}>
      {/* Previous Button */}
      <button
        disabled={isFirst}
        onClick={onPrevious}
        style={{
          padding: '7px 16px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: isFirst ? 'default' : 'pointer',
          background: 'none',
          border: `1px solid ${C.border}`,
          color: isFirst ? C.textLight : C.textSecondary,
          opacity: isFirst ? 0.5 : 1,
        }}
      >
        ← Previous
      </button>

      {/* Section Counter */}
      <span style={{
        fontSize: 11,
        color: C.textMuted,
      }}>
        Section {currentIndex + 1} of {SECTIONS.length}
      </span>

      {/* Next Button */}
      <button
        onClick={onNext}
        style={{
          padding: '7px 16px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          background: isLast ? C.surfaceAlt : `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
          border: 'none',
          color: isLast ? C.textSecondary : '#fff',
        }}
      >
        {isLast ? 'Final' : 'Next →'}
      </button>
    </div>
  );
};
