/**
 * Sidebar — Component Tests
 * Tests ARIA landmarks, navigation, progress display, and collapse behavior.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';

const defaultProps = {
  currentSection: 'sysinfo',
  onSectionChange: vi.fn(),
  progress: { sysinfo: 50, fips199: 100, controls: 0 },
  overall: 30,
  collapsed: false,
  onToggleCollapse: vi.fn(),
};

function renderSidebar(overrides = {}) {
  const props = { ...defaultProps, ...overrides, onSectionChange: vi.fn(), onToggleCollapse: vi.fn() };
  return { props, ...render(<Sidebar {...props} />) };
}

describe('Sidebar', () => {
  it('renders with correct ARIA landmark role', () => {
    renderSidebar();
    const aside = screen.getByRole('complementary');
    expect(aside).toHaveAttribute('aria-label', 'SSP Navigation Sidebar');
  });

  it('renders navigation with aria-label', () => {
    renderSidebar();
    const nav = screen.getByRole('navigation', { name: 'SSP Sections' });
    expect(nav).toBeInTheDocument();
  });

  it('renders section nav items', () => {
    renderSidebar();
    // Should find at least System Info section
    expect(screen.getByText('System Information')).toBeInTheDocument();
  });

  it('marks active section with aria-current', () => {
    renderSidebar({ currentSection: 'sysinfo' });
    const activeButton = screen.getByRole('button', { current: 'page' });
    expect(activeButton).toBeInTheDocument();
  });

  it('calls onSectionChange when a nav item is clicked', () => {
    const { props } = renderSidebar();
    const fipsButton = screen.getByText('Security Categorization');
    fireEvent.click(fipsButton);
    expect(props.onSectionChange).toHaveBeenCalled();
  });

  it('renders collapse button with aria-label', () => {
    renderSidebar();
    const btn = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(btn).toBeInTheDocument();
  });

  it('shows expand label when collapsed', () => {
    renderSidebar({ collapsed: true });
    const btn = screen.getByRole('button', { name: 'Expand sidebar' });
    expect(btn).toBeInTheDocument();
  });

  it('calls onToggleCollapse when collapse button is clicked', () => {
    const { props } = renderSidebar();
    const btn = screen.getByRole('button', { name: 'Collapse sidebar' });
    fireEvent.click(btn);
    expect(props.onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('renders progress display when not collapsed', () => {
    renderSidebar({ collapsed: false });
    // Progress section should be visible
    expect(screen.getByText(/complete/i)).toBeInTheDocument();
  });

  it('hides progress display when collapsed', () => {
    renderSidebar({ collapsed: true });
    expect(screen.queryByText(/complete/i)).not.toBeInTheDocument();
  });
});
