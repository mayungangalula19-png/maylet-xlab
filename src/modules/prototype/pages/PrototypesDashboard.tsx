import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { PrototypeCommandCenter } from '../components/command-center/PrototypeCommandCenter';
import { usePrototypeCommandCenter } from '../hooks/usePrototypeCommandCenter';
import '../prototype.css';

function buildExportReport(
  kpis: ReturnType<typeof usePrototypeCommandCenter>['kpis'],
  portfolio: ReturnType<typeof usePrototypeCommandCenter>['portfolio']
): string {
  const lines = [
    '# MAYLET X LAB — Prototype Portfolio Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## KPIs',
    `- Total: ${kpis.total}`,
    `- Active: ${kpis.active}`,
    `- In validation: ${kpis.inValidation}`,
    `- Funding ready: ${kpis.fundingReady}`,
    `- Innovation health: ${kpis.innovationHealth}`,
    '',
    '## Portfolio',
    ...portfolio.map(
      (p) =>
        `- ${p.prototype.name} | ${p.stage} | completion ${p.completion}% | readiness ${p.readinessIndex}`
    ),
  ];
  return lines.join('\n');
}

export default function PrototypesDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') ?? undefined;
  const researchId = searchParams.get('researchId') ?? undefined;

  const cc = usePrototypeCommandCenter(user?.id, projectId);

  const newHref =
    projectId || researchId
      ? `/prototypes/new?${new URLSearchParams({
          ...(projectId ? { projectId } : {}),
          ...(researchId ? { researchId } : {}),
        }).toString()}`
      : '/prototypes/new';

  if (authLoading || cc.loading) {
    return (
      <div className="proto-page proto-cc-page">
        <p>Loading innovation command center…</p>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="proto-page proto-cc-page">
        <p>Sign in to access the prototype command center.</p>
      </div>
    );
  }

  const gateBanner =
    projectId ? (
      <div className={`proto-gate-banner ${cc.gateOk ? 'proto-gate-banner--ok' : 'proto-gate-banner--block'}`}>
        {cc.gateOk ? (
          <>Research gate approved — V1 scope: {cc.gateScope ?? 'Not specified'}</>
        ) : (
          <>
            Research gate required before prototype build.{' '}
            <Link to={`/research/${projectId}?tab=gate`}>Complete gate review →</Link>
          </>
        )}
      </div>
    ) : null;

  const handleExport = () => {
    const blob = new Blob([buildExportReport(cc.kpis, cc.portfolio)], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `maylet-prototype-report-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleArchive = (id: string) => {
    if (!window.confirm('Archive this prototype?')) return;
    void cc.withSaving(async () => {
      const { supabase } = await import('../../../lib/supabase/client');
      await supabase.from('prototypes').update({ status: 'archived' }).eq('id', id);
    }).then(() => cc.refresh());
  };

  return (
    <div className="proto-page proto-cc-page">
      {cc.error ? <p className="proto-error">{cc.error}</p> : null}
      <PrototypeCommandCenter
        {...cc}
        newHref={newHref}
        projectId={projectId}
        researchId={researchId}
        gateBanner={gateBanner}
        onExport={handleExport}
        onArchive={handleArchive}
      />
    </div>
  );
}
