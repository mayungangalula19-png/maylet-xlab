import { useState } from 'react';
import { FINDING_TYPE_LABELS } from '../types/research.types';
import type { FindingType, ResearchFinding } from '../types/research.types';

interface Props {
  findings: ResearchFinding[];
  onCreate: (payload: { title: string; content: string; finding_type: FindingType }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function FindingsPanel({ findings, onCreate, onDelete }: Props) {
  const [form, setForm] = useState({ title: '', content: '', finding_type: 'finding' as FindingType });

  const submit = async () => {
    if (!form.title.trim()) return;
    await onCreate(form);
    setForm({ title: '', content: '', finding_type: 'finding' });
  };

  return (
    <>
      <div className="research-card">
        <div className="research-grid-2">
          <div className="research-field">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="research-field">
            <label>Type</label>
            <select value={form.finding_type} onChange={(e) => setForm({ ...form, finding_type: e.target.value as FindingType })}>
              {Object.entries(FINDING_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="research-field">
          <label>Content</label>
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        </div>
        <button type="button" className="research-btn research-btn--primary" onClick={submit}>Add finding</button>
      </div>

      {findings.length === 0 ? (
        <p className="research-empty">No findings recorded.</p>
      ) : (
        findings.map((f) => (
          <div key={f.id} className="research-card">
            <div className="research-card-header">
              <h4>{f.title}</h4>
              <button type="button" className="research-btn research-btn--danger" onClick={() => onDelete(f.id)}>Delete</button>
            </div>
            <div className="research-card-meta"><span className="research-tag">{FINDING_TYPE_LABELS[f.finding_type]}</span></div>
            <div className="research-card-body">{f.content}</div>
          </div>
        ))
      )}
    </>
  );
}
