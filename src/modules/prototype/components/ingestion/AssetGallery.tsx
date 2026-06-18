import { useState } from 'react';
import { formatPrototypeFileSize } from '../../types/prototype.types';
import type { IngestionAsset } from '../../types/prototypeIngestion.types';

type ViewMode = 'grid' | 'list' | 'thumb';

interface Props {
  assets: IngestionAsset[];
}

const KIND_ICON: Record<string, string> = {
  image: '🖼',
  document: '📄',
  media: '🎬',
  archive: '📦',
  code: '🐙',
  design: '🎨',
};

export function AssetGallery({ assets }: Props) {
  const [view, setView] = useState<ViewMode>('grid');
  const [preview, setPreview] = useState<IngestionAsset | null>(null);

  return (
    <section className="proto-ingest-panel">
      <header className="proto-ingest-panel__head">
        <h2>Visual asset gallery</h2>
        <div className="proto-ingest-view-toggle">
          {(['grid', 'list', 'thumb'] as const).map((v) => (
            <button key={v} type="button" className={view === v ? 'proto-ingest-view-toggle--active' : ''} onClick={() => setView(v)}>{v}</button>
          ))}
        </div>
      </header>

      {assets.length === 0 ? (
        <p className="proto-muted">No assets ingested yet. Upload files or import from GitHub/Figma.</p>
      ) : (
        <ul className={`proto-ingest-gallery proto-ingest-gallery--${view}`}>
          {assets.map((a) => (
            <li key={a.id}>
              <button type="button" className="proto-ingest-gallery__card" onClick={() => setPreview(a)}>
                <span className="proto-ingest-gallery__icon">{KIND_ICON[a.kind] ?? '📎'}</span>
                <strong>{a.name}</strong>
                <span>{formatPrototypeFileSize(a.size)} · {a.status}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {preview ? (
        <div className="proto-ingest-modal" role="dialog" aria-modal="true">
          <div className="proto-ingest-modal__backdrop" onClick={() => setPreview(null)} />
          <div className="proto-ingest-modal__content">
            <header>
              <h3>{preview.name}</h3>
              <button type="button" className="proto-btn proto-btn--ghost" onClick={() => setPreview(null)}>Close</button>
            </header>
            <p>{formatPrototypeFileSize(preview.size)} · {preview.kind} · {preview.status}</p>
            {preview.url && preview.kind === 'image' ? (
              <img src={preview.url} alt={preview.name} className="proto-ingest-modal__img" />
            ) : (
              <p className="proto-muted">Preview available after processing completes.</p>
            )}
            {preview.url ? (
              <a href={preview.url} target="_blank" rel="noreferrer" className="proto-btn proto-btn--secondary">Open fullscreen</a>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
