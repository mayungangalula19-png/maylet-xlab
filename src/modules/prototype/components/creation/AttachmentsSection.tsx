import type { AttachmentItem, AttachmentKind, PrototypeCreationDraft } from '../../types/prototypeCreation.types';
import { newId } from '../../types/prototypeCreation.types';
import { ProtoSectionShell } from './ProtoSectionShell';

interface Props {
  draft: PrototypeCreationDraft;
  completion: number;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeCreationDraft>) => void;
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

export function AttachmentsSection({ draft, completion, disabled, onChange }: Props) {
  const update = (id: string, patch: Partial<AttachmentItem>) => {
    onChange({
      attachments: draft.attachments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    });
  };

  const add = (kind: AttachmentKind = 'other') => {
    onChange({
      attachments: [...draft.attachments, { id: newId(), kind, label: '', url: '', notes: '' }],
    });
  };

  const remove = (id: string) => {
    onChange({ attachments: draft.attachments.filter((a) => a.id !== id) });
  };

  return (
    <ProtoSectionShell
      id="attachments"
      title="Attachments & links"
      description="GitHub, Figma, documents, and media references."
      completion={completion}
    >
      {draft.attachments.length === 0 ? (
        <p className="proto-muted">No attachments yet. Add repository or design links.</p>
      ) : (
        <ul className="proto-attachment-list">
          {draft.attachments.map((a) => (
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
              <button type="button" className="proto-btn proto-btn--ghost proto-btn--sm" disabled={disabled} onClick={() => remove(a.id)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="proto-attachment-actions">
        {KINDS.slice(0, 4).map((k) => (
          <button key={k.id} type="button" className="proto-btn proto-btn--secondary proto-btn--sm" disabled={disabled} onClick={() => add(k.id)}>
            + {k.label}
          </button>
        ))}
      </div>
    </ProtoSectionShell>
  );
}
