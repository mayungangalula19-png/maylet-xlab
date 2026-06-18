import type { BuilderFeatureStatus, PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';
import { BUILDER_FEATURE_STATUSES, newBuilderId } from '../../types/prototypeBuilder.types';
import type { FeaturePriority, PrototypeFeatureItem } from '../../types/prototypeCreation.types';

interface Props {
  meta: PrototypeBuilderMeta;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeBuilderMeta>) => void;
}

const STATUS_MAP: Record<string, BuilderFeatureStatus> = {
  planned: 'planned',
  in_progress: 'building',
  implemented: 'testing',
  tested: 'complete',
};

const REVERSE_STATUS: Record<BuilderFeatureStatus, PrototypeFeatureItem['status']> = {
  planned: 'planned',
  building: 'in_progress',
  testing: 'implemented',
  complete: 'tested',
};

const PRIORITIES: FeaturePriority[] = ['low', 'medium', 'high', 'critical'];

function toBuilderStatus(status: PrototypeFeatureItem['status']): BuilderFeatureStatus {
  return STATUS_MAP[status] ?? 'planned';
}

export function FeatureBoard({ meta, disabled, onChange }: Props) {
  const update = (id: string, patch: Partial<PrototypeFeatureItem>) => {
    onChange({
      features: meta.features.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });
  };

  const moveTo = (id: string, col: BuilderFeatureStatus) => {
    update(id, { status: REVERSE_STATUS[col] });
  };

  const add = () => {
    onChange({
      features: [
        ...meta.features,
        { id: newBuilderId(), title: '', description: '', priority: 'medium', status: 'planned' },
      ],
    });
  };

  const remove = (id: string) => {
    onChange({ features: meta.features.filter((f) => f.id !== id) });
  };

  const columns = BUILDER_FEATURE_STATUSES.map((col) => ({
    ...col,
    items: meta.features.filter((f) => toBuilderStatus(f.status) === col.id),
  }));

  return (
    <section id="proto-builder-features" className="proto-builder-panel">
      <header className="proto-builder-panel__head">
        <h2>Feature board</h2>
        <p>Kanban view of prototype capabilities with priority and dependencies.</p>
      </header>

      <div className="proto-kanban">
        {columns.map((col) => (
          <div key={col.id} className="proto-kanban__col">
            <h3 className="proto-kanban__col-title">
              {col.label}
              <span>{col.items.length}</span>
            </h3>
            <ul className="proto-kanban__cards">
              {col.items.map((f) => (
                <li key={f.id} className="proto-kanban__card">
                  <input
                    value={f.title}
                    disabled={disabled}
                    placeholder="Feature name"
                    onChange={(e) => update(f.id, { title: e.target.value })}
                  />
                  <textarea
                    rows={2}
                    value={f.description}
                    disabled={disabled}
                    placeholder="Description"
                    onChange={(e) => update(f.id, { description: e.target.value })}
                  />
                  <select
                    value={f.priority}
                    disabled={disabled}
                    onChange={(e) => update(f.id, { priority: e.target.value as FeaturePriority })}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <div className="proto-kanban__card-actions">
                    {BUILDER_FEATURE_STATUSES.filter((c) => c.id !== col.id).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="proto-btn proto-btn--ghost"
                        disabled={disabled}
                        onClick={() => moveTo(f.id, c.id)}
                      >
                        → {c.label}
                      </button>
                    ))}
                    <button type="button" className="proto-btn proto-btn--ghost" disabled={disabled} onClick={() => remove(f.id)}>
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <button type="button" className="proto-btn proto-btn--secondary" disabled={disabled} onClick={add}>
        + Add feature
      </button>
    </section>
  );
}
