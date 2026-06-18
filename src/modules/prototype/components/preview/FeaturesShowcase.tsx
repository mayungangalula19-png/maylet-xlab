import { useState } from 'react';
import type { PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';
import type { PrototypeFeatureItem } from '../../types/prototypeCreation.types';

interface Props {
  meta: PrototypeBuilderMeta;
}

const STATUS_LABELS: Record<PrototypeFeatureItem['status'], string> = {
  planned: 'Planned',
  in_progress: 'Building',
  implemented: 'Testing',
  tested: 'Complete',
};

export function FeaturesShowcase({ meta }: Props) {
  const [selected, setSelected] = useState<PrototypeFeatureItem | null>(null);

  if (meta.features.length === 0) {
    return (
      <section id="proto-preview-features" className="proto-preview-section">
        <header className="proto-preview-section__head">
          <h2>Features</h2>
          <p>Capability showcase with implementation status.</p>
        </header>
        <p className="proto-muted">No features documented yet.</p>
      </section>
    );
  }

  return (
    <section id="proto-preview-features" className="proto-preview-section">
      <header className="proto-preview-section__head">
        <h2>Features</h2>
        <p>{meta.features.length} capabilities · click for detail</p>
      </header>
      <div className="proto-preview-feature-grid">
        {meta.features.map((f) => (
          <button
            key={f.id}
            type="button"
            className="proto-preview-feature-card"
            onClick={() => setSelected(f)}
          >
            <span className={`proto-preview-feature-card__priority proto-preview-feature-card__priority--${f.priority}`}>
              {f.priority}
            </span>
            <h3>{f.title || 'Untitled feature'}</h3>
            <p>{f.description.slice(0, 100) || 'No description'}</p>
            <span className="proto-preview-feature-card__status">{STATUS_LABELS[f.status]}</span>
          </button>
        ))}
      </div>

      {selected ? (
        <div className="proto-preview-drawer" role="dialog" aria-label="Feature detail" onClick={() => setSelected(null)}>
          <div className="proto-preview-drawer__panel" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="proto-preview-drawer__close" onClick={() => setSelected(null)} aria-label="Close">
              ×
            </button>
            <h3>{selected.title}</h3>
            <div className="proto-preview-drawer__meta">
              <span>Priority: {selected.priority}</span>
              <span>Status: {STATUS_LABELS[selected.status]}</span>
            </div>
            <p>{selected.description || 'No detailed description.'}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
