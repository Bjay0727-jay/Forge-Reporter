/**
 * Color System Tests
 * Tests for ForgeComply 360 branding colors and theme management
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getThemeMode,
  setThemeMode,
  toggleTheme,
  setCurrentMode,
  C,
  lightTheme,
  darkTheme,
  NAV_GROUPS,
} from './colors';

// Mock localStorage
const localStorageMock = {
  data: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.data[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.data[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.data[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.data = {};
  }),
  length: 0,
  key: vi.fn(),
};

// Mock matchMedia
const matchMediaMock = vi.fn((query: string) => ({
  matches: query.includes('dark'),
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock document.documentElement
const mockSetAttribute = vi.fn();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'window', {
  value: {
    matchMedia: matchMediaMock,
    localStorage: localStorageMock,
  },
  writable: true,
});
Object.defineProperty(global, 'document', {
  value: {
    documentElement: {
      setAttribute: mockSetAttribute,
    },
  },
  writable: true,
});

describe('Color System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.data = {};
    setCurrentMode('light');
  });

  describe('Brand Colors', () => {
    it('should have ForgeComply 360 brand colors in light theme', () => {
      expect(lightTheme.navy).toBe('#1a2744');
      expect(lightTheme.teal).toBe('#84cc16'); // Lime green
      expect(lightTheme.tealLight).toBe('#a3e635');
      expect(lightTheme.tealDark).toBe('#65a30d');
    });

    it('should have ForgeComply 360 brand colors in dark theme', () => {
      expect(darkTheme.navy).toBe('#0f172a');
      expect(darkTheme.teal).toBe('#84cc16'); // Same lime green
      expect(darkTheme.tealLight).toBe('#a3e635');
      expect(darkTheme.tealDark).toBe('#65a30d');
    });

    it('should have consistent accent color across themes', () => {
      expect(lightTheme.accent).toBe('#84cc16');
      expect(darkTheme.accent).toBe('#84cc16');
      expect(lightTheme.cardAccent).toBe('#84cc16');
      expect(darkTheme.cardAccent).toBe('#84cc16');
    });
  });

  describe('Theme Colors Structure', () => {
    it('should have all required color keys in light theme', () => {
      const requiredKeys = [
        'navy', 'navyLight', 'navyDark',
        'teal', 'tealLight', 'tealDark',
        'bg', 'surface', 'surfaceAlt', 'surfaceHover',
        'primary', 'primaryDark', 'primaryLight',
        'accent', 'accentDark', 'accentLight',
        'success', 'successLight', 'warning', 'warningLight',
        'error', 'errorLight', 'info', 'infoLight',
        'text', 'textSecondary', 'textMuted', 'textLight',
        'sidebarText', 'sidebarTextMuted', 'sidebarTextSecondary',
        'border', 'borderDark', 'borderLight',
        'cardAccent',
      ];

      requiredKeys.forEach(key => {
        expect(lightTheme).toHaveProperty(key);
        expect(typeof lightTheme[key as keyof typeof lightTheme]).toBe('string');
      });
    });

    it('should have all required color keys in dark theme', () => {
      const lightKeys = Object.keys(lightTheme);
      const darkKeys = Object.keys(darkTheme);

      expect(lightKeys.sort()).toEqual(darkKeys.sort());
    });

    it('should have valid hex color values', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

      Object.values(lightTheme).forEach(color => {
        expect(color).toMatch(hexColorRegex);
      });

      Object.values(darkTheme).forEach(color => {
        expect(color).toMatch(hexColorRegex);
      });
    });
  });

  describe('Status Colors', () => {
    it('should have distinct status colors', () => {
      expect(lightTheme.success).toBe('#22c55e');
      expect(lightTheme.warning).toBe('#f59e0b');
      expect(lightTheme.error).toBe('#ef4444');
      expect(lightTheme.info).toBe('#3b82f6');
    });

    it('should have lighter variants for status colors', () => {
      expect(lightTheme.successLight).toBeDefined();
      expect(lightTheme.warningLight).toBeDefined();
      expect(lightTheme.errorLight).toBeDefined();
      expect(lightTheme.infoLight).toBeDefined();
    });
  });

  describe('Theme Mode Functions', () => {
    // Helper to create a complete matchMedia mock result
    const createMatchMediaResult = (matches: boolean) => ({
      matches,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    it('should return light theme by default when no preference stored', () => {
      matchMediaMock.mockReturnValue(createMatchMediaResult(false));
      const mode = getThemeMode();
      expect(mode).toBe('light');
    });

    it('should return stored theme preference', () => {
      localStorageMock.data['forge-theme'] = 'dark';
      const mode = getThemeMode();
      expect(mode).toBe('dark');
    });

    it('should respect system dark mode preference', () => {
      matchMediaMock.mockReturnValue(createMatchMediaResult(true));
      const mode = getThemeMode();
      expect(mode).toBe('dark');
    });

    it('should store theme preference on setThemeMode', () => {
      setThemeMode('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('forge-theme', 'dark');
      expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('should toggle theme from light to dark', () => {
      localStorageMock.data['forge-theme'] = 'light';
      toggleTheme();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('forge-theme', 'dark');
    });

    it('should toggle theme from dark to light', () => {
      localStorageMock.data['forge-theme'] = 'dark';
      toggleTheme();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('forge-theme', 'light');
    });
  });

  describe('Dynamic Color Proxy (C)', () => {
    it('should return light theme colors by default', () => {
      setCurrentMode('light');
      expect(C.navy).toBe(lightTheme.navy);
      expect(C.teal).toBe(lightTheme.teal);
      expect(C.bg).toBe(lightTheme.bg);
    });

    it('should return dark theme colors when mode is dark', () => {
      setCurrentMode('dark');
      expect(C.navy).toBe(darkTheme.navy);
      expect(C.bg).toBe(darkTheme.bg);
      expect(C.surface).toBe(darkTheme.surface);
    });

    it('should switch colors when mode changes', () => {
      setCurrentMode('light');
      const lightBg = C.bg;

      setCurrentMode('dark');
      const darkBg = C.bg;

      expect(lightBg).not.toBe(darkBg);
      expect(lightBg).toBe(lightTheme.bg);
      expect(darkBg).toBe(darkTheme.bg);
    });
  });

  describe('Navigation Groups', () => {
    it('should have all navigation groups defined', () => {
      expect(NAV_GROUPS).toHaveProperty('gettingStarted');
      expect(NAV_GROUPS).toHaveProperty('architecture');
      expect(NAV_GROUPS).toHaveProperty('securityControls');
      expect(NAV_GROUPS).toHaveProperty('policies');
    });

    it('should have labels for all groups', () => {
      expect(NAV_GROUPS.gettingStarted.label).toBe('Getting Started');
      expect(NAV_GROUPS.architecture.label).toBe('Architecture');
      expect(NAV_GROUPS.securityControls.label).toBe('Security Controls');
      expect(NAV_GROUPS.policies.label).toBe('Policies & Plans');
    });

    it('should have section arrays for all groups', () => {
      expect(Array.isArray(NAV_GROUPS.gettingStarted.sections)).toBe(true);
      expect(Array.isArray(NAV_GROUPS.architecture.sections)).toBe(true);
      expect(Array.isArray(NAV_GROUPS.securityControls.sections)).toBe(true);
      expect(Array.isArray(NAV_GROUPS.policies.sections)).toBe(true);
    });

    it('should have non-empty section arrays', () => {
      expect(NAV_GROUPS.gettingStarted.sections.length).toBeGreaterThan(0);
      expect(NAV_GROUPS.architecture.sections.length).toBeGreaterThan(0);
      expect(NAV_GROUPS.securityControls.sections.length).toBeGreaterThan(0);
      expect(NAV_GROUPS.policies.sections.length).toBeGreaterThan(0);
    });
  });

  describe('Contrast Requirements', () => {
    it('should have dark text on light backgrounds', () => {
      // Light theme should have dark text for readability
      expect(lightTheme.text).toBe('#1e293b'); // Dark text
      expect(lightTheme.bg).toBe('#f8fafc'); // Light background
    });

    it('should have light text on dark backgrounds', () => {
      // Dark theme should have light text for readability
      expect(darkTheme.text).toBe('#f1f5f9'); // Light text
      expect(darkTheme.bg).toBe('#0f172a'); // Dark background
    });

    it('should have white sidebar text', () => {
      expect(lightTheme.sidebarText).toBe('#ffffff');
      expect(darkTheme.sidebarText).toBe('#ffffff');
    });
  });
});
