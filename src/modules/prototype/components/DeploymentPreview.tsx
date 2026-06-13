import type { PrototypeAiEvaluation, PrototypeRecord } from '../types/prototype.types';

interface Props {
  prototype: PrototypeRecord;
  evaluation: PrototypeAiEvaluation | null;
}

export function DeploymentPreview({ prototype, evaluation }: Props) {
  return (
    <div className="proto-panel">
      <h3>Deployment preview</h3>
      <div className="proto-preview-frame">
        {prototype.file_url ? (
          <iframe title="preview" src={prototype.file_url} className="proto-preview-iframe" />
        ) : (
          <p className="proto-empty">No artifact to preview. Run a build first.</p>
        )}
      </div>
      {evaluation && (
        <div className="proto-ai-strip">
          <span className={`proto-ai-rec proto-ai-rec--${evaluation.recommendation.toLowerCase()}`}>
            MAYA: {evaluation.recommendation}
          </span>
          <span>Risk {evaluation.riskScore}/100</span>
        </div>
      )}
    </div>
  );
}
