/**
 * Lightweight toast notification component.
 * Replaces browser alert() with a non-blocking, auto-dismissing notification.
 */
import { useState, useEffect, useCallback } from 'react';
import { C } from '../config/colors';
import type { ToastType, ToastMessage } from '../utils/showToast';
import { registerToastHandler, unregisterToastHandler, nextToastId } from '../utils/showToast';

const TYPE_COLORS: Record<ToastType, { bg: string; border: string; color: string }> = {
  success: { bg: `${C.success}14`, border: `${C.success}40`, color: C.success },
  error:   { bg: `${C.error}14`,   border: `${C.error}40`,   color: C.error },
  warning: { bg: `${C.warning}14`, border: `${C.warning}40`, color: C.warning },
  info:    { bg: `${C.info}14`,    border: `${C.info}40`,     color: C.info },
};

const ICONS: Record<ToastType, string> = {
  success: '\u2713',
  error:   '\u2716',
  warning: '\u26A0',
  info:    '\u2139',
};

function ToastItem({ msg, onDismiss }: { msg: ToastMessage; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 200);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const tc = TYPE_COLORS[msg.type];

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        borderRadius: 10,
        background: tc.bg,
        border: `1px solid ${tc.border}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        fontSize: 13,
        fontWeight: 500,
        color: tc.color,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-8px)',
        transition: 'opacity 0.2s, transform 0.2s',
        cursor: 'pointer',
        maxWidth: 400,
      }}
      onClick={onDismiss}
    >
      <span style={{ fontSize: 15, flexShrink: 0 }}>{ICONS[msg.type]}</span>
      <span style={{ flex: 1 }}>{msg.text}</span>
    </div>
  );
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    registerToastHandler((text: string, type: ToastType = 'info') => {
      const id = nextToastId();
      setToasts((prev) => [...prev, { id, text, type }]);
    });
    return () => { unregisterToastHandler(); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} msg={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
};
