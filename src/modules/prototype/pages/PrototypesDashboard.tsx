import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { PrototypeCard } from '../components/PrototypeCard';
import { PrototypeEmptyState } from '../components/PrototypeEmptyState';
import { PrototypeLifecycle } from '../components/PrototypeLifecycle';
import { PrototypeStats } from '../components/PrototypeStats';
import { usePrototype } from '../hooks/usePrototype';
import { getPrototypePipelineStage } from '../types/prototype.types';
import '../prototype.css';

export default function PrototypesDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') ?? undefined;
  const researchId = searchParams.get('researchId') ?? undefined;

  const { prototypes, stats, gateOk, gateScope, loading, error, withSaving, prototypeService, refresh } =
    usePrototype(user?.id, undefined, projectId);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = prototypes.filter((p) => {
    const q = search.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q);
    const matchS = statusFilter === 'all' || p.lifecycle_status === statusFilter;
    const matchR = !researchId || p.research_id === researchId;
    return matchQ && matchS && matchR;
  });

  const aggregateStage =
    filtered.length > 0
      ? getPrototypePipelineStage(
          filtered.find((p) => p.lifecycle_status === 'success') ??
            filtered.find((p) => p.lifecycle_status === 'testing') ??
            filtered[0]
        )
      : 'draft';

  if (authLoading || loading) {
    return (
      <div className="proto-page">
        <p>Loading prototype workspace…</p>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="proto-page">
        <p>Sign in to manage prototypes.</p>
      </div>
    );
  }

  const newHref =
    projectId || researchId
      ? `/prototypes/new?${new URLSearchParams({
          ...(projectId ? { projectId } : {}),
          ...(researchId ? { researchId } : {}),
        }).toString()}`
      : '/prototypes/new';

  return (
    <div className="proto-page">
      <header className="proto-header">
        <div>
          <h1>Prototype Management</h1>
          <p>Builds · uploads · versions · testing · AI evaluation — not research or project tasks.</p>
        </div>
        <div className="proto-header-actions">
          <Link to={newHref} className="proto-btn proto-btn--primary">
            + New prototype
          </Link>
        </div>
      </header>

      {projectId && (
        <div className={`proto-gate-banner ${gateOk ? 'proto-gate-banner--ok' : 'proto-gate-banner--block'}`}>
          {gateOk ? (
            <>Research gate approved — V1 scope: {gateScope ?? 'Not specified'}</>
          ) : (
            <>
              Research gate required before prototype build.{' '}
              <Link to={`/research/${projectId}?tab=gate`}>Complete gate review →</Link>
            </>
          )}
        </div>
      )}

      {error ? <p className="proto-error">{error}</p> : null}
      {stats ? <PrototypeStats stats={stats} /> : null}
      <PrototypeLifecycle highlightStage={aggregateStage} />

      <div className="proto-toolbar">
        <input placeholder="Search prototypes…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="building">Building</option>
          <option value="testing">Testing</option>
          <option value="success">Validated</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <PrototypeEmptyState projectId={projectId} researchId={researchId} />
      ) : (
        <div className="proto-grid">
          {filtered.map((p) => (
            <PrototypeCard
              key={p.id}
              prototype={p}
              onDelete={(id) => withSaving(() => prototypeService.remove(id, user.id)).then(() => refresh())}
            />
          ))}
        </div>
      )}
    </div>
  );
}
