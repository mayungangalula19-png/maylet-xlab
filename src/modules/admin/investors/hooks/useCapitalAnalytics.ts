import { useMemo } from 'react';
import { computeCapitalOverview, computeSuccessProbability } from '../services/capital.service';
import type { Deal, Investor } from '../types/investorOps.types';

export function useCapitalAnalytics(investors: Investor[], deals: Deal[]) {
  const overview = useMemo(() => computeCapitalOverview(investors, deals), [investors, deals]);
  const successProbability = useMemo(() => computeSuccessProbability(deals), [deals]);

  return {
    overview,
    successProbability,
    totalCapital: overview.totalCapitalAvailable,
    activeDeals: overview.activeDealsCount,
    committedCapital: overview.committedCapital,
    pendingValue: overview.pendingDealsValue,
    weightedPipeline: overview.weightedPipelineValue,
    runwayMonths: overview.runwayMonthsEstimate,
    revenueProjection90d: overview.revenueProjection90d,
  };
}
