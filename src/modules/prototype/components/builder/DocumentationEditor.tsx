import type { PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';

interface Props {
  meta: PrototypeBuilderMeta;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeBuilderMeta>) => void;
}

const DOC_TEMPLATES = [
  { label: 'Technical spec', content: '# Technical specification\n\n## Overview\n\n## Architecture\n\n## API contracts\n\n## Deployment\n' },
  { label: 'Research brief', content: '# Research references\n\n## Problem evidence\n\n## Key findings\n\n## Open questions\n' },
];

export function DocumentationEditor({ meta, disabled, onChange }: Props) {
  const wordCount = meta.documentation.trim() ? meta.documentation.trim().split(/\s+/).length : 0;

  return (
    <section id="proto-builder-documentation" className="proto-builder-panel">
      <header className="proto-builder-panel__head">
        <div>
          <h2>Documentation</h2>
          <p>Markdown editor for technical notes, research references, and prototype docs.</p>
        </div>
        <span className="proto-builder-doc-count">{wordCount} words</span>
      </header>

      <div className="proto-builder-doc-templates">
        {DOC_TEMPLATES.map((t) => (
          <button
            key={t.label}
            type="button"
            className="proto-btn proto-btn--ghost"
            disabled={disabled}
            onClick={() => onChange({ documentation: meta.documentation ? `${meta.documentation}\n\n${t.content}` : t.content })}
          >
            + {t.label}
          </button>
        ))}
      </div>

      <div className="proto-builder-doc-split">
        <div className="proto-field">
          <label htmlFor="builder-doc">Markdown source</label>
          <textarea
            id="builder-doc"
            className="proto-builder-doc-editor"
            rows={16}
            value={meta.documentation}
            disabled={disabled}
            placeholder="# Prototype documentation&#10;&#10;## Problem&#10;&#10;## Solution&#10;&#10;## Technical notes"
            onChange={(e) => onChange({ documentation: e.target.value })}
          />
        </div>
        <div className="proto-builder-doc-preview">
          <h3>Preview</h3>
          <div className="proto-builder-doc-preview__body">
            {meta.documentation.trim() ? (
              <pre>{meta.documentation}</pre>
            ) : (
              <p className="proto-muted">Preview appears as you write.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
