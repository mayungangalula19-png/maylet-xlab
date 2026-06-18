import { Link } from 'react-router-dom';
import { INGESTION_FORMAT_GROUPS } from '../../types/prototypeIngestion.types';
import type { IngestionKPIs } from '../../utils/ingestionCenter.utils';

interface Props {
  onUpload: () => void;
  onGitHub: () => void;
  onFigma: () => void;
  onDrive: () => void;
  onLocal: () => void;
}

export function UploadExecutiveHeader({ onUpload, onGitHub, onFigma, onDrive, onLocal }: Props) {
  return (
    <header className="proto-ingest-executive">
      <div>
        <nav className="proto-breadcrumb">
          <Link to="/prototypes">Prototypes</Link>
          <span>/</span>
          <span>Import & ingestion</span>
        </nav>
        <h1>Prototype Import & Ingestion Center</h1>
        <p className="proto-ingest-executive__sub">
          Gateway for external and internal prototypes entering the MAYLET X LAB ecosystem
        </p>
        <div className="proto-ingest-formats">
          {INGESTION_FORMAT_GROUPS.map((g) => (
            <span key={g.label}>
              <strong>{g.label}:</strong> {g.formats.join(', ')}
            </span>
          ))}
        </div>
      </div>
      <div className="proto-ingest-executive__actions">
        <button type="button" className="proto-btn proto-btn--primary" onClick={onUpload}>Upload files</button>
        <button type="button" className="proto-btn proto-btn--secondary" onClick={onGitHub}>Import GitHub</button>
        <button type="button" className="proto-btn proto-btn--secondary" onClick={onFigma}>Import Figma</button>
        <button type="button" className="proto-btn proto-btn--ghost" onClick={onDrive}>Google Drive</button>
        <button type="button" className="proto-btn proto-btn--ghost" onClick={onLocal}>Local storage</button>
      </div>
    </header>
  );
}

export function UploadCommandCenter({ kpis }: { kpis: IngestionKPIs }) {
  const cards = [
    { label: 'Total assets', value: kpis.totalAssets },
    { label: 'Ready', value: kpis.readyAssets },
    { label: 'Failed', value: kpis.failedAssets, warn: kpis.failedAssets > 0 },
    { label: 'GitHub imports', value: kpis.githubImports },
    { label: 'Figma imports', value: kpis.figmaImports },
    { label: 'Versions', value: kpis.versionCount },
  ];

  return (
    <section className="proto-ingest-kpis" aria-label="Ingestion KPIs">
      {cards.map((c) => (
        <article key={c.label} className={`proto-ingest-kpi${c.warn ? ' proto-ingest-kpi--warn' : ''}`}>
          <strong>{c.value}</strong>
          <span>{c.label}</span>
        </article>
      ))}
    </section>
  );
}
