/**
 * FIPS199 Section — Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FIPS199Sec } from './FIPS199';
import type { SSPData } from '../types';

vi.mock('../services/ai', () => ({
  generateSectionContent: vi.fn().mockResolvedValue('AI generated content'),
}));

const defaultData: SSPData = {};

function renderFIPS(data: SSPData = defaultData, sf = vi.fn()) {
  return { sf, ...render(<FIPS199Sec d={data} sf={sf} />) };
}

describe('FIPS199Sec', () => {
  it('renders section heading', () => {
    renderFIPS();
    expect(screen.getByText('FIPS 199 Categorization')).toBeInTheDocument();
  });

  it('shows dash for overall impact when no values selected', () => {
    renderFIPS();
    // The overall impact badge should show the dash character
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('calculates HIGH water mark correctly', () => {
    renderFIPS({ conf: 'high', integ: 'low', avail: 'moderate' });
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('calculates MODERATE water mark correctly', () => {
    renderFIPS({ conf: 'moderate', integ: 'low', avail: 'moderate' });
    expect(screen.getByText('MODERATE')).toBeInTheDocument();
  });

  it('calculates LOW water mark correctly', () => {
    renderFIPS({ conf: 'low', integ: 'low', avail: 'low' });
    expect(screen.getByText('LOW')).toBeInTheDocument();
  });

  it('renders CIA triad labels', () => {
    renderFIPS();
    expect(screen.getByText(/Confidentiality/)).toBeInTheDocument();
    expect(screen.getByText(/Integrity/)).toBeInTheDocument();
    expect(screen.getByText(/Availability/)).toBeInTheDocument();
  });

  it('calls setField when confidentiality is changed', () => {
    const { sf } = renderFIPS();
    const selects = screen.getAllByRole('combobox');
    // First select should be confidentiality
    fireEvent.change(selects[0], { target: { value: 'high' } });
    expect(sf).toHaveBeenCalledWith('conf', 'high');
  });

  it('calls setField when integrity is changed', () => {
    const { sf } = renderFIPS();
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'moderate' } });
    expect(sf).toHaveBeenCalledWith('integ', 'moderate');
  });

  it('calls setField when availability is changed', () => {
    const { sf } = renderFIPS();
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[2], { target: { value: 'low' } });
    expect(sf).toHaveBeenCalledWith('avail', 'low');
  });

  it('renders categorization justification field', () => {
    renderFIPS();
    expect(screen.getByText('Categorization Justification')).toBeInTheDocument();
  });

  it('displays pre-populated categorization justification', () => {
    renderFIPS({ catJust: 'Based on NIST SP 800-60 analysis...' });
    expect(screen.getByDisplayValue('Based on NIST SP 800-60 analysis...')).toBeInTheDocument();
  });
});
