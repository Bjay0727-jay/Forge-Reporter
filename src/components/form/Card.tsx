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
    <div style={{ padding: 24 }}>
      {title && (
        <div style={{ marginBottom: subtitle ? 4 : 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.text }}>{title}</h3>
          {subtitle && (
            <p style={{ margin: '6px 0 0', fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  </div>
);
