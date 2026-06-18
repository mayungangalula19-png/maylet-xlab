import type { AttachmentItem, AttachmentKind } from '../../types/prototypeCreation.types';
import { newId } from '../../types/prototypeCreation.types';
import type { PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';

interface Props {
  meta: PrototypeBuilderMeta;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeBuilderMeta>) => void;
}

const KINDS: { id: AttachmentKind; label: string }[] = [
  { id: 'github', label: 'GitHub' },
  { id: 'figma', label: 'Figma' },
  { id: 'pdf', label: 'PDF' },
  { id: 'docx', label: 'DOCX' },
  { id: 'pptx', label: 'PPTX' },
  { id: 'video', label: 'Video' },
  { id: 'image', label: 'Image' },
  { id: 'other', label: 'Other' },
];

export function BuilderAttachments({ meta, disabled, onChange }: Props) {
  const update = (id: string, patch: Partial<AttachmentItem>) => {
    onChange({
      attachments: meta.attachments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    });
  };

  const add = (kind: AttachmentKind = 'other') => {
    onChange({
      attachments: [...meta.attachments, { id: newId(), kind, label: '', url: '', notes: '' }],
    });
  };

  const remove = (id: string) => {
    onChange({ attachments: meta.attachments.filter((a) => a.id !== id) });
  };

  return (
    <section id="proto-builder-attachments" className="proto-builder-panel">
      <header className="proto-builder-panel__head">
        <h2>Attachments & links</h2>
        <p>GitHub, Figma, documents, videos, and media references.</p>
      </header>

      {meta.attachments.length === 0 ? (
        <p className="proto-muted">No attachments yet.</p>
      ) : (
        <ul className="proto-attachment-list">
          {meta.attachments.map((a) => (
            <li key={a.id} className="proto-attachment-row">
              <select value={a.kind} disabled={disabled} onChange={(e) => update(a.id, { kind: e.target.value as AttachmentKind })}>
                {KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
              <input value={a.label} disabled={disabled} placeholder="Label" onChange={(e) => update(a.id, { label: e.target.value })} />
              <input value={a.url} disabled={disabled} placeholder="URL" onChange={(e) => update(a.id, { url: e.target.value })} />
              <button type="button" className="proto-btn proto-btn--ghost" disabled={disabled} onClick={() => remove(a.id)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="proto-attachment-actions">
        {KINDS.slice(0, 5).map((k) => (
          <button key={k.id} type="button" className="proto-btn proto-btn--secondary" disabled={disabled} onClick={() => add(k.id)}>
            + {k.label}
          </button>
        ))}
      </div>
    </section>
  );
}
