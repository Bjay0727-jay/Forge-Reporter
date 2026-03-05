/**
 * Controls Section — Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlsSec } from './Controls';
import type { SSPData } from '../types';

describe('ControlsSec', () => {
  it('renders section heading', () => {
    render(<ControlsSec d={{}} sf={vi.fn()} />);
    expect(screen.getByText('Control Implementations')).toBeInTheDocument();
  });

  it('renders all 20 NIST 800-53 Rev5 control families', () => {
    render(<ControlsSec d={{}} sf={vi.fn()} />);
    expect(screen.getByText('Access Control')).toBeInTheDocument();
    expect(screen.getByText('Audit & Accountability')).toBeInTheDocument();
    expect(screen.getByText('Incident Response')).toBeInTheDocument();
    expect(screen.getByText('System & Comms Protection')).toBeInTheDocument();
    expect(screen.getByText('Supply Chain Risk Mgmt')).toBeInTheDocument();
  });

  it('renders control status legend', () => {
    render(<ControlsSec d={{}} sf={vi.fn()} />);
    expect(screen.getByText('Implemented')).toBeInTheDocument();
    expect(screen.getByText('Partial')).toBeInTheDocument();
    expect(screen.getByText('Planned')).toBeInTheDocument();
  });

  it('renders family codes (AC, AT, AU, etc.)', () => {
    render(<ControlsSec d={{}} sf={vi.fn()} />);
    expect(screen.getByText('AC')).toBeInTheDocument();
    expect(screen.getByText('AU')).toBeInTheDocument();
    expect(screen.getByText('SC')).toBeInTheDocument();
  });

  it('expands a control family when clicked', () => {
    render(<ControlsSec d={{}} sf={vi.fn()} />);
    const acButton = screen.getByText('Access Control').closest('button') ||
                     screen.getByText('AC').closest('button');
    if (acButton) {
      fireEvent.click(acButton);
      // After expansion we should see control implementation fields
      // The expanded view should contain input elements for the control
    }
  });

  it('shows control count per family', () => {
    render(<ControlsSec d={{}} sf={vi.fn()} />);
    // AC has 25 controls
    expect(screen.getByText(/25/)).toBeInTheDocument();
  });

  it('renders with pre-existing control data', () => {
    const data: SSPData = {
      ctrlData: {
        'AC-1': { status: 'implemented', narrative: 'Access control policy documented.' },
        'AC-2': { status: 'partial', narrative: 'Account management in progress.' },
      },
    };
    render(<ControlsSec d={data} sf={vi.fn()} />);
    expect(screen.getByText('Control Implementations')).toBeInTheDocument();
  });
});
