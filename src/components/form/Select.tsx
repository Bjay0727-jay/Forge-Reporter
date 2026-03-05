import { C } from '../../config/colors';
import { inputStyle, errorBorderStyle } from './styles';

interface SelectOption {
  v: string;
  l: string;
}

interface SelProps {
  value?: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  ph?: string;
  error?: boolean;
  id?: string;
}

export const Sel: React.FC<SelProps> = ({ value, onChange, options, ph, error, ...rest }) => (
  <select
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    style={{
      ...inputStyle,
      color: value ? C.text : C.textMuted,
      cursor: 'pointer',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 12px center',
      paddingRight: 36,
      ...(error ? errorBorderStyle : {}),
    }}
    {...rest}
  >
    {ph && <option value="">{ph}</option>}
    {options.map((o) => (
      <option key={o.v} value={o.v}>{o.l}</option>
    ))}
  </select>
);
