import { memo, useCallback, useMemo, useState } from 'react';
import { AdminPermissionDenied } from '../../components/AdminPermissionDenied';
import { AdminPageHeader } from '../../components/layout/AdminPageHeader';
import { AdminPageShell } from '../../components/layout/AdminPageShell';
import { AdminLoadingState } from '../../components/layout/AdminLoadingState';
import { adminBreadcrumbsFor } from '../../config/adminNav.config';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { CapitalOverviewPanel } from '../components/CapitalOverviewPanel';
import { DealPipelineBoard } from '../components/DealPipelineBoard';
import { InvestorAIInsightsPanel } from '../components/InvestorAIInsightsPanel';
import { InvestorProfilePanel } from '../components/InvestorProfilePanel';
import { useCapitalAnalytics } from '../hooks/useCapitalAnalytics';
import { useDeals } from '../hooks/useDeals';
import { useInvestorAI } from '../hooks/useInvestorAI';
import { useInvestors } from '../hooks/useInvestors';
import type { Deal, DealFormValues, Investor } from '../types/investorOps.types';
import { STAGE_PROBABILITY_DEFAULTS } from '../types/investorOps.types';

const InvestorCard = memo(function InvestorCard({
  investor,
  selected,
  onSelect,
}: {
  investor: Investor;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const scoreColor =
    investor.investorScore >= 75 ? '#48bb78' : investor.investorScore >= 50 ? '#f6c90e' : '#fc8181';

  return (
    <button
      type="button"
      className={`admin-investor-card ${selected ? 'admin-investor-card--selected' : ''}`}
      onClick={() => onSelect(investor.id)}
    >
      <div className="admin-investor-card-top">
        <span className="admin-investor-card-name">{investor.name}</span>
        <span className="admin-investor-card-score" style={{ color: scoreColor }}>
          {investor.investorScore}
        </span>
      </div>
      <span className="admin-muted">{investor.email || investor.type}</span>
      <div className="admin-investor-card-meta">
        <span>{investor.activeDeals} deals</span>
        <span>Risk {investor.riskScore}</span>
      </div>
      {investor.tags.length > 0 ? (
        <div className="admin-investor-card-tags">
          {investor.tags.slice(0, 2).map((t) => (
            <span key={t} className="admin-investor-tag-sm">{t}</span>
          ))}
        </div>
      ) : null}
    </button>
  );
});

function DealCreateDialog({
  open,
  investors,
  defaultInvestorId,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  investors: Investor[];
  defaultInvestorId?: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: DealFormValues) => Promise<void>;
}) {
  const [form, setForm] = useState<DealFormValues>({
    investorId: defaultInvestorId ?? investors[0]?.id ?? '',
    title: '',
    amount: 100000,
    stage: 'lead',
    probabilityScore: STAGE_PROBABILITY_DEFAULTS.lead,
    expectedCloseDate: '',
    notes: '',
  });

  if (!open) return null;

  return (
    <div className="admin-dialog-overlay" role="dialog" aria-modal="true">
      <div className="admin-dialog">
        <h3>New deal</h3>
        <form
          className="admin-career-form"
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit(form).then(onClose);
          }}
        >
          <label>
            Investor
            <select
              value={form.investorId}
              onChange={(e) => setForm({ ...form, investorId: e.target.value })}
              required
            >
              {investors.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </label>
          <label>
            Amount (USD)
            <input
              type="number"
              min={0}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            />
          </label>
          <label>
            Notes
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          <div className="admin-dialog-actions">
            <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminInvestorsPage() {
  const { can, roleLoading } = useAdminPermissions();
  const canManage = can('manage_users');

  const investorOps = useInvestors({ sortBy: 'score' });
  const allDeals = useDeals();
  const capital = useCapitalAnalytics(investorOps.investors, allDeals.deals);
  const ai = useInvestorAI(investorOps.investors, allDeals.deals, !investorOps.loading);

  const [dealDialogOpen, setDealDialogOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const displayDeals = useMemo(() => {
    if (investorOps.selectedId) {
      return allDeals.deals.filter((d) => d.investorId === investorOps.selectedId);
    }
    return allDeals.deals;
  }, [allDeals.deals, investorOps.selectedId]);

  const displayByStage = useMemo(() => {
    const grouped = {
      lead: [] as Deal[],
      contacted: [] as Deal[],
      negotiation: [] as Deal[],
      committed: [] as Deal[],
      closed: [] as Deal[],
    };
    for (const deal of displayDeals) {
      grouped[deal.stage].push(deal);
    }
    return grouped;
  }, [displayDeals]);

  const liveEvents = useMemo(
    () =>
      [...investorOps.events, ...allDeals.events, ...ai.events]
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 8),
    [investorOps.events, allDeals.events, ai.events]
  );

  const handleSelectInvestor = useCallback((id: string) => {
    investorOps.setSelectedId(id);
    setProfileOpen(true);
  }, [investorOps]);

  const handleMoveDeal = useCallback(
    async (dealId: string, stage: Deal['stage']) => {
      setActionError(null);
      try {
        await allDeals.moveDealToStage(dealId, stage);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Failed to move deal');
      }
    },
    [allDeals]
  );

  const handleCreateDeal = useCallback(
    async (values: DealFormValues) => {
      setActionError(null);
      await allDeals.addDeal(values);
    },
    [allDeals]
  );

  if (roleLoading) {
    return (
      <AdminPageShell>
        <AdminLoadingState label="Checking permissions…" />
      </AdminPageShell>
    );
  }

  if (!canManage) {
    return (
      <AdminPageShell>
        <AdminPermissionDenied permission="manage_users" />
      </AdminPageShell>
    );
  }

  if (investorOps.loading || allDeals.loading) {
    return (
      <AdminPageShell>
        <AdminLoadingState label="Loading investment operations…" />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Investment Operations Command Center"
        subtitle="Investor intelligence · deal pipeline · AI insights · capital analytics"
        breadcrumbs={adminBreadcrumbsFor('/admin/investors')}
        actions={[
          {
            label: 'New deal',
            onClick: () => setDealDialogOpen(true),
            variant: 'primary',
            icon: '＋',
          },
          {
            label: investorOps.refreshing ? 'Refreshing…' : 'Refresh',
            onClick: () => {
              void investorOps.refresh();
              void allDeals.refresh();
            },
            variant: 'secondary',
            disabled: investorOps.refreshing,
          },
        ]}
      />

      <CapitalOverviewPanel
        totalCapital={capital.totalCapital}
        activeDeals={capital.activeDeals}
        successProbability={ai.successProbability || capital.successProbability}
        committedCapital={capital.committedCapital}
        pendingValue={capital.pendingValue}
        weightedPipeline={capital.weightedPipeline}
        runwayMonths={capital.runwayMonths}
      />

      {investorOps.error || allDeals.error || actionError ? (
        <div className="admin-alert admin-alert--danger">
          {investorOps.error || allDeals.error || actionError}
          {(investorOps.error ?? allDeals.error)?.includes('investor_deals') ? (
            <span> Run scripts/create-investor-deals-table.sql in Supabase.</span>
          ) : null}
        </div>
      ) : null}

      <div className="admin-investor-ops-grid">
        <section className="admin-investor-ops-left">
          <div className="admin-investor-ops-panel-head">
            <h3>Investors</h3>
            <span className="admin-muted">{investorOps.investors.length} tracked</span>
          </div>
          <div className="admin-investor-ops-search">
            <input
              type="search"
              placeholder="Search investors…"
              value={investorOps.filters.search ?? ''}
              onChange={(e) =>
                investorOps.setFilters({ ...investorOps.filters, search: e.target.value })
              }
            />
            <select
              value={investorOps.filters.tag ?? 'all'}
              onChange={(e) =>
                investorOps.setFilters({
                  ...investorOps.filters,
                  tag: e.target.value === 'all' ? undefined : e.target.value,
                })
              }
            >
              <option value="all">All tags</option>
              {investorOps.allTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <select
              value={investorOps.filters.minScore ?? 0}
              onChange={(e) =>
                investorOps.setFilters({
                  ...investorOps.filters,
                  minScore: Number(e.target.value),
                })
              }
            >
              <option value={0}>Any score</option>
              <option value={50}>Score 50+</option>
              <option value={70}>Score 70+</option>
              <option value={85}>Score 85+</option>
            </select>
          </div>
          <div className="admin-investor-card-list">
            {investorOps.investors.length === 0 ? (
              <p className="admin-muted">No investors in directory. Add listings via Funding Directory or seed data.</p>
            ) : (
              investorOps.investors.map((inv) => (
                <InvestorCard
                  key={inv.id}
                  investor={inv}
                  selected={investorOps.selectedId === inv.id}
                  onSelect={handleSelectInvestor}
                />
              ))
            )}
          </div>
        </section>

        <section className="admin-investor-ops-center">
          <div className="admin-investor-ops-panel-head">
            <h3>Deal Pipeline</h3>
            {investorOps.selectedInvestor ? (
              <button
                type="button"
                className="admin-btn admin-btn--ghost admin-btn--xs"
                onClick={() => investorOps.setSelectedId(null)}
              >
                Clear filter · {investorOps.selectedInvestor.name}
              </button>
            ) : (
              <span className="admin-muted">{displayDeals.length} deals</span>
            )}
          </div>
          <DealPipelineBoard
            byStage={displayByStage}
            actionLoading={allDeals.actionLoading}
            onMoveDeal={handleMoveDeal}
            onSelectDeal={(deal) => handleSelectInvestor(deal.investorId)}
          />
        </section>

        <InvestorAIInsightsPanel
          insights={ai.insights}
          computing={ai.computing}
          suggestedContact={ai.suggestedContact}
          hotLeads={ai.hotLeads}
          portfolioRiskScore={ai.portfolioRiskScore}
          onSelectInvestor={handleSelectInvestor}
          recentEvents={liveEvents}
        />
      </div>

      <InvestorProfilePanel
        investor={investorOps.selectedInvestor}
        deals={allDeals.deals}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      <DealCreateDialog
        open={dealDialogOpen}
        investors={investorOps.investors}
        defaultInvestorId={investorOps.selectedId ?? undefined}
        saving={allDeals.actionLoading === 'create'}
        onClose={() => setDealDialogOpen(false)}
        onSubmit={handleCreateDeal}
      />
    </AdminPageShell>
  );
}
