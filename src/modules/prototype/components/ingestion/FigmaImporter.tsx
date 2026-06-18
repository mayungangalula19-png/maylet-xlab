import { useState } from 'react';
import type { FigmaImport } from '../../types/prototypeIngestion.types';

interface Props {
  imports: FigmaImport[];
  disabled?: boolean;
  onImport: (url: string) => Promise<void>;
}

export function FigmaImporter({ imports, disabled, onImport }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      await onImport(url.trim());
      setUrl('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="proto-ingest-panel">
      <header className="proto-ingest-panel__head">
        <h2>Figma importer</h2>
        <p>Frame extraction · Design metadata · Screen inventory</p>
      </header>
      <div className="proto-ingest-import-row">
        <input value={url} placeholder="https://figma.com/file/…" onChange={(e) => setUrl(e.target.value)} disabled={disabled || loading} />
        <button type="button" className="proto-btn proto-btn--primary" disabled={disabled || loading || !url.trim()} onClick={submit}>
          {loading ? 'Extracting…' : 'Import Figma file'}
        </button>
      </div>
      {imports.length === 0 ? (
        <p className="proto-muted">No Figma imports yet.</p>
      ) : (
        <ul className="proto-ingest-import-list">
          {imports.map((f) => (
            <li key={f.id} className="proto-ingest-import-card">
              <header>
                <strong>{f.figmaUrl}</strong>
                <span className={`proto-ingest-status proto-ingest-status--${f.status}`}>{f.status}</span>
              </header>
              <p>{f.metadata}</p>
              <p><strong>{f.frameCount}</strong> frames</p>
              <ul className="proto-ingest-screens">
                {f.screens.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
