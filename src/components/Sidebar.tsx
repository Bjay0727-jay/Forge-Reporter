/**
 * ForgeComply 360 Reporter - Sidebar Component (Light Theme)
 */
import { Fragment, useMemo } from 'react';
import { C, TAG_COLORS, TAG_LABELS } from '../config/colors';
import { SECTIONS } from '../config/sections';
import type { Section, SectionGroup } from '../config/sections';

interface SidebarProps {
  currentSection: string;
  onSectionChange: (sectionId: string) => void;
  progress: Record<string, number>;
  overall: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  validationErrors?: Record<string, number>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSectionChange,
  progress,
  overall,
  collapsed,
  onToggleCollapse,
  // validationErrors reserved for future use
}) => {
  // Pre-compute group headers using reduce to avoid variable reassignment
  const sectionsWithGroups = useMemo(() => {
    return SECTIONS.reduce<{
      lastGrp: SectionGroup | '';
      items: Array<{ section: Section; showGroupHeader: boolean; groupName: SectionGroup }>;
    }>(
      (acc, s) => {
        const showGroupHeader = s.grp !== acc.lastGrp;
        acc.items.push({ section: s, showGroupHeader, groupName: s.grp });
        return { lastGrp: s.grp, items: acc.items };
      },
      { lastGrp: '', items: [] }
    ).items;
  }, []);

  return (
    <div style={{
      width: collapsed ? 64 : 300,
      flexShrink: 0,
      background: C.bg,
      borderRight: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: collapsed ? '14px 6px' : '16px 16px 12px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 30,
          height: 30,
          borderRadius: 7,
          flexShrink: 0,
          background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          fontWeight: 800,
          color: '#fff',
        }}>
          F
        </div>
        {!collapsed && (
          <div>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.text,
              lineHeight: 1.2,
            }}>
              ForgeComply 360
            </div>
            <div style={{
              fontSize: 9,
              color: C.primary,
              fontWeight: 600,
              letterSpacing: '.07em',
            }}>
              REPORTER — FISMA SSP
            </div>
          </div>
        )}
      </div>

      {/* Progress */}
      {!collapsed && (
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${C.borderLight}`,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}>
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              color: C.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '.05em',
            }}>
              SSP Completion
            </span>
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              color: overall === 100 ? C.success : C.primary,
            }}>
              {overall}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: 5,
            background: C.surfaceAlt,
            borderRadius: 3,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${overall}%`,
              height: '100%',
              borderRadius: 3,
              background: overall === 100 ? C.success : `linear-gradient(90deg, ${C.primary}, ${C.accent})`,
              transition: 'width 0.5s',
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
            fontSize: 9.5,
          }}>
            <span style={{ color: C.textMuted }}>11 original</span>
            <span style={{ color: TAG_COLORS.fedramp }}>+7 FedRAMP</span>
            <span style={{ color: TAG_COLORS.fisma }}>+5 FISMA</span>
          </div>
        </div>
      )}

      {/* Section List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '4px 0',
      }}>
        {sectionsWithGroups.map(({ section: s, showGroupHeader, groupName }) => {
          const isActive = currentSection === s.id;
          const pct = progress[s.id] || 0;
          const tc = TAG_COLORS[s.tag];

          // Group header
          const groupHeader = (!collapsed && showGroupHeader) ? (
            <div style={{
              fontSize: 9,
              fontWeight: 700,
              color: C.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              padding: '10px 16px 2px',
            }}>
              {groupName}
            </div>
          ) : null;

          return (
            <Fragment key={s.id}>
              {groupHeader}
              <div
                onClick={() => onSectionChange(s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: collapsed ? '7px 0' : '7px 16px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  cursor: 'pointer',
                  background: isActive ? `${C.primary}10` : 'transparent',
                  borderRight: isActive ? `3px solid ${C.primary}` : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{
                  fontSize: collapsed ? 16 : 14,
                  flexShrink: 0,
                  opacity: pct === 100 ? 1 : 0.75,
                }}>
                  {s.icon}
                </span>
                {!collapsed && (
                  <>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 11.5,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? C.primary : C.textSecondary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        {s.label}
                        {s.tag !== 'original' && (
                          <span style={{
                            fontSize: 7.5,
                            background: `${tc}25`,
                            color: tc,
                            padding: '1px 4px',
                            borderRadius: 3,
                            fontWeight: 700,
                            letterSpacing: '.03em',
                            flexShrink: 0,
                          }}>
                            {TAG_LABELS[s.tag]}
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: 9,
                        color: C.textMuted,
                        fontFamily: "'Fira Code', monospace",
                      }}>
                        {s.rmf}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 9.5,
                      fontWeight: 600,
                      fontFamily: "'Fira Code', monospace",
                      color: pct === 100 ? C.success : pct > 0 ? C.primary : C.textMuted,
                    }}>
                      {pct > 0 ? `${pct}%` : '—'}
                    </div>
                  </>
                )}
              </div>
            </Fragment>
          );
        })}
      </div>

      {/* Collapse Toggle */}
      <div style={{
        borderTop: `1px solid ${C.borderLight}`,
        padding: 6,
        textAlign: 'center',
      }}>
        <button
          onClick={onToggleCollapse}
          style={{
            background: 'none',
            border: 'none',
            color: C.textMuted,
            cursor: 'pointer',
            fontSize: 14,
            padding: 4,
          }}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>
    </div>
  );
};
