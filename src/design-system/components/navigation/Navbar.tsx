import type { ReactNode } from 'react';

export function Navbar({ children }: { children: ReactNode }) {
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
      {children}
    </header>
  );
}
