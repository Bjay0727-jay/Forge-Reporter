/**
 * ForgeComply 360 Reporter - Color System
 * Matching ForgeComply 360 brand (Navy + Lime Green)
 */

// Theme type
export type ThemeMode = 'light' | 'dark';

// Light theme colors
const lightColors = {
  // ForgeComply 360 Brand Colors
  navy: '#1a2744',
  navyLight: '#2a3a5c',
  navyDark: '#0f172a',
  teal: '#84cc16',      // Lime green (brand accent)
  tealLight: '#a3e635', // Lighter lime
  tealDark: '#65a30d',  // Darker lime

  // Backgrounds
  bg: '#f8fafc',
  surface: '#ffffff',
  surfaceAlt: '#f1f5f9',
  surfaceHover: '#e2e8f0',

  // Primary Actions (Navy)
  primary: '#1a2744',
  primaryDark: '#0f172a',
  primaryLight: '#e0f2fe',

  // Accent (Lime Green)
  accent: '#84cc16',
  accentDark: '#65a30d',
  accentLight: '#ecfccb',

  // Status Colors
  success: '#22c55e',
  successLight: '#dcfce7',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  error: '#ef4444',
  errorLight: '#fee2e2',
  info: '#3b82f6',
  infoLight: '#dbeafe',

  // Text Colors
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  textLight: '#cbd5e1',

  // Sidebar Text
  sidebarText: '#ffffff',
  sidebarTextMuted: '#94a3b8',
  sidebarTextSecondary: '#cbd5e1',

  // Borders
  border: '#e2e8f0',
  borderDark: '#cbd5e1',
  borderLight: '#f1f5f9',

  // Card accent line (Lime Green)
  cardAccent: '#84cc16',
};

// Dark theme colors
const darkColors = {
  // ForgeComply 360 Brand Colors
  navy: '#0f172a',
  navyLight: '#1e293b',
  navyDark: '#020617',
  teal: '#84cc16',      // Lime green
  tealLight: '#a3e635',
  tealDark: '#65a30d',

  // Backgrounds
  bg: '#0f172a',
  surface: '#1e293b',
  surfaceAlt: '#334155',
  surfaceHover: '#475569',

  // Primary Actions
  primary: '#84cc16',
  primaryDark: '#65a30d',
  primaryLight: '#365314',

  // Accent
  accent: '#84cc16',
  accentDark: '#65a30d',
  accentLight: '#365314',

  // Status Colors
  success: '#22c55e',
  successLight: '#166534',
  warning: '#f59e0b',
  warningLight: '#92400e',
  error: '#ef4444',
  errorLight: '#991b1b',
  info: '#3b82f6',
  infoLight: '#1e40af',

  // Text Colors
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  textLight: '#64748b',

  // Sidebar Text
  sidebarText: '#ffffff',
  sidebarTextMuted: '#94a3b8',
  sidebarTextSecondary: '#cbd5e1',

  // Borders
  border: '#334155',
  borderDark: '#475569',
  borderLight: '#1e293b',

  // Card accent line (Lime Green)
  cardAccent: '#84cc16',
};

// Get current theme from localStorage or system preference
export const getThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('forge-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Set theme mode
export const setThemeMode = (mode: ThemeMode) => {
  localStorage.setItem('forge-theme', mode);
  document.documentElement.setAttribute('data-theme', mode);
};

// Toggle theme
export const toggleTheme = () => {
  const current = getThemeMode();
  setThemeMode(current === 'light' ? 'dark' : 'light');
};

// Current colors (default to light, will be updated by theme context)
let currentMode: ThemeMode = 'light';

export const setCurrentMode = (mode: ThemeMode) => {
  currentMode = mode;
};

// Export colors based on current mode
export const C = new Proxy(lightColors, {
  get(target, prop: keyof typeof lightColors) {
    return currentMode === 'dark' ? darkColors[prop] : target[prop];
  },
});

// Also export static versions for cases where proxy doesn't work
export const lightTheme = lightColors;
export const darkTheme = darkColors;

// Navigation groups for sidebar
export const NAV_GROUPS = {
  gettingStarted: {
    label: 'Getting Started',
    sections: ['sysinfo', 'fips199', 'infotypes'],
  },
  architecture: {
    label: 'Architecture',
    sections: ['baseline', 'rmf', 'boundary', 'dataflow', 'network', 'pps', 'interconnections'],
  },
  securityControls: {
    label: 'Security Controls',
    sections: ['crypto', 'personnel', 'identity', 'sepduty', 'controls'],
  },
  policies: {
    label: 'Policies & Plans',
    sections: ['policies', 'scrm', 'privacy', 'contingency', 'ir', 'cm', 'conmon', 'poam'],
  },
};
