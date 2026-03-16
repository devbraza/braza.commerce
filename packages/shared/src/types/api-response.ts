export interface ApiResponse<T = unknown> {
  status: 'ok' | 'error';
  data?: T;
  error?: string;
  message?: string;
}
