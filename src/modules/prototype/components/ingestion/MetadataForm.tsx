import { useState } from 'react';
import { PROTOTYPE_CATEGORIES } from '../../types/prototypeCreation.types';
import type { IngestionMetadata } from '../../types/prototypeIngestion.types';
import { INGESTION_INDUSTRIES } from '../../types/prototypeIngestion.types';
import type { ProjectOption } from '../../hooks/usePrototypeCreation';

interface Props {
  metadata: IngestionMetadata;
  projects: ProjectOption[];
  disabled?: boolean;
  onChange: (patch: Partial<IngestionMetadata>) => void;
}

export function MetadataForm({ metadata, projects, disabled, onChange }: Props) {
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || metadata.tags.includes(t)) return;
    onChange({ tags: [...metadata.tags, t] });
    setTagInput('');
  };

  return (
    <section className="proto-ingest-panel">
      <header className="proto-ingest-panel__head">
        <h2>Prototype metadata</h2>
        <p>Auto-generated fields can be refined before validation</p>
      </header>
      <div className="proto-form-grid proto-form-grid--2">
        <label className="proto-field">
          <span>Prototype name</span>
          <input value={metadata.name} disabled={disabled} onChange={(e) => onChange({ name: e.target.value })} />
        </label>
        <label className="proto-field">
          <span>Category</span>
          <select value={metadata.category} disabled={disabled} onChange={(e) => onChange({ category: e.target.value })}>
            {PROTOTYPE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="proto-field proto-field--full">
          <span>Description</span>
          <textarea rows={3} value={metadata.description} disabled={disabled} onChange={(e) => onChange({ description: e.target.value })} />
        </label>
        <label className="proto-field">
          <span>Industry</span>
          <select value={metadata.industry} disabled={disabled} onChange={(e) => onChange({ industry: e.target.value })}>
            <option value="">Select…</option>
            {INGESTION_INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </label>
        <label className="proto-field">
          <span>Related project</span>
          <select value={metadata.projectId} disabled={disabled} onChange={(e) => onChange({ projectId: e.target.value, researchId: e.target.value })}>
            <option value="">None</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      </div>
      <div className="proto-ingest-tags">
        <input value={tagInput} placeholder="Add tag" onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} />
        <button type="button" className="proto-btn proto-btn--secondary" onClick={addTag}>Add</button>
        <div className="proto-ingest-tags__list">
          {metadata.tags.map((t) => (
            <button key={t} type="button" className="proto-ingest-tag" onClick={() => onChange({ tags: metadata.tags.filter((x) => x !== t) })}>{t} ×</button>
          ))}
        </div>
      </div>
    </section>
  );
}
