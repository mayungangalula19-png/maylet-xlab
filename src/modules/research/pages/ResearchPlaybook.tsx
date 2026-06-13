import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { getProject } from '../../../services/projects.service';
import '../research.css';

const SECTIONS = [
  {
    id: 'mandate',
    title: '1. Research Mandate',
    content: `Define before collecting evidence:
• Research objective — what decision must research enable?
• Innovation hypothesis — what do you believe before evidence?
• Decision deadline — when is go/no-go required?
• Evidence standard — minimum proof to advance
• Stakeholders — who consumes outputs?`,
  },
  {
    id: 'problem',
    title: '2. Problem Definition (Problem tab)',
    fields: [
      { label: 'Problem Statement', hint: 'Context → Problem → Impact → Opportunity' },
      { label: 'Target Users', hint: 'Primary users, environment, constraints' },
      { label: 'Pain Points', hint: 'Operational, economic, adoption barriers' },
      { label: 'Existing Solutions', hint: 'Manual methods, commercial options, market gap' },
      { label: 'Research Questions', hint: 'Strategic (must answer) + Operational + Risk' },
    ],
  },
  {
    id: 'notes',
    title: '3. Notes System (Notes tab)',
    content: `Categories: general, fieldwork, interview, methodology, data, meeting

Each note should include:
[Context] [Observation] [Implication] [Follow-up] [Confidence]

Professional target: ≥10 notes across ≥3 categories`,
  },
  {
    id: 'literature',
    title: '4. Literature Review (Literature tab)',
    content: `Track: title, type, authors, source, date, citations, relevance (0–100), URL, notes

Relevance rubric:
90–100 Directly answers strategic question
70–89  Strong supporting evidence
50–69  Contextual background
<50    Archive only

Professional target: ≥8 sources, avg relevance ≥70`,
  },
  {
    id: 'documents',
    title: '5. Document Evidence (Documents tab)',
    content: `Classes: Primary evidence, Survey instruments, Benchmark data, Regulatory, Commercial intel, Synthesis

Formats: PDF, DOCX, PPTX, TXT
Tag every upload with category and description.`,
  },
  {
    id: 'findings',
    title: '6. Findings Repository (Findings tab)',
    content: `Types: finding → observation → insight → conclusion

Format:
CLAIM / EVIDENCE / CONFIDENCE / DECISION IMPACT / OPEN RISK

Professional target: ≥5 findings including ≥1 conclusion`,
  },
  {
    id: 'maya',
    title: '7. MAYA Review Workflow (MAYA tab)',
    steps: ['summarize', 'gaps', 'questions', 'insights', 'literature', 'nextSteps'],
  },
  {
    id: 'gate',
    title: '8. Gate Approval (Gate tab)',
    content: `Sections A–D must pass before Prototype:
A — System evidence (8/8, 100%)
B — Professional quality (auto-evaluated)
C — Decision readiness (human confirm)
D — Approver sign-off (GO / Conditional GO / Hold / No-Go)

Prototype is authorized only after GO or Conditional GO with V1 scope documented.`,
  },
];

export default function ResearchPlaybook() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [open, setOpen] = useState<string>('mandate');

  useEffect(() => {
    if (!projectId) {
      navigate('/research');
      return;
    }
    getProject(projectId)
      .then((p) => setProjectName(p.name))
      .catch(() => setProjectName('Project'));
  }, [projectId, navigate]);

  if (!projectId) return null;

  return (
    <div className="research-page">
      <nav className="research-breadcrumb">
        <Link to="/research">Research Center</Link>
        <span>/</span>
        <Link to={`/research/${projectId}`}>{projectName}</Link>
        <span>/</span>
        <span>Playbook</span>
      </nav>

      <header className="research-header">
        <div>
          <h1>Research Playbook</h1>
          <p>Advanced operating guide for {projectName} — Idea → Research → Prototype gate.</p>
        </div>
        <Link to={`/research/${projectId}?tab=gate`} className="research-btn research-btn--primary">
          Open Gate Review
        </Link>
      </header>

      <div className="research-playbook">
        {SECTIONS.map((s) => (
          <div key={s.id} className="research-glass research-playbook-section">
            <button
              type="button"
              className="research-playbook-toggle"
              onClick={() => setOpen(open === s.id ? '' : s.id)}
            >
              {s.title}
              <span>{open === s.id ? '−' : '+'}</span>
            </button>
            {open === s.id && (
              <div className="research-playbook-body">
                {s.content && <pre className="research-playbook-pre">{s.content}</pre>}
                {s.fields?.map((f) => (
                  <div key={f.label} className="research-playbook-field">
                    <strong>{f.label}</strong>
                    <p>{f.hint}</p>
                  </div>
                ))}
                {s.steps && (
                  <ol className="research-playbook-steps">
                    {s.steps.map((step) => (
                      <li key={step}>Run MAYA prompt: <code>{step}</code></li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="research-glass research-panel" style={{ marginTop: '1rem' }}>
        <h2>30-Day Research Sprint</h2>
        <div className="research-overview-grid">
          <div className="research-overview-card"><strong>Week 1</strong><span>Problem + 5 sources</span></div>
          <div className="research-overview-card"><strong>Week 2</strong><span>Interviews + fieldwork</span></div>
          <div className="research-overview-card"><strong>Week 3</strong><span>Insights + economics</span></div>
          <div className="research-overview-card"><strong>Week 4</strong><span>Gate review + conclusion</span></div>
        </div>
        <div className="research-gate-actions" style={{ marginTop: '1rem' }}>
          <Link to={`/research/${projectId}`} className="research-btn research-btn--secondary">Back to workspace</Link>
          <Link to={`/research/${projectId}/literature`} className="research-btn research-btn--secondary">Literature center</Link>
        </div>
      </div>
    </div>
  );
}
