import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import {
  EXPERIMENT_CATEGORIES,
  LIFECYCLE_STAGES,
  PIPELINE_STAGES,
  type ExperimentFilters,
  type ExperimentOpsSnapshot,
  type PipelineStage,
} from '../../../lib/experiment/experimentOps';
import { exportExperimentsCsv, loadExperimentOps } from '../../../lib/experiment/experimentOps.service';
import { EXP_STYLES } from '../components/expStyles';
import { ExpMayaSidebar } from '../components/ExpPrimitives';
import {
  AnalyticsCenterView,
  DataCollectionView,
  DesignView,
  DocumentationView,
  EnterpriseView,
  ExecutiveView,
  HypothesisView,
  IntelligenceView,
  IntegrationsView,
  PipelineView,
  PrototypeIntegrationView,
  RegistryView,
  ResultsAnalyticsView,
  ValidationGateView,
} from '../components/ExpViews';

const NAV = [
  { id: 'executive', label: 'Operations Dashboard', group: 'Command' },
  { id: 'pipeline', label: 'Experiment Pipeline', group: 'Workflow' },
  { id: 'registry', label: 'Experiment Registry', group: 'Workflow' },
  { id: 'hypothesis', label: 'Hypothesis Engine', group: 'Science' },
  { id: 'design', label: 'Design Center', group: 'Science' },
  { id: 'data', label: 'Data Collection', group: 'Evidence' },
  { id: 'results', label: 'Results Analytics', group: 'Evidence' },
  { id: 'intelligence', label: 'Experiment Intelligence', group: 'Intelligence' },
  { id: 'prototypes', label: 'Prototype Integration', group: 'Intelligence' },
  { id: 'validation', label: 'Validation Gate', group: 'Intelligence' },
  { id: 'analytics', label: 'Analytics Center', group: 'Intelligence' },
  { id: 'documentation', label: 'Documentation', group: 'Platform' },
  { id: 'enterprise', label: 'Enterprise', group: 'Platform' },
  { id: 'integrations', label: 'Integrations', group: 'Platform' },
] as const;

type ViewId = (typeof NAV)[number]['id'];

const DEFAULT_FILTERS: ExperimentFilters = {
  search: '',
  stage: 'All',
  category: 'All',
  type: 'All',
  status: 'All',
};

export default function Experiments() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<ExperimentOpsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewId>('executive');
  const [filters, setFilters] = useState<ExperimentFilters>(DEFAULT_FILTERS);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const snapshot = await loadExperimentOps(user.id);
      setData(snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load experiments');
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [user, authLoading, load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const navGroups = useMemo(() => {
    const groups = new Map<string, (typeof NAV)[number][]>();
    for (const item of NAV) {
      const list = groups.get(item.group) ?? [];
      list.push(item);
      groups.set(item.group, list);
    }
    return [...groups.entries()];
  }, []);

  const statusOptions = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.experiments.map((e) => e.status))];
  }, [data]);

  const patchFilter = (partial: Partial<ExperimentFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  if (authLoading || loading) {
    return (
      <div className="exp-page">
        <div className="exp-loading" aria-label="Loading experiment operations center" />
        <style>{EXP_STYLES}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="exp-page">
        <p className="exp-error">Sign in to access the Experiment Operations Center.</p>
        <Link to="/login">Sign in</Link>
        <style>{EXP_STYLES}</style>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="exp-page">
        <p className="exp-error">{error ?? 'Unable to load experiments.'}</p>
        <Link to="/dashboard">← Dashboard</Link>
        <style>{EXP_STYLES}</style>
      </div>
    );
  }

  const renderView = () => {
    switch (view) {
      case 'executive':
        return <ExecutiveView data={data} />;
      case 'pipeline':
        return <PipelineView data={data} />;
      case 'registry':
        return (
          <RegistryView
            data={data}
            filters={filters}
            onExport={() => exportExperimentsCsv(data.experiments)}
          />
        );
      case 'hypothesis':
        return <HypothesisView data={data} />;
      case 'design':
        return <DesignView data={data} />;
      case 'data':
        return <DataCollectionView data={data} />;
      case 'results':
        return <ResultsAnalyticsView data={data} />;
      case 'intelligence':
        return <IntelligenceView data={data} />;
      case 'prototypes':
        return <PrototypeIntegrationView data={data} />;
      case 'validation':
        return <ValidationGateView data={data} />;
      case 'analytics':
        return (
          <AnalyticsCenterView
            data={data}
            onExport={() => exportExperimentsCsv(data.experiments)}
          />
        );
      case 'documentation':
        return <DocumentationView data={data} />;
      case 'enterprise':
        return <EnterpriseView data={data} />;
      case 'integrations':
        return <IntegrationsView />;
      default:
        return <ExecutiveView data={data} />;
    }
  };

  return (
    <div className="exp-page">
      <header className="exp-header">
        <div className="exp-header__top">
          <div>
            <Link to="/dashboard" className="exp-back">
              ← Innovation OS
            </Link>
            <h1>Experiment Operations Center</h1>
            <p className="exp-header__sub">
              Research → Prototype → Experiment → Validation — evidence engine for innovation
            </p>
            <div className="exp-lifecycle" aria-hidden>
              {LIFECYCLE_STAGES.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </div>
          <div className="exp-header__actions">
            <button type="button" className="exp-btn exp-btn--ghost" onClick={() => refresh()}>
              {refreshing ? 'Syncing…' : 'Refresh'}
            </button>
            <Link to="/experiments/create" className="exp-btn exp-btn--primary">
              + New experiment
            </Link>
          </div>
        </div>
        <div className="exp-toolbar">
          <input
            type="search"
            placeholder="Search name, project, prototype, hypothesis…"
            value={filters.search}
            onChange={(e) => patchFilter({ search: e.target.value })}
            aria-label="Search experiments"
          />
          <select
            value={filters.stage}
            onChange={(e) => patchFilter({ stage: e.target.value as PipelineStage | 'All' })}
            aria-label="Filter by pipeline stage"
          >
            <option value="All">All stages</option>
            {PIPELINE_STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={filters.category}
            onChange={(e) => patchFilter({ category: e.target.value })}
            aria-label="Filter by category"
          >
            <option value="All">All categories</option>
            {EXPERIMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => patchFilter({ status: e.target.value })}
            aria-label="Filter by status"
          >
            <option value="All">All statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </header>

      {error && <div className="exp-banner exp-banner--error">{error}</div>}

      <div className="exp-layout">
        <nav className="exp-nav" aria-label="Experiment sections">
          {navGroups.map(([group, items]) => (
            <div key={group} className="exp-nav__group">
              <span className="exp-nav__label">{group}</span>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`exp-nav__item ${view === item.id ? 'exp-nav__item--active' : ''}`}
                  onClick={() => setView(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <main className="exp-main">
          <section className="exp-section">{renderView()}</section>
        </main>

        <ExpMayaSidebar data={data} />
      </div>

      <style>{EXP_STYLES}</style>
    </div>
  );
}
