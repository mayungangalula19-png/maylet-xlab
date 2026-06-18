import type { PrototypeCreationDraft } from '../../types/prototypeCreation.types';
import { ProtoSectionShell } from './ProtoSectionShell';

interface Props {
  draft: PrototypeCreationDraft;
  completion: number;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeCreationDraft>) => void;
}

const FIELDS: { key: keyof Pick<PrototypeCreationDraft, 'frontendStack' | 'backendStack' | 'database' | 'apis' | 'aiIntegrations' | 'infrastructure'>; label: string }[] = [
  { key: 'frontendStack', label: 'Frontend stack' },
  { key: 'backendStack', label: 'Backend stack' },
  { key: 'database', label: 'Database' },
  { key: 'apis', label: 'APIs & integrations' },
  { key: 'aiIntegrations', label: 'AI integrations' },
  { key: 'infrastructure', label: 'Infrastructure' },
];

export function ArchitectureSection({ draft, completion, disabled, onChange }: Props) {
  return (
    <ProtoSectionShell
      id="architecture"
      title="Technical architecture"
      description="Document stack choices. Upload architecture diagrams in Visual proof."
      completion={completion}
    >
      <div className="proto-form-grid proto-form-grid--2">
        {FIELDS.map((f) => (
          <div key={f.key} className="proto-field">
            <label htmlFor={`proto-arch-${f.key}`}>{f.label}</label>
            <textarea
              id={`proto-arch-${f.key}`}
              rows={2}
              value={draft[f.key]}
              disabled={disabled}
              onChange={(e) => onChange({ [f.key]: e.target.value })}
            />
          </div>
        ))}
      </div>
    </ProtoSectionShell>
  );
}
