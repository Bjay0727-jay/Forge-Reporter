import { inputStyle, errorBorderStyle, handleFocus, handleBlur } from './styles';

interface TIProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
  error?: boolean;
  id?: string;
}

export const TI: React.FC<TIProps> = ({ value, onChange, placeholder, mono, error, ...rest }) => (
  <input
    type="text"
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    style={{
      ...inputStyle,
      fontFamily: mono ? "'Fira Code', monospace" : inputStyle.fontFamily,
      ...(error ? errorBorderStyle : {}),
    }}
    onFocus={(e) => handleFocus(e, error)}
    onBlur={(e) => handleBlur(e, error)}
    {...rest}
  />
);
