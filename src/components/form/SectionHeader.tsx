import { C, lightTheme } from '../../config/colors';

interface SHProps {
  title: string;
  sub?: string;
}

export const SH: React.FC<SHProps> = ({ title, sub }) => (
  <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: sub ? 10 : 0 }}>
      <div
        style={{
          width: 5,
          height: 28,
          borderRadius: 2,
          background: `linear-gradient(180deg, ${lightTheme.teal}, ${lightTheme.tealDark})`,
        }}
      />
      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: C.text, letterSpacing: '-0.01em' }}>{title}</h3>
    </div>
    {sub && (
      <p style={{ margin: 0, paddingLeft: 17, fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>{sub}</p>
    )}
  </div>
);
