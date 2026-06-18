import type { ProjectOption } from '../../hooks/usePrototypeCreation';
import type { PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';
import { PROTOTYPE_CATEGORIES } from '../../types/prototypeCreation.types';
import { WORKSPACE_STAGES } from '../../types/prototypeCreation.types';
import type { PrototypeRecord } from '../../types/prototype.types';
import { VersionHistory } from '../VersionHistory';
import type { PrototypeBuild } from '../../types/prototype.types';

interface Props {
  meta: PrototypeBuilderMeta;
  prototype: PrototypeRecord;
  builds: PrototypeBuild[];
  projects: ProjectOption[];
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeBuilderMeta>) => void;
}

export function PrototypeOverview({ meta, prototype, builds, projects, disabled, onChange }: Props) {
  return (
    <section id="proto-builder-overview" className="proto-builder-panel">
      <header className="proto-builder-panel__head">
        <h2>Prototype overview</h2>
        <p>Identity, classification, and research linkage with version history.</p>
      </header>
      <div className="proto-form-grid proto-form-grid--2">
        <div className="proto-field">
          <label htmlFor="builder-name">Prototype name</label>
          <input
            id="builder-name"
            value={meta.name}
            disabled={disabled}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>
        <div className="proto-field">
          <label htmlFor="builder-stage">Current stage</label>
          <select
            id="builder-stage"
            value={meta.workspaceStage}
            disabled={disabled}
            onChange={(e) => onChange({ workspaceStage: e.target.value as PrototypeBuilderMeta['workspaceStage'] })}
          >
            {WORKSPACE_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="proto-field proto-field--full">
          <label htmlFor="builder-summary">Summary</label>
          <textarea
            id="builder-summary"
            rows={3}
            value={meta.description}
            disabled={disabled}
            placeholder="What does this prototype validate?"
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>
        <div className="proto-field">
          <label htmlFor="builder-category">Category</label>
          <select
            id="builder-category"
            value={meta.category}
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
        <div className="proto-field">
          <label htmlFor="builder-industry">Industry</label>
          <input
            id="builder-industry"
            value={meta.industry}
            disabled={disabled}
            onChange={(e) => onChange({ industry: e.target.value })}
          />
        </div>
        <div className="proto-field">
          <label htmlFor="builder-tags">Tags</label>
          <input
            id="builder-tags"
            value={meta.tags.join(', ')}
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
          <label htmlFor="builder-project">Related project</label>
          <select
            id="builder-project"
            value={meta.projectId}
            disabled={disabled}
            onChange={(e) => onChange({ projectId: e.target.value })}
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
          <label htmlFor="builder-research">Related research</label>
          <select
            id="builder-research"
            value={meta.researchId}
            disabled={disabled}
            onChange={(e) => onChange({ researchId: e.target.value })}
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
      <div className="proto-builder-overview__versions">
        <VersionHistory prototype={prototype} builds={builds} />
      </div>
    </section>
  );
}
