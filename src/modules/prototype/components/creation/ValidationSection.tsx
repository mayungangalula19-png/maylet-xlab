import type { PrototypeCreationDraft } from '../../types/prototypeCreation.types';
import { ProtoSectionShell } from './ProtoSectionShell';

interface Props {
  draft: PrototypeCreationDraft;
  completion: number;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeCreationDraft>) => void;
}

export function ValidationSection({ draft, completion, disabled, onChange }: Props) {
  const v = draft.validation;

  const patchValidation = (patch: Partial<typeof v>) => {
    onChange({ validation: { ...v, ...patch } });
  };

  return (
    <ProtoSectionShell
      id="validation"
      title="Validation"
      description="Track feedback, test results, and validation score."
      completion={completion}
    >
      <div className="proto-validation-cards">
        <div className="proto-validation-stat">
          <span>Validation score</span>
          <strong>{v.validationScore != null ? `${v.validationScore}%` : '—'}</strong>
        </div>
        <div className="proto-validation-stat">
          <span>User rating</span>
          <strong>{v.userRatings != null ? `${v.userRatings}/5` : '—'}</strong>
        </div>
      </div>
      <div className="proto-form-stack">
        <div className="proto-field">
          <label>Validation score (0–100)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={v.validationScore ?? ''}
            disabled={disabled}
            onChange={(e) =>
              patchValidation({
                validationScore: e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
        </div>
        <div className="proto-field">
          <label>User rating (1–5)</label>
          <input
            type="number"
            min={1}
            max={5}
            step={0.1}
            value={v.userRatings ?? ''}
            disabled={disabled}
            onChange={(e) =>
              patchValidation({
                userRatings: e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
        </div>
        <div className="proto-field">
          <label>Feedback</label>
          <textarea rows={3} value={v.feedback} disabled={disabled} onChange={(e) => patchValidation({ feedback: e.target.value })} />
        </div>
        <div className="proto-field">
          <label>Test results</label>
          <textarea rows={3} value={v.testResults} disabled={disabled} onChange={(e) => patchValidation({ testResults: e.target.value })} />
        </div>
      </div>
    </ProtoSectionShell>
  );
}
