import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { getPrototypeRecommendation } from '../ai/recommendationEngine';
import { AIEvaluationPanel } from '../components/AIEvaluationPanel';
import { PrototypeLifecycle } from '../components/PrototypeLifecycle';
import { PrototypeUpload } from '../components/PrototypeUpload';
import { ResearchLinkPanel } from '../components/ResearchLinkPanel';
import { TestResultsPanel } from '../components/TestResultsPanel';
import { VisualProofSection } from '../components/VisualProofSection';
import { VersionHistory } from '../components/VersionHistory';
import { usePrototype } from '../hooks/usePrototype';
import { usePrototypeTesting } from '../hooks/usePrototypeTesting';
import { buildService } from '../services/buildService';
import { prototypeService } from '../services/prototypeService';
import { versionService } from '../services/versionService';
import type { PrototypeFile, ResearchLinkSummary } from '../types/prototype.types';
import { LIFECYCLE_LABELS } from '../types/prototype.types';
import '../prototype.css';

export default function PrototypeWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    prototype,
    builds,
    tests,
    prototypeFiles,
    screenshots,
    aiEval,
    loading,
    error,
    refresh,
    addUploadedFile,
    withSaving,
  } = usePrototype(user?.id, id);

  const [researchSummary, setResearchSummary] = useState<ResearchLinkSummary | null>(null);
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [promoting, setPromoting] = useState(false);

  const { passRate, recordTest } = usePrototypeTesting({
    prototypeId: id,
    userId: user?.id,
    tests,
    withSaving,
  });

  const recommendation = useMemo(() => {
    if (!prototype) return null;
    const buildRate = builds.length ? builds.filter((b) => b.status === 'completed').length / builds.length : 0;
    return getPrototypeRecommendation({
      prototype,
      buildSuccessRate: buildRate,
      testPassRate: passRate,
    });
  }, [prototype, builds, passRate]);

  const versions = useMemo(() => {
    if (!prototype) return [];
    return versionService.buildVersionHistory(prototype, builds, prototypeFiles);
  }, [prototype, builds, prototypeFiles]);

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

  const handleUploaded = (file: PrototypeFile) => {
    addUploadedFile(file);
    refresh({ silent: true });
  };

  const handlePromote = async () => {
    if (!id || !user?.id || !prototype) return;
    setPromoteError(null);
    setPromoting(true);
    try {
      const result = await prototypeService.promotePrototypeToProject(id, user.id);
      await refresh({ silent: true });
      navigate(`/projects/${result.projectId}`);
    } catch (e) {
      setPromoteError(e instanceof Error ? e.message : 'Promotion failed');
    } finally {
      setPromoting(false);
    }
  };

  if (!id) {
    navigate('/prototypes');
    return null;
  }

  if (loading) {
    return (
      <div className="proto-page">
        <p>Loading workspace…</p>
      </div>
    );
  }

  if (!prototype) {
    return (
      <div className="proto-page">
        <p className="proto-error">Prototype not found or you do not have access.</p>
        <Link to="/prototypes" className="proto-btn proto-btn--ghost">
          ← Back to prototypes
        </Link>
      </div>
    );
  }

  const canPromote = prototype.lifecycle_status === 'success';

  return (
    <div className="proto-page">
      <nav className="proto-breadcrumb">
        <Link to="/prototypes">Prototypes</Link>
        <span>/</span>
        <span>{prototype.name}</span>
      </nav>

      <header className="proto-header">
        <div>
          <h1>{prototype.name}</h1>
          <p>
            v{prototype.version} ·{' '}
            <span className={`proto-lifecycle proto-lifecycle--${prototype.lifecycle_status}`}>
              {LIFECYCLE_LABELS[prototype.lifecycle_status]}
            </span>
            {prototype.project_name ? ` · Project: ${prototype.project_name}` : ' · No linked project'}
            {prototype.research_id || prototype.project_id ? ' · Research linked' : ''}
          </p>
        </div>
        <div className="proto-header-actions">
          <Link to={`/prototypes/${id}/edit`} className="proto-btn proto-btn--ghost">
            Edit
          </Link>
          <Link to={`/prototypes/${id}/testing/edit`} className="proto-btn proto-btn--ghost">
            Edit testing
          </Link>
          <Link to={`/prototypes/${id}/testing`} className="proto-btn proto-btn--secondary">
            Run test
          </Link>
          <button
            type="button"
            className="proto-btn proto-btn--primary"
            disabled={!canPromote || promoting}
            onClick={handlePromote}
            title={canPromote ? 'Promote to project' : 'Validate prototype first (pass tests)'}
          >
            {promoting ? 'Promoting…' : 'Promote to project'}
          </button>
          {prototype.project_id ? (
            <Link to={`/projects/${prototype.project_id}`} className="proto-btn proto-btn--ghost">
              Open project
            </Link>
          ) : null}
        </div>
      </header>

      {error ? <p className="proto-error">{error}</p> : null}
      {promoteError ? <p className="proto-error">{promoteError}</p> : null}

      <PrototypeLifecycle prototype={prototype} />

      {user?.id ? (
        <VisualProofSection
          prototypeId={id}
          userId={user.id}
          prototypeName={prototype.name}
          screenshots={screenshots}
          onChange={() => refresh({ silent: true })}
        />
      ) : null}

      <div className="proto-workspace-grid proto-workspace-grid--top">
        <AIEvaluationPanel
          evaluation={aiEval}
          readinessScore={recommendation?.readinessScore}
          nextAction={recommendation?.nextAction}
        />
        <ResearchLinkPanel summary={researchSummary} prototypeName={prototype.name} />
      </div>

      <div className="proto-workspace-upload">
        <PrototypeUpload prototypeId={id} files={prototypeFiles} onUploaded={handleUploaded} />
      </div>

      <div className="proto-workspace-grid">
        <TestResultsPanel
          tests={tests}
          onRecord={async (payload) => {
            await recordTest(payload);
          }}
        />
        <VersionHistory prototype={prototype} builds={builds} versions={versions} />
      </div>

      <div className="proto-panel">
        <h3>Build activity</h3>
        <p>
          Builds: {builds.length} · Tests: {tests.length} · Files: {prototypeFiles.length} · Pass rate:{' '}
          {Math.round(passRate * 100)}%
        </p>
        <button
          type="button"
          className="proto-btn proto-btn--secondary"
          onClick={() =>
            withSaving(() => buildService.run(user!.id, id, `Build ${new Date().toLocaleDateString()}`))
          }
        >
          Queue build
        </button>
      </div>
    </div>
  );
}
