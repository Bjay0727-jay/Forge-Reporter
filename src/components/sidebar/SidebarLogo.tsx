/**
 * ForgeComply 360 shield logo and branding text for the sidebar.
 */
import { C } from '../../config/colors';

interface SidebarLogoProps {
  collapsed: boolean;
}

export const SidebarLogo: React.FC<SidebarLogoProps> = ({ collapsed }) => (
  <div
    style={{
      padding: collapsed ? '20px 12px' : '20px',
      borderBottom: `1px solid ${C.navyLight}`,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      justifyContent: collapsed ? 'center' : 'flex-start',
    }}
  >
    <div
      style={{
        width: 44,
        height: 44,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <defs>
          <linearGradient id="shieldOuter" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0e0e0" />
            <stop offset="30%" stopColor="#a0a0a0" />
            <stop offset="70%" stopColor="#c0c0c0" />
            <stop offset="100%" stopColor="#909090" />
          </linearGradient>
          <linearGradient id="shieldLime" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a3e635" />
            <stop offset="100%" stopColor="#65a30d" />
          </linearGradient>
          <linearGradient id="shieldNavy" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a2744" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
        <path d="M22 1 L42 8 L42 24 C42 35 32 42 22 44 C12 42 2 35 2 24 L2 8 Z" fill="url(#shieldOuter)" />
        <path d="M22 4 L39 10 L39 24 C39 33 30 39 22 41 C14 39 5 33 5 24 L5 10 Z" fill="url(#shieldLime)" />
        <path d="M22 7 L36 12 L36 24 C36 31 28 36 22 38 C16 36 8 31 8 24 L8 12 Z" fill="url(#shieldNavy)" />
        <g transform="translate(22, 22)">
          <path
            d="M0 -9 L1.5 -9 L2 -7 L4 -7.5 L5.5 -8.5 L6.5 -7 L5 -5.5 L5.5 -4 L7 -3 L7 -1.5 L5 -1 L5 1 L7 1.5 L7 3 L5.5 4 L5 5.5 L6.5 7 L5.5 8.5 L4 7.5 L2 7 L1.5 9 L-1.5 9 L-2 7 L-4 7.5 L-5.5 8.5 L-6.5 7 L-5 5.5 L-5.5 4 L-7 3 L-7 1.5 L-5 1 L-5 -1 L-7 -1.5 L-7 -3 L-5.5 -4 L-5 -5.5 L-6.5 -7 L-5.5 -8.5 L-4 -7.5 L-2 -7 L-1.5 -9 Z"
            fill="#1a2744" stroke="#84cc16" strokeWidth="0.5"
          />
          <circle cx="0" cy="0" r="4" fill="#1a2744" stroke="#84cc16" strokeWidth="1" />
          <circle cx="0" cy="0" r="1.5" fill="#84cc16" />
        </g>
      </svg>
    </div>
    {!collapsed && (
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', letterSpacing: '0.02em' }}>
            ForgeComply
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#84cc16' }}>360</span>
        </div>
        <div style={{ fontSize: 12, color: C.sidebarTextMuted, marginTop: 2, fontWeight: 500 }}>
          Reporter &bull; SSP Builder
        </div>
      </div>
    )}
  </div>
);
