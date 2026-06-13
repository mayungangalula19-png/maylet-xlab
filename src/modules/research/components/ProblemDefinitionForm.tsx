import { useEffect, useState } from 'react';
import type { ResearchProfile } from '../types/research.types';

interface Props {
  profile: ResearchProfile | null;
  onSave: (fields: Partial<ResearchProfile>) => Promise<void>;
}

export function ProblemDefinitionForm({ profile, onSave }: Props) {
  const [form, setForm] = useState({
    problem_statement: '',
    target_users: '',
    pain_points: '',
    existing_solutions: '',
    research_questions: '',
  });

  useEffect(() => {
    setForm({
      problem_statement: profile?.problem_statement ?? '',
      target_users: profile?.target_users ?? '',
      pain_points: profile?.pain_points ?? '',
      existing_solutions: profile?.existing_solutions ?? '',
      research_questions: profile?.research_questions ?? '',
    });
  }, [profile]);

  const fields = [
    { key: 'problem_statement' as const, label: 'Problem Statement' },
    { key: 'target_users' as const, label: 'Target Users' },
    { key: 'pain_points' as const, label: 'Pain Points' },
    { key: 'existing_solutions' as const, label: 'Existing Solutions' },
    { key: 'research_questions' as const, label: 'Research Questions' },
  ];

  return (
    <>
      <div className="research-panel-header"><h2>Problem Definition</h2></div>
      {fields.map((f) => (
        <div key={f.key} className="research-field">
          <label>{f.label}</label>
          <textarea value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
        </div>
      ))}
      <button type="button" className="research-btn research-btn--primary" onClick={() => onSave(form)}>
        Save problem definition
      </button>
    </>
  );
}
