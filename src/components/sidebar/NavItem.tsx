/**
 * Individual navigation item button in the sidebar.
 */
import { C } from '../../config/colors';
import { NavIcon, CompletionIcon } from './SidebarIcons';

interface NavItemProps {
  sectionId: string;
  label: string;
  isActive: boolean;
  progress: number;
  collapsed: boolean;
  onClick: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({
  sectionId,
  label,
  isActive,
  progress,
  collapsed,
  onClick,
}) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: collapsed ? '10px 0' : '10px 12px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      cursor: 'pointer',
      background: isActive ? 'rgba(20, 184, 166, 0.15)' : 'transparent',
      borderLeft: isActive ? `3px solid ${C.teal}` : '3px solid transparent',
      borderRadius: '0 8px 8px 0',
      marginLeft: collapsed ? 0 : -12,
      paddingLeft: collapsed ? 0 : 12,
      transition: 'all 0.15s ease',
      border: 'none',
      width: '100%',
      textAlign: 'left',
    }}
    onMouseEnter={(e) => {
      if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
    }}
    onMouseLeave={(e) => {
      if (!isActive) e.currentTarget.style.background = 'transparent';
    }}
  >
    <NavIcon sectionId={sectionId} isActive={isActive} color={isActive ? C.teal : C.sidebarTextMuted} />
    {!collapsed && (
      <span
        style={{
          fontSize: 13,
          fontWeight: isActive ? 500 : 400,
          color: isActive ? C.sidebarText : C.sidebarTextSecondary,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1,
        }}
      >
        {label}
      </span>
    )}
    {!collapsed && progress === 100 && <CompletionIcon color={C.success} />}
  </button>
);
