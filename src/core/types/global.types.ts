export interface AsyncState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

export interface PageLoadContext {
  cancelled: () => boolean;
}

export type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ServiceError {
  message: string;
  code?: string;
  retryable?: boolean;
}
