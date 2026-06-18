import { useMemo, useState } from 'react';
import type { PrototypeCreationDraft } from '../../types/prototypeCreation.types';

type AiAction =
  | 'improve_description'
  | 'feature_ideas'
  | 'validation_checklist'
  | 'documentation'
  | 'investor_summary';

const ACTIONS: { id: AiAction; label: string; icon: string }[] = [
  { id: 'improve_description', label: 'Improve description', icon: '✨' },
  { id: 'feature_ideas', label: 'Feature ideas', icon: '⚡' },
  { id: 'validation_checklist', label: 'Validation checklist', icon: '✅' },
  { id: 'documentation', label: 'Documentation draft', icon: '📄' },
  { id: 'investor_summary', label: 'Investor summary', icon: '💰' },
];

interface Props {
  draft: PrototypeCreationDraft;
  disabled?: boolean;
  onApply?: (patch: Partial<PrototypeCreationDraft>) => void;
}

function generateOutput(action: AiAction, draft: PrototypeCreationDraft): string {
  const name = draft.name.trim() || 'This prototype';
  switch (action) {
    case 'improve_description':
      return `${name} addresses ${draft.problemStatement.trim() || 'a defined user problem'} for ${draft.targetUsers.trim() || 'target users'}. ${draft.solutionOverview.trim() || 'The solution delivers a testable MVP to validate core assumptions before scaling.'}`;
    case 'feature_ideas':
      return [
        'Onboarding flow with role-based setup',
        'Core workflow dashboard',
        'Feedback capture widget',
        'Analytics events for key actions',
        'Admin configuration panel',
      ].join('\n• ');
    case 'validation_checklist':
      return [
        'Problem interview notes linked',
        '≥3 user test sessions scheduled',
        'Success metrics defined',
        'Failure criteria documented',
        'Gate review evidence attached',
      ].join('\n☐ ');
    case 'documentation':
      return `# ${name}\n\n## Problem\n${draft.problemStatement || 'TBD'}\n\n## Solution\n${draft.solutionOverview || 'TBD'}\n\n## Architecture\nFrontend: ${draft.frontendStack || 'TBD'}\nBackend: ${draft.backendStack || 'TBD'}`;
    case 'investor_summary':
      return `${name} targets ${draft.marketNeed.trim() || 'a large underserved market'} with ${draft.keyInnovation.trim() || 'a differentiated approach'}. Competitive edge: ${draft.competitiveAdvantage.trim() || 'speed to validated learning'}.`;
    default:
      return '';
  }
}

export function AIPrototypeAssistant({ draft, disabled, onApply }: Props) {
  const [output, setOutput] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<AiAction | null>(null);

  const contextSummary = useMemo(
    () =>
      [
        draft.name ? `Name: ${draft.name}` : null,
        draft.features.length ? `${draft.features.length} features` : null,
        draft.problemStatement ? 'Problem defined' : 'Problem pending',
      ]
        .filter(Boolean)
        .join(' · '),
    [draft]
  );

  const run = (action: AiAction) => {
    setLastAction(action);
    setOutput(generateOutput(action, draft));
  };

  const applyDescription = () => {
    if (!output || lastAction !== 'improve_description') return;
    onApply?.({ description: output });
  };

  return (
    <aside className="proto-ai-panel" aria-label="AI Prototype Assistant">
      <header className="proto-ai-panel__head">
        <h2>AI assistant</h2>
        <p>{contextSummary || 'Add prototype details for richer suggestions'}</p>
      </header>
      <div className="proto-ai-panel__actions">
        {ACTIONS.map((a) => (
          <button key={a.id} type="button" className="proto-ai-panel__action" disabled={disabled} onClick={() => run(a.id)}>
            <span aria-hidden>{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>
      {output ? (
        <div className="proto-ai-panel__output">
          <pre>{output}</pre>
          {lastAction === 'improve_description' && onApply ? (
            <button type="button" className="proto-btn proto-btn--secondary proto-btn--sm" disabled={disabled} onClick={applyDescription}>
              Apply to description
            </button>
          ) : null}
        </div>
      ) : (
        <p className="proto-muted">Run an action to generate prototype guidance.</p>
      )}
    </aside>
  );
}
