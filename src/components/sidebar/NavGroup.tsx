/**
 * Navigation group — a labeled set of nav items in the sidebar.
 */
import { C } from '../../config/colors';
import type { Section } from '../../config/sections';
import { NavItem } from './NavItem';
import { NAV_GROUPS, SECTION_LABELS } from './navConfig';

interface NavGroupProps {
  group: typeof NAV_GROUPS[number];
  sectionMap: Record<string, Section>;
  currentSection: string;
  progress: Record<string, number>;
  collapsed: boolean;
  onSectionChange: (sectionId: string) => void;
}

export const NavGroup: React.FC<NavGroupProps> = ({
  group,
  sectionMap,
  currentSection,
  progress,
  collapsed,
  onSectionChange,
}) => (
  <div style={{ marginBottom: 20 }}>
    {!collapsed && (
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: C.sidebarTextMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '0 12px 8px',
        }}
      >
        {group.label}
      </div>
    )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {group.sectionIds.map((sectionId) => {
        const section = sectionMap[sectionId];
        if (!section) return null;
        return (
          <NavItem
            key={sectionId}
            sectionId={sectionId}
            label={SECTION_LABELS[sectionId] || section.label}
            isActive={currentSection === sectionId}
            progress={progress[sectionId] || 0}
            collapsed={collapsed}
            onClick={() => onSectionChange(sectionId)}
          />
        );
      })}
    </div>
  </div>
);
