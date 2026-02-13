/**
 * ForgeComply 360 Reporter - Color System (Light Theme)
 */
export const C = {
  // Backgrounds (Light)
  bg: '#ffffff',           // Main background - white
  surface: '#f8fafc',      // Card/section background - slate-50
  surfaceAlt: '#f1f5f9',   // Alternate surface - slate-100
  surfaceHover: '#e2e8f0', // Hover state - slate-200

  // Brand Colors (ForgeComply)
  primary: '#0ea5e9',      // Sky-500 - primary actions
  primaryDark: '#0284c7',  // Sky-600 - hover states
  primaryLight: '#e0f2fe', // Sky-100 - light background
  accent: '#14b8a6',       // Teal-500 - accents
  accentDark: '#0d9488',   // Teal-600 - hover
  accentLight: '#ccfbf1',  // Teal-100 - light background

  // Status Colors
  success: '#22c55e',      // Green-500
  successLight: '#dcfce7', // Green-100
  warning: '#f59e0b',      // Amber-500
  warningLight: '#fef3c7', // Amber-100
  error: '#ef4444',        // Red-500
  errorLight: '#fee2e2',   // Red-100
  info: '#3b82f6',         // Blue-500
  infoLight: '#dbeafe',    // Blue-100

  // Text Colors
  text: '#0f172a',         // Slate-900 - primary text
  textSecondary: '#475569', // Slate-600 - secondary text
  textMuted: '#94a3b8',    // Slate-400 - muted text
  textLight: '#cbd5e1',    // Slate-300 - disabled text

  // Borders
  border: '#e2e8f0',       // Slate-200
  borderDark: '#cbd5e1',   // Slate-300
  borderLight: '#f1f5f9',  // Slate-100

  // Tag Colors
  tagOriginal: '#64748b',  // Slate-500 (gray)
  tagFedramp: '#3b82f6',   // Blue-500
  tagFisma: '#f97316',     // Orange-500

  // Tag Backgrounds
  tagOriginalBg: '#f1f5f9', // Slate-100
  tagFedrampBg: '#eff6ff',  // Blue-50
  tagFismaBg: '#fff7ed',    // Orange-50
};

export const TAG_COLORS = {
  original: C.tagOriginal,
  fedramp: C.tagFedramp,
  fisma: C.tagFisma,
};

export const TAG_LABELS = {
  original: 'ORIGINAL',
  fedramp: 'FEDRAMP',
  fisma: 'FISMA/RMF',
};

export const TAG_BG = {
  original: C.tagOriginalBg,
  fedramp: C.tagFedrampBg,
  fisma: C.tagFismaBg,
};
