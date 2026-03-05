/**
 * Footer — Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders navigation landmark', () => {
    render(<Footer currentIndex={0} onPrevious={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByRole('navigation', { name: 'Section navigation' })).toBeInTheDocument();
  });

  it('renders section counter', () => {
    render(<Footer currentIndex={2} onPrevious={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByText(/Section 3 of/)).toBeInTheDocument();
  });

  it('disables previous button on first section', () => {
    render(<Footer currentIndex={0} onPrevious={vi.fn()} onNext={vi.fn()} />);
    const prevBtn = screen.getByText('Previous Section').closest('button');
    expect(prevBtn).toBeDisabled();
  });

  it('enables previous button on non-first section', () => {
    render(<Footer currentIndex={3} onPrevious={vi.fn()} onNext={vi.fn()} />);
    const prevBtn = screen.getByText('Previous Section').closest('button');
    expect(prevBtn).not.toBeDisabled();
  });

  it('calls onPrevious when previous button clicked', () => {
    const onPrev = vi.fn();
    render(<Footer currentIndex={3} onPrevious={onPrev} onNext={vi.fn()} />);
    fireEvent.click(screen.getByText('Previous Section'));
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it('calls onNext when next button clicked', () => {
    const onNext = vi.fn();
    render(<Footer currentIndex={0} onPrevious={vi.fn()} onNext={onNext} />);
    fireEvent.click(screen.getByText(/Next:/));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('shows next section name', () => {
    render(<Footer currentIndex={0} onPrevious={vi.fn()} onNext={vi.fn()} />);
    // Index 0 is sysinfo, next should be fips199 = "Security Categorization"
    expect(screen.getByText(/Next: Security Categorization/)).toBeInTheDocument();
  });
});
