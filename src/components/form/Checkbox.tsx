import { C } from '../../config/colors';

interface ChkProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export const Chk: React.FC<ChkProps> = ({ checked, onChange, label }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: C.text }}>
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 18,
        height: 18,
        borderRadius: 4,
        flexShrink: 0,
        cursor: 'pointer',
        border: `2px solid ${checked ? C.primary : C.borderDark}`,
        background: checked ? C.primary : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
      }}
    >
      {checked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
    </div>
    {label}
  </label>
);
