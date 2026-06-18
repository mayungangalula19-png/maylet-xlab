import { useState } from 'react';
import type { GitHubImport } from '../../types/prototypeIngestion.types';

interface Props {
  imports: GitHubImport[];
  disabled?: boolean;
  onImport: (url: string) => Promise<void>;
}

export function GitHubImporter({ imports, disabled, onImport }: Props) {
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
        <h2>GitHub importer</h2>
        <p>Repository analysis · README extraction · Tech stack detection</p>
      </header>
      <div className="proto-ingest-import-row">
        <input value={url} placeholder="https://github.com/org/repo" onChange={(e) => setUrl(e.target.value)} disabled={disabled || loading} />
        <button type="button" className="proto-btn proto-btn--primary" disabled={disabled || loading || !url.trim()} onClick={submit}>
          {loading ? 'Analyzing…' : 'Import repository'}
        </button>
      </div>
      {imports.length === 0 ? (
        <p className="proto-muted">No GitHub imports yet.</p>
      ) : (
        <ul className="proto-ingest-import-list">
          {imports.map((g) => (
            <li key={g.id} className="proto-ingest-import-card">
              <header>
                <strong>{g.repoUrl}</strong>
                <span className={`proto-ingest-status proto-ingest-status--${g.status}`}>{g.status}</span>
              </header>
              <p>{g.summary}</p>
              <div className="proto-ingest-tech">
                {g.techStack.map((t) => <span key={t}>{t}</span>)}
              </div>
              <pre className="proto-ingest-code">{g.structure}</pre>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
