/**
 * SystemInfo Section — Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SystemInfoSec } from './SystemInfo';
import type { SSPData } from '../types';

// Mock AI service to avoid network calls
vi.mock('../services/ai', () => ({
  generateSectionContent: vi.fn().mockResolvedValue('AI generated content'),
}));

const defaultData: SSPData = {};

function renderSystemInfo(data: SSPData = defaultData, sf = vi.fn()) {
  return { sf, ...render(<SystemInfoSec d={data} sf={sf} />) };
}

describe('SystemInfoSec', () => {
  it('renders section heading', () => {
    renderSystemInfo();
    expect(screen.getByText('System Information')).toBeInTheDocument();
  });

  it('renders all required fields with labels', () => {
    renderSystemInfo();
    expect(screen.getByText('System Name')).toBeInTheDocument();
    expect(screen.getByText('System Acronym')).toBeInTheDocument();
    expect(screen.getByText('Owning Agency / Organization')).toBeInTheDocument();
    expect(screen.getByText('Authorization Type')).toBeInTheDocument();
  });

  it('renders pre-populated data in inputs', () => {
    renderSystemInfo({
      sysName: 'ForgeComply',
      sysAcronym: 'FC360',
      owningAgency: 'DHS',
    });
    expect(screen.getByDisplayValue('ForgeComply')).toBeInTheDocument();
    expect(screen.getByDisplayValue('FC360')).toBeInTheDocument();
    expect(screen.getByDisplayValue('DHS')).toBeInTheDocument();
  });

  it('calls setField when system name is changed', () => {
    const { sf } = renderSystemInfo();
    const nameInput = screen.getByPlaceholderText('e.g., ForgeComply 360 Enterprise Platform');
    fireEvent.change(nameInput, { target: { value: 'New System' } });
    expect(sf).toHaveBeenCalledWith('sysName', 'New System');
  });

  it('calls setField when acronym is changed', () => {
    const { sf } = renderSystemInfo();
    const input = screen.getByPlaceholderText('e.g., FC360');
    fireEvent.change(input, { target: { value: 'NS1' } });
    expect(sf).toHaveBeenCalledWith('sysAcronym', 'NS1');
  });

  it('calls setField when owning agency is changed', () => {
    const { sf } = renderSystemInfo();
    const input = screen.getByPlaceholderText('e.g., Department of Homeland Security');
    fireEvent.change(input, { target: { value: 'DoD' } });
    expect(sf).toHaveBeenCalledWith('owningAgency', 'DoD');
  });

  it('renders authorization type select with options', () => {
    renderSystemInfo();
    expect(screen.getByText('FISMA Agency ATO')).toBeInTheDocument();
    expect(screen.getByText('FedRAMP JAB P-ATO')).toBeInTheDocument();
  });

  it('calls setField when authorization type is selected', () => {
    const { sf } = renderSystemInfo();
    const selects = screen.getAllByRole('combobox');
    // Authorization Type is the 3rd select (after Cloud Service Model and Deployment Model) but
    // it may vary. Find the one with the correct option.
    const authSelect = selects.find(sel => {
      const options = sel.querySelectorAll('option');
      return Array.from(options).some(o => o.textContent === 'FISMA Agency ATO');
    });
    expect(authSelect).toBeDefined();
    fireEvent.change(authSelect!, { target: { value: 'fedramp-jab' } });
    expect(sf).toHaveBeenCalledWith('authType', 'fedramp-jab');
  });

  it('renders cloud service model and deployment model selects', () => {
    renderSystemInfo();
    expect(screen.getByText('SaaS')).toBeInTheDocument();
    expect(screen.getByText('Public Cloud')).toBeInTheDocument();
  });

  it('renders leveraged authorizations table', () => {
    renderSystemInfo();
    expect(screen.getByText('Leveraged Authorizations')).toBeInTheDocument();
  });
});
