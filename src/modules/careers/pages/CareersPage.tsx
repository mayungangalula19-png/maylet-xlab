import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import {
  buildMayaMatchSnapshot,
  submitCareerApplication,
  validateResumeFile,
} from '../services/careers.service';
import './Careers.css';

const CORE_ROLES = [
  {
    title: 'Developers',
    icon: '💻',
    description: 'Build and ship features across the Idea → Commercialization pipeline.',
    tag: 'Engineering',
  },
  {
    title: 'AI Engineers (MAYA)',
    icon: '🤖',
    description: 'Design prompts, agents, and intelligence layers that power MAYA across modules.',
    tag: 'AI / MAYA',
  },
  {
    title: 'Researchers',
    icon: '🔬',
    description: 'Advance literature review, evidence models, and research workflows.',
    tag: 'Research',
  },
  {
    title: 'Designers',
    icon: '🎨',
    description: 'Craft product UX for innovators, teams, and ecosystem programs.',
    tag: 'Design',
  },
  {
    title: 'Data Engineers',
    icon: '📊',
    description: 'Pipeline analytics, scoring systems, and platform intelligence infrastructure.',
    tag: 'Data',
  },
  {
    title: 'Innovation Fellows',
    icon: '🌱',
    description: 'Bridge community, academy, and incubator programs with real builder outcomes.',
    tag: 'Ecosystem',
  },
];

const INNOVATION_ROLES = [
  {
    title: 'Research Contributors',
    icon: '📚',
    description: 'Curate findings, documents, and research gates tied to active projects.',
  },
  {
    title: 'Prototype Builders',
    icon: '📦',
    description: 'Help teams iterate MVPs, uploads, and prototype testing workflows.',
  },
  {
    title: 'Experiment Analysts',
    icon: '🧪',
    description: 'Design and interpret structured experiments with measurable outcomes.',
  },
  {
    title: 'Validation Reviewers',
    icon: '✅',
    description: 'Evaluate readiness evidence and scoring before projects enter funding.',
  },
  {
    title: 'Funding Analysts',
    icon: '💰',
    description: 'Support pitch quality, investor matching, and capital readiness reviews.',
  },
];

const WHY_JOIN = [
  {
    icon: '🌍',
    title: 'Global innovation ecosystem',
    description: 'Work with builders across 35+ countries on real Idea → Commercialization journeys.',
  },
  {
    icon: '🧠',
    title: 'MAYA-powered workflows',
    description: 'Collaborate on AI-assisted research, validation, and funding intelligence.',
  },
  {
    icon: '🚀',
    title: 'Ship meaningful impact',
    description: 'Every role connects directly to products innovators use every day.',
  },
  {
    icon: '🎓',
    title: 'Learn and grow fast',
    description: 'Academy resources, mentorship, and a clear path from contributor to lead.',
  },
  {
    icon: '🤝',
    title: 'Remote-first collaboration',
    description: 'Async-friendly teams with hubs in Africa and a global contributor network.',
  },
  {
    icon: '💡',
    title: 'Equity in innovation',
    description: 'Help democratize tools once reserved for well-funded startup ecosystems.',
  },
];

const GROWTH_PATH = [
  { level: 'Intern', detail: 'Learn the pipeline' },
  { level: 'Contributor', detail: 'Ship scoped work' },
  { level: 'Engineer', detail: 'Own modules' },
  { level: 'Lead', detail: 'Guide squads' },
  { level: 'Architect', detail: 'Shape the OS' },
];

const ROLE_OPTIONS = [
  'Developers',
  'AI Engineers (MAYA)',
  'Researchers',
  'Designers',
  'Data Engineers',
  'Innovation Fellows',
  'Research Contributors',
  'Prototype Builders',
  'Experiment Analysts',
  'Validation Reviewers',
  'Funding Analysts',
];

interface ApplicationForm {
  name: string;
  email: string;
  skills: string;
  portfolio: string;
  role: string;
}

const EMPTY_FORM: ApplicationForm = {
  name: '',
  email: '',
  skills: '',
  portfolio: '',
  role: '',
};

export default function Careers() {
  const { user } = useAuth();
  const [form, setForm] = useState<ApplicationForm>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  useEffect(() => {
    if (user?.email) {
      setForm((prev) => (prev.email ? prev : { ...prev, email: user.email! }));
    }
  }, [user?.email]);

  const mayaSnapshot = useMemo(
    () => buildMayaMatchSnapshot(form.skills || 'TypeScript, React'),
    [form.skills]
  );

  const displaySkills = mayaSnapshot.skills.length > 0 ? mayaSnapshot.skills : ['TypeScript', 'React'];
  const topMatches = mayaSnapshot.matches.slice(0, 3);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const applyForRole = (roleTitle: string) => {
    setForm((prev) => ({ ...prev, role: roleTitle }));
    scrollTo('apply');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const snapshot = buildMayaMatchSnapshot(form.skills);

    if (resumeFile) {
      const resumeError = validateResumeFile(resumeFile);
      if (resumeError) {
        setSubmitting(false);
        setError(resumeError);
        return;
      }
    }

    const { error: submitError } = await submitCareerApplication({
      fullName: form.name,
      email: form.email,
      roleInterest: form.role,
      skills: form.skills,
      portfolio: form.portfolio,
      userId: user?.id ?? null,
      mayaMatchSnapshot: snapshot,
      resumeFile,
    });

    setSubmitting(false);

    if (submitError) {
      setError(submitError);
      return;
    }

    setSubmitted(true);
    setForm(EMPTY_FORM);
    setResumeFile(null);
    window.setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="careers-page">
      <Link to="/" className="careers-back">
        ← Back to Home
      </Link>

      <div className="careers-container">
        <section className="careers-hero">
          <div className="careers-pill">
            <span>🌟</span> Ecosystem Talent
          </div>
          <h1>
            Join <span>Maylet XLab</span>
          </h1>
          <p>
            The innovation operating system needs builders, researchers, and analysts who want to
            turn ideas into funded, scalable ventures — across Africa and beyond.
          </p>
          <div className="careers-hero__actions">
            <button type="button" className="careers-btn careers-btn--primary" onClick={() => scrollTo('apply')}>
              Apply →
            </button>
            <button type="button" className="careers-btn careers-btn--secondary" onClick={() => scrollTo('roles')}>
              View Roles
            </button>
          </div>
        </section>

        <section className="careers-section" id="roles">
          <div className="careers-section__head">
            <div className="careers-kicker">Open tracks</div>
            <h2>
              Core <span>roles</span>
            </h2>
            <p>Full-time and contract paths across product, AI, design, data, and ecosystem programs.</p>
          </div>
          <div className="careers-grid">
            {CORE_ROLES.map((role) => (
              <article
                key={role.title}
                className="careers-card careers-card--clickable"
                onClick={() => applyForRole(role.title)}
                onKeyDown={(e) => e.key === 'Enter' && applyForRole(role.title)}
                role="button"
                tabIndex={0}
              >
                <div className="careers-card__icon">{role.icon}</div>
                <h3>{role.title}</h3>
                <p>{role.description}</p>
                <span className="careers-card__tag">{role.tag}</span>
                <span className="careers-card__apply">Apply for this role →</span>
              </article>
            ))}
          </div>
        </section>

        <section className="careers-section" id="innovation-roles">
          <div className="careers-section__head">
            <div className="careers-kicker">Pipeline specialists</div>
            <h2>
              Innovation-specific <span>roles</span>
            </h2>
            <p>Contribute at each stage of the Idea → Commercialization workflow.</p>
          </div>
          <div className="careers-innovation">
            <div className="careers-grid careers-grid--2">
              {INNOVATION_ROLES.map((role) => (
                <article
                  key={role.title}
                  className="careers-card careers-card--clickable"
                  onClick={() => applyForRole(role.title)}
                  onKeyDown={(e) => e.key === 'Enter' && applyForRole(role.title)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="careers-card__icon">{role.icon}</div>
                  <h3>{role.title}</h3>
                  <p>{role.description}</p>
                  <span className="careers-card__apply">Apply for this role →</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="careers-section" id="why-join">
          <div className="careers-section__head">
            <div className="careers-kicker">Why join</div>
            <h2>
              Innovation ecosystem <span>benefits</span>
            </h2>
            <p>More than a job — a front-row seat to how the next generation of startups gets built.</p>
          </div>
          <div className="careers-benefits">
            {WHY_JOIN.map((item) => (
              <div key={item.title} className="careers-benefit">
                <span className="careers-benefit__icon">{item.icon}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="careers-section" id="growth-path">
          <div className="careers-section__head">
            <div className="careers-kicker">Your trajectory</div>
            <h2>
              Growth <span>path</span>
            </h2>
            <p>Start as an intern or contributor and grow into technical leadership on the platform.</p>
          </div>
          <div className="careers-path">
            {GROWTH_PATH.map((step, index) => (
              <div key={step.level} style={{ display: 'contents' }}>
                <div className="careers-path__step">
                  <strong>{step.level}</strong>
                  <span>{step.detail}</span>
                </div>
                {index < GROWTH_PATH.length - 1 && (
                  <span className="careers-path__arrow" aria-hidden>
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="careers-section" id="maya-matching">
          <div className="careers-section__head">
            <div className="careers-kicker">MAYA intelligence</div>
            <h2>
              AI role <span>matching</span>
            </h2>
            <p>MAYA ranks ecosystem fit from your skills — updates live as you type in the application form.</p>
          </div>
          <div className="careers-maya">
            <div className="careers-maya__panel">
              <div className="careers-maya__badge">
                <span>✨</span> MAYA Talent Matcher
              </div>
              <h3>Your skill profile</h3>
              <p>Parsed from the skills field in your application:</p>
              <div className="careers-skill-tags">
                {displaySkills.map((skill, index) => (
                  <span
                    key={skill}
                    className={`careers-skill-tag ${index < 3 ? 'careers-skill-tag--active' : ''}`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="careers-maya__panel">
              <h3>Suggested role matches</h3>
              <p>Top fits based on your current skill profile:</p>
              <div className="careers-match-list">
                {topMatches.map((match) => (
                  <div key={match.role} className="careers-match-item">
                    <div style={{ flex: 1 }}>
                      <strong>{match.role}</strong>
                      <div className="careers-match-bar">
                        <span style={{ width: `${match.score}%` }} />
                      </div>
                    </div>
                    <span className="careers-match-score">{match.score}% fit</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="careers-section" id="apply">
          <div className="careers-section__head">
            <div className="careers-kicker">Apply now</div>
            <h2>
              Join the <span>ecosystem</span>
            </h2>
            <p>Tell us about yourself. We review applications on a rolling basis.</p>
          </div>
          <div className="careers-apply">
            <form className="careers-form" onSubmit={handleSubmit}>
              {submitted && (
                <div className="careers-form__success" role="status">
                  Application saved! Our team will review it and contact you by email.
                </div>
              )}
              {error && (
                <div className="careers-form__error" role="alert">
                  {error}
                </div>
              )}
              <div className="careers-form__row">
                <div>
                  <label htmlFor="careers-name">Full name</label>
                  <input
                    id="careers-name"
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label htmlFor="careers-email">Email</label>
                  <input
                    id="careers-email"
                    type="email"
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="careers-role">Role of interest</label>
                <select
                  id="careers-role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  required
                  disabled={submitting}
                >
                  <option value="">Select a role</option>
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="careers-skills">Skills</label>
                <input
                  id="careers-skills"
                  type="text"
                  placeholder="e.g. React, Python, UX research, data analysis"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label htmlFor="careers-resume">Resume (PDF or Word, max 5 MB)</label>
                <input
                  id="careers-resume"
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                  disabled={submitting}
                />
                {resumeFile && (
                  <p className="careers-form__note" style={{ marginTop: 0 }}>
                    Selected: {resumeFile.name}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="careers-portfolio">Portfolio / LinkedIn / GitHub</label>
                <textarea
                  id="careers-portfolio"
                  placeholder="Share links to your work, projects, or profiles"
                  value={form.portfolio}
                  onChange={(e) => setForm({ ...form, portfolio: e.target.value })}
                  required
                  disabled={submitting}
                />
              </div>
              <button
                type="submit"
                className="careers-btn careers-btn--primary"
                style={{ width: '100%' }}
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : 'Submit Application →'}
              </button>
              {user && (
                <p className="careers-form__note">
                  Signed in as {user.email} — your application will be linked to your account.
                </p>
              )}
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
