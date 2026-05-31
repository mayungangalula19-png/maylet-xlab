import { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

/** Content shell — use inside DashboardLayout (sidebar provided by layout). */
export function PageShell({ title, subtitle, children, actions }: Props) {
  return (
    <div style={{ color: '#e8e8f0' }}>
      <main style={{ padding: '2rem', overflow: 'auto' }}>
        <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem' }}>{title}</h1>
            {subtitle && <p style={{ margin: '0.5rem 0 0', opacity: 0.7 }}>{subtitle}</p>}
          </div>
          {actions}
        </header>
        {children}
      </main>
    </div>
  );
}
