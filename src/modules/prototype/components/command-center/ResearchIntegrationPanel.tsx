import { Link } from 'react-router-dom';
import type { PortfolioItem } from '../../types/commandCenter.types';

interface Props {
  items: PortfolioItem[];
}

export function ResearchIntegrationPanel({ items }: Props) {
  const linked = items.filter((p) => p.prototype.project_id);

  if (linked.length === 0) {
    return (
      <section className="proto-cc-research">
        <h3>Research integration</h3>
        <p className="proto-muted">Link prototypes to research projects for lineage tracking.</p>
      </section>
    );
  }

  return (
    <section className="proto-cc-research">
      <header className="proto-cc-section-head">
        <h2>Research lineage</h2>
        <p>{linked.length} research-linked prototypes</p>
      </header>
      <ul className="proto-cc-research-list">
        {linked.slice(0, 6).map((p) => (
          <li key={p.prototype.id}>
            <div>
              <strong>{p.prototype.name}</strong>
              <span>{p.prototype.project_name ?? 'Research project'}</span>
            </div>
            {p.prototype.project_id ? (
              <Link to={`/research/${p.prototype.project_id}`} className="proto-btn proto-btn--ghost">
                Open research →
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
