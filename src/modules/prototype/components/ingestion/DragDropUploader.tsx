import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  formatPrototypeFileSize,
  getPrototypeFileExtension,
  PROTOTYPE_ALLOWED_EXTENSIONS,
  PROTOTYPE_UPLOAD_MAX_BYTES,
} from '../../types/prototype.types';
import { validateIngestionFile } from '../../utils/ingestionCenter.utils';

interface Props {
  disabled?: boolean;
  onUpload: (file: File) => Promise<void>;
}

export function DragDropUploader({ disabled, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const accept = PROTOTYPE_ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',');

  const select = (file: File | null) => {
    if (!file) return;
    try {
      validateIngestionFile(file);
      setPending(file);
      setStatus('idle');
      setMessage(null);
    } catch (err) {
      setPending(null);
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Invalid file');
    }
  };

  const handleUpload = async () => {
    if (!pending) return;
    setStatus('uploading');
    setProgress(10);
    const timer = window.setInterval(() => setProgress((p) => Math.min(p + 8, 92)), 200);
    try {
      await onUpload(pending);
      setProgress(100);
      setPending(null);
      setMessage(`"${pending.name}" ingested successfully`);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      window.clearInterval(timer);
    }
  };

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    select(e.dataTransfer.files[0] ?? null);
  }, []);

  return (
    <section className="proto-ingest-panel">
      <header className="proto-ingest-panel__head">
        <h2>Upload center</h2>
        <span className="proto-muted">Max {formatPrototypeFileSize(PROTOTYPE_UPLOAD_MAX_BYTES)} · Malware scan on ingest</span>
      </header>

      <div
        className={`proto-ingest-dropzone${dragOver ? ' proto-ingest-dropzone--active' : ''}${status === 'uploading' ? ' proto-ingest-dropzone--busy' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input ref={inputRef} type="file" accept={accept} className="proto-upload__input" disabled={disabled || status === 'uploading'} onChange={(e: ChangeEvent<HTMLInputElement>) => { select(e.target.files?.[0] ?? null); e.target.value = ''; }} />
        <span className="proto-ingest-dropzone__icon">⬆</span>
        <p><strong>Drag & drop prototype assets</strong></p>
        <p className="proto-muted">Images · Documents · Media · Archives</p>
      </div>

      {pending ? (
        <div className="proto-ingest-pending">
          <div>
            <strong>{pending.name}</strong>
            <span>{formatPrototypeFileSize(pending.size)} · .{getPrototypeFileExtension(pending.name)}</span>
          </div>
          <div className="proto-ingest-pending__actions">
            <button type="button" className="proto-btn proto-btn--ghost" onClick={() => setPending(null)} disabled={status === 'uploading'}>Remove</button>
            <button type="button" className="proto-btn proto-btn--primary" onClick={handleUpload} disabled={disabled || status === 'uploading'}>
              {status === 'uploading' ? 'Ingesting…' : 'Start ingestion'}
            </button>
          </div>
        </div>
      ) : null}

      {status === 'uploading' ? (
        <div className="proto-ingest-progress">
          <div className="proto-ingest-progress__bar" style={{ width: `${progress}%` }} />
          <span>{progress}%</span>
        </div>
      ) : null}

      {message ? <p className={status === 'error' ? 'proto-error' : 'proto-ingest-success'}>{message}</p> : null}
    </section>
  );
}
