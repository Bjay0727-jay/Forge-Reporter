import { useState } from 'react';
import { C } from '../../config/colors';
import { generateSectionContent, type SystemContext } from '../../services/ai';
import { inputStyle, errorBorderStyle, handleFocus, handleBlur } from './styles';

interface TAAIProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  error?: boolean;
  sectionKey: string;
  sectionLabel: string;
  systemContext: SystemContext;
  id?: string;
}

export const TAAI: React.FC<TAAIProps> = ({
  value,
  onChange,
  placeholder,
  rows = 4,
  error,
  sectionKey,
  sectionLabel,
  systemContext,
  ...rest
}) => {
  const [status, setStatus] = useState<'idle' | 'generating'>('idle');
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const hasContent = !!value && value.trim().length > 0;

  const handleGenerate = async (mode: 'generate' | 'refine' | 'expand') => {
    setShowMenu(false);
    setStatus('generating');
    try {
      const response = await generateSectionContent({
        sectionKey,
        sectionLabel,
        currentContent: value,
        systemContext,
        mode,
      });
      setPreviewContent(response.content);
      setShowPreview(true);
    } catch (e) {
      console.error('AI generation failed:', e);
    } finally {
      setStatus('idle');
    }
  };

  const handleAccept = () => {
    onChange(previewContent);
    setShowPreview(false);
    setPreviewContent('');
  };

  const menuBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    background: 'none',
    border: 'none',
    borderBottom: `1px solid ${C.border}`,
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* AI Button */}
      <div style={{ position: 'absolute', top: -28, right: 0, zIndex: 10 }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={status === 'generating'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            background: status === 'generating' ? C.surface : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: status === 'generating' ? 'wait' : 'pointer',
          }}
          title="AI Writing Assistant"
        >
          {status === 'generating' ? (
            <><span style={{ animation: 'spin 1s linear infinite' }}>⟳</span> Generating...</>
          ) : (
            <><span>✨</span> ForgeML</>
          )}
        </button>

        {showMenu && status !== 'generating' && (
          <>
            <div
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
              onClick={() => setShowMenu(false)}
            />
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 4,
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minWidth: 160,
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              <button onClick={() => handleGenerate('generate')} style={menuBtnStyle}>
                <span style={{ fontSize: 14 }}>✨</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                    {hasContent ? 'Regenerate' : 'Generate'}
                  </div>
                  <div style={{ fontSize: 9, color: C.textMuted }}>AI-write this section</div>
                </div>
              </button>
              {hasContent && (
                <>
                  <button onClick={() => handleGenerate('refine')} style={menuBtnStyle}>
                    <span style={{ fontSize: 14 }}>🔄</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Refine</div>
                      <div style={{ fontSize: 9, color: C.textMuted }}>Improve clarity</div>
                    </div>
                  </button>
                  <button onClick={() => handleGenerate('expand')} style={{ ...menuBtnStyle, borderBottom: 'none' }}>
                    <span style={{ fontSize: 14 }}>📝</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Expand</div>
                      <div style={{ fontSize: 9, color: C.textMuted }}>Add more detail</div>
                    </div>
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Textarea */}
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, ...(error ? errorBorderStyle : {}) }}
        onFocus={(e) => handleFocus(e, error)}
        onBlur={(e) => handleBlur(e, error)}
        {...rest}
      />

      {/* AI Preview Modal */}
      {showPreview && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowPreview(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.bg,
              borderRadius: 12,
              width: '90%',
              maxWidth: 700,
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>✨</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>AI-Generated Content</div>
                <div style={{ fontSize: 14, color: C.textMuted }}>Review and accept or dismiss</div>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
              <div
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: 20,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: C.text,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {previewContent}
              </div>
            </div>
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  color: C.textSecondary,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
              <button
                onClick={handleAccept}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>✓</span>
                Accept & Use
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
