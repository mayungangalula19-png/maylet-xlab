import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { uploadPrototypeBuild } from '../services/prototypeService';
import {
  formatPrototypeFileSize,
  getPrototypeFileExtension,
  PROTOTYPE_ALLOWED_EXTENSIONS,
  PROTOTYPE_UPLOAD_MAX_BYTES,
  validatePrototypeUploadFile,
  type PrototypeFile,
} from '../types/prototype.types';

interface Props {
  prototypeId: string;
  files: PrototypeFile[];
  onUploaded: (file: PrototypeFile) => void;
  maxSizeBytes?: number;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

function fileIcon(ext: string): string {
  const icons: Record<string, string> = {
    zip: '📦',
    pdf: '📄',
    docx: '📝',
    pptx: '📊',
    apk: '📱',
    txt: '📋',
  };
  return icons[ext] ?? '📎';
}

function formatUploadedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PrototypeUpload({ prototypeId, files, onUploaded, maxSizeBytes = PROTOTYPE_UPLOAD_MAX_BYTES }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const acceptTypes = PROTOTYPE_ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',');

  const selectFile = (file: File | null) => {
    if (!file) return;
    try {
      validatePrototypeUploadFile(file, maxSizeBytes);
      setPendingFile(file);
      setStatus('idle');
      setMessage(null);
    } catch (err) {
      setPendingFile(null);
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Invalid file');
    }
  };

  const handleBrowse = (e: ChangeEvent<HTMLInputElement>) => {
    selectFile(e.target.files?.[0] ?? null);
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    selectFile(e.dataTransfer.files[0] ?? null);
  };

  const stopProgress = useCallback(() => {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopProgress(), [stopProgress]);

  const simulateProgress = useCallback(() => {
    stopProgress();
    setProgress(0);
    progressTimerRef.current = window.setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + Math.random() * 12));
    }, 180);
  }, [stopProgress]);

  const handleUpload = async () => {
    if (!pendingFile) {
      setStatus('error');
      setMessage('Please select a file to upload');
      return;
    }

    setStatus('uploading');
    setMessage(null);
    simulateProgress();

    try {
      const uploaded = await uploadPrototypeBuild(prototypeId, pendingFile, { maxSizeBytes });
      stopProgress();
      setProgress(100);
      setStatus('success');
      setMessage(`"${uploaded.fileName}" uploaded successfully`);
      setPendingFile(null);
      onUploaded(uploaded);
    } catch (err) {
      stopProgress();
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Upload failed');
      setProgress(0);
    }
  };

  const clearPending = () => {
    setPendingFile(null);
    setProgress(0);
    setStatus('idle');
    setMessage(null);
  };

  return (
    <section className="proto-upload">
      <header className="proto-upload__header">
        <div>
          <h3>Upload Build</h3>
          <p>Attach real-world proof of your innovation — code bundles, docs, decks, or mobile builds.</p>
        </div>
        <span className="proto-upload__limit">Max {formatPrototypeFileSize(maxSizeBytes)}</span>
      </header>

      <div
        className={`proto-upload__dropzone ${dragOver ? 'proto-upload__dropzone--active' : ''} ${status === 'uploading' ? 'proto-upload__dropzone--busy' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (status !== 'uploading') setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => status !== 'uploading' && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptTypes}
          className="proto-upload__input"
          onChange={handleBrowse}
          disabled={status === 'uploading'}
        />
        <div className="proto-upload__dropzone-inner">
          <span className="proto-upload__icon">⬆</span>
          <p className="proto-upload__title">Drag & drop your build here</p>
          <p className="proto-upload__subtitle">or click to browse files</p>
          <p className="proto-upload__formats">
            {PROTOTYPE_ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(' · ')}
          </p>
        </div>
      </div>

      {pendingFile && (
        <div className="proto-upload__pending">
          <div className="proto-upload__pending-info">
            <span>{fileIcon(getPrototypeFileExtension(pendingFile.name))}</span>
            <div>
              <strong>{pendingFile.name}</strong>
              <span>{formatPrototypeFileSize(pendingFile.size)}</span>
            </div>
          </div>
          <div className="proto-upload__pending-actions">
            <button type="button" className="proto-btn proto-btn--ghost" onClick={clearPending} disabled={status === 'uploading'}>
              Remove
            </button>
            <button type="button" className="proto-btn proto-btn--primary" onClick={handleUpload} disabled={status === 'uploading'}>
              {status === 'uploading' ? 'Uploading…' : 'Upload file'}
            </button>
          </div>
        </div>
      )}

      {status === 'uploading' && (
        <div className="proto-upload__progress">
          <div className="proto-upload__progress-bar" style={{ width: `${Math.min(progress, 100)}%` }} />
          <span>{Math.round(Math.min(progress, 100))}%</span>
        </div>
      )}

      {message && (
        <p className={status === 'error' ? 'proto-error' : 'proto-upload__success'}>{message}</p>
      )}

      <div className="proto-upload__list">
        <h4>Uploaded files ({files.length})</h4>
        {files.length === 0 ? (
          <p className="proto-upload__empty">No build files yet. Upload your first artifact above.</p>
        ) : (
          <ul>
            {files.map((f) => {
              const ext = getPrototypeFileExtension(f.fileName);
              return (
                <li key={f.id} className="proto-upload__file">
                  <span className="proto-upload__file-icon">{fileIcon(ext)}</span>
                  <div className="proto-upload__file-meta">
                    <strong>{f.fileName}</strong>
                    <span>
                      {formatPrototypeFileSize(f.fileSize)} · {f.fileType || ext} · {formatUploadedAt(f.uploadedAt)}
                    </span>
                  </div>
                  <span className="proto-upload__file-status proto-upload__file-status--done">Uploaded</span>
                  {f.url ? (
                    <a href={f.url} target="_blank" rel="noreferrer" className="proto-btn proto-btn--ghost proto-upload__download">
                      Download
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
