/**
 * Shared form styles used across all form components.
 */
import React from 'react';
import { C } from '../../config/colors';

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: 13.5,
  fontFamily: "'DM Sans', sans-serif",
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  color: C.text,
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
};

export const errorBorderStyle: React.CSSProperties = {
  borderColor: C.error,
};

export const errorMessageStyle: React.CSSProperties = {
  fontSize: 11,
  color: C.error,
  marginTop: 4,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

export function handleFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, error?: boolean) {
  if (!error) {
    e.target.style.borderColor = C.primary;
    e.target.style.boxShadow = `0 0 0 3px ${C.primary}15`;
  }
}

export function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, error?: boolean) {
  e.target.style.borderColor = error ? C.error : C.border;
  e.target.style.boxShadow = 'none';
}
