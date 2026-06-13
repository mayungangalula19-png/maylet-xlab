import { useRef } from 'react';
import type { ResearchDocument } from '../types/research.types';

interface Props {
  documents: ResearchDocument[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function DocumentUploader({ documents, onUpload, onDelete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="research-panel-header">
        <h2>Documents</h2>
        <button type="button" className="research-btn research-btn--primary" onClick={() => inputRef.current?.click()}>
          Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.pptx,.txt"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await onUpload(file);
            e.target.value = '';
          }}
        />
      </div>
      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginBottom: '1rem' }}>PDF, DOCX, PPTX, TXT</p>

      {documents.length === 0 ? (
        <p className="research-empty">No documents uploaded.</p>
      ) : (
        documents.map((d) => (
          <div key={d.id} className="research-doc-row">
            <div>
              <strong>{d.name}</strong>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>
                {d.file_type ?? 'file'} · {d.size_bytes ? `${Math.round(d.size_bytes / 1024)} KB` : '—'}
              </div>
            </div>
            <div className="research-doc-actions">
              {d.file_url ? <a href={d.file_url} target="_blank" rel="noreferrer">Preview</a> : null}
              {d.file_url ? <a href={d.file_url} download>Download</a> : null}
              <button type="button" onClick={() => onDelete(d.id)}>Delete</button>
            </div>
          </div>
        ))
      )}
    </>
  );
}
