/**
 * Forge Cyber Defense - ForgeReporter Sidebar
 * Clean, professional navigation matching ForgeComply 360 design.
 * Sub-components extracted for maintainability.
 */
import { useMemo } from 'react';
import { C } from '../../config/colors';
import { SECTIONS } from '../../config/sections';
import type { Section } from '../../config/sections';
import { SidebarLogo } from './SidebarLogo';
import { DocumentCard } from './DocumentCard';
import { NavGroup } from './NavGroup';
import { NAV_GROUPS } from './navConfig';
import { SidebarProgress } from './SidebarProgress';
import { CollapseIcon } from './SidebarIcons';

interface SidebarProps {
  currentSection: string;
  onSectionChange: (sectionId: string) => void;
  progress: Record<string, number>;
  overall: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  documentName?: string;
  lastSaved?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSectionChange,
  progress,
  overall,
  collapsed,
  onToggleCollapse,
  documentName = 'SSP-2024-FISMA-001',
  lastSaved = 'Auto-saved',
}) => {
  const sectionMap = useMemo(() => {
    return SECTIONS.reduce<Record<string, Section>>((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {});
  }, []);

  const sectionsComplete = useMemo(() => {
    return Object.values(progress).filter(p => p === 100).length;
  }, [progress]);

  return (
    <aside
      style={{
        width: collapsed ? 72 : 280,
        flexShrink: 0,
        background: C.navy,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        overflow: 'hidden',
      }}
    >
      <SidebarLogo collapsed={collapsed} />

      {!collapsed && <DocumentCard documentName={documentName} lastSaved={lastSaved} />}

      <nav style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '16px 8px' : '16px 12px' }}>
        {NAV_GROUPS.map((group) => (
          <NavGroup
            key={group.id}
            group={group}
            sectionMap={sectionMap}
            currentSection={currentSection}
            progress={progress}
            collapsed={collapsed}
            onSectionChange={onSectionChange}
          />
        ))}
      </nav>

      {!collapsed && <SidebarProgress overall={overall} sectionsComplete={sectionsComplete} />}

      <div style={{ borderTop: `1px solid ${C.navyLight}`, padding: '12px', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={onToggleCollapse}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: 8,
            color: C.sidebarTextMuted,
            cursor: 'pointer',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
        >
          <CollapseIcon collapsed={collapsed} />
        </button>
      </div>
    </aside>
  );
};
