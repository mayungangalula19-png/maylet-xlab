import { useCallback, useState } from 'react';
import type { AsyncState, FormStatus } from '../types/global.types';

export function useAsyncState<T>(initialData: T | null = null): AsyncState<T> & {
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  setData: (v: T | null) => void;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(initialData);
  return { loading, error, data, setLoading, setError, setData };
}

export function useFormState() {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(() => {
    setStatus('loading');
    setError(null);
  }, []);

  const succeed = useCallback(() => {
    setStatus('success');
    setError(null);
  }, []);

  const fail = useCallback((message: string) => {
    setStatus('error');
    setError(message);
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return {
    status,
    loading: status === 'loading',
    error,
    start,
    succeed,
    fail,
    reset,
  };
}
