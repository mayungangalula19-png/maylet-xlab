import { useCallback, useState } from 'react';

export function useModalState<T>() {
  const [selected, setSelected] = useState<T | null>(null);
  const open = useCallback((item: T) => setSelected(item), []);
  const close = useCallback(() => setSelected(null), []);
  return { selected, open, close, isOpen: selected !== null };
}
