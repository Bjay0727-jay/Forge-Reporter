/**
 * Overall progress bar displayed at the bottom of the sidebar.
 */
import { C } from '../../config/colors';
import { SECTIONS } from '../../config/sections';

interface SidebarProgressProps {
  overall: number;
  sectionsComplete: number;
}

export const SidebarProgress: React.FC<SidebarProgressProps> = ({ overall, sectionsComplete }) => (
  <div style={{ padding: '16px', borderTop: `1px solid ${C.navyLight}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: C.sidebarTextMuted }}>
        Overall Progress
      </span>
      <span style={{ fontSize: 14, fontWeight: 600, color: overall === 100 ? C.success : C.teal }}>
        {overall}%
      </span>
    </div>
    <div style={{ width: '100%', height: 6, background: C.navyLight, borderRadius: 3, overflow: 'hidden' }}>
      <div
        style={{
          width: `${overall}%`,
          height: '100%',
          borderRadius: 3,
          background: overall === 100 ? C.success : `linear-gradient(90deg, ${C.teal}, ${C.tealLight})`,
          transition: 'width 0.5s ease',
        }}
      />
    </div>
    <div style={{ fontSize: 12, color: C.sidebarTextMuted, marginTop: 6 }}>
      {sectionsComplete} of {SECTIONS.length} sections complete
    </div>
  </div>
);
