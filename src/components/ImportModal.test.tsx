/**
 * ImportModal — Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImportModal } from './ImportModal';

describe('ImportModal', () => {
  it('does not render when isOpen is false', () => {
    render(<ImportModal isOpen={false} onClose={vi.fn()} onImport={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog with correct ARIA attributes', () => {
    render(<ImportModal isOpen={true} onClose={vi.fn()} onImport={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'import-modal-title');
  });

  it('renders title', () => {
    render(<ImportModal isOpen={true} onClose={vi.fn()} onImport={vi.fn()} />);
    expect(screen.getByText('Import OSCAL SSP')).toBeInTheDocument();
  });

  it('renders drop zone with instructions', () => {
    render(<ImportModal isOpen={true} onClose={vi.fn()} onImport={vi.fn()} />);
    expect(screen.getByText('Drop OSCAL SSP file here')).toBeInTheDocument();
    expect(screen.getByText(/or click to browse/)).toBeInTheDocument();
  });

  it('renders supported formats', () => {
    render(<ImportModal isOpen={true} onClose={vi.fn()} onImport={vi.fn()} />);
    expect(screen.getByText('Supported Formats:')).toBeInTheDocument();
    expect(screen.getByText('OSCAL JSON')).toBeInTheDocument();
    expect(screen.getByText('OSCAL XML')).toBeInTheDocument();
  });

  it('has accessible file input', () => {
    render(<ImportModal isOpen={true} onClose={vi.fn()} onImport={vi.fn()} />);
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute('aria-label', 'Upload OSCAL SSP file');
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    render(<ImportModal isOpen={true} onClose={onClose} onImport={vi.fn()} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    render(<ImportModal isOpen={true} onClose={onClose} onImport={vi.fn()} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
