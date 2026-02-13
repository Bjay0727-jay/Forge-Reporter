/**
 * ForgeComply 360 Reporter - Dynamic Table Component (Light Theme)
 */
import React from 'react';
import { C } from '../config/colors';

interface Column {
  k: string;
  l: string;
  ph?: string;
  w?: string;
  mono?: boolean;
  type?: 'select';
  opts?: string[];
}

interface DTProps {
  cols: Column[];
  rows: Record<string, unknown>[];
  onAdd: () => void;
  onDel: (index: number) => void;
  onUpd: (index: number, key: string, value: string) => void;
}

export const DT: React.FC<DTProps> = ({ cols, rows, onAdd, onDel, onUpd }) => {
  const gridTemplate = cols.map(c => c.w || '1fr').join(' ') + ' 40px';

  return (
    <div style={{
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: gridTemplate,
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: '7px 10px',
      }}>
        {cols.map(c => (
          <div key={c.k} style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: C.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '.04em',
          }}>
            {c.l}
          </div>
        ))}
        <div />
      </div>

      {/* Rows */}
      {rows.map((r, i) => (
        <div key={i} style={{
          display: 'grid',
          gridTemplateColumns: gridTemplate,
          padding: '5px 10px',
          borderBottom: i < rows.length - 1 ? `1px solid ${C.borderLight}` : 'none',
          alignItems: 'center',
          background: i % 2 === 0 ? 'transparent' : C.surface,
        }}>
          {cols.map(c => (
            <div key={c.k} style={{ paddingRight: 6 }}>
              {c.type === 'select' ? (
                <select
                  value={(r[c.k] as string) || ''}
                  onChange={(e) => onUpd(i, c.k, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '5px 6px',
                    fontSize: 11.5,
                    background: C.bg,
                    border: `1px solid ${C.border}`,
                    borderRadius: 5,
                    color: C.text,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">\u2014</option>
                  {c.opts?.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={(r[c.k] as string) || ''}
                  onChange={(e) => onUpd(i, c.k, e.target.value)}
                  placeholder={c.ph || ''}
                  style={{
                    width: '100%',
                    padding: '5px 6px',
                    fontSize: 11.5,
                    background: C.bg,
                    border: `1px solid ${C.border}`,
                    borderRadius: 5,
                    color: C.text,
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: c.mono ? "'Fira Code', monospace" : 'inherit',
                  }}
                />
              )}
            </div>
          ))}
          <button
            onClick={() => onDel(i)}
            style={{
              background: 'none',
              border: 'none',
              color: C.error,
              cursor: 'pointer',
              fontSize: 14,
              padding: 2,
              opacity: 0.5,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => (e.target as HTMLElement).style.opacity = '1'}
            onMouseLeave={(e) => (e.target as HTMLElement).style.opacity = '0.5'}
          >
            \u2715
          </button>
        </div>
      ))}

      {/* Add Row Button */}
      <button
        onClick={onAdd}
        style={{
          width: '100%',
          padding: '9px',
          background: 'none',
          border: 'none',
          borderTop: `1px solid ${C.border}`,
          color: C.primary,
          fontSize: 12.5,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
        }}
      >
        <span style={{ fontSize: 15 }}>+</span> Add Row
      </button>
    </div>
  );
};

// Hook for managing dynamic table data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDT<T extends Record<string, unknown>>(
  data: any,
  key: string,
  setField: (key: string, value: T[]) => void
) {
  const rows = (data[key] as T[]) || [];

  return {
    rows,
    add: () => setField(key, [...rows, {} as T]),
    del: (i: number) => setField(key, rows.filter((_, x) => x !== i)),
    upd: (i: number, k: string, v: string) => {
      const c = [...rows];
      c[i] = { ...c[i], [k]: v };
      setField(key, c);
    },
  };
}
