import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { AIPrototypeAssistant } from '../components/creation/AIPrototypeAssistant';
import { ArchitectureSection } from '../components/creation/ArchitectureSection';
import { AttachmentsSection } from '../components/creation/AttachmentsSection';
import { ExperimentsSection } from '../components/creation/ExperimentsSection';
import { FeaturesSection } from '../components/creation/FeaturesSection';
import { ProblemStatementSection } from '../components/creation/ProblemStatementSection';
import { PrototypeDetailsForm } from '../components/creation/PrototypeDetailsForm';
import { PrototypeHeader } from '../components/creation/PrototypeHeader';
import {
  PrototypeStatusTracker,
  PrototypeStatusTrackerBar,
} from '../components/creation/PrototypeStatusTracker';
import { PrototypeVisualsSection } from '../components/creation/PrototypeVisualsSection';
import { SolutionDesignSection } from '../components/creation/SolutionDesignSection';
import { UserFlowSection } from '../components/creation/UserFlowSection';
import { ValidationSection } from '../components/creation/ValidationSection';
import { usePrototypeCreation } from '../hooks/usePrototypeCreation';
import { CREATION_SECTIONS } from '../types/prototypeCreation.types';
import { validateCreationDraft } from '../validation/prototypeCreation.validation';
import '../prototype.css';

const DRAFT_KEY = 'new';

export default function NewPrototype() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') ?? undefined;
  const researchId = searchParams.get('researchId') ?? undefined;

  const [activeSection, setActiveSection] = useState<string>('details');
  const [publishing, setPublishing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const creation = usePrototypeCreation({
    userId: user?.id ?? '',
    draftKey: DRAFT_KEY,
    defaultProjectId: projectId,
    defaultResearchId: researchId,
  });

  const {
    draft,
    patchDraft,
    prototypeId,
    screenshots,
    refreshScreenshots,
    ensurePrototypeRecord,
    projects,
    saveState,
    error,
    setError,
    saveNow,
    publish,
    sections,
    completion,
    gateAllowed,
    gateReason,
    gateLoading,
    gateProjectId,
  } = creation;

  const saving = saveState === 'saving' || publishing;

  const visualsCompletion = useMemo(
    () => (screenshots.length > 0 ? 100 : prototypeId ? 40 : 0),
    [screenshots.length, prototypeId]
  );

  const scrollToSection = useCallback((id: string) => {
    setActiveSection(id);
    document.getElementById(`proto-section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handlePublish = async () => {
    const validation = validateCreationDraft(draft, 'publish');
    setValidationErrors(validation.errors);
    if (!validation.valid) {
      setError(Object.values(validation.errors)[0] ?? 'Fix validation errors before publishing');
      return;
    }
    setPublishing(true);
    const id = await publish();
    setPublishing(false);
    if (id) navigate(`/prototypes/${id}`);
  };

  const handleSaveDraft = async () => {
    const validation = validateCreationDraft(draft, 'draft');
    setValidationErrors(validation.errors);
    if (!validation.valid) {
      setError(Object.values(validation.errors)[0] ?? 'Fix errors before saving');
      return;
    }
    await saveNow();
  };

  if (authLoading) {
    return (
      <div className="proto-page proto-create-page">
        <p>Loading…</p>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="proto-page proto-create-page">
        <p>Sign in to create a prototype.</p>
      </div>
    );
  }

  return (
    <div className="proto-page proto-create-page">
      <PrototypeHeader
        name={draft.name}
        completion={completion}
        saveState={saveState}
        workspaceStage={draft.workspaceStage}
        onBack={() => navigate('/prototypes')}
      />

      <PrototypeStatusTrackerBar stage={draft.workspaceStage} />

      <div className="proto-create-layout">
        <nav className="proto-create-nav" aria-label="Workspace sections">
          {CREATION_SECTIONS.map((s) => {
            const pct = s.id === 'visuals' ? visualsCompletion : sections[s.id] ?? 0;
            return (
              <button
                key={s.id}
                type="button"
                className={`proto-create-nav__item${activeSection === s.id ? ' proto-create-nav__item--active' : ''}`}
                onClick={() => scrollToSection(s.id)}
              >
                <span aria-hidden>{s.icon}</span>
                <span className="proto-create-nav__label">{s.label}</span>
                <span className="proto-create-nav__pct">{pct}%</span>
              </button>
            );
          })}
        </nav>

        <main className="proto-create-main">
          {error ? (
            <div className="proto-create-banner proto-create-banner--error" role="alert">
              <span>{error}</span>
              <button type="button" className="proto-btn proto-btn--ghost proto-btn--sm" onClick={() => setError(null)}>
                Dismiss
              </button>
            </div>
          ) : null}

          {gateProjectId && !gateLoading && !gateAllowed ? (
            <div className="proto-create-banner proto-create-banner--warn" role="status">
              Research gate: {gateReason ?? 'Approval required before publishing prototypes for this project.'}
            </div>
          ) : null}

          <PrototypeDetailsForm
            draft={draft}
            projects={projects}
            completion={sections.details ?? 0}
            errors={validationErrors}
            disabled={saving}
            onChange={patchDraft}
          />

          <PrototypeVisualsSection
            completion={visualsCompletion}
            prototypeId={prototypeId}
            userId={user.id}
            prototypeName={draft.name}
            screenshots={screenshots}
            saving={saving}
            onEnsureRecord={ensurePrototypeRecord}
            onRefresh={() => prototypeId && void refreshScreenshots(prototypeId)}
          />

          <ProblemStatementSection
            draft={draft}
            completion={sections.problem ?? 0}
            errors={validationErrors}
            disabled={saving}
            onChange={patchDraft}
          />

          <SolutionDesignSection
            draft={draft}
            completion={sections.solution ?? 0}
            errors={validationErrors}
            disabled={saving}
            onChange={patchDraft}
          />

          <UserFlowSection draft={draft} completion={sections.flow ?? 0} disabled={saving} onChange={patchDraft} />

          <FeaturesSection
            draft={draft}
            completion={sections.features ?? 0}
            errors={validationErrors}
            disabled={saving}
            onChange={patchDraft}
          />

          <ArchitectureSection
            draft={draft}
            completion={sections.architecture ?? 0}
            disabled={saving}
            onChange={patchDraft}
          />

          <ExperimentsSection
            draft={draft}
            completion={sections.experiments ?? 0}
            disabled={saving}
            onChange={patchDraft}
          />

          <ValidationSection
            draft={draft}
            completion={sections.validation ?? 0}
            disabled={saving}
            onChange={patchDraft}
          />

          <AttachmentsSection
            draft={draft}
            completion={sections.attachments ?? 0}
            disabled={saving}
            onChange={patchDraft}
          />

          <PrototypeStatusTracker
            stage={draft.workspaceStage}
            completion={draft.workspaceStage !== 'draft' ? 100 : 50}
            disabled={saving}
            onChange={(stage) => patchDraft({ workspaceStage: stage })}
          />
        </main>

        <AIPrototypeAssistant draft={draft} disabled={saving} onApply={patchDraft} />
      </div>

      <footer className="proto-create-action-bar">
        <div className="proto-create-action-bar__info">
          <strong>{completion}%</strong> workspace complete
        </div>
        <div className="proto-create-action-bar__actions">
          <button type="button" className="proto-btn proto-btn--ghost" disabled={saving} onClick={() => navigate('/prototypes')}>
            Cancel
          </button>
          <button type="button" className="proto-btn proto-btn--secondary" disabled={saving} onClick={() => void handleSaveDraft()}>
            {saveState === 'saving' ? 'Saving…' : 'Save draft'}
          </button>
          <button
            type="button"
            className="proto-btn proto-btn--primary"
            disabled={saving || gateLoading || (!!gateProjectId && !gateAllowed)}
            onClick={() => void handlePublish()}
          >
            {publishing ? 'Publishing…' : 'Publish prototype'}
          </button>
        </div>
      </footer>
    </div>
  );
}
