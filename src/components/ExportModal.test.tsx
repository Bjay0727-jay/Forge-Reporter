/**
 * ExportModal — Component Tests
 * Tests dialog role, ARIA attributes, focus management, keyboard handling, and export flow.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportModal } from './ExportModal';
import type { ValidationResult } from '../utils/validation';

const validValidation: ValidationResult = {
  isValid: true,
  errorCount: 0,
  warningCount: 0,
  errors: [],
  sectionErrors: {},
};

const invalidValidation: ValidationResult = {
  isValid: false,
  errorCount: 3,
  warningCount: 0,
  errors: [
    { field: 'sysName', message: 'System name required', section: 'system_info' },
    { field: 'conf', message: 'Confidentiality required', section: 'fips_199' },
    { field: 'ctrlBaseline', message: 'Baseline required', section: 'control_baseline' },
  ],
  sectionErrors: {
    system_info: [{ field: 'sysName', message: 'System name required', section: 'system_info' }],
  },
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onExport: vi.fn().mockResolvedValue(undefined),
  validation: validValidation,
};

function renderExportModal(overrides = {}) {
  const props = { ...defaultProps, ...overrides };
  return { props, ...render(<ExportModal {...props} />) };
}

describe('ExportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <ExportModal isOpen={false} onClose={vi.fn()} onExport={vi.fn()} validation={validValidation} />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog with correct ARIA attributes', () => {
    renderExportModal();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'export-modal-title');
  });

  it('renders modal title', () => {
    renderExportModal();
    expect(screen.getByText('Export SSP Package')).toBeInTheDocument();
  });

  it('shows all enabled export formats', () => {
    renderExportModal();
    expect(screen.getByText('OSCAL JSON')).toBeInTheDocument();
    expect(screen.getByText('OSCAL XML')).toBeInTheDocument();
    expect(screen.getByText('PDF Report')).toBeInTheDocument();
  });

  it('shows disabled formats as coming soon', () => {
    renderExportModal();
    expect(screen.getAllByText(/Coming Soon/).length).toBeGreaterThan(0);
  });

  it('shows validation success when all fields complete', () => {
    renderExportModal({ validation: validValidation });
    expect(screen.getByText('All required fields are complete')).toBeInTheDocument();
  });

  it('shows validation error count when fields missing', () => {
    renderExportModal({ validation: invalidValidation });
    expect(screen.getByText(/3 required fields missing/)).toBeInTheDocument();
  });

  it('calls onExport when format is clicked', async () => {
    const { props } = renderExportModal();
    fireEvent.click(screen.getByText('OSCAL JSON'));
    await waitFor(() => {
      expect(props.onExport).toHaveBeenCalledWith('OSCAL JSON');
    });
  });

  it('calls onClose when cancel is clicked', () => {
    const { props } = renderExportModal();
    fireEvent.click(screen.getByText('Cancel'));
    expect(props.onClose).toHaveBeenCalled();
  });

  it('closes on Escape key', () => {
    const { props } = renderExportModal();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(props.onClose).toHaveBeenCalled();
  });

  it('closes when backdrop is clicked', () => {
    const { props } = renderExportModal();
    // Click the backdrop (the outer div) - use the dialog's parent
    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.parentElement;
    expect(backdrop).toBeDefined();
    fireEvent.click(backdrop!);
    expect(props.onClose).toHaveBeenCalled();
  });

  it('does not close when dialog content is clicked', () => {
    const { props } = renderExportModal();
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(props.onClose).not.toHaveBeenCalled();
  });
});
