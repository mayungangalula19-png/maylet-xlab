import { useMemo, useState } from 'react';
import type { PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';
import type { PrototypeAiEvaluation, ResearchLinkSummary } from '../../types/prototype.types';
import { ResearchLinkPanel } from '../ResearchLinkPanel';
import { AIPrototypeAssistant } from '../creation/AIPrototypeAssistant';

type BuilderAiAction =
  | 'improve_description'
  | 'feature_ideas'
  | 'architecture'
  | 'validation_plan'
  | 'investor_summary'
  | 'tech_docs';

const EXTRA_ACTIONS: { id: BuilderAiAction; label: string; icon: string }[] = [
  { id: 'architecture', label: 'Architecture suggestions', icon: '🏗️' },
  { id: 'validation_plan', label: 'Validation plan', icon: '📊' },
  { id: 'tech_docs', label: 'Technical documentation', icon: '📝' },
];

interface Props {
  meta: PrototypeBuilderMeta;
  researchSummary: ResearchLinkSummary | null;
  prototypeName: string;
  aiEval: PrototypeAiEvaluation | null;
  disabled?: boolean;
  onApply: (patch: Partial<PrototypeBuilderMeta>) => void;
}

function generateBuilderOutput(action: BuilderAiAction, meta: PrototypeBuilderMeta): string {
  const name = meta.name.trim() || 'Prototype';
  switch (action) {
    case 'architecture':
      return [
        `Frontend: ${meta.frontendStack || 'React + TypeScript recommended'}`,
        `Backend: ${meta.backendStack || 'Node/Supabase edge functions'}`,
        `Database: ${meta.database || 'PostgreSQL with RLS'}`,
        `AI: ${meta.aiIntegrations || 'LLM assistant via Maya'}`,
      ].join('\n');
    case 'validation_plan':
      return [
        'Week 1: Problem interviews (n≥5)',
        'Week 2: Usability tests on core flow',
        'Week 3: A/B on key feature',
        'Metrics: activation, task success, NPS',
        `Target validation score: ${meta.validation.validationScore ?? 70}%`,
      ].join('\n☐ ');
    case 'tech_docs':
      return meta.documentation.trim() || `# ${name} — Technical Documentation\n\n## Stack\n${meta.frontendStack}\n${meta.backendStack}\n\n## Services\n${meta.serviceInventory || 'TBD'}`;
    default:
      return '';
  }
}

export function BuilderAIPanel({
  meta,
  researchSummary,
  prototypeName,
  aiEval,
  disabled,
  onApply,
}: Props) {
  const [extraOutput, setExtraOutput] = useState<string | null>(null);
  const [lastExtra, setLastExtra] = useState<BuilderAiAction | null>(null);

  const insights = useMemo(
    () =>
      [
        aiEval?.recommendation ? `AI: ${aiEval.recommendation}` : null,
        aiEval?.riskScore != null ? `Risk ${aiEval.riskScore}/100` : null,
        meta.features.length ? `${meta.features.length} features scoped` : null,
      ]
        .filter(Boolean)
        .join(' · '),
    [aiEval, meta.features.length]
  );

  const runExtra = (id: BuilderAiAction) => {
    setLastExtra(id);
    setExtraOutput(generateBuilderOutput(id, meta));
  };

  return (
    <aside className="proto-builder-aside" aria-label="AI and insights">
      <AIPrototypeAssistant draft={meta} disabled={disabled} onApply={onApply} />

      <div className="proto-builder-aside__block">
        <h3>Builder AI</h3>
        <div className="proto-ai-panel__actions">
          {EXTRA_ACTIONS.map((a) => (
            <button key={a.id} type="button" className="proto-ai-panel__action" disabled={disabled} onClick={() => runExtra(a.id)}>
              <span aria-hidden>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
        {extraOutput ? (
          <div className="proto-ai-panel__output">
            <pre>{extraOutput}</pre>
            {lastExtra === 'tech_docs' ? (
              <button
                type="button"
                className="proto-btn proto-btn--secondary"
                disabled={disabled}
                onClick={() => onApply({ documentation: extraOutput })}
              >
                Apply to documentation
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {insights ? (
        <div className="proto-builder-aside__block">
          <h3>Validation insights</h3>
          <p className="proto-muted">{insights}</p>
          {aiEval?.explanation ? <p className="proto-builder-insight">{aiEval.explanation}</p> : null}
        </div>
      ) : null}

      <div className="proto-builder-aside__block">
        <ResearchLinkPanel summary={researchSummary} prototypeName={prototypeName} />
      </div>
    </aside>
  );
}
