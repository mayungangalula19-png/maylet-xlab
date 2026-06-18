import type { PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';
import type { AttachmentItem } from '../../types/prototypeCreation.types';

interface Props {
  meta: PrototypeBuilderMeta;
}

export function DocumentationViewer({ meta }: Props) {
  const hasDoc = meta.documentation.trim().length > 0;

  return (
    <section id="proto-preview-docs" className="proto-preview-section">
      <header className="proto-preview-section__head">
        <h2>Documentation</h2>
        <p>Technical notes and research references.</p>
      </header>
      {hasDoc ? (
        <div className="proto-preview-doc-body">
          <pre>{meta.documentation}</pre>
        </div>
      ) : (
        <p className="proto-muted">No documentation published yet.</p>
      )}
    </section>
  );
}

export function AttachmentsViewer({ meta }: Props) {
  if (meta.attachments.length === 0) {
    return (
      <section id="proto-preview-attachments" className="proto-preview-section">
        <header className="proto-preview-section__head">
          <h2>Attachments</h2>
          <p>Supporting files, repos, and design links.</p>
        </header>
        <p className="proto-muted">No attachments linked.</p>
      </section>
    );
  }

  return (
    <section id="proto-preview-attachments" className="proto-preview-section">
      <header className="proto-preview-section__head">
        <h2>Attachments</h2>
        <p>{meta.attachments.length} linked resource{meta.attachments.length === 1 ? '' : 's'}</p>
      </header>
      <ul className="proto-preview-attachments">
        {meta.attachments.map((a: AttachmentItem) => (
          <li key={a.id}>
            <span className="proto-preview-attachments__kind">{a.kind}</span>
            <div>
              <strong>{a.label || a.kind}</strong>
              {a.url ? (
                <a href={a.url} target="_blank" rel="noopener noreferrer">
                  {a.url}
                </a>
              ) : (
                <span className="proto-muted">No URL</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
