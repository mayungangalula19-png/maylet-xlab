import type { ProjectOption } from '../../hooks/usePrototypeCreation';
import type { PrototypeCreationDraft } from '../../types/prototypeCreation.types';
import { PROTOTYPE_CATEGORIES } from '../../types/prototypeCreation.types';
import { ProtoSectionShell } from './ProtoSectionShell';

interface Props {
  draft: PrototypeCreationDraft;
  projects: ProjectOption[];
  completion: number;
  errors?: Record<string, string>;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeCreationDraft>) => void;
}

export function PrototypeDetailsForm({ draft, projects, completion, errors, disabled, onChange }: Props) {
  return (
    <ProtoSectionShell
      id="details"
      title="Prototype information"
      description="Core identity, classification, and research linkage."
      completion={completion}
    >
      <div className="proto-form-grid proto-form-grid--2">
        <div className="proto-field">
          <label htmlFor="proto-name">Prototype name *</label>
          <input
            id="proto-name"
            value={draft.name}
            disabled={disabled}
            placeholder="e.g. SMS Irrigation Alert MVP"
            onChange={(e) => onChange({ name: e.target.value })}
          />
          {errors?.name ? <span className="proto-field-error">{errors.name}</span> : null}
        </div>
        <div className="proto-field">
          <label htmlFor="proto-category">Category</label>
          <select
            id="proto-category"
            value={draft.category}
            disabled={disabled}
            onChange={(e) => onChange({ category: e.target.value })}
          >
            {PROTOTYPE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="proto-field proto-field--full">
          <label htmlFor="proto-desc">Short description</label>
          <textarea
            id="proto-desc"
            rows={3}
            value={draft.description}
            disabled={disabled}
            placeholder="What will this prototype validate?"
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>
        <div className="proto-field">
          <label htmlFor="proto-industry">Industry</label>
          <input
            id="proto-industry"
            value={draft.industry}
            disabled={disabled}
            placeholder="e.g. AgriTech, FinTech"
            onChange={(e) => onChange({ industry: e.target.value })}
          />
        </div>
        <div className="proto-field">
          <label htmlFor="proto-tags">Tags</label>
          <input
            id="proto-tags"
            value={draft.tags.join(', ')}
            disabled={disabled}
            placeholder="comma-separated"
            onChange={(e) =>
              onChange({
                tags: e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
        <div className="proto-field">
          <label htmlFor="proto-project">Related project</label>
          <select
            id="proto-project"
            value={draft.projectId}
            disabled={disabled}
            onChange={(e) => {
              const id = e.target.value;
              onChange({ projectId: id, researchId: id || draft.researchId });
            }}
          >
            <option value="">None</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="proto-field">
          <label htmlFor="proto-research">Related research</label>
          <select
            id="proto-research"
            value={draft.researchId}
            disabled={disabled}
            onChange={(e) => {
              const id = e.target.value;
              onChange({ researchId: id, projectId: id || draft.projectId });
            }}
          >
            <option value="">None</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </ProtoSectionShell>
  );
}
