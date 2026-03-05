import { inputStyle, errorBorderStyle, handleFocus, handleBlur } from './styles';

interface TAProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  error?: boolean;
  id?: string;
}

export const TA: React.FC<TAProps> = ({ value, onChange, placeholder, rows = 4, error, ...rest }) => (
  <textarea
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    style={{
      ...inputStyle,
      resize: 'vertical',
      lineHeight: 1.6,
      ...(error ? errorBorderStyle : {}),
    }}
    onFocus={(e) => handleFocus(e, error)}
    onBlur={(e) => handleBlur(e, error)}
    {...rest}
  />
);
