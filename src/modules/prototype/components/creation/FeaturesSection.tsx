import type { FeaturePriority, FeatureStatus, PrototypeCreationDraft, PrototypeFeatureItem } from '../../types/prototypeCreation.types';
import { newId } from '../../types/prototypeCreation.types';
import { ProtoSectionShell } from './ProtoSectionShell';

interface Props {
  draft: PrototypeCreationDraft;
  completion: number;
  errors?: Record<string, string>;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeCreationDraft>) => void;
}

const PRIORITIES: FeaturePriority[] = ['low', 'medium', 'high', 'critical'];
const STATUSES: FeatureStatus[] = ['planned', 'in_progress', 'implemented', 'tested'];

export function FeaturesSection({ draft, completion, errors, disabled, onChange }: Props) {
  const update = (id: string, patch: Partial<PrototypeFeatureItem>) => {
    onChange({
      features: draft.features.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });
  };

  const add = () => {
    onChange({
      features: [
        ...draft.features,
        { id: newId(), title: '', description: '', priority: 'medium', status: 'planned' },
      ],
    });
  };

  const remove = (id: string) => {
    onChange({ features: draft.features.filter((f) => f.id !== id) });
  };

  return (
    <ProtoSectionShell
      id="features"
      title="Features"
      description="Scope prototype capabilities with priority and delivery status."
      completion={completion}
    >
      {errors?.features ? <p className="proto-error">{errors.features}</p> : null}
      {draft.features.length === 0 ? (
        <p className="proto-muted">No features defined yet.</p>
      ) : (
        <ul className="proto-feature-list">
          {draft.features.map((f) => (
            <li key={f.id} className="proto-feature-card">
              <input
                value={f.title}
                disabled={disabled}
                placeholder="Feature title"
                onChange={(e) => update(f.id, { title: e.target.value })}
              />
              <textarea
                rows={2}
                value={f.description}
                disabled={disabled}
                placeholder="Description"
                onChange={(e) => update(f.id, { description: e.target.value })}
              />
              <div className="proto-feature-card__meta">
                <select value={f.priority} disabled={disabled} onChange={(e) => update(f.id, { priority: e.target.value as FeaturePriority })}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <select value={f.status} disabled={disabled} onChange={(e) => update(f.id, { status: e.target.value as FeatureStatus })}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <button type="button" className="proto-btn proto-btn--ghost proto-btn--sm" disabled={disabled} onClick={() => remove(f.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="proto-btn proto-btn--secondary" disabled={disabled} onClick={add}>
        + Add feature
      </button>
    </ProtoSectionShell>
  );
}
