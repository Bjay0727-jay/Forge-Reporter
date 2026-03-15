/**
 * Navigation group — a labeled set of nav items in the sidebar.
 */
import { C } from '../../config/colors';
import type { Section } from '../../config/sections';
import { NavItem } from './NavItem';
import { CompletionIcon, PartialIcon } from './SidebarIcons';
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
}) => {
  const sectionProgresses = group.sectionIds.map((id) => progress[id] || 0);
  const allComplete = sectionProgresses.length > 0 && sectionProgresses.every((p) => p === 100);
  const anyStarted = sectionProgresses.some((p) => p > 0);

  return (
  <div style={{ marginBottom: 20 }}>
    {!collapsed && (
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: C.sidebarTextMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '0 12px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {group.label}
        {allComplete && <CompletionIcon color={C.success} />}
        {!allComplete && anyStarted && <PartialIcon color={C.warning} />}
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
};
