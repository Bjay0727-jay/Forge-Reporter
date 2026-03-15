/**
 * showToast utility tests
 */
import { describe, it, expect, vi } from 'vitest';
import {
  showToast,
  registerToastHandler,
  unregisterToastHandler,
  nextToastId,
} from './showToast';

describe('showToast utility', () => {
  it('should not throw when no handler is registered', () => {
    unregisterToastHandler();
    expect(() => showToast('test')).not.toThrow();
  });

  it('should call registered handler with text and type', () => {
    const handler = vi.fn();
    registerToastHandler(handler);

    showToast('Hello', 'success');
    expect(handler).toHaveBeenCalledWith('Hello', 'success');

    showToast('Warning message', 'warning');
    expect(handler).toHaveBeenCalledWith('Warning message', 'warning');

    unregisterToastHandler();
  });

  it('should default to info type', () => {
    const handler = vi.fn();
    registerToastHandler(handler);

    showToast('Info message');
    expect(handler).toHaveBeenCalledWith('Info message', 'info');

    unregisterToastHandler();
  });

  it('should stop calling handler after unregister', () => {
    const handler = vi.fn();
    registerToastHandler(handler);
    unregisterToastHandler();

    showToast('Should not reach handler');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should generate incrementing toast IDs', () => {
    const id1 = nextToastId();
    const id2 = nextToastId();
    const id3 = nextToastId();

    expect(id2).toBe(id1 + 1);
    expect(id3).toBe(id2 + 1);
  });
});
