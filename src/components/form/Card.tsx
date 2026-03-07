import { C, lightTheme } from '../../config/colors';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  accentColor?: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  accentColor = lightTheme.teal,
}) => (
  <div
    style={{
      background: C.surface,
      borderRadius: 12,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      overflow: 'hidden',
      marginBottom: 20,
    }}
  >
    <div style={{ height: 6, background: `linear-gradient(90deg, ${accentColor}, ${lightTheme.tealLight})` }} />
    <div style={{ padding: 28 }}>
      {title && (
        <div style={{ marginBottom: subtitle ? 6 : 24 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: C.text, letterSpacing: '-0.01em' }}>{title}</h3>
          {subtitle && (
            <p style={{ margin: '8px 0 0', fontSize: 14, color: C.textMuted, lineHeight: 1.5 }}>{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  </div>
);
