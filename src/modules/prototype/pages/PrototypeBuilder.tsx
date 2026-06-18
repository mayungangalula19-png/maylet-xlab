import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { ArchitectureDesigner } from '../components/builder/ArchitectureDesigner';
import { BuildRunnerPanel } from '../components/builder/BuildRunnerPanel';
import { BuilderAIPanel } from '../components/builder/BuilderAIPanel';
import { BuilderAttachments } from '../components/builder/BuilderAttachments';
import { BuilderHeader } from '../components/builder/BuilderHeader';
import { BuilderLifecycle } from '../components/builder/BuilderLifecycle';
import { BuilderSidebar } from '../components/builder/BuilderSidebar';
import { CollaborationPanel } from '../components/builder/CollaborationPanel';
import { DocumentationEditor } from '../components/builder/DocumentationEditor';
import { ExperimentDesigner } from '../components/builder/ExperimentDesigner';
import { FeatureBoard } from '../components/builder/FeatureBoard';
import { PrototypeOverview } from '../components/builder/PrototypeOverview';
import { UserFlowDesigner } from '../components/builder/UserFlowDesigner';
import { ValidationCenter } from '../components/builder/ValidationCenter';
import { VisualBuilder } from '../components/builder/VisualBuilder';
import { useBuildRunner } from '../hooks/useBuildRunner';
import { usePrototypeBuilder } from '../hooks/usePrototypeBuilder';
import { prototypeService } from '../services/prototypeService';
import type { BuilderSectionId } from '../types/prototypeBuilder.types';
import type { ResearchLinkSummary } from '../types/prototype.types';
import '../prototype.css';

export default function PrototypeBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<BuilderSectionId>('overview');
  const [researchSummary, setResearchSummary] = useState<ResearchLinkSummary | null>(null);

  const builder = usePrototypeBuilder({
    userId: user?.id ?? '',
    prototypeId: id ?? '',
  });

  const {
    prototype,
    meta,
    metaReady,
    patchMeta,
    projects,
    builds,
    tests,
    screenshots,
    aiEval,
    loading,
    saving,
    error,
    metaError,
    setMetaError,
    saveNow,
    completion,
    refresh,
  } = builder;

  const { running, lastBuild, error: buildError, runBuild } = useBuildRunner(user?.id, id);

  useEffect(() => {
    if (!user?.id || !prototype) {
      setResearchSummary(null);
      return;
    }
    const researchProjectId = prototype.project_id ?? prototype.research_id;
    if (!researchProjectId) {
      setResearchSummary(null);
      return;
    }
    prototypeService.fetchResearchContext(researchProjectId, user.id).then(setResearchSummary);
  }, [user?.id, prototype?.project_id, prototype?.research_id]);

  if (!id) {
    navigate('/prototypes');
    return null;
  }

  if (loading || !metaReady) {
    return (
      <div className="proto-page proto-builder-page">
        <p>Loading builder workspace…</p>
      </div>
    );
  }

  if (!prototype) {
    return (
      <div className="proto-page proto-builder-page">
        <p className="proto-error">Prototype not found.</p>
        <Link to="/prototypes" className="proto-btn proto-btn--ghost">
          ← Back to prototypes
        </Link>
      </div>
    );
  }

  const disabled = saving;
  const displayError = metaError ?? error;

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <PrototypeOverview
            meta={meta}
            prototype={prototype}
            builds={builds}
            projects={projects}
            disabled={disabled}
            onChange={patchMeta}
          />
        );
      case 'visuals':
        return user?.id ? (
          <VisualBuilder
            prototypeId={id}
            userId={user.id}
            prototypeName={prototype.name}
            screenshots={screenshots}
            onChange={() => refresh({ silent: true })}
          />
        ) : null;
      case 'flow':
        return <UserFlowDesigner meta={meta} disabled={disabled} onChange={patchMeta} />;
      case 'features':
        return <FeatureBoard meta={meta} disabled={disabled} onChange={patchMeta} />;
      case 'architecture':
        return <ArchitectureDesigner meta={meta} disabled={disabled} onChange={patchMeta} />;
      case 'experiments':
        return <ExperimentDesigner meta={meta} disabled={disabled} onChange={patchMeta} />;
      case 'validation':
        return (
          <ValidationCenter meta={meta} tests={tests} aiEval={aiEval} disabled={disabled} onChange={patchMeta} />
        );
      case 'documentation':
        return <DocumentationEditor meta={meta} disabled={disabled} onChange={patchMeta} />;
      case 'attachments':
        return <BuilderAttachments meta={meta} disabled={disabled} onChange={patchMeta} />;
      case 'lifecycle':
        return <BuilderLifecycle meta={meta} disabled={disabled} onChange={patchMeta} />;
      case 'collaboration':
        return (
          <CollaborationPanel
            meta={meta}
            authorName={user?.email?.split('@')[0] ?? 'Team member'}
            disabled={disabled}
            onChange={patchMeta}
          />
        );
      case 'build':
        return (
          <BuildRunnerPanel
            prototype={prototype}
            builds={builds}
            running={running}
            lastBuild={lastBuild}
            buildError={buildError}
            onRun={async (config) => {
              await runBuild(config);
              await refresh({ silent: true });
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="proto-page proto-builder-page">
      <BuilderHeader
        prototype={prototype}
        completion={completion}
        saveState={builder.saveState}
        onSaveNow={() => void saveNow()}
      />

      {displayError ? (
        <div className="proto-create-banner proto-create-banner--error" role="alert">
          <span>{displayError}</span>
          <button type="button" className="proto-btn proto-btn--ghost" onClick={() => setMetaError(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="proto-builder-layout">
        <BuilderSidebar
          active={activeSection}
          onSelect={setActiveSection}
          assetCount={meta.attachments.length + screenshots.length}
          experimentCount={meta.experiments.length}
        />

        <main className="proto-builder-main">{renderSection()}</main>

        <BuilderAIPanel
          meta={meta}
          researchSummary={researchSummary}
          prototypeName={prototype.name}
          aiEval={aiEval}
          disabled={disabled}
          onApply={patchMeta}
        />
      </div>
    </div>
  );
}
