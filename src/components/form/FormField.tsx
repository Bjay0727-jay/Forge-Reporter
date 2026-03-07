import React from 'react';
import { C } from '../../config/colors';
import { errorMessageStyle } from './styles';
import { Lbl } from './Label';

interface FFProps {
  label: string;
  fieldId?: string;
  req?: boolean;
  hint?: string;
  span?: number;
  error?: string;
  children: React.ReactNode;
}

function labelToId(label: string): string {
  return 'ff-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const FF: React.FC<FFProps> = ({ label, fieldId, req, hint, span, error, children }) => {
  const id = fieldId || labelToId(label);

  return (
    <div style={{ gridColumn: span === 2 ? '1/-1' : undefined, marginBottom: 10 }}>
      <Lbl req={req} htmlFor={id}>{label}</Lbl>
      {React.Children.map(children, (child, index) => {
        if (index === 0 && React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ id?: string }>, { id });
        }
        return child;
      })}
      {error && (
        <div style={errorMessageStyle}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.error} strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}
      {hint && !error && (
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6, lineHeight: 1.5 }}>{hint}</div>
      )}
    </div>
  );
};
