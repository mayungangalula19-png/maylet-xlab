import { useState } from 'react';
import type { IngestionVersion } from '../../types/prototypeIngestion.types';

interface Props {
  versions: IngestionVersion[];
  disabled?: boolean;
  onAdd: (label: string, notes: string) => void;
}

export function VersionManager({ versions, disabled, onAdd }: Props) {
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <section className="proto-ingest-panel">
      <header className="proto-ingest-panel__head">
        <h2>Version management</h2>
        <p>Initial upload · New versions · History</p>
      </header>
      <div className="proto-form-grid proto-form-grid--2">
        <input value={label} placeholder="Version label (e.g. v1.0)" onChange={(e) => setLabel(e.target.value)} />
        <input value={notes} placeholder="Release notes" onChange={(e) => setNotes(e.target.value)} />
        <button
          type="button"
          className="proto-btn proto-btn--secondary"
          disabled={disabled || !label.trim()}
          onClick={() => { onAdd(label, notes); setLabel(''); setNotes(''); }}
        >
          Record version
        </button>
      </div>
      {versions.length === 0 ? (
        <p className="proto-muted">No versions recorded. Upload assets then snapshot a version.</p>
      ) : (
        <ul className="proto-ingest-version-list">
          {versions.map((v, i) => (
            <li key={v.id}>
              <strong>{v.label}</strong>
              <span>{v.assetCount} assets · {new Date(v.createdAt).toLocaleString()}</span>
              {v.notes ? <p>{v.notes}</p> : null}
              {i > 0 ? <em className="proto-muted">Compare with {versions[i - 1]?.label}</em> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
