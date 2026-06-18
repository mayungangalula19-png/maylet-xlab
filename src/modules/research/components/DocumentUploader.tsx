import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react';
import { documentService } from '../services/documentService';
import type { ResearchDocument } from '../types/research.types';

const ACCEPT = '.pdf,.docx,.pptx,.txt';
const MAX_BYTES = 25 * 1024 * 1024;

interface Props {
  documents: ResearchDocument[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  disabled?: boolean;
}

function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function fileIcon(name: string, fileType: string | null): string {
  const n = (name + (fileType ?? '')).toLowerCase();
  if (n.includes('pdf')) return '📕';
  if (n.includes('doc')) return '📘';
  if (n.includes('ppt')) return '📙';
  if (n.includes('txt')) return '📄';
  return '📎';
}

function extLabel(name: string, fileType: string | null): string {
  const match = name.match(/\.([a-z0-9]+)$/i);
  if (match) return match[1].toUpperCase();
  if (fileType?.includes('pdf')) return 'PDF';
  if (fileType?.includes('word')) return 'DOCX';
  if (fileType?.includes('presentation')) return 'PPTX';
  if (fileType?.includes('text')) return 'TXT';
  return 'FILE';
}

export function DocumentUploader({ documents, onUpload, onDelete, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...documents].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [documents]
  );

  const totalBytes = useMemo(
    () => documents.reduce((sum, d) => sum + (d.size_bytes ?? 0), 0),
    [documents]
  );

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      const typeErr = documentService.validateFile(file);
      if (typeErr) {
        setError(typeErr);
        return;
      }
      if (file.size > MAX_BYTES) {
        setError(`"${file.name}" exceeds the 25 MB limit.`);
        return;
      }

      setUploading(true);
      try {
        await onUpload(file);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || disabled || uploading) return;
      for (const file of Array.from(files)) {
        await processFile(file);
      }
    },
    [disabled, uploading, processFile]
  );

  const onDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      await handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDelete = useCallback(
    async (doc: ResearchDocument) => {
      if (!window.confirm(`Remove "${doc.name}" from research documents?`)) return;
      setError(null);
      setDeletingId(doc.id);
      try {
        await onDelete(doc.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Delete failed');
      } finally {
        setDeletingId(null);
      }
    },
    [onDelete]
  );

  const busy = disabled || uploading;

  return (
    <div className="research-docs">
      <div className="research-panel-header">
        <div>
          <h2>Research documents</h2>
          <p className="research-docs__summary">
            {documents.length} file{documents.length === 1 ? '' : 's'} · {formatBytes(totalBytes)} total
          </p>
        </div>
        <button
          type="button"
          className="research-btn research-btn--primary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : 'Upload file'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="research-docs__input"
          disabled={busy}
          onChange={async (e) => {
            await handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {error ? (
        <p className="research-docs__error" role="alert">
          {error}
          <button type="button" className="research-docs__error-dismiss" onClick={() => setError(null)}>
            Dismiss
          </button>
        </p>
      ) : null}

      <div
        className={`research-dropzone${dragOver ? ' research-dropzone--active' : ''}${busy ? ' research-dropzone--busy' : ''}`}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!busy) setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (e.currentTarget === e.target) setDragOver(false);
        }}
        onDrop={onDrop}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !busy) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={busy ? -1 : 0}
        aria-label="Upload research documents. Drag and drop or click to browse."
      >
        <span className="research-dropzone__icon" aria-hidden>
          📁
        </span>
        <strong>{dragOver ? 'Drop to upload' : 'Drag & drop files here'}</strong>
        <span className="research-dropzone__hint">PDF, DOCX, PPTX, TXT · max 25 MB each</span>
      </div>

      {sorted.length === 0 ? (
        <p className="research-empty research-docs__empty">
          No documents yet. Upload gate evidence, interview notes, or literature exports.
        </p>
      ) : (
        <ul className="research-docs__list">
          {sorted.map((d) => (
            <li key={d.id} className="research-doc-row">
              <div className="research-doc-row__main">
                <span className="research-doc-row__icon" aria-hidden>
                  {fileIcon(d.name, d.file_type)}
                </span>
                <div className="research-doc-row__body">
                  <div className="research-doc-row__title">
                    <strong title={d.name}>{d.name}</strong>
                    <span className="research-doc-row__badge">{extLabel(d.name, d.file_type)}</span>
                    {d.category ? (
                      <span className="research-doc-row__category">{d.category}</span>
                    ) : null}
                  </div>
                  <div className="research-doc-row__meta">
                    {formatBytes(d.size_bytes)} · Uploaded {formatDate(d.created_at)}
                    {d.description ? ` · ${d.description}` : ''}
                  </div>
                  {d.tags && d.tags.length > 0 ? (
                    <div className="research-doc-row__tags">
                      {d.tags.map((tag) => (
                        <span key={tag} className="research-doc-row__tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="research-doc-actions">
                {d.file_url ? (
                  <a href={d.file_url} target="_blank" rel="noreferrer">
                    Preview
                  </a>
                ) : null}
                {d.file_url ? (
                  <a href={d.file_url} download={d.name}>
                    Download
                  </a>
                ) : null}
                <button
                  type="button"
                  className="research-doc-actions__delete"
                  disabled={deletingId === d.id || busy}
                  onClick={() => void handleDelete(d)}
                >
                  {deletingId === d.id ? 'Removing…' : 'Delete'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
