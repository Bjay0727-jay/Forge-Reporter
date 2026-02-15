/**
 * Forge Cyber Defense - ForgeReporter Color System
 * Clean, professional design with dark mode support
 */

// Theme type
export type ThemeMode = 'light' | 'dark';

// Light theme colors
const lightColors = {
  // Forge Cyber Defense Brand Colors
  navy: '#1e3a5f',
  navyLight: '#2d4a6f',
  navyDark: '#152a4a',
  teal: '#14b8a6',
  tealLight: '#2dd4bf',
  tealDark: '#0d9488',

  // Backgrounds
  bg: '#f8fafc',
  surface: '#ffffff',
  surfaceAlt: '#f1f5f9',
  surfaceHover: '#e2e8f0',

  // Primary Actions
  primary: '#1e3a5f',
  primaryDark: '#152a4a',
  primaryLight: '#e0f2fe',

  // Accent
  accent: '#14b8a6',
  accentDark: '#0d9488',
  accentLight: '#ccfbf1',

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

  // Card accent line
  cardAccent: '#14b8a6',
};

// Dark theme colors
const darkColors = {
  // Forge Cyber Defense Brand Colors
  navy: '#0f172a',
  navyLight: '#1e293b',
  navyDark: '#020617',
  teal: '#14b8a6',
  tealLight: '#2dd4bf',
  tealDark: '#0d9488',

  // Backgrounds
  bg: '#0f172a',
  surface: '#1e293b',
  surfaceAlt: '#334155',
  surfaceHover: '#475569',

  // Primary Actions
  primary: '#14b8a6',
  primaryDark: '#0d9488',
  primaryLight: '#134e4a',

  // Accent
  accent: '#14b8a6',
  accentDark: '#0d9488',
  accentLight: '#134e4a',

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

  // Card accent line
  cardAccent: '#14b8a6',
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
