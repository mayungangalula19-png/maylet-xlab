import type { PrototypeCreationDraft } from '../../types/prototypeCreation.types';
import { ProtoSectionShell } from './ProtoSectionShell';

interface Props {
  draft: PrototypeCreationDraft;
  completion: number;
  errors?: Record<string, string>;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeCreationDraft>) => void;
}

const FIELDS: { key: keyof Pick<PrototypeCreationDraft, 'problemStatement' | 'targetUsers' | 'currentLimitations' | 'marketNeed'>; label: string; placeholder: string; rows: number }[] = [
  { key: 'problemStatement', label: 'Problem being solved', placeholder: 'What pain exists today?', rows: 4 },
  { key: 'targetUsers', label: 'Target users', placeholder: 'Who experiences this problem?', rows: 3 },
  { key: 'currentLimitations', label: 'Current limitations', placeholder: 'Why do existing approaches fail?', rows: 3 },
  { key: 'marketNeed', label: 'Market need', placeholder: 'Evidence of demand or urgency', rows: 3 },
];

export function ProblemStatementSection({ draft, completion, errors, disabled, onChange }: Props) {
  return (
    <ProtoSectionShell
      id="problem"
      title="Problem statement"
      description="Anchor the prototype in a validated problem space."
      completion={completion}
    >
      <div className="proto-form-stack">
        {FIELDS.map((f) => (
          <div key={f.key} className="proto-field">
            <label htmlFor={`proto-${f.key}`}>{f.label}</label>
            <textarea
              id={`proto-${f.key}`}
              rows={f.rows}
              value={draft[f.key]}
              disabled={disabled}
              placeholder={f.placeholder}
              onChange={(e) => onChange({ [f.key]: e.target.value })}
            />
            {errors?.[f.key] ? <span className="proto-field-error">{errors[f.key]}</span> : null}
          </div>
        ))}
      </div>
    </ProtoSectionShell>
  );
}
