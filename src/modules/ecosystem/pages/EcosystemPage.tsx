import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';
import { useAuth } from '../../../hooks/useAuth';
import { getProjects } from '../../../lib/supabase/projects.queries';
import type { Project } from '../../../types/project.types';

/* ─── Types & constants ───────────────────────────────────────────────────── */

const PIPELINE = [
  'Idea',
  'Research',
  'Prototype',
  'Experiment',
  'Validation',
  'Funding',
  'Commercialization',
] as const;

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'innovators', label: 'Innovators' },
  { id: 'startups', label: 'Startups' },
  { id: 'universities', label: 'Universities' },
  { id: 'investors', label: 'Investors' },
  { id: 'mentors', label: 'Mentors' },
  { id: 'partnerships', label: 'Partnerships' },
  { id: 'communities', label: 'Communities' },
  { id: 'events', label: 'Events' },
  { id: 'collaboration', label: 'Collaboration' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

type EntityType =
  | 'innovator'
  | 'student'
  | 'researcher'
  | 'startup'
  | 'company'
  | 'university'
  | 'investor'
  | 'mentor'
  | 'partner'
  | 'ngo'
  | 'government'
  | 'community'
  | 'event';

interface EcosystemEntity {
  id: string;
  type: EntityType;
  name: string;
  tagline: string;
  sector: string;
  region: string;
  tags: string[];
  description: string;
  metric?: string;
  status: 'active' | 'accepting' | 'closed';
  link: string;
}

interface EcosystemMetrics {
  innovators: number;
  startups: number;
  investors: number;
  mentors: number;
  partners: number;
  communities: number;
}

interface MayaEcosystemInsight {
  mentorMatches: string[];
  investorMatches: string[];
  partnerRecs: string[];
  collaborationIdeas: string[];
  fundingOps: string[];
}

const SECTORS = [
  'All',
  'Health',
  'Education',
  'FinTech',
  'Agriculture',
  'AI/ML',
  'Climate',
  'Logistics',
  'GovTech',
] as const;

const CATALOG: EcosystemEntity[] = [
  {
    id: 'inv-1',
    type: 'innovator',
    name: 'Nairobi Health Builders',
    tagline: 'Clinical workflow innovators',
    sector: 'Health',
    region: 'East Africa',
    tags: ['telemedicine', 'validation-ready'],
    description: 'Cross-functional innovator collective building hospital triage and rural diagnostics tools.',
    metric: '12 active projects',
    status: 'active',
    link: '/projects',
  },
  {
    id: 'stu-1',
    type: 'student',
    name: 'XLab Campus Fellows',
    tagline: 'University student innovators',
    sector: 'Education',
    region: 'Global',
    tags: ['student', 'hackathon'],
    description: 'Student innovators participating in structured research-to-prototype programs.',
    metric: '2,400+ fellows',
    status: 'accepting',
    link: '/ecosystem/academy',
  },
  {
    id: 'res-1',
    type: 'researcher',
    name: 'Applied Research Network',
    tagline: 'Evidence-first R&D',
    sector: 'AI/ML',
    region: 'Global',
    tags: ['literature', 'experiments'],
    description: 'Researchers publishing findings and running structured experiments on the XLab pipeline.',
    metric: '180 research workspaces',
    status: 'active',
    link: '/research',
  },
  {
    id: 'st-1',
    type: 'startup',
    name: 'AgriPulse',
    tagline: 'Precision agriculture SaaS',
    sector: 'Agriculture',
    region: 'East Africa',
    tags: ['prototype', 'funding'],
    description: 'Startup linking soil sensors to cooperative marketplaces with validation PASS evidence.',
    metric: 'Series seed ready',
    status: 'active',
    link: '/funding',
  },
  {
    id: 'st-2',
    type: 'startup',
    name: 'PayFlow Africa',
    tagline: 'SME treasury automation',
    sector: 'FinTech',
    region: 'West Africa',
    tags: ['commercialization'],
    description: 'B2B payments startup entering commercialization with GTM partners.',
    metric: '8 enterprise pilots',
    status: 'active',
    link: '/commercialization',
  },
  {
    id: 'co-1',
    type: 'company',
    name: 'Horizon Manufacturing Group',
    tagline: 'Industry pilot partner',
    sector: 'Logistics',
    region: 'Southern Africa',
    tags: ['pilot', 'partner'],
    description: 'Corporate innovation unit co-developing prototypes with XLab teams.',
    status: 'accepting',
    link: '/enterprise',
  },
  {
    id: 'uni-1',
    type: 'university',
    name: 'University of Nairobi Innovation Lab',
    tagline: 'Research commercialization',
    sector: 'Education',
    region: 'Kenya',
    tags: ['university', 'IP'],
    description: 'Technology transfer office connecting faculty research to XLab validation and funding.',
    metric: '45 spin-outs tracked',
    status: 'active',
    link: '/research',
  },
  {
    id: 'uni-2',
    type: 'university',
    name: 'Makerere AI Research Institute',
    tagline: 'Health AI evidence lab',
    sector: 'Health',
    region: 'Uganda',
    tags: ['university', 'clinical'],
    description: 'Institution running joint experiments and prototype testing with innovator teams.',
    status: 'active',
    link: '/experiments',
  },
  {
    id: 'inv-net-1',
    type: 'investor',
    name: 'Savannah Seed Fund',
    tagline: 'Early-stage impact VC',
    sector: 'FinTech',
    region: 'Pan-Africa',
    tags: ['seed', 'impact'],
    description: 'Investor network reviewing PASS-validated pitches from the Funding Hub.',
    metric: '$12M deployable',
    status: 'accepting',
    link: '/funding',
  },
  {
    id: 'inv-net-2',
    type: 'investor',
    name: 'HealthBridge Angels',
    tagline: 'Clinical innovation angels',
    sector: 'Health',
    region: 'Global',
    tags: ['angel', 'health'],
    description: 'Angel syndicate focused on validated health prototypes with user evidence.',
    status: 'accepting',
    link: '/funding/create',
  },
  {
    id: 'men-1',
    type: 'mentor',
    name: 'Dr. Amara Okafor',
    tagline: 'Product & regulatory strategy',
    sector: 'Health',
    region: 'Global',
    tags: ['mentor', 'FDA'],
    description: 'Mentor supporting teams through validation gates and regulatory documentation.',
    metric: '4.9★ · 120 sessions',
    status: 'accepting',
    link: '/mentorship',
  },
  {
    id: 'men-2',
    type: 'mentor',
    name: 'James Mbeki',
    tagline: 'Go-to-market & fundraising',
    sector: 'FinTech',
    region: 'East Africa',
    tags: ['mentor', 'GTM'],
    description: 'Former founder mentoring commercialization and investor narrative development.',
    status: 'accepting',
    link: '/mentorship',
  },
  {
    id: 'par-1',
    type: 'partner',
    name: 'Innovation Alliance Corp',
    tagline: 'Enterprise co-development',
    sector: 'Logistics',
    region: 'Global',
    tags: ['enterprise', 'pilot'],
    description: 'Strategic partner providing pilot sites and procurement pathways for validated products.',
    status: 'active',
    link: '/enterprise',
  },
  {
    id: 'ngo-1',
    type: 'ngo',
    name: 'GreenFuture Foundation',
    tagline: 'Climate innovation grants',
    sector: 'Climate',
    region: 'Global',
    tags: ['grant', 'climate'],
    description: 'NGO funding research and prototype phases for climate resilience solutions.',
    metric: '$2M grant pool',
    status: 'accepting',
    link: '/funding',
  },
  {
    id: 'gov-1',
    type: 'government',
    name: 'National Innovation Authority',
    tagline: 'Public innovation programs',
    sector: 'GovTech',
    region: 'East Africa',
    tags: ['government', 'policy'],
    description: 'Government program connecting validated startups to procurement and export support.',
    status: 'active',
    link: '/ecosystem/incubator',
  },
  {
    id: 'com-1',
    type: 'community',
    name: 'XLab Health Innovators',
    tagline: 'Sector community',
    sector: 'Health',
    region: 'Global',
    tags: ['slack', 'weekly'],
    description: 'Community of practice for health innovators sharing validation evidence templates.',
    metric: '1,200 members',
    status: 'active',
    link: '/ecosystem/community',
  },
  {
    id: 'com-2',
    type: 'community',
    name: 'Women in Deep Tech',
    tagline: 'Inclusive innovation network',
    sector: 'AI/ML',
    region: 'Global',
    tags: ['diversity', 'mentorship'],
    description: 'Community pairing founders with mentors and investor office hours.',
    status: 'accepting',
    link: '/community',
  },
  {
    id: 'evt-1',
    type: 'event',
    name: 'XLab Innovation Challenge 2026',
    tagline: 'Global validation sprint',
    sector: 'All',
    region: 'Hybrid',
    tags: ['challenge', 'prizes'],
    description: 'Multi-week challenge from prototype to validation with mentor office hours.',
    metric: '$50K prize pool',
    status: 'accepting',
    link: '/hackathons',
  },
  {
    id: 'evt-2',
    type: 'event',
    name: 'Funding Readiness Summit',
    tagline: 'Investor demo day',
    sector: 'FinTech',
    region: 'Nairobi',
    tags: ['summit', 'investors'],
    description: 'Showcase for PASS-validated teams meeting active investor networks.',
    status: 'accepting',
    link: '/funding',
  },
];

const SECTION_TYPES: Record<SectionId, EntityType[] | 'all'> = {
  dashboard: 'all',
  innovators: ['innovator', 'student', 'researcher'],
  startups: ['startup', 'company'],
  universities: ['university'],
  investors: ['investor'],
  mentors: ['mentor'],
  partnerships: ['partner', 'ngo', 'government'],
  communities: ['community'],
  events: ['event'],
  collaboration: 'all',
};

const INTEGRATIONS = [
  { label: 'Projects', desc: 'Pipeline workspaces', to: '/projects' },
  { label: 'Research', desc: 'Evidence & literature', to: '/research' },
  { label: 'Funding', desc: 'Investor matching', to: '/funding' },
  { label: 'Commercialization', desc: 'GTM launch center', to: '/commercialization' },
  { label: 'Careers', desc: 'Talent & hiring', to: '/careers' },
  { label: 'Teams', desc: 'Collaboration hub', to: '/teams' },
];

/** Innovation OS module tree under each project */
const PROJECT_MODULES = [
  { label: 'Research', route: (projectId: string) => `/research/${projectId}` },
  { label: 'Prototype', route: (projectId: string) => `/prototypes?projectId=${projectId}` },
  { label: 'Experiment', route: (projectId: string) => `/experiments?projectId=${projectId}` },
  { label: 'Validation', route: (projectId: string) => `/validation/new?projectId=${projectId}` },
  { label: 'Funding', route: (projectId: string) => `/funding/create?projectId=${projectId}` },
  {
    label: 'Commercialization',
    route: (projectId: string) => `/commercialization?projectId=${projectId}`,
  },
] as const;

function ProjectPipelineTree({
  project,
  compact = false,
}: {
  project: Project;
  compact?: boolean;
}) {
  return (
    <div className={`eco-pipeline-tree ${compact ? 'eco-pipeline-tree--compact' : ''}`}>
      <div className="eco-pipeline-tree__root">
        <Link to={`/projects/${project.id}`}>Project · {project.name}</Link>
        <span className="eco-muted">
          {project.sector} · {project.progress}%
        </span>
      </div>
      <ul className="eco-pipeline-tree__modules">
        {PROJECT_MODULES.map((mod, index) => {
          const branch = index === PROJECT_MODULES.length - 1 ? '└' : '├';
          return (
            <li key={mod.label}>
              <span className="eco-pipeline-tree__branch" aria-hidden>
                {branch}
              </span>
              <Link to={mod.route(project.id)}>{mod.label}</Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StaticPipelineDiagram() {
  return (
    <div className="eco-pipeline-diagram" aria-label="Project pipeline structure">
      <div className="eco-pipeline-diagram__root">Project</div>
      <ul>
        {PROJECT_MODULES.map((mod, index) => (
          <li key={mod.label}>
            <span aria-hidden>{index === PROJECT_MODULES.length - 1 ? '└' : '├'}</span>
            {mod.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── MAYA stubs ────────────────────────────────────────────────────────── */

function mayaMentorMatches(sector: string, projects: Project[]): string[] {
  const stage = projects[0]?.status ?? 'active';
  return [
    `Match mentors with ${sector} + ${stage} stage experience for your top project.`,
    'Dr. Amara Okafor — regulatory & clinical validation (Health).',
    'James Mbeki — GTM narrative and investor prep (FinTech).',
    'Book sessions via Mentorship after validation PASS.',
  ];
}

function mayaInvestorMatches(sector: string, projects: Project[]): string[] {
  const readiness = projects.length ? 'validation-linked' : 'early';
  return [
    `Savannah Seed Fund aligns with ${sector} ${readiness} raises.`,
    'HealthBridge Angels for clinical evidence-heavy decks.',
    'Upload pitch workspace artifacts before investor outreach.',
    'Target investors only after validation gate PASS.',
  ];
}

function mayaPartnerRecs(sector: string): string[] {
  return [
    `Horizon Manufacturing Group — pilot partner for ${sector} hardware/logistics.`,
    'GreenFuture Foundation — climate grant pathway for research-stage teams.',
    'National Innovation Authority — procurement bridge post-commercialization.',
    'Enterprise Vault — secure partner document exchange.',
  ];
}

function mayaCollaboration(projects: Project[]): string[] {
  if (!projects.length) {
    return [
      'Create a project, then open Teams to assemble cross-functional collaborators.',
      'Join sector communities for co-founder matching.',
      'Link research documents before inviting university partners.',
    ];
  }
  return projects.slice(0, 3).map(
    (p) => `Team workspace for "${p.name}" — invite mentors and researchers from directory.`
  );
}

function mayaFundingOps(projects: Project[]): string[] {
  const hasProject = projects.length > 0;
  return [
    hasProject ? 'Run validation gate, then create a structured funding pitch.' : 'Start with Save Idea or Create Project.',
    'NGO grant track: GreenFuture Foundation climate pool.',
    'Government program: National Innovation Authority export readiness.',
    'Monitor Funding Hub for investor application status.',
  ];
}

function buildMayaInsight(sector: string, projects: Project[]): MayaEcosystemInsight {
  return {
    mentorMatches: mayaMentorMatches(sector, projects),
    investorMatches: mayaInvestorMatches(sector, projects),
    partnerRecs: mayaPartnerRecs(sector),
    collaborationIdeas: mayaCollaboration(projects),
    fundingOps: mayaFundingOps(projects),
  };
}

function countByTypes(types: EntityType[]): number {
  return CATALOG.filter((e) => types.includes(e.type)).length;
}

function defaultMetrics(): EcosystemMetrics {
  return {
    innovators: countByTypes(['innovator', 'student', 'researcher']),
    startups: countByTypes(['startup', 'company']),
    investors: countByTypes(['investor']),
    mentors: countByTypes(['mentor']),
    partners: countByTypes(['partner', 'ngo', 'government']),
    communities: countByTypes(['community']),
  };
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function Ecosystem() {
  const { user } = useAuth();

  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState<string>('All');
  const [region, setRegion] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'accepting' | 'active'>('all');
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [liveMetrics, setLiveMetrics] = useState<EcosystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const metrics = liveMetrics ?? defaultMetrics();
  const maya = useMemo(
    () => buildMayaInsight(sector === 'All' ? 'multi-sector' : sector, userProjects),
    [sector, userProjects]
  );

  const loadContext = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        const projects = await getProjects(user.id);
        setUserProjects(projects);

        const [{ count: teamCount }, { count: projectCount }] = await Promise.all([
          supabase.from('teams').select('*', { count: 'exact', head: true }).eq('owner_id', user.id),
          supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        ]);

        setLiveMetrics({
          innovators: defaultMetrics().innovators + (projectCount ?? 0),
          startups: defaultMetrics().startups + Math.max(0, (projectCount ?? 0) - 1),
          investors: defaultMetrics().investors,
          mentors: defaultMetrics().mentors,
          partners: defaultMetrics().partners,
          communities: defaultMetrics().communities + (teamCount ?? 0),
        });
      } else {
        setLiveMetrics(null);
        setUserProjects([]);
      }
    } catch {
      setLiveMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadContext();
  }, [loadContext]);

  const filtered = useMemo(() => {
    const types = SECTION_TYPES[activeSection];
    const q = search.trim().toLowerCase();

    return CATALOG.filter((e) => {
      if (types !== 'all' && !types.includes(e.type)) return false;
      if (sector !== 'All' && e.sector !== sector && e.sector !== 'All') return false;
      if (region && !e.region.toLowerCase().includes(region.toLowerCase())) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [e.name, e.tagline, e.description, e.sector, e.region, ...e.tags]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [activeSection, search, sector, region, statusFilter]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  };

  const runMaya = () => {
    flash('MAYA ecosystem intelligence refreshed for your profile.');
  };

  return (
    <div className="eco-page">
      <header className="eco-hero">
        <Link to="/" className="eco-back">
          ← Maylet XLab
        </Link>
        <h1>Innovation Ecosystem Hub</h1>
        <p>
          Connect innovators, universities, investors, mentors, and partners across the full
          innovation operating system.
        </p>
        <nav className="eco-pipeline" aria-label="Innovation pipeline">
          {PIPELINE.map((step) => (
            <span key={step} className="eco-pipeline__step">
              {step}
            </span>
          ))}
        </nav>
      </header>

      {toast && <div className="eco-toast">{toast}</div>}

      <section className="eco-metrics" aria-label="Ecosystem metrics">
        {(
          [
            ['Innovators', metrics.innovators],
            ['Startups', metrics.startups],
            ['Investors', metrics.investors],
            ['Mentors', metrics.mentors],
            ['Partners', metrics.partners],
            ['Communities', metrics.communities],
          ] as const
        ).map(([label, value]) => (
          <article key={label} className="eco-metric">
            <span>{label}</span>
            <strong>{loading ? '…' : value}</strong>
          </article>
        ))}
      </section>

      <nav className="eco-tabs" aria-label="Ecosystem sections">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={activeSection === s.id ? 'on' : ''}
            onClick={() => setActiveSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div className="eco-layout">
        <aside className="eco-maya">
          <h2>MAYA Ecosystem AI</h2>
          <button type="button" className="eco-maya__run" onClick={runMaya}>
            ✨ Refresh matches
          </button>

          <div className="eco-maya__block">
            <h3>Mentor matching</h3>
            <ul>{maya.mentorMatches.slice(0, 3).map((m) => <li key={m}>{m}</li>)}</ul>
          </div>
          <div className="eco-maya__block">
            <h3>Investor matching</h3>
            <ul>{maya.investorMatches.slice(0, 3).map((m) => <li key={m}>{m}</li>)}</ul>
          </div>
          <div className="eco-maya__block">
            <h3>Partner recommendations</h3>
            <ul>{maya.partnerRecs.slice(0, 2).map((m) => <li key={m}>{m}</li>)}</ul>
          </div>
          <div className="eco-maya__block">
            <h3>Collaboration suggestions</h3>
            <ul>{maya.collaborationIdeas.map((m) => <li key={m}>{m}</li>)}</ul>
          </div>
          <div className="eco-maya__block">
            <h3>Funding opportunities</h3>
            <ul>{maya.fundingOps.slice(0, 3).map((m) => <li key={m}>{m}</li>)}</ul>
          </div>

          {!user && (
            <p className="eco-muted">
              <Link to="/login">Sign in</Link> to personalize matches with your projects.
            </p>
          )}

          <div className="eco-maya__block eco-maya__pipeline">
            <h3>Project pipeline</h3>
            <StaticPipelineDiagram />
          </div>

          {userProjects.length > 0 && (
            <div className="eco-maya__block">
              <h3>Your projects</h3>
              {userProjects.slice(0, 2).map((p) => (
                <ProjectPipelineTree key={p.id} project={p} compact />
              ))}
            </div>
          )}
        </aside>

        <main className="eco-main">
          {activeSection === 'dashboard' && (
            <section className="eco-panel">
              <h2>Ecosystem dashboard</h2>
              <p className="eco-muted">
                Platform directory spanning {CATALOG.length} verified ecosystem entities. Search and
                filter across innovators, capital, institutions, and programs.
              </p>
              <div className="eco-highlights">
                {CATALOG.slice(0, 4).map((e) => (
                  <article key={e.id} className="eco-highlight">
                    <strong>{e.name}</strong>
                    <p>{e.tagline}</p>
                    <Link to={e.link}>Explore →</Link>
                  </article>
                ))}
              </div>
              <h3>Platform integrations</h3>
              <div className="eco-integrations">
                {INTEGRATIONS.map((i) => (
                  <Link key={i.to} to={i.to} className="eco-int-card">
                    <strong>{i.label}</strong>
                    <span>{i.desc}</span>
                  </Link>
                ))}
              </div>

              <h3>Project module map</h3>
              <p className="eco-muted">
                Every innovation project runs through the same operating system modules.
              </p>
              <StaticPipelineDiagram />

              {userProjects.length > 0 ? (
                <div className="eco-project-trees">
                  {userProjects.slice(0, 4).map((p) => (
                    <ProjectPipelineTree key={p.id} project={p} />
                  ))}
                </div>
              ) : (
                <p className="eco-muted">
                  <Link to="/projects/create">Create a project</Link> to open module workspaces.
                </p>
              )}
            </section>
          )}

          {activeSection === 'collaboration' && (
            <section className="eco-panel">
              <h2>Collaboration center</h2>
              <p className="eco-muted">
                Assemble teams, message collaborators, and link ecosystem partners to active pipeline
                work.
              </p>
              <div className="eco-collab-grid">
                <Link to="/teams" className="eco-collab-card">
                  <strong>Teams</strong>
                  <span>Create squads and assign pipeline ownership</span>
                </Link>
                <Link to="/teams/create" className="eco-collab-card">
                  <strong>Assemble team</strong>
                  <span>Invite mentors, researchers, and builders</span>
                </Link>
                <Link to="/messages" className="eco-collab-card">
                  <strong>Messages</strong>
                  <span>Coordinate with ecosystem contacts</span>
                </Link>
                <Link to="/documents" className="eco-collab-card">
                  <strong>Document center</strong>
                  <span>Share evidence with partners</span>
                </Link>
              </div>

              <h3>Project pipeline workspaces</h3>
              <p className="eco-muted">
                Jump directly into Research, Prototype, Experiment, Validation, Funding, or
                Commercialization for each active project.
              </p>
              {userProjects.length > 0 ? (
                <div className="eco-project-trees">
                  {userProjects.map((p) => (
                    <ProjectPipelineTree key={p.id} project={p} />
                  ))}
                </div>
              ) : (
                <p className="eco-muted">
                  <Link to="/login">Sign in</Link> or{' '}
                  <Link to="/projects/create">create a project</Link> to link ecosystem collaboration
                  to pipeline modules.
                </p>
              )}
            </section>
          )}

          {activeSection !== 'dashboard' && activeSection !== 'collaboration' && (
            <section className="eco-panel">
              <div className="eco-panel__head">
                <h2>
                  {SECTIONS.find((s) => s.id === activeSection)?.label} directory
                </h2>
                <span className="eco-muted">{filtered.length} results</span>
              </div>

              <div className="eco-filters">
                <input
                  type="search"
                  placeholder="Search name, tags, sector, region…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select value={sector} onChange={(e) => setSector(e.target.value)}>
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Region filter"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                >
                  <option value="all">All status</option>
                  <option value="accepting">Accepting</option>
                  <option value="active">Active</option>
                </select>
              </div>

              {filtered.length === 0 ? (
                <div className="eco-empty">No entities match your filters.</div>
              ) : (
                <div className="eco-directory">
                  {filtered.map((entity) => (
                    <article key={entity.id} className="eco-entity">
                      <div className="eco-entity__head">
                        <div>
                          <h3>{entity.name}</h3>
                          <p className="eco-entity__tag">{entity.tagline}</p>
                        </div>
                        <span className={`eco-status eco-status--${entity.status}`}>
                          {entity.status}
                        </span>
                      </div>
                      <p className="eco-entity__desc">{entity.description}</p>
                      <dl className="eco-entity__meta">
                        <div>
                          <dt>Sector</dt>
                          <dd>{entity.sector}</dd>
                        </div>
                        <div>
                          <dt>Region</dt>
                          <dd>{entity.region}</dd>
                        </div>
                        <div>
                          <dt>Type</dt>
                          <dd>{entity.type}</dd>
                        </div>
                      </dl>
                      {entity.metric && <p className="eco-entity__metric">{entity.metric}</p>}
                      <div className="eco-tags">
                        {entity.tags.map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </div>
                      <div className="eco-entity__actions">
                        <Link to={entity.link} className="eco-btn eco-btn--primary">
                          Connect
                        </Link>
                        <button
                          type="button"
                          className="eco-btn eco-btn--ghost"
                          onClick={() => flash(`MAYA queued intro for ${entity.name}.`)}
                        >
                          MAYA intro
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      <style>{`
        .eco-page {
          min-height: 100vh;
          padding: 1.25rem 1.5rem 3rem;
          color: #e8eaf6;
          background: linear-gradient(165deg, #060a12 0%, #0d1528 50%, #111b33 100%);
        }
        .eco-hero { margin-bottom: 1.25rem; max-width: 1200px; margin-inline: auto; }
        .eco-back { color: #8b9cff; text-decoration: none; font-size: 0.85rem; }
        .eco-hero h1 {
          margin: 0.45rem 0 0.25rem;
          font-size: 2rem;
          background: linear-gradient(135deg, #fff, #8b9cff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .eco-hero p { margin: 0; opacity: 0.68; max-width: 720px; line-height: 1.5; }
        .eco-pipeline {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-top: 0.9rem;
        }
        .eco-pipeline__step {
          padding: 0.28rem 0.65rem;
          border-radius: 16px;
          font-size: 0.62rem;
          font-weight: 700;
          border: 1px solid rgba(255,255,255,0.08);
          opacity: 0.55;
        }
        .eco-toast {
          max-width: 1200px;
          margin: 0 auto 0.85rem;
          padding: 0.65rem 1rem;
          border-radius: 10px;
          background: rgba(104,211,145,0.12);
          border: 1px solid rgba(104,211,145,0.3);
          color: #68d391;
          font-size: 0.85rem;
        }
        .eco-metrics {
          max-width: 1200px;
          margin: 0 auto 1rem;
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.6rem;
        }
        @media (max-width: 900px) { .eco-metrics { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 520px) { .eco-metrics { grid-template-columns: repeat(2, 1fr); } }
        .eco-metric {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 0.7rem 0.85rem;
        }
        .eco-metric span {
          display: block;
          font-size: 0.62rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.55;
        }
        .eco-metric strong { font-size: 1.25rem; }
        .eco-tabs {
          max-width: 1200px;
          margin: 0 auto 1rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .eco-tabs button {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.75);
          border-radius: 20px;
          padding: 0.38rem 0.8rem;
          font-size: 0.76rem;
          font-weight: 600;
          cursor: pointer;
        }
        .eco-tabs button.on {
          background: rgba(139,156,255,0.22);
          border-color: rgba(139,156,255,0.45);
          color: #c7d0ff;
        }
        .eco-layout {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 290px 1fr;
          gap: 1rem;
          align-items: start;
        }
        @media (max-width: 960px) { .eco-layout { grid-template-columns: 1fr; } }
        .eco-maya {
          position: sticky;
          top: 1rem;
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(139,156,255,0.25);
          border-radius: 16px;
          padding: 1rem;
          font-size: 0.82rem;
        }
        .eco-maya h2 { margin: 0 0 0.65rem; font-size: 0.95rem; color: #a5b4ff; }
        .eco-maya__run {
          width: 100%;
          margin-bottom: 0.75rem;
          background: rgba(139,156,255,0.18);
          border: 1px solid rgba(139,156,255,0.35);
          color: #c7d0ff;
          border-radius: 18px;
          padding: 0.4rem 0.7rem;
          font-size: 0.76rem;
          font-weight: 600;
          cursor: pointer;
        }
        .eco-maya__block { margin-bottom: 0.7rem; }
        .eco-maya__block h3 {
          margin: 0 0 0.25rem;
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #8b9cff;
          opacity: 0.85;
        }
        .eco-maya__block ul {
          margin: 0;
          padding-left: 1rem;
          opacity: 0.82;
          line-height: 1.4;
        }
        .eco-maya__block li { margin-bottom: 0.25rem; font-size: 0.76rem; }
        .eco-muted { opacity: 0.62; font-size: 0.82rem; line-height: 1.45; }
        .eco-muted a { color: #8b9cff; }
        .eco-main { display: flex; flex-direction: column; gap: 1rem; }
        .eco-panel {
          background: rgba(0,0,0,0.32);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1.1rem;
        }
        .eco-panel h2 { margin: 0 0 0.65rem; font-size: 1rem; color: #a5b4ff; }
        .eco-panel h3 { margin: 1rem 0 0.5rem; font-size: 0.88rem; color: #8b9cff; }
        .eco-panel__head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        .eco-panel__head h2 { margin: 0; }
        .eco-highlights {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.65rem;
          margin: 0.75rem 0;
        }
        @media (max-width: 640px) { .eco-highlights { grid-template-columns: 1fr; } }
        .eco-highlight {
          background: rgba(0,0,0,0.28);
          border-radius: 12px;
          padding: 0.75rem;
        }
        .eco-highlight strong { display: block; margin-bottom: 0.2rem; }
        .eco-highlight p { margin: 0 0 0.35rem; font-size: 0.78rem; opacity: 0.7; }
        .eco-highlight a { color: #2fd4ff; font-size: 0.76rem; text-decoration: none; }
        .eco-integrations {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.55rem;
        }
        @media (max-width: 720px) { .eco-integrations { grid-template-columns: 1fr 1fr; } }
        .eco-int-card {
          display: block;
          background: rgba(0,0,0,0.28);
          border-radius: 12px;
          padding: 0.7rem;
          text-decoration: none;
          color: inherit;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .eco-int-card strong { display: block; font-size: 0.85rem; color: #c7d0ff; }
        .eco-int-card span { font-size: 0.72rem; opacity: 0.65; }
        .eco-pipeline-diagram,
        .eco-pipeline-tree {
          background: rgba(0,0,0,0.28);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 0.75rem 0.85rem;
          font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
          font-size: 0.78rem;
        }
        .eco-pipeline-diagram__root,
        .eco-pipeline-tree__root {
          font-weight: 700;
          color: #c7d0ff;
          margin-bottom: 0.35rem;
        }
        .eco-pipeline-tree__root {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .eco-pipeline-tree__root a {
          color: #c7d0ff;
          text-decoration: none;
          font-family: inherit;
        }
        .eco-pipeline-diagram ul,
        .eco-pipeline-tree__modules {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .eco-pipeline-diagram li,
        .eco-pipeline-tree__modules li {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.18rem 0;
          opacity: 0.88;
        }
        .eco-pipeline-tree__modules a {
          color: #2fd4ff;
          text-decoration: none;
          font-family: inherit;
        }
        .eco-pipeline-tree__modules a:hover { text-decoration: underline; }
        .eco-pipeline-tree__branch { opacity: 0.45; width: 1rem; }
        .eco-pipeline-tree--compact {
          margin-bottom: 0.55rem;
          font-size: 0.7rem;
        }
        .eco-project-trees {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 0.65rem;
          margin-top: 0.75rem;
        }
        .eco-maya__pipeline { margin-top: 0.5rem; }
        .eco-collab-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.65rem;
        }
        @media (max-width: 640px) { .eco-collab-grid { grid-template-columns: 1fr; } }
        .eco-collab-card {
          display: block;
          background: rgba(0,0,0,0.28);
          border-radius: 12px;
          padding: 0.85rem;
          text-decoration: none;
          color: inherit;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .eco-collab-card strong { display: block; margin-bottom: 0.2rem; color: #c7d0ff; }
        .eco-collab-card span { font-size: 0.76rem; opacity: 0.68; }
        .eco-filters {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 0.55rem;
          margin-bottom: 0.85rem;
        }
        @media (max-width: 800px) { .eco-filters { grid-template-columns: 1fr 1fr; } }
        .eco-filters input,
        .eco-filters select {
          background: rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 0.55rem 0.7rem;
          color: #fff;
          font-size: 0.84rem;
        }
        .eco-directory {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 0.75rem;
        }
        .eco-entity {
          background: rgba(0,0,0,0.28);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 0.9rem;
        }
        .eco-entity__head {
          display: flex;
          justify-content: space-between;
          gap: 0.5rem;
          align-items: flex-start;
        }
        .eco-entity h3 { margin: 0; font-size: 0.95rem; }
        .eco-entity__tag { margin: 0.15rem 0 0; font-size: 0.76rem; opacity: 0.65; }
        .eco-status {
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.15rem 0.45rem;
          border-radius: 8px;
          white-space: nowrap;
        }
        .eco-status--active { background: rgba(72,187,120,0.2); color: #68d391; }
        .eco-status--accepting { background: rgba(139,156,255,0.2); color: #a5b4ff; }
        .eco-status--closed { background: rgba(255,255,255,0.1); color: #aaa; }
        .eco-entity__desc {
          margin: 0.55rem 0;
          font-size: 0.8rem;
          opacity: 0.8;
          line-height: 1.45;
        }
        .eco-entity__meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.35rem;
          margin: 0 0 0.45rem;
        }
        .eco-entity__meta dt { font-size: 0.58rem; opacity: 0.5; text-transform: uppercase; }
        .eco-entity__meta dd { margin: 0.1rem 0 0; font-size: 0.74rem; font-weight: 600; }
        .eco-entity__metric { margin: 0 0 0.4rem; font-size: 0.72rem; color: #68d391; }
        .eco-tags { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 0.55rem; }
        .eco-tags span {
          background: rgba(139,156,255,0.14);
          border-radius: 10px;
          padding: 0.12rem 0.45rem;
          font-size: 0.62rem;
          color: #c7d0ff;
        }
        .eco-entity__actions { display: flex; gap: 0.45rem; flex-wrap: wrap; }
        .eco-btn {
          padding: 0.42rem 0.85rem;
          border-radius: 20px;
          font-size: 0.76rem;
          font-weight: 600;
          text-decoration: none;
          border: none;
          cursor: pointer;
        }
        .eco-btn--primary {
          background: linear-gradient(135deg, #6b7fff, #2fd4ff);
          color: #0a0d1a;
        }
        .eco-btn--ghost {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }
        .eco-empty {
          text-align: center;
          padding: 2rem;
          opacity: 0.65;
        }
      `}</style>
    </div>
  );
}
