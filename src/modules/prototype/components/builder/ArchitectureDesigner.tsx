import type { PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';

interface Props {
  meta: PrototypeBuilderMeta;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeBuilderMeta>) => void;
}

const STACK_FIELDS: { key: keyof Pick<PrototypeBuilderMeta, 'frontendStack' | 'backendStack' | 'database' | 'apis' | 'aiIntegrations' | 'infrastructure'>; label: string }[] = [
  { key: 'frontendStack', label: 'Frontend' },
  { key: 'backendStack', label: 'Backend' },
  { key: 'database', label: 'Database' },
  { key: 'apis', label: 'API layer' },
  { key: 'aiIntegrations', label: 'AI layer' },
  { key: 'infrastructure', label: 'Infrastructure' },
];

export function ArchitectureDesigner({ meta, disabled, onChange }: Props) {
  return (
    <section id="proto-builder-architecture" className="proto-builder-panel">
      <header className="proto-builder-panel__head">
        <h2>Architecture design</h2>
        <p>Stack inventory, service map, and architecture notes. Upload diagrams in Visual builder.</p>
      </header>
      <div className="proto-form-grid proto-form-grid--2">
        {STACK_FIELDS.map((f) => (
          <div key={f.key} className="proto-field">
            <label>{f.label}</label>
            <textarea
              rows={2}
              value={meta[f.key]}
              disabled={disabled}
              onChange={(e) => onChange({ [f.key]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <div className="proto-field">
        <label htmlFor="builder-arch-notes">Architecture notes</label>
        <textarea
          id="builder-arch-notes"
          rows={4}
          value={meta.architectureNotes}
          disabled={disabled}
          placeholder="Design decisions, trade-offs, integration patterns…"
          onChange={(e) => onChange({ architectureNotes: e.target.value })}
        />
      </div>
      <div className="proto-field">
        <label htmlFor="builder-services">Service inventory</label>
        <textarea
          id="builder-services"
          rows={3}
          value={meta.serviceInventory}
          disabled={disabled}
          placeholder="Auth service, API gateway, worker queues…"
          onChange={(e) => onChange({ serviceInventory: e.target.value })}
        />
      </div>
    </section>
  );
}
