import type { CapitalOverview, Deal, Investor } from '../types/investorOps.types';

const RUNWAY_BASE_MONTHLY_BURN = 85_000;

export function computeCapitalOverview(investors: Investor[], deals: Deal[]): CapitalOverview {
  const activeDeals = deals.filter((d) => d.stage !== 'closed');
  const closedDeals = deals.filter((d) => d.stage === 'closed');
  const committedDeals = deals.filter((d) => d.stage === 'committed');

  const totalCapitalAvailable = investors
    .filter((i) => i.isActive)
    .reduce((sum, i) => sum + i.investmentRangeMax, 0);

  const committedCapital = committedDeals.reduce((sum, d) => sum + d.amount, 0);
  const closedCapital = closedDeals.reduce((sum, d) => sum + d.amount, 0);
  const pendingDealsValue = activeDeals.reduce((sum, d) => sum + d.amount, 0);

  const weightedPipelineValue = activeDeals.reduce(
    (sum, d) => sum + d.amount * (d.probabilityScore / 100),
    0
  );

  const averageDealProbability =
    activeDeals.length > 0
      ? Math.round(activeDeals.reduce((s, d) => s + d.probabilityScore, 0) / activeDeals.length)
      : 0;

  const revenueProjection90d = Math.round(
    weightedPipelineValue * 0.35 + committedCapital * 0.6 + closedCapital * 0.15
  );

  const runwayMonthsEstimate =
    RUNWAY_BASE_MONTHLY_BURN > 0
      ? Math.round(((closedCapital + committedCapital * 0.7) / RUNWAY_BASE_MONTHLY_BURN) * 10) / 10
      : 0;

  return {
    totalCapitalAvailable,
    committedCapital,
    pendingDealsValue,
    closedCapital,
    weightedPipelineValue,
    averageDealProbability,
    activeDealsCount: activeDeals.length,
    runwayMonthsEstimate,
    revenueProjection90d,
  };
}

export function computeSuccessProbability(deals: Deal[]): number {
  const open = deals.filter((d) => d.stage !== 'closed');
  if (open.length === 0) return closedDealsOnly(deals);
  const weighted = open.reduce((s, d) => s + d.probabilityScore, 0) / open.length;
  const closedBoost = closedDealsOnly(deals) * 0.2;
  return Math.min(100, Math.round(weighted * 0.8 + closedBoost));
}

function closedDealsOnly(deals: Deal[]): number {
  const total = deals.length;
  if (total === 0) return 0;
  const closed = deals.filter((d) => d.stage === 'closed').length;
  return Math.round((closed / total) * 100);
}

export function formatCapitalShort(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}
