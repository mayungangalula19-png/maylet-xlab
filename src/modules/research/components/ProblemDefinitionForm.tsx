import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ResearchProfile } from '../types/research.types';

type ProblemFieldKey =
  | 'problem_statement'
  | 'target_users'
  | 'pain_points'
  | 'existing_solutions'
  | 'research_questions';

const FIELD_KEYS: ProblemFieldKey[] = [
  'problem_statement',
  'target_users',
  'pain_points',
  'existing_solutions',
  'research_questions',
];

const MAX_CHARS = 4000;

const FIELD_META: Record<
  ProblemFieldKey,
  { label: string; icon: string; placeholder: string; hint: string; gate: string; rows: number }
> = {
  problem_statement: {
    label: 'Problem statement',
    icon: '🎯',
    placeholder: 'What problem are you solving? Be specific about context and impact.',
    hint: 'Core narrative for gate review and stakeholder alignment.',
    gate: 'Gate A1 — System evidence',
    rows: 4,
  },
  target_users: {
    label: 'Target users',
    icon: '👥',
    placeholder: 'Who experiences this problem? Segments, roles, demographics, or personas.',
    hint: 'Define who you are researching and who the prototype will serve.',
    gate: 'Gate A2 — System evidence',
    rows: 3,
  },
  pain_points: {
    label: 'Pain points',
    icon: '⚡',
    placeholder: 'What frustrations, costs, or risks do users face today?',
    hint: 'Evidence-backed pain is required before prototype authorization.',
    gate: 'Gate A3 — System evidence',
    rows: 3,
  },
  existing_solutions: {
    label: 'Existing solutions',
    icon: '🔎',
    placeholder: 'What alternatives exist? Where do they fall short?',
    hint: 'Competitive and substitute analysis for the quality bar.',
    gate: 'Gate B2 — Professional quality',
    rows: 3,
  },
  research_questions: {
    label: 'Research questions',
    icon: '❓',
    placeholder: 'What must this research answer before building a prototype?',
    hint: 'Align questions with the problem statement for gate A4/B7.',
    gate: 'Gate A4 — System evidence',
    rows: 4,
  },
};

type FormState = Record<ProblemFieldKey, string>;

function emptyForm(): FormState {
  return {
    problem_statement: '',
    target_users: '',
    pain_points: '',
    existing_solutions: '',
    research_questions: '',
  };
}

function profileToForm(profile: ResearchProfile | null): FormState {
  return {
    problem_statement: profile?.problem_statement ?? '',
    target_users: profile?.target_users ?? '',
    pain_points: profile?.pain_points ?? '',
    existing_solutions: profile?.existing_solutions ?? '',
    research_questions: profile?.research_questions ?? '',
  };
}

function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

interface Props {
  profile: ResearchProfile | null;
  onSave: (fields: Partial<ResearchProfile>) => Promise<void>;
  disabled?: boolean;
}

export function ProblemDefinitionForm({ profile, onSave, disabled }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [baseline, setBaseline] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const next = profileToForm(profile);
    setForm(next);
    setBaseline(next);
    setError(null);
  }, [profile]);

  const filledCount = useMemo(
    () => FIELD_KEYS.filter((key) => form[key].trim().length > 0).length,
    [form]
  );

  const completionPct = Math.round((filledCount / FIELD_KEYS.length) * 100);

  const isDirty = useMemo(
    () => FIELD_KEYS.some((key) => form[key] !== baseline[key]),
    [form, baseline]
  );

  const busy = disabled || saving;

  const updateField = useCallback((key: ProblemFieldKey, value: string) => {
    setSavedFlash(false);
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(baseline);
    setError(null);
    setSavedFlash(false);
  }, [baseline]);

  const submit = async () => {
    if (!form.problem_statement.trim()) {
      setError('Problem statement is required.');
      return;
    }
    if (!form.research_questions.trim()) {
      setError('At least one research question is required.');
      return;
    }

    for (const key of FIELD_KEYS) {
      if (form[key].length > MAX_CHARS) {
        setError(`${FIELD_META[key].label} must be ${MAX_CHARS} characters or fewer.`);
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        problem_statement: form.problem_statement.trim(),
        target_users: form.target_users.trim(),
        pain_points: form.pain_points.trim(),
        existing_solutions: form.existing_solutions.trim(),
        research_questions: form.research_questions.trim(),
      };
      await onSave(payload);
      setBaseline(form);
      setSavedFlash(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save problem definition');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="research-problem">
      <div className="research-panel-header">
        <div>
          <h2>Problem definition</h2>
          <p className="research-problem__summary">
            {filledCount}/{FIELD_KEYS.length} fields complete
            {isDirty ? ' · Unsaved changes' : ''}
            {savedFlash && !isDirty ? ' · Saved' : ''}
          </p>
        </div>
        <div className="research-problem__header-actions">
          {isDirty ? (
            <button type="button" className="research-btn research-btn--secondary" disabled={busy} onClick={resetForm}>
              Reset
            </button>
          ) : null}
          <button
            type="button"
            className="research-btn research-btn--primary"
            disabled={busy || !isDirty}
            onClick={submit}
          >
            {saving ? 'Saving…' : 'Save problem definition'}
          </button>
        </div>
      </div>

      <div className="research-problem__progress">
        <div className="research-problem__progress-head">
          <span>Gate readiness</span>
          <strong className={completionPct === 100 ? 'research-problem__ready' : ''}>{completionPct}%</strong>
        </div>
        <div className="research-progress-bar" role="progressbar" aria-valuenow={completionPct} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${completionPct}%` }} />
        </div>
        {completionPct < 100 ? (
          <span className="research-problem__progress-hint">Complete all five fields for full system evidence (gate sections A & B)</span>
        ) : null}
      </div>

      {error ? (
        <p className="research-problem__error" role="alert">
          {error}
          <button type="button" className="research-problem__error-dismiss" onClick={() => setError(null)}>
            Dismiss
          </button>
        </p>
      ) : null}

      <div className="research-problem__fields">
        {FIELD_KEYS.map((key) => {
          const meta = FIELD_META[key];
          const complete = form[key].trim().length > 0;

          return (
            <div
              key={key}
              className={`research-problem-field${complete ? ' research-problem-field--complete' : ''}`}
            >
              <div className="research-problem-field__head">
                <span className="research-problem-field__icon" aria-hidden>
                  {meta.icon}
                </span>
                <div className="research-problem-field__titles">
                  <label htmlFor={`problem-${key}`}>{meta.label}</label>
                  <span className="research-problem-field__gate">{meta.gate}</span>
                </div>
                <span
                  className={`research-problem-field__status research-problem-field__status--${
                    complete ? 'complete' : 'incomplete'
                  }`}
                >
                  {complete ? 'Complete' : 'Incomplete'}
                </span>
              </div>
              <p className="research-problem-field__hint">{meta.hint}</p>
              <textarea
                id={`problem-${key}`}
                value={form[key]}
                rows={meta.rows}
                maxLength={MAX_CHARS}
                disabled={busy}
                placeholder={meta.placeholder}
                onChange={(e) => updateField(key, e.target.value)}
              />
              <span className="research-problem-field__counter">
                {wordCount(form[key])} words · {form[key].length}/{MAX_CHARS}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
