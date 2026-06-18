import { useMemo } from 'react';
import type { PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';
import type { PrototypeAiEvaluation, PrototypeTestRun } from '../../types/prototype.types';
import { testingService } from '../../services/testingService';

interface Props {
  meta: PrototypeBuilderMeta;
  tests: PrototypeTestRun[];
  aiEval: PrototypeAiEvaluation | null;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeBuilderMeta>) => void;
}

export function ValidationCenter({ meta, tests, aiEval, disabled, onChange }: Props) {
  const v = meta.validation;
  const passRate = useMemo(() => testingService.passRate(tests), [tests]);

  const patchValidation = (patch: Partial<typeof v>) => {
    onChange({ validation: { ...v, ...patch } });
  };

  const riskScore = aiEval?.riskScore ?? null;
  const validationProgress = v.validationScore ?? Math.round(passRate * 100);

  return (
    <section id="proto-builder-validation" className="proto-builder-panel">
      <header className="proto-builder-panel__head">
        <h2>Validation center</h2>
        <p>Feedback, test results, adoption signals, and validation analytics.</p>
      </header>

      <div className="proto-validation-cards proto-validation-cards--4">
        <div className="proto-validation-stat">
          <span>Success rate</span>
          <strong>{Math.round(passRate * 100)}%</strong>
        </div>
        <div className="proto-validation-stat">
          <span>Validation progress</span>
          <strong>{validationProgress}%</strong>
        </div>
        <div className="proto-validation-stat">
          <span>Risk score</span>
          <strong>{riskScore != null ? `${riskScore}/100` : '—'}</strong>
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
              patchValidation({ validationScore: e.target.value === '' ? null : Number(e.target.value) })
            }
          />
        </div>
        <div className="proto-field">
          <label>User feedback</label>
          <textarea rows={3} value={v.feedback} disabled={disabled} onChange={(e) => patchValidation({ feedback: e.target.value })} />
        </div>
        <div className="proto-field">
          <label>Testing results</label>
          <textarea rows={3} value={v.testResults} disabled={disabled} onChange={(e) => patchValidation({ testResults: e.target.value })} />
        </div>
        <div className="proto-field">
          <label>Adoption indicators</label>
          <textarea
            rows={2}
            value={meta.adoptionIndicators}
            disabled={disabled}
            placeholder="DAU, retention, NPS, pilot signups…"
            onChange={(e) => onChange({ adoptionIndicators: e.target.value })}
          />
        </div>
      </div>

      {tests.length > 0 ? (
        <div className="proto-builder-validation-tests">
          <h3>Recent test runs ({tests.length})</h3>
          <ul className="proto-version-list">
            {tests.slice(0, 5).map((t) => (
              <li key={t.id}>
                <strong>{t.verdict}</strong>
                <span>{new Date(t.created_at).toLocaleString()}</span>
                <p>{t.notes?.slice(0, 120) ?? '—'}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
