import type { PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';
import type { PrototypeScreenshot } from '../../types/prototype.types';

interface Props {
  meta: PrototypeBuilderMeta;
  screenshots: PrototypeScreenshot[];
}

const STACK = [
  { key: 'frontendStack' as const, label: 'Frontend' },
  { key: 'backendStack' as const, label: 'Backend' },
  { key: 'database' as const, label: 'Database' },
  { key: 'apis' as const, label: 'API layer' },
  { key: 'aiIntegrations' as const, label: 'AI layer' },
  { key: 'infrastructure' as const, label: 'Infrastructure' },
];

export function ArchitectureViewer({ meta, screenshots }: Props) {
  const archShots = screenshots.filter((s) => s.category === 'architecture');

  return (
    <section id="proto-preview-architecture" className="proto-preview-section">
      <header className="proto-preview-section__head">
        <h2>Technical architecture</h2>
        <p>Stack overview and architecture diagrams.</p>
      </header>
      <div className="proto-preview-arch-grid">
        {STACK.map((s) => (
          <article key={s.key} className="proto-preview-arch-card">
            <h3>{s.label}</h3>
            <p>{meta[s.key].trim() || '—'}</p>
          </article>
        ))}
      </div>
      {meta.architectureNotes ? (
        <div className="proto-preview-arch-notes">
          <h3>Architecture notes</h3>
          <p>{meta.architectureNotes}</p>
        </div>
      ) : null}
      {meta.serviceInventory ? (
        <div className="proto-preview-arch-notes">
          <h3>Service inventory</h3>
          <p>{meta.serviceInventory}</p>
        </div>
      ) : null}
      {archShots.length > 0 ? (
        <div className="proto-preview-arch-diagrams">
          <h3>Architecture diagrams</h3>
          <div className="proto-preview-arch-diagrams__grid">
            {archShots.map((s) => (
              <figure key={s.id}>
                <img src={s.url} alt={s.title} loading="lazy" />
                <figcaption>{s.title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
