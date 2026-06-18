import type { ReactNode } from 'react';

interface Props {
  id: string;
  title: string;
  description?: string;
  completion?: number;
  children: ReactNode;
}

export function ProtoSectionShell({ id, title, description, completion, children }: Props) {
  return (
    <section id={`proto-section-${id}`} className="proto-create-section">
      <header className="proto-create-section__head">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {completion != null ? (
          <span className={`proto-create-section__pct${completion >= 100 ? ' proto-create-section__pct--done' : ''}`}>
            {completion}%
          </span>
        ) : null}
      </header>
      <div className="proto-create-section__body">{children}</div>
    </section>
  );
}
