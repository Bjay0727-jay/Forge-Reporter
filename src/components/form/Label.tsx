import { C } from '../../config/colors';

interface LblProps {
  children: React.ReactNode;
  req?: boolean;
  htmlFor?: string;
}

export const Lbl: React.FC<LblProps> = ({ children, req, htmlFor }) => (
  <label
    htmlFor={htmlFor}
    style={{
      display: 'block',
      fontSize: 12,
      fontWeight: 600,
      color: C.textSecondary,
      marginBottom: 8,
      letterSpacing: '.05em',
      textTransform: 'uppercase',
      lineHeight: 1.2,
    }}
  >
    {children}
    {req && <span style={{ color: C.error, marginLeft: 3 }}>*</span>}
  </label>
);
