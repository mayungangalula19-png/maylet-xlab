import type { PrototypeCreationDraft } from '../../types/prototypeCreation.types';
import { ProtoSectionShell } from './ProtoSectionShell';

interface Props {
  draft: PrototypeCreationDraft;
  completion: number;
  errors?: Record<string, string>;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeCreationDraft>) => void;
}

const FIELDS: { key: keyof Pick<PrototypeCreationDraft, 'solutionOverview' | 'keyInnovation' | 'competitiveAdvantage' | 'technicalApproach'>; label: string; placeholder: string }[] = [
  { key: 'solutionOverview', label: 'Solution overview', placeholder: 'How does your prototype solve the problem?' },
  { key: 'keyInnovation', label: 'Key innovation', placeholder: 'What is novel or defensible?' },
  { key: 'competitiveAdvantage', label: 'Competitive advantage', placeholder: 'Why will you win vs alternatives?' },
  { key: 'technicalApproach', label: 'Technical approach', placeholder: 'High-level build strategy' },
];

export function SolutionDesignSection({ draft, completion, errors, disabled, onChange }: Props) {
  return (
    <ProtoSectionShell
      id="solution"
      title="Solution design"
      description="Articulate the innovation narrative and technical direction."
      completion={completion}
    >
      <div className="proto-form-stack">
        {FIELDS.map((f) => (
          <div key={f.key} className="proto-field">
            <label htmlFor={`proto-${f.key}`}>{f.label}</label>
            <textarea
              id={`proto-${f.key}`}
              rows={3}
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
