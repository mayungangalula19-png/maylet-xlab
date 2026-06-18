import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  formatScreenshotDocumentation,
  generateScreenshotDescription,
} from '../ai/screenshotDescription.service';
import { screenshotService } from '../services/screenshotService';
import type { PrototypeScreenshot, ScreenshotCategory } from '../types/prototype.types';
import { SCREENSHOT_CATEGORIES } from '../types/prototype.types';
import { PrototypeImageGallery } from './PrototypeImageGallery';

interface Props {
  prototypeId: string;
  userId: string;
  prototypeName: string;
  screenshots: PrototypeScreenshot[];
  onChange: () => void;
}

export function VisualProofSection({
  prototypeId,
  userId,
  prototypeName,
  screenshots,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [category, setCategory] = useState<ScreenshotCategory>('ui');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, GIF, WebP)');
      return;
    }
    setPendingFile(file);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
    }
    setError(null);
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

  const handleUpload = async (withAi: boolean) => {
    if (!pendingFile) {
      setError('Select an image to upload');
      return;
    }
    if (!title.trim()) {
      setError('Enter a title for this screenshot');
      return;
    }

    setUploading(true);
    setGenerating(withAi);
    setError(null);
    setMessage(null);

    try {
      let description;
      if (withAi) {
        description = await generateScreenshotDescription({ title: title.trim(), context, category });
      }

      await screenshotService.upload(prototypeId, userId, pendingFile, {
        title: description?.title ?? title.trim(),
        category,
        context,
        description,
        isHero: screenshots.length === 0,
      });

      setMessage(
        withAi && description
          ? `Uploaded with AI documentation:\n${formatScreenshotDocumentation(description).slice(0, 120)}…`
          : 'Screenshot added to visual proof gallery'
      );
      setPendingFile(null);
      setTitle('');
      setContext('');
      onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      setGenerating(false);
    }
  };

  const handleSetHero = useCallback(
    async (id: string) => {
      try {
        await screenshotService.setHero(prototypeId, id);
        onChange();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to set hero image');
      }
    },
    [prototypeId, onChange]
  );

  const handleRemove = async (id: string) => {
    if (!window.confirm('Remove this screenshot from the gallery?')) return;
    try {
      await screenshotService.remove(id, prototypeId);
      onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <section className="proto-panel proto-visual-proof">
      <header className="proto-visual-proof__header">
        <div>
          <h2>Visual Proof Gallery</h2>
          <p>
            Showcase UI screenshots, user flows, and architecture diagrams as professional prototype evidence.
          </p>
        </div>
        <span className="proto-visual-proof__count">{screenshots.length} image{screenshots.length === 1 ? '' : 's'}</span>
      </header>

      <PrototypeImageGallery
        screenshots={screenshots}
        prototypeName={prototypeName}
        editable
        onSetHero={handleSetHero}
      />

      <div
        className={`proto-visual-proof__dropzone ${dragOver ? 'proto-visual-proof__dropzone--active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="proto-upload__input"
          onChange={handleBrowse}
          disabled={uploading}
        />
        <p className="proto-visual-proof__drop-title">Add prototype screenshot</p>
        <p className="proto-visual-proof__drop-sub">Drag & drop or click · PNG, JPG, GIF, WebP · max 10 MB</p>
      </div>

      {pendingFile ? (
        <div className="proto-visual-proof__form">
          <div className="proto-form-grid proto-visual-proof__fields">
            <label>
              Title
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Project Dashboard Overview"
                disabled={uploading}
              />
            </label>
            <label>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value as ScreenshotCategory)} disabled={uploading}>
                {SCREENSHOT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="proto-visual-proof__context-label">
            Context (optional)
            <textarea
              className="proto-textarea"
              rows={2}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="What this screen demonstrates in your prototype…"
              disabled={uploading}
            />
          </label>
          <div className="proto-visual-proof__preview">
            <img src={URL.createObjectURL(pendingFile)} alt="" />
            <span>{pendingFile.name}</span>
          </div>
          <div className="proto-visual-proof__actions">
            <button
              type="button"
              className="proto-btn proto-btn--ghost"
              onClick={() => setPendingFile(null)}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="proto-btn proto-btn--secondary"
              onClick={() => handleUpload(false)}
              disabled={uploading}
            >
              {uploading && !generating ? 'Uploading…' : 'Upload only'}
            </button>
            <button
              type="button"
              className="proto-btn proto-btn--primary"
              onClick={() => handleUpload(true)}
              disabled={uploading}
            >
              {generating ? 'Generating AI docs…' : 'Upload + AI description'}
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="proto-error">{error}</p> : null}
      {message ? <p className="proto-upload__success">{message}</p> : null}

      {screenshots.length > 0 ? (
        <ul className="proto-visual-proof__manage">
          {screenshots.map((s) => (
            <li key={s.id}>
              <img src={s.url} alt="" loading="lazy" />
              <div>
                <strong>{s.title}</strong>
                <span>{s.category}{s.isHero ? ' · Hero' : ''}</span>
              </div>
              <button type="button" className="proto-btn proto-btn--ghost" onClick={() => handleRemove(s.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
