// Innovation Command Center — production dashboard (database records only)

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';
import { useAuthContext } from '../../../contexts/AuthContext';
import {
  ActivityTimeline,
  InnovationPipelineOverview,
  InnovationProjectCard,
  NewProjectModal,
  OperationalActionsPanel,
  OperationalOverview,
  OperationalPipelineBars,
  OperationalQueuesPanel,
  OperationalStatusGrid,
  ProjectFactsPanel,
  QuickActionsPanel,
  ResearchStatusPanel,
  ResearchImpactAlerts,
  ExperimentStatusPanel,
  FundingStatusPanel,
  VaultStatusPanel,
  TeamStatusPanel,
} from '../components';
import '../components/command-center.css';
import '../components/projects-pipeline.css';
import '../components/portfolio.css';
import { useInnovationCommandCenter } from '../../../hooks/useInnovationCommandCenter';
import { deleteProject, getProjects } from '../../../lib/supabase/projects.queries';
import { fetchRecentActivities, subscribeToActivities } from '../services/activityService';
import {
  getInnovationStage,
  type InnovationFilterStage,
  type InnovationStage,
} from '../../../lib/innovation/lifecycle';
import type { Activity, Project } from '../../../types/project.types';

const Projects = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pipelineFilter, setPipelineFilter] = useState<InnovationFilterStage>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user, loading: authLoading } = useAuthContext();
  const userId = user?.id ?? '';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const { data: cc } = useInnovationCommandCenter(userId, projects);
  const focusProject = useMemo(() => {
    const first = cc.operationalQueues.actionRequired[0] ?? cc.operationalQueues.completeSetup[0];
    if (first) return projects.find((p) => p.id === first.id) ?? projects[0] ?? null;
    return projects[0] ?? null;
  }, [projects, cc.operationalQueues]);

  const fetchProjects = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setFetchError(null);

    try {
      const projectsData = await getProjects(userId);
      setProjects(projectsData);
      setFilteredProjects(projectsData);
      if (projectsData.length === 0) {
        setFetchError(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load projects';
      console.error('Error fetching projects:', error);
      setFetchError(message);
      setProjects([]);
      setFilteredProjects([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  const fetchActivities = useCallback(async () => {
    if (!userId) return;
    try {
      const rows = await fetchRecentActivities({ userId }, 5);
      setActivities(
        rows.map((a) => ({
          id: a.id,
          user_name: a.user_name,
          action: a.action,
          project_name: a.project_name,
          created_at: a.created_at,
          type: a.type === 'system' ? 'task' : a.type,
        }))
      );
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  }, [userId]);

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId, userId || undefined);
      const updated = projects.filter((p) => p.id !== projectId);
      setProjects(updated);
      setFilteredProjects(updated);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleProjectCreated = (project: Project) => {
    const updated = [project, ...projects];
    setProjects(updated);
    setFilteredProjects(updated);
  };

  const handleStageClick = (stage: InnovationStage) => {
    setPipelineFilter(stage);
    requestAnimationFrame(() => {
      document.getElementById('innovation-portfolio')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  useEffect(() => {
    let filtered = [...projects];
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sector.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter((p) => p.status === 'Experiment' || p.status === 'Prototype');
      } else if (statusFilter === 'completed') {
        filtered = filtered.filter((p) => p.status === 'Launched' || p.progress === 100);
      } else if (statusFilter === 'hold') {
        filtered = filtered.filter((p) => p.status === 'Idea');
      }
    }
    if (pipelineFilter !== 'All') {
      filtered = filtered.filter((p) => getInnovationStage(p) === pipelineFilter);
    }
    setFilteredProjects(filtered);
  }, [searchTerm, statusFilter, pipelineFilter, projects]);

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setShowCreateModal(true);
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (userId) fetchProjects();
  }, [userId, fetchProjects]);

  useEffect(() => {
    if (!userId) return;
    fetchActivities();
    const unsubscribeActivities = subscribeToActivities(fetchActivities);
    const projectsChannel = supabase
      .channel('projects_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchProjects)
      .subscribe();
    return () => {
      unsubscribeActivities();
      projectsChannel.unsubscribe();
    };
  }, [userId, fetchProjects, fetchActivities]);

  if (loading) {
    return (
      <div className="projects-container icc-page">
        <main className="projects-main">
          <div className="loading-spinner" />
        </main>
      </div>
    );
  }

  return (
    <div className="projects-container icc-page">
      <main className="projects-main">
        <header className="icc-header">
          <div>
            <h1>Innovation Command Center</h1>
            <p>Portfolio operations and live metrics.</p>
          </div>
          <div className="header-actions">
            <button type="button" className="btn-create" onClick={() => setShowCreateModal(true)}>
              New Project
            </button>
          </div>
        </header>

        {fetchError ? (
          <div className="portfolio-empty icc-glass" style={{ marginBottom: '1rem' }}>
            <h3>Could not load projects</h3>
            <p>{fetchError}</p>
            <button type="button" className="portfolio-empty__btn" onClick={() => fetchProjects()}>
              Retry
            </button>
          </div>
        ) : null}

        <OperationalOverview snapshot={cc} />
        <QuickActionsPanel onCreateProject={() => setShowCreateModal(true)} />
        <OperationalStatusGrid snapshot={cc} />

        <InnovationPipelineOverview stageCounts={cc.stageCounts} onStageClick={handleStageClick} />

        <div className="icc-command-row">
          <OperationalQueuesPanel {...cc.operationalQueues} />
          <OperationalActionsPanel actions={cc.operationalActions} />
        </div>

        <OperationalPipelineBars stageCounts={cc.stageCounts} onStageClick={handleStageClick} />

        <div className="search-filter-bar">
          <div className="search-input-wrapper">
            <span className="search-icon">Search</span>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-tabs">
            {(['all', 'active', 'completed', 'hold'] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={`filter-tab ${statusFilter === f ? 'active' : ''}`}
                onClick={() => setStatusFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'active' ? 'In Progress' : f === 'completed' ? 'Completed' : 'On Hold'}
              </button>
            ))}
          </div>
        </div>

        <div className="icc-layout" id="innovation-portfolio">
          <div className="left-column portfolio-section">
            <div className="portfolio-section__header">
              <div>
                <h2>Portfolio</h2>
                <p className="portfolio-section__meta">
                  {pipelineFilter !== 'All'
                    ? `Filtered by ${pipelineFilter}`
                    : `${projects.length} total projects`}
                </p>
              </div>
              <span className="portfolio-section__count">{filteredProjects.length}</span>
            </div>
            {filteredProjects.length === 0 ? (
              <div className="portfolio-empty icc-glass">
                <h3>{fetchError ? 'Projects unavailable' : 'No matching projects'}</h3>
                <p>
                  {fetchError
                    ? 'Fix the error above or retry loading.'
                    : projects.length === 0
                      ? 'You have no projects yet. Create one to get started.'
                      : 'Adjust filters or create a new project.'}
                </p>
                <button type="button" className="portfolio-empty__btn" onClick={() => setShowCreateModal(true)}>
                  Create Project
                </button>
              </div>
            ) : (
              <div className="portfolio-grid">
                {filteredProjects.map((project) => (
                  <InnovationProjectCard key={project.id} project={project} onDelete={handleDeleteProject} />
                ))}
              </div>
            )}
          </div>

          <div className="icc-sidebar-stack">
            <ProjectFactsPanel project={focusProject} onCreateProject={() => setShowCreateModal(true)} />
            <ResearchStatusPanel research={cc.research} />
            <ResearchImpactAlerts project={focusProject} userId={userId} />
            <ExperimentStatusPanel experiments={cc.experiments} />
            <FundingStatusPanel funding={cc.funding} />
            <VaultStatusPanel vault={cc.vault} />
            <TeamStatusPanel team={cc.team} />
            <ActivityTimeline events={cc.timeline} legacyActivities={activities} projects={projects} />
          </div>
        </div>

        <footer className="projects-footer">
          <p>© 2026 Maylet XLab. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
        </footer>
      </main>

      <NewProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleProjectCreated}
        userId={userId}
        prefillTeamId={(location.state as { prefillTeamId?: string } | null)?.prefillTeamId}
      />

      <style>{`
        .projects-container { min-height: 100vh; background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%); }
        .projects-main { max-width: 1400px; margin: 0 auto; padding: 2rem; }
        @media (max-width: 768px) { .projects-main { padding: 1rem; } }
        .loading-spinner { width: 50px; height: 50px; border: 3px solid rgba(124,95,230,0.3); border-top-color: #7c5fe6; border-radius: 50%; animation: spin 1s linear infinite; margin: 20% auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .header-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
        .btn-create { background: linear-gradient(135deg, #7c5fe6, #2fd4ff); color: #0a0d1a; padding: 0.75rem 1.5rem; border-radius: 40px; font-weight: 600; border: none; cursor: pointer; font-family: inherit; }
        .btn-create-secondary { padding: 0.75rem 1.25rem; border-radius: 40px; font-weight: 600; font-size: 0.8rem; text-decoration: none; border: 1px solid rgba(124,95,230,0.4); color: #c4b5fd; }
        .search-filter-bar { background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); border-radius: 60px; padding: 0.5rem; margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .search-input-wrapper { flex: 1; display: flex; align-items: center; background: rgba(255,255,255,0.05); border-radius: 40px; padding: 0.5rem 1rem; min-width: 200px; }
        .search-icon { font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem; color: #667eea; }
        .search-input { flex: 1; background: none; border: none; color: white; font-size: 0.9rem; outline: none; }
        .filter-tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .filter-tab { background: rgba(255,255,255,0.05); border: none; padding: 0.5rem 1.2rem; border-radius: 40px; color: rgba(255,255,255,0.7); cursor: pointer; font-family: inherit; font-size: 0.8rem; }
        .filter-tab:hover, .filter-tab.active { background: #7c5fe6; color: white; }
        .projects-footer { display: flex; justify-content: space-between; padding-top: 1.5rem; margin-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.7rem; color: rgba(255,255,255,0.5); flex-wrap: wrap; gap: 1rem; }
        .footer-links { display: flex; gap: 1.5rem; }
        .footer-links a { color: rgba(255,255,255,0.5); text-decoration: none; }
      `}</style>
    </div>
  );
};

export default Projects;
