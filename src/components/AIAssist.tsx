/**
 * ForgeComply 360 Reporter - AI Assist Component
 * Provides AI writing assistance UI for SSP sections
 */

import React, { useState } from 'react';
import { C } from '../config/colors';
import type { AIState, AIActions } from '../hooks/useAI';
import type { SystemContext } from '../services/ai';

interface AIAssistButtonProps {
  sectionKey: string;
  sectionLabel: string;
  currentContent?: string;
  systemContext: SystemContext;
  aiState: AIState;
  aiActions: AIActions;
  onAccept: (content: string) => void;
}

/**
 * AI Assist Button - triggers AI content generation
 */
export const AIAssistButton: React.FC<AIAssistButtonProps> = ({
  sectionKey,
  sectionLabel,
  currentContent,
  systemContext,
  aiState,
  aiActions,
  onAccept,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const hasContent = !!currentContent && currentContent.trim().length > 0;
  const isGenerating = aiState.status === 'generating';

  const handleGenerate = async () => {
    setShowMenu(false);
    const content = await aiActions.generate(sectionKey, sectionLabel, systemContext, currentContent);
    if (content) {
      // Show preview modal
    }
  };

  const handleRefine = async () => {
    setShowMenu(false);
    if (currentContent) {
      await aiActions.refine(sectionKey, sectionLabel, systemContext, currentContent);
    }
  };

  const handleExpand = async () => {
    setShowMenu(false);
    if (currentContent) {
      await aiActions.expand(sectionKey, sectionLabel, systemContext, currentContent);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isGenerating}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 10px',
          background: isGenerating ? C.surface : `linear-gradient(135deg, #8b5cf6, #6366f1)`,
          border: 'none',
          borderRadius: 6,
          color: '#fff',
          fontSize: 11,
          fontWeight: 600,
          cursor: isGenerating ? 'wait' : 'pointer',
          opacity: isGenerating ? 0.7 : 1,
        }}
        title="AI Writing Assistant"
      >
        {isGenerating ? (
          <>
            <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
            Generating...
          </>
        ) : (
          <>
            <span>✨</span>
            ForgeML
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {showMenu && !isGenerating && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99,
            }}
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
              minWidth: 180,
              zIndex: 100,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={handleGenerate}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                borderBottom: `1px solid ${C.border}`,
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 16 }}>✨</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                  {hasContent ? 'Regenerate' : 'Generate'}
                </div>
                <div style={{ fontSize: 10, color: C.textMuted }}>
                  AI-write this section
                </div>
              </div>
            </button>

            {hasContent && (
              <>
                <button
                  onClick={handleRefine}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    borderBottom: `1px solid ${C.border}`,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 16 }}>🔄</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Refine</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>Improve clarity & language</div>
                  </div>
                </button>

                <button
                  onClick={handleExpand}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 16 }}>📝</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Expand</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>Add more detail</div>
                  </div>
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* AI Preview Modal */}
      {aiState.status === 'success' && aiState.content && (
        <AIPreviewModal
          content={aiState.content}
          model={aiState.model}
          onAccept={() => {
            const content = aiActions.accept();
            if (content) onAccept(content);
          }}
          onDismiss={aiActions.dismiss}
        />
      )}

      {/* Error Toast */}
      {aiState.status === 'error' && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            background: C.error,
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>❌</span>
          <span style={{ fontSize: 13 }}>{aiState.error}</span>
          <button
            onClick={aiActions.clear}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              padding: '4px 8px',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * AI Preview Modal - shows generated content for review
 */
interface AIPreviewModalProps {
  content: string;
  model: string | null;
  onAccept: () => void;
  onDismiss: () => void;
}

const AIPreviewModal: React.FC<AIPreviewModalProps> = ({
  content,
  model,
  onAccept,
  onDismiss,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onDismiss}
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
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>✨</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                AI-Generated Content
              </div>
              <div style={{ fontSize: 11, color: C.textMuted }}>
                Review and accept or dismiss
              </div>
            </div>
          </div>
          {model && (
            <span
              style={{
                fontSize: 9,
                color: C.textMuted,
                background: C.surface,
                padding: '4px 8px',
                borderRadius: 4,
                fontFamily: "'Fira Code', monospace",
              }}
            >
              {model}
            </span>
          )}
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 20,
          }}
        >
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: 20,
              fontSize: 13,
              lineHeight: 1.7,
              color: C.text,
              whiteSpace: 'pre-wrap',
            }}
          >
            {content}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button
            onClick={onDismiss}
            style={{
              padding: '8px 16px',
              background: 'none',
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              color: C.textSecondary,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
          <button
            onClick={onAccept}
            style={{
              padding: '8px 16px',
              background: `linear-gradient(135deg, #8b5cf6, #6366f1)`,
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontSize: 12,
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
  );
};

/**
 * Inline AI Assist for textarea fields
 */
interface InlineAIAssistProps {
  sectionKey: string;
  sectionLabel: string;
  currentContent?: string;
  systemContext: SystemContext;
  onContentChange: (content: string) => void;
}

export const InlineAIAssist: React.FC<InlineAIAssistProps> = ({
  sectionKey,
  sectionLabel,
  currentContent,
  systemContext,
  onContentChange,
}) => {
  const [status, setStatus] = useState<'idle' | 'generating'>('idle');
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  const handleGenerate = async () => {
    setStatus('generating');
    try {
      const response = await import('../services/ai').then((m) =>
        m.generateSectionContent({
          sectionKey,
          sectionLabel,
          currentContent,
          systemContext,
          mode: 'generate',
        })
      );
      setPreviewContent(response.content);
      setShowPreview(true);
    } catch (e) {
      console.error('AI generation failed:', e);
    } finally {
      setStatus('idle');
    }
  };

  const handleAccept = () => {
    onContentChange(previewContent);
    setShowPreview(false);
    setPreviewContent('');
  };

  return (
    <>
      <button
        onClick={handleGenerate}
        disabled={status === 'generating'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px',
          background: status === 'generating' ? C.surface : `linear-gradient(135deg, #8b5cf6, #6366f1)`,
          border: 'none',
          borderRadius: 4,
          color: '#fff',
          fontSize: 10,
          fontWeight: 600,
          cursor: status === 'generating' ? 'wait' : 'pointer',
          marginLeft: 8,
        }}
        title="Generate with AI"
      >
        {status === 'generating' ? '⟳' : '✨'} AI
      </button>

      {showPreview && (
        <AIPreviewModal
          content={previewContent}
          model="ForgeML"
          onAccept={handleAccept}
          onDismiss={() => setShowPreview(false)}
        />
      )}
    </>
  );
};
