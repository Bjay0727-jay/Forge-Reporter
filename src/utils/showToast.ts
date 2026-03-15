/** Toast type variants. */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

let nextId = 0;
let globalShow: ((text: string, type?: ToastType) => void) | null = null;

/** Fire a toast from anywhere (after ToastContainer is mounted). */
export function showToast(text: string, type: ToastType = 'info') {
  globalShow?.(text, type);
}

/** Called by ToastContainer to register itself as the global handler. */
export function registerToastHandler(handler: (text: string, type?: ToastType) => void) {
  globalShow = handler;
}

/** Called by ToastContainer on unmount. */
export function unregisterToastHandler() {
  globalShow = null;
}

/** Get a unique toast id. */
export function nextToastId() {
  return nextId++;
}
