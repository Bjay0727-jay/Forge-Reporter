import React from 'react';
import { C } from '../../config/colors';

interface UploadZoneProps {
  icon: string;
  title: string;
  sub: string;
  onUpload?: (file: File) => void;
  previewUrl?: string;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ icon, title, sub, onUpload, previewUrl }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => { inputRef.current?.click(); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) onUpload(file);
  };

  return (
    <div style={{
      background: C.surface,
      borderRadius: 10,
      padding: 22,
      margin: '18px 0',
      border: `1px dashed ${C.borderDark}`,
      textAlign: 'center',
      minHeight: 120,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {previewUrl ? (
        <img src={previewUrl} alt="Uploaded preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 6, marginBottom: 10 }} />
      ) : (
        <>
          <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary }}>{title}</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4, maxWidth: 400 }}>{sub}</div>
        </>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} style={{ display: 'none' }} />
      <button
        onClick={handleClick}
        style={{
          marginTop: 14,
          padding: '7px 18px',
          background: C.primary,
          color: '#fff',
          border: 'none',
          borderRadius: 7,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {previewUrl ? 'Replace File' : 'Upload File'}
      </button>
    </div>
  );
};
