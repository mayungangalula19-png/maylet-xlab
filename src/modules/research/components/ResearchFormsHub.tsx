import { useMemo, useState } from 'react';
import { GATE_DECISION_LABELS } from '../types/gate.types';
import type { GateEvaluation } from '../types/gate.types';
import type { ProjectResearchSnapshot, ResearchWorkspaceTab } from '../types/research.types';

type FormStatus = 'complete' | 'in_progress' | 'not_started';
type StatusFilter = 'all' | FormStatus;

interface ResearchFormItem {
  id: string;
  tab: ResearchWorkspaceTab;
  title: string;
  description: string;
  icon: string;
  status: FormStatus;
  detail: string;
  gateHint: string;
  progress: number;
}

interface Props {
  snapshot: ProjectResearchSnapshot;
  evaluation?: GateEvaluation | null;
  onOpenTab: (tab: ResearchWorkspaceTab) => void;
  compact?: boolean;
}

function problemStatus(profile: ProjectResearchSnapshot['profile']): { status: FormStatus; detail: string; filled: number } {
  const fields = [
    profile?.problem_statement?.trim(),
    profile?.target_users?.trim(),
    profile?.pain_points?.trim(),
    profile?.existing_solutions?.trim(),
    profile?.research_questions?.trim(),
  ];
  const filled = fields.filter(Boolean).length;
  if (filled === 5) return { status: 'complete', detail: 'All 5 fields complete', filled };
  if (filled > 0) return { status: 'in_progress', detail: `${filled}/5 fields filled`, filled };
  return { status: 'not_started', detail: '0/5 fields filled', filled };
}

function buildForms(snapshot: ProjectResearchSnapshot, evaluation?: GateEvaluation | null): ResearchFormItem[] {
  const profile = problemStatus(snapshot.profile);
  const interviewNotes = snapshot.notes.filter(
    (n) => n.category === 'interview' || n.category === 'fieldwork'
  );
  const hasConclusion = snapshot.findings.some(
    (f) => f.finding_type === 'conclusion' || f.finding_type === 'insight'
  );

  const notesStatus: FormStatus =
    interviewNotes.length >= 3 ? 'complete' : snapshot.notes.length > 0 ? 'in_progress' : 'not_started';

  const literatureStatus: FormStatus =
    snapshot.literature.length >= 3 ? 'complete' : snapshot.literature.length > 0 ? 'in_progress' : 'not_started';

  const findingsStatus: FormStatus = hasConclusion
    ? 'complete'
    : snapshot.findings.length > 0
      ? 'in_progress'
      : 'not_started';

  const docsStatus: FormStatus = snapshot.documents.length > 0 ? 'complete' : 'not_started';

  const gateStatus: FormStatus = evaluation?.prototypeAuthorized
    ? 'complete'
    : evaluation && evaluation.systemCompletion > 0
      ? 'in_progress'
      : 'not_started';

  const gateDetail = evaluation
    ? `${evaluation.systemCompletion}% evidence · ${GATE_DECISION_LABELS[evaluation.recommendedDecision]}`
    : 'Not evaluated yet';

  return [
    {
      id: 'problem',
      tab: 'problem',
      title: 'Problem definition',
      description: 'Problem, users, pain points, existing solutions, research questions',
      icon: '🎯',
      status: profile.status,
      detail: profile.detail,
      gateHint: 'Gate A1–A4, B2',
      progress: Math.round((profile.filled / 5) * 100),
    },
    {
      id: 'notes',
      tab: 'notes',
      title: 'Research notes',
      description: 'Fieldwork and interview evidence for user validation',
      icon: '📓',
      status: notesStatus,
      detail: `${snapshot.notes.length} notes · ${interviewNotes.length} interview/fieldwork`,
      gateHint: 'Gate B1 — ≥3 evidence notes',
      progress: Math.min(100, Math.round((interviewNotes.length / 3) * 100)),
    },
    {
      id: 'literature',
      tab: 'literature',
      title: 'Literature review',
      description: 'Papers, journals, and references with relevance scores',
      icon: '📚',
      status: literatureStatus,
      detail: `${snapshot.literature.length} sources`,
      gateHint: 'Gate B5 — ≥3 sources (target ≥8)',
      progress: Math.min(100, Math.round((snapshot.literature.length / 3) * 100)),
    },
    {
      id: 'findings',
      tab: 'findings',
      title: 'Findings & insights',
      description: 'Document insights or conclusions from your research',
      icon: '💡',
      status: findingsStatus,
      detail: `${snapshot.findings.length} findings${hasConclusion ? ' · conclusion recorded' : ''}`,
      gateHint: 'Gate B3–B4 — insight or conclusion',
      progress: hasConclusion ? 100 : snapshot.findings.length > 0 ? 50 : 0,
    },
    {
      id: 'documents',
      tab: 'documents',
      title: 'Evidence documents',
      description: 'Upload PDFs, reports, and supporting files',
      icon: '📎',
      status: docsStatus,
      detail: `${snapshot.documents.length} files`,
      gateHint: 'Gate A8, B8 — attached evidence',
      progress: snapshot.documents.length > 0 ? 100 : 0,
    },
    {
      id: 'gate',
      tab: 'gate',
      title: 'Research gate review',
      description: 'Complete checklist and authorize prototype stage',
      icon: '🚦',
      status: gateStatus,
      detail: gateDetail,
      gateHint: '100% system evidence required',
      progress: evaluation?.systemCompletion ?? 0,
    },
  ];
}

const STATUS_LABEL: Record<FormStatus, string> = {
  complete: 'Complete',
  in_progress: 'In progress',
  not_started: 'Not started',
};

const STATUS_ORDER: Record<FormStatus, number> = {
  not_started: 0,
  in_progress: 1,
  complete: 2,
};

export function ResearchFormsHub({ snapshot, evaluation, onOpenTab, compact }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const forms = useMemo(() => buildForms(snapshot, evaluation), [snapshot, evaluation]);

  const done = forms.filter((f) => f.status === 'complete').length;
  const inProgress = forms.filter((f) => f.status === 'in_progress').length;

  const sorted = useMemo(() => {
    const list = [...forms];
    list.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.title.localeCompare(b.title));
    return list;
  }, [forms]);

  const visible = useMemo(
    () => (statusFilter === 'all' ? sorted : sorted.filter((f) => f.status === statusFilter)),
    [sorted, statusFilter]
  );

  const nextForm = useMemo(
    () => forms.find((f) => f.status !== 'complete'),
    [forms]
  );

  const formsPct = Math.round((done / forms.length) * 100);

  return (
    <section className={`research-forms-hub${compact ? ' research-forms-hub--compact' : ''}`} aria-label="Research stage forms">
      <header className="research-forms-hub__header">
        <div>
          <h2>{compact ? 'Research checklist' : 'Stage 2 — Research forms'}</h2>
          <p className="research-forms-hub__intro">
            Complete all forms to pass the research gate and advance to Prototype.
            {evaluation?.blockers.length ? ` ${evaluation.blockers.length} blocker${evaluation.blockers.length === 1 ? '' : 's'} remaining.` : ''}
          </p>
        </div>
        <div className="research-forms-hub__progress">
          <strong>{done}/{forms.length}</strong>
          <span>forms complete</span>
        </div>
      </header>

      <div className="research-forms-hub__dashboard">
        <div className="research-forms-hub__metric">
          <span className="research-forms-hub__metric-label">Forms progress</span>
          <div className="research-forms-hub__metric-row">
            <div className="research-progress-bar research-forms-hub__bar" role="progressbar" aria-valuenow={formsPct} aria-valuemin={0} aria-valuemax={100}>
              <div style={{ width: `${formsPct}%` }} />
            </div>
            <strong>{formsPct}%</strong>
          </div>
        </div>
        <div className="research-forms-hub__metric">
          <span className="research-forms-hub__metric-label">System evidence</span>
          <div className="research-forms-hub__metric-row">
            <div className="research-progress-bar research-forms-hub__bar" role="progressbar" aria-valuenow={snapshot.completionRate} aria-valuemin={0} aria-valuemax={100}>
              <div style={{ width: `${snapshot.completionRate}%` }} />
            </div>
            <strong className={snapshot.completionRate >= 100 ? 'research-forms-hub__ready' : ''}>
              {snapshot.completionRate}%
            </strong>
          </div>
        </div>
        <div className="research-forms-hub__stat-chips">
          <span className="research-forms-hub__chip research-forms-hub__chip--complete">{done} complete</span>
          <span className="research-forms-hub__chip research-forms-hub__chip--progress">{inProgress} in progress</span>
          <span className="research-forms-hub__chip">{forms.length - done - inProgress} not started</span>
        </div>
      </div>

      {evaluation && evaluation.blockers.length > 0 ? (
        <div className="research-forms-hub__alert research-forms-hub__alert--block" role="alert">
          <strong>Gate blockers</strong>
          <ul>
            {evaluation.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {evaluation && evaluation.warnings.length > 0 ? (
        <div className="research-forms-hub__alert research-forms-hub__alert--warn" role="status">
          <strong>Warnings</strong>
          <ul>
            {evaluation.warnings.slice(0, 3).map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {nextForm ? (
        <div className="research-forms-hub__next">
          <div>
            <span className="research-forms-hub__next-label">Suggested next step</span>
            <strong>{nextForm.title}</strong>
            <p>{nextForm.detail}</p>
          </div>
          <button type="button" className="research-btn research-btn--primary" onClick={() => onOpenTab(nextForm.tab)}>
            Open {nextForm.title}
          </button>
        </div>
      ) : (
        <div className="research-forms-hub__next research-forms-hub__next--done">
          <span className="research-forms-hub__next-icon" aria-hidden>
            ✓
          </span>
          <div>
            <strong>All research forms complete</strong>
            <p>Proceed to gate review to authorize the Prototype stage.</p>
          </div>
          <button type="button" className="research-btn research-btn--primary" onClick={() => onOpenTab('gate')}>
            Open gate review
          </button>
        </div>
      )}

      <div className="research-forms-hub__toolbar">
        <div className="research-forms-hub__filters" role="group" aria-label="Filter forms by status">
          {(['all', 'not_started', 'in_progress', 'complete'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              className={`research-forms-hub__filter${statusFilter === filter ? ' research-forms-hub__filter--active' : ''}`}
              onClick={() => setStatusFilter(filter)}
            >
              {filter === 'all'
                ? `All (${forms.length})`
                : filter === 'not_started'
                  ? `Not started (${forms.length - done - inProgress})`
                  : filter === 'in_progress'
                    ? `In progress (${inProgress})`
                    : `Complete (${done})`}
            </button>
          ))}
        </div>
      </div>

      <div className="research-forms-grid">
        {visible.map((form) => (
          <button
            key={form.id}
            type="button"
            className={`research-form-card research-form-card--${form.status}`}
            onClick={() => onOpenTab(form.tab)}
          >
            <div className="research-form-card__head">
              <span className="research-form-card__icon" aria-hidden>
                {form.icon}
              </span>
              <span className={`research-form-card__status research-form-card__status--${form.status}`}>
                {STATUS_LABEL[form.status]}
              </span>
            </div>
            <div className="research-form-card__body">
              <h3>{form.title}</h3>
              <p>{form.description}</p>
              <span className="research-form-card__gate">{form.gateHint}</span>
              <span className="research-form-card__detail">{form.detail}</span>
              <div className="research-form-card__progress">
                <div className="research-progress-mini" aria-hidden>
                  <div style={{ width: `${form.progress}%` }} />
                </div>
                <span>{form.progress}%</span>
              </div>
            </div>
            <span className="research-form-card__cta" aria-hidden>
              Open →
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="research-empty research-forms-hub__empty">No forms match this filter.</p>
      ) : null}
    </section>
  );
}
