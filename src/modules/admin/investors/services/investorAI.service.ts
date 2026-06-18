import type {
  AIInsight,
  Deal,
  Investor,
  InvestorAIAnalysis,
} from '../types/investorOps.types';
import { computeInvestorScore } from './investors.service';

function daysSince(iso: string | null): number {
  if (!iso) return 999;
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
}

export function rankInvestors(investors: Investor[]): Investor[] {
  return [...investors].sort((a, b) => b.investorScore - a.investorScore);
}

export function predictDealSuccess(deal: Deal, investor: Investor | undefined): number {
  const base = deal.probabilityScore;
  const investorBoost = investor ? investor.investorScore * 0.25 : 0;
  const stageBoost =
    deal.stage === 'committed' ? 15 : deal.stage === 'negotiation' ? 8 : 0;
  const riskPenalty = investor ? investor.riskScore * 0.15 : 10;
  return Math.min(100, Math.max(0, Math.round(base + investorBoost + stageBoost - riskPenalty)));
}

export function detectHotLeads(investors: Investor[], deals: Deal[]): Investor[] {
  return investors.filter((inv) => {
    const openDeals = deals.filter((d) => d.investorId === inv.id && d.stage !== 'closed');
    const hasHighValueDeal = openDeals.some((d) => d.amount >= 100_000 && d.probabilityScore >= 50);
    const isHot =
      inv.investorScore >= 70 &&
      inv.engagementScore >= 60 &&
      (hasHighValueDeal || inv.applicationCount >= 2);
    return isHot;
  });
}

export function suggestNextContact(investors: Investor[], deals: Deal[]): Investor | null {
  const ranked = rankInvestors(investors);
  for (const inv of ranked) {
    const openDeals = deals.filter((d) => d.investorId === inv.id && d.stage !== 'closed');
    const stale = daysSince(inv.lastActivity) > 14;
    const inNegotiation = openDeals.some((d) => d.stage === 'negotiation' || d.stage === 'committed');
    if (inv.isActive && (stale || inNegotiation) && inv.investorScore >= 55) {
      return inv;
    }
  }
  return ranked.find((i) => i.isActive && i.investorScore >= 60) ?? null;
}

export function generateInsights(investors: Investor[], deals: Deal[]): AIInsight[] {
  const insights: AIInsight[] = [];
  const now = new Date().toISOString();
  const hotLeads = detectHotLeads(investors, deals);
  const suggested = suggestNextContact(investors, deals);

  for (const inv of hotLeads.slice(0, 3)) {
    insights.push({
      id: `hot-${inv.id}`,
      type: 'hot_lead',
      severity: 'success',
      title: `Hot lead: ${inv.name}`,
      message: `Score ${inv.investorScore}/100 with ${inv.activeDeals} active deal(s). Prioritize outreach.`,
      investorId: inv.id,
      score: inv.investorScore,
      createdAt: now,
    });
  }

  for (const inv of investors.filter((i) => i.riskScore >= 65).slice(0, 2)) {
    insights.push({
      id: `risk-${inv.id}`,
      type: 'risk_alert',
      severity: 'warning',
      title: `Risk alert: ${inv.name}`,
      message: `Risk score ${inv.riskScore}/100. Low engagement or inactive profile detected.`,
      investorId: inv.id,
      score: inv.riskScore,
      createdAt: now,
    });
  }

  if (suggested) {
    insights.push({
      id: `follow-${suggested.id}`,
      type: 'follow_up',
      severity: 'info',
      title: 'Suggested follow-up',
      message: `Contact ${suggested.name} — high score with stale activity or active negotiation.`,
      investorId: suggested.id,
      score: suggested.investorScore,
      createdAt: now,
    });
  }

  const highValueDeals = deals
    .filter((d) => d.stage !== 'closed' && d.amount >= 250_000)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 2);

  for (const deal of highValueDeals) {
    const inv = investors.find((i) => i.id === deal.investorId);
    const prob = predictDealSuccess(deal, inv);
    insights.push({
      id: `opp-${deal.id}`,
      type: 'opportunity',
      severity: prob >= 60 ? 'success' : 'info',
      title: `High-value deal: ${deal.title}`,
      message: `${formatMoney(deal.amount)} at ${deal.stage}. AI success probability: ${prob}%.`,
      investorId: deal.investorId,
      dealId: deal.id,
      score: prob,
      createdAt: now,
    });
  }

  const avgScore =
    investors.length > 0
      ? Math.round(investors.reduce((s, i) => s + i.investorScore, 0) / investors.length)
      : 0;

  insights.push({
    id: 'rec-portfolio',
    type: 'recommendation',
    severity: 'info',
    title: 'Portfolio intelligence',
    message: `${investors.length} investors tracked. Average score ${avgScore}/100. ${hotLeads.length} hot leads identified.`,
    score: avgScore,
    createdAt: now,
  });

  return insights.slice(0, 12);
}

export function buildInvestorAIAnalysis(investors: Investor[], deals: Deal[]): InvestorAIAnalysis {
  const rankedInvestors = rankInvestors(investors);
  const hotLeads = detectHotLeads(investors, deals);
  const suggestedContact = suggestNextContact(investors, deals);
  const insights = generateInsights(investors, deals);

  const portfolioRiskScore =
    investors.length > 0
      ? Math.round(investors.reduce((s, i) => s + i.riskScore, 0) / investors.length)
      : 0;

  const openDeals = deals.filter((d) => d.stage !== 'closed');
  const successProbability =
    openDeals.length > 0
      ? Math.round(
          openDeals.reduce((s, d) => {
            const inv = investors.find((i) => i.id === d.investorId);
            return s + predictDealSuccess(d, inv);
          }, 0) / openDeals.length
        )
      : 0;

  return {
    rankedInvestors,
    insights,
    suggestedContact,
    hotLeads,
    portfolioRiskScore,
    successProbability,
  };
}

export function rescoreInvestor(investor: Investor): Investor {
  const capitalWeight = Math.min(100, Math.round((investor.investmentRangeMax / 5_000_000) * 100));
  const responseRate = investor.applicationCount > 0 ? Math.min(100, 70) : 40;
  const historicalInvestments = Math.min(100, Math.round((investor.totalInvested / 1_000_000) * 100));
  const investorScore = computeInvestorScore(
    investor.engagementScore,
    capitalWeight,
    responseRate,
    historicalInvestments
  );
  return { ...investor, investorScore };
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}
