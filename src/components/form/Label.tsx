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
      fontSize: 11.5,
      fontWeight: 600,
      color: C.textSecondary,
      marginBottom: 5,
      letterSpacing: '.04em',
      textTransform: 'uppercase',
    }}
  >
    {children}
    {req && <span style={{ color: C.error, marginLeft: 3 }}>*</span>}
  </label>
);
