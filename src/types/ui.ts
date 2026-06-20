export type ToastType = 'success' | 'error' | 'info';
export type Theme = 'light' | 'dark';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
