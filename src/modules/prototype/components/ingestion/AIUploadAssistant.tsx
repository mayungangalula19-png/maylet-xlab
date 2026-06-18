import { useState } from 'react';
import type { AiIngestionAnalysis, PrototypeIngestionWorkspace } from '../../types/prototypeIngestion.types';
import type { IngestionReadiness } from '../../utils/ingestionCenter.utils';

type AiAction =
  | 'analyze'
  | 'documentation'
  | 'missing'
  | 'testing'
  | 'validation'
  | 'investor';

interface Props {
  workspace: PrototypeIngestionWorkspace;
  readiness: IngestionReadiness;
  analysis: AiIngestionAnalysis;
  prototypeName?: string;
  disabled?: boolean;
  onRunAnalysis: () => void;
  onApplyTags?: (tags: string[]) => void;
}

export function AIUploadAssistant({
  workspace,
  readiness,
  analysis,
  prototypeName,
  disabled,
  onRunAnalysis,
  onApplyTags,
}: Props) {
  const [output, setOutput] = useState<string | null>(null);

  const run = (action: AiAction) => {
    const name = workspace.metadata.name || prototypeName || 'Prototype';
    switch (action) {
      case 'analyze':
        onRunAnalysis();
        setOutput(analysis.summary || `Analyzing ${name}…`);
        break;
      case 'documentation':
        setOutput(`# ${name}\n\n${workspace.metadata.description || 'Documentation draft from ingested assets.'}\n\n## Features\n${analysis.features.map((f) => `- ${f}`).join('\n')}`);
        break;
      case 'missing':
        setOutput(
          [
            readiness.documentationScore < 70 ? 'Add README or product brief' : null,
            readiness.assetScore < 60 ? 'Upload ZIP build or screenshots' : null,
            workspace.githubImports.length === 0 ? 'Link GitHub repository' : null,
            workspace.figmaImports.length === 0 ? 'Import Figma screens' : null,
          ].filter(Boolean).join('\n') || 'Asset package looks complete.'
        );
        break;
      case 'testing':
        setOutput('Suggested: Functional smoke tests, usability walkthrough, performance baseline, security scan.');
        break;
      case 'validation':
        setOutput(`Validation checklist:\n- Documentation ${readiness.documentationScore}%\n- Assets ${readiness.assetScore}%\n- Testing readiness ${readiness.testingReadiness}%`);
        break;
      case 'investor':
        setOutput(`${name}: ${analysis.summary}\nTech: ${analysis.technologies.join(', ')}\nValidation readiness: ${readiness.validationScore}%`);
        break;
    }
  };

  const actions: { id: AiAction; label: string }[] = [
    { id: 'analyze', label: 'Analyze prototype' },
    { id: 'documentation', label: 'Generate documentation' },
    { id: 'missing', label: 'Suggest missing assets' },
    { id: 'testing', label: 'Suggest testing plan' },
    { id: 'validation', label: 'Validation checklist' },
    { id: 'investor', label: 'Investor summary' },
  ];

  return (
    <aside className="proto-ingest-ai" aria-label="AI upload assistant">
      <h2>AI ingestion assistant</h2>
      <div className="proto-ingest-ai__actions">
        {actions.map((a) => (
          <button key={a.id} type="button" className="proto-ingest-ai__btn" disabled={disabled} onClick={() => run(a.id)}>
            {a.label}
          </button>
        ))}
      </div>
      {analysis.analyzedAt ? (
        <div className="proto-ingest-ai__insights">
          <h3>Latest analysis</h3>
          <p>{analysis.summary}</p>
          {analysis.riskIndicators.length > 0 ? (
            <ul>{analysis.riskIndicators.map((r) => <li key={r}>{r}</li>)}</ul>
          ) : null}
        </div>
      ) : null}
      {output ? (
        <div className="proto-ingest-ai__output">
          <pre>{output}</pre>
          {onApplyTags && analysis.suggestedTags.length > 0 ? (
            <button type="button" className="proto-btn proto-btn--secondary" onClick={() => onApplyTags(analysis.suggestedTags)}>
              Apply suggested tags
            </button>
          ) : null}
        </div>
      ) : (
        <p className="proto-muted">Run AI actions after uploading assets.</p>
      )}
    </aside>
  );
}
