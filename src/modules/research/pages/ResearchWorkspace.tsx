import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { analyzeResearchImpact } from '../../ai/researchImpactEngine';
import { GateApprovalPanel } from '../components/GateApprovalPanel';
import { DocumentUploader } from '../components/DocumentUploader';
import { FindingsPanel } from '../components/FindingsPanel';
import { LiteratureTable } from '../components/LiteratureTable';
import { MayaAssistantPanel } from '../components/MayaAssistantPanel';
import { NotesEditor } from '../components/NotesEditor';
import { ProblemDefinitionForm } from '../components/ProblemDefinitionForm';
import { ResearchFormsHub } from '../components/ResearchFormsHub';
import { ResearchImpactPanel } from '../components/ResearchImpactPanel';
import { useMayaAI } from '../hooks/useMayaAI';
import { useResearch } from '../hooks/useResearch';
import { documentService } from '../services/documentService';
import { literatureService } from '../services/literatureService';
import type { ResearchImpactResult, ResearchWorkspaceTab } from '../types/research.types';
import { getProject } from '../../../services/projects.service';
import { useGateApproval } from '../hooks/useGateApproval';
import { updateProjectStage, getProjects } from '../../../lib/supabase/projects.queries';
import type { Project } from '../../../types/project.types';
import { useAuth } from '../../../hooks/useAuth';
import '../research.css';

const TABS: { id: ResearchWorkspaceTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'forms', label: 'All Forms' },
  { id: 'notes', label: 'Notes' },
  { id: 'problem', label: 'Problem' },
  { id: 'findings', label: 'Findings' },
  { id: 'literature', label: 'Literature' },
  { id: 'documents', label: 'Documents' },
  { id: 'maya', label: 'MAYA' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'impact', label: 'Impact' },
  { id: 'gate', label: 'Gate' },
];

export default function ResearchWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const initialTab = searchParams.get('tab') as ResearchWorkspaceTab | null;
  const [tab, setTab] = useState<ResearchWorkspaceTab>(
    initialTab && TABS.some((t) => t.id === initialTab) ? initialTab : 'overview'
  );
  const [projectName, setProjectName] = useState('');
  const [search, setSearch] = useState('');
  const [impact, setImpact] = useState<ResearchImpactResult | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [advancing, setAdvancing] = useState(false);

  const { snapshot, activity, loading, saving, error, setError, withSaving, researchService } = useResearch(
    user?.id,
    projectId
  );

  const maya = useMayaAI(projectId, projectName, snapshot);
  const gate = useGateApproval(projectId, user?.id, snapshot);

  useEffect(() => {
    if (!projectId) {
      navigate('/research');
      return;
    }
    getProject(projectId)
      .then((p) => setProjectName(p.name))
      .catch(() => setProjectName('Project'));
  }, [projectId, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    getProjects(user.id).then(setAllProjects).catch(() => setAllProjects([]));
  }, [user?.id]);

  const handleAdvanceToPrototype = async () => {
    if (!projectId || !user?.id) return;
    setAdvancing(true);
    try {
      await updateProjectStage(projectId, user.id, 'Prototype');
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to advance project stage');
    } finally {
      setAdvancing(false);
    }
  };

  const runImpactAnalysis = useCallback(() => {
    if (!snapshot || !projectId) return;
    const latestFinding = snapshot.findings[0];
    if (!latestFinding) {
      setError('Add at least one finding to run impact analysis.');
      return;
    }
    const refs = allProjects.map((p) => ({
      id: p.id,
      name: p.name,
      sector: p.sector,
      status: p.status,
      progress: p.progress,
    }));
    setImpact(analyzeResearchImpact(projectId, latestFinding, refs));
  }, [snapshot, projectId, allProjects, setError]);

  const filterText = useCallback((text: string) => !search || text.toLowerCase().includes(search.toLowerCase()), [search]);

  const filteredNotes = useMemo(
    () => snapshot?.notes.filter((n) => filterText(`${n.title} ${n.content}`)) ?? [],
    [snapshot, filterText]
  );
  const filteredFindings = useMemo(
    () => snapshot?.findings.filter((f) => filterText(`${f.title} ${f.content}`)) ?? [],
    [snapshot, filterText]
  );
  const filteredLiterature = useMemo(
    () => snapshot?.literature.filter((l) => filterText(`${l.title} ${l.authors ?? ''}`)) ?? [],
    [snapshot, filterText]
  );
  const filteredDocs = useMemo(
    () => snapshot?.documents.filter((d) => filterText(d.name)) ?? [],
    [snapshot, filterText]
  );

  if (!projectId) return null;

  if (loading || !snapshot) {
    return (
      <div className="research-page">
        <p>Loading workspace…</p>
      </div>
    );
  }

  const userId = user?.id ?? '';

  return (
    <div className="research-page">
      <nav className="research-breadcrumb">
        <Link to="/research">Research Center</Link>
        <span>/</span>
        <span>{projectName}</span>
      </nav>

      <header className="research-header">
        <div>
          <h1>{projectName}</h1>
          <p>Research workspace — {snapshot.completionRate}% complete</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to={`/research/${projectId}/edit`} className="research-btn research-btn--secondary">
            Edit profile
          </Link>
          <Link to={`/research/${projectId}/playbook`} className="research-btn research-btn--secondary">
            Playbook
          </Link>
          <Link to={`/research/${projectId}/literature`} className="research-btn research-btn--secondary">
            Literature Center
          </Link>
          <Link to={`/research/${projectId}/documents`} className="research-btn research-btn--secondary">
            Documents
          </Link>
          <Link to={`/projects/${projectId}`} className="research-btn research-btn--secondary">
            View Project
          </Link>
        </div>
      </header>

      {error ? <p className="research-error">{error}</p> : null}
      {saving ? <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Saving…</p> : null}

      <div className="research-search-bar">
        <input
          placeholder="Search notes, findings, literature…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="research-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`research-tab${tab === t.id ? ' research-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="research-glass research-panel">
        {tab === 'overview' && (
          <>
            <h2>Overview</h2>
            <ResearchFormsHub
              snapshot={snapshot}
              evaluation={gate.evaluation}
              onOpenTab={setTab}
              compact
            />
            <div className="research-stats" style={{ marginTop: '1.5rem' }}>
              <div className="research-glass research-stat"><strong>{snapshot.notes.length}</strong><span>Notes</span></div>
              <div className="research-glass research-stat"><strong>{snapshot.literature.length}</strong><span>Literature</span></div>
              <div className="research-glass research-stat"><strong>{snapshot.findings.length}</strong><span>Findings</span></div>
              <div className="research-glass research-stat"><strong>{snapshot.documents.length}</strong><span>Documents</span></div>
            </div>
            <div className="research-progress-bar" style={{ marginTop: '1.5rem' }}>
              <div style={{ width: `${snapshot.completionRate}%` }} />
            </div>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{snapshot.completionRate}% research checklist complete</p>
          </>
        )}

        {tab === 'forms' && (
          <ResearchFormsHub
            snapshot={snapshot}
            evaluation={gate.evaluation}
            onOpenTab={setTab}
          />
        )}

        {tab === 'notes' && (
          <NotesEditor
            notes={filteredNotes}
            disabled={saving}
            onCreate={async (payload) => {
              await withSaving(() => researchService.createNote(projectId, userId, payload));
            }}
            onUpdate={async (id, payload) => {
              await withSaving(() => researchService.updateNote(id, payload));
            }}
            onDelete={async (id) => {
              await withSaving(() => researchService.deleteNote(id));
            }}
          />
        )}

        {tab === 'problem' && (
          <ProblemDefinitionForm
            profile={snapshot.profile}
            disabled={saving}
            onSave={async (fields) => {
              await withSaving(() => researchService.saveProfile(projectId, userId, fields));
            }}
          />
        )}

        {tab === 'findings' && (
          <FindingsPanel
            findings={filteredFindings}
            disabled={saving}
            onCreate={async (payload) => {
              await withSaving(() => researchService.createFinding(projectId, userId, payload));
            }}
            onDelete={async (id) => {
              await withSaving(() => researchService.deleteFinding(id));
            }}
          />
        )}

        {tab === 'literature' && (
          <>
            <div className="research-panel-header">
              <h2>Literature Review</h2>
              <Link to={`/research/${projectId}/literature`} className="research-btn research-btn--secondary">
                Open full center
              </Link>
            </div>
            <LiteratureTable
              items={filteredLiterature}
              disabled={saving}
              compact
              onDelete={async (id) => {
                await withSaving(() => literatureService.remove(id));
              }}
            />
          </>
        )}

        {tab === 'documents' && (
          <DocumentUploader
            documents={filteredDocs}
            onUpload={async (file) => {
              await withSaving(() => documentService.upload(projectId, userId, file));
            }}
            onDelete={async (id) => {
              await withSaving(() => documentService.remove(id));
            }}
          />
        )}

        {tab === 'maya' && (
          <MayaAssistantPanel
            prompts={maya.prompts}
            messages={maya.messages}
            gaps={maya.gaps}
            insights={maya.insights}
            questions={maya.questions}
            loading={maya.loading}
            error={maya.error}
            localAnalysis={maya.localAnalysis}
            completionRate={snapshot.completionRate}
            onRunPrompt={maya.runPrompt}
            onSend={maya.send}
            onRunLocalAnalysis={maya.runLocalAnalysis}
            onClear={maya.clear}
          />
        )}

        {tab === 'analytics' && (
          <>
            <h2>Research Analytics</h2>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)' }}>
              Activity over the last 14 days
            </p>
            {activity.length === 0 ? (
              <p className="research-empty">No research activity recorded yet.</p>
            ) : (
              <div className="research-activity-chart">
                {activity.map((a) => (
                  <div key={a.date} className="research-activity-bar" title={`${a.date}: ${a.count}`}>
                    <div style={{ height: `${Math.min(a.count * 12, 80)}px` }} />
                    <span>{a.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'impact' && (
          <ResearchImpactPanel impact={impact} onRunAnalysis={runImpactAnalysis} />
        )}

        {tab === 'gate' && (
          <GateApprovalPanel
            projectId={projectId}
            evaluation={gate.evaluation}
            record={gate.record}
            sectionC={gate.sectionC}
            decision={gate.decision}
            v1Scope={gate.v1Scope}
            outOfScope={gate.outOfScope}
            openRisks={gate.openRisks}
            reviewerName={gate.reviewerName}
            saving={gate.saving}
            loading={gate.loading}
            error={gate.error}
            onDecisionChange={gate.setDecision}
            onV1ScopeChange={gate.setV1Scope}
            onOutOfScopeChange={gate.setOutOfScope}
            onOpenRisksChange={gate.setOpenRisks}
            onReviewerNameChange={gate.setReviewerName}
            onToggleSectionC={gate.toggleSectionC}
            onConfirmAllSectionC={gate.confirmAllSectionC}
            onResetSectionC={gate.resetSectionC}
            onSubmit={async () => { await gate.submitReview(); }}
            onAdvanceToPrototype={handleAdvanceToPrototype}
            advancing={advancing}
          />
        )}
      </div>
    </div>
  );
}
