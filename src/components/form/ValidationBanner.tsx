import { C } from '../../config/colors';

interface ValidationBannerProps {
  errorCount: number;
  onShowErrors: () => void;
}

export const ValidationBanner: React.FC<ValidationBannerProps> = ({ errorCount, onShowErrors }) => {
  if (errorCount === 0) return null;

  return (
    <div style={{
      background: `${C.error}10`,
      border: `1px solid ${C.error}30`,
      borderRadius: 8,
      padding: '12px 16px',
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.error} strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span style={{ fontSize: 13, color: C.error, fontWeight: 500 }}>
          {errorCount} required field{errorCount > 1 ? 's' : ''} missing
        </span>
      </div>
      <button
        onClick={onShowErrors}
        style={{
          background: 'none',
          border: `1px solid ${C.error}40`,
          borderRadius: 6,
          padding: '5px 12px',
          fontSize: 11,
          color: C.error,
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        View All
      </button>
    </div>
  );
};
