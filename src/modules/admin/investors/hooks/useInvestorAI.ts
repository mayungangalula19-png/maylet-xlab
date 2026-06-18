import { useEffect, useMemo, useRef, useState } from 'react';
import { buildInvestorAIAnalysis } from '../services/investorAI.service';
import type { Deal, Investor, InvestorAIAnalysis, InvestorOpsEvent } from '../types/investorOps.types';

const AI_DEBOUNCE_MS = 350;

export function useInvestorAI(investors: Investor[], deals: Deal[], enabled = true) {
  const [analysis, setAnalysis] = useState<InvestorAIAnalysis | null>(null);
  const [computing, setComputing] = useState(false);
  const [events, setEvents] = useState<InvestorOpsEvent[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const inputKey = useMemo(
    () => `${investors.length}:${deals.length}:${investors.map((i) => i.investorScore).join(',')}`,
    [investors, deals]
  );

  useEffect(() => {
    if (!enabled || investors.length === 0) {
      setAnalysis(null);
      return;
    }

    setComputing(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const result = buildInvestorAIAnalysis(investors, deals);
      setAnalysis(result);
      setComputing(false);
      setEvents((prev) => [
        {
          type: 'ai:insight_generated',
          payload: { insightCount: result.insights.length },
          at: new Date().toISOString(),
        },
        ...prev.slice(0, 9),
      ]);
    }, AI_DEBOUNCE_MS);

    return () => clearTimeout(timerRef.current);
  }, [inputKey, enabled, investors, deals]);

  return {
    analysis,
    computing,
    insights: analysis?.insights ?? [],
    rankedInvestors: analysis?.rankedInvestors ?? investors,
    suggestedContact: analysis?.suggestedContact ?? null,
    hotLeads: analysis?.hotLeads ?? [],
    portfolioRiskScore: analysis?.portfolioRiskScore ?? 0,
    successProbability: analysis?.successProbability ?? 0,
    events,
  };
}
