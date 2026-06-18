import { supabase } from '../../../../lib/supabase/client';
import { assertAdminPermission } from '../../services/adminAuth.service';
import type { AdminServiceResult } from '../../types/projectAdmin.types';
import type { Deal, DealStage, Investor, InvestorActivityEvent, InvestorFilters } from '../types/investorOps.types';

const INVESTOR_SELECT =
  'id, name, type, focus_industries, investment_range_min, investment_range_max, contact_email, website, description, is_active, tags, created_at, updated_at';

const DEAL_SELECT =
  'id, investor_id, title, amount, stage, probability_score, expected_close_date, notes, created_at, updated_at';

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.length > 0) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === 'string' && msg.length > 0) return msg;
  }
  return 'Request failed';
}

function toError(err: unknown, code: string): AdminServiceResult<never> {
  return { data: null, error: { code, message: extractErrorMessage(err) } };
}

function daysSince(iso: string | null): number {
  if (!iso) return 999;
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
}

function computeEngagementScore(
  applicationCount: number,
  activeDeals: number,
  lastActivity: string | null,
  isActive: boolean
): number {
  let score = 0;
  score += Math.min(applicationCount * 8, 32);
  score += Math.min(activeDeals * 12, 36);
  if (isActive) score += 10;
  const days = daysSince(lastActivity);
  if (days <= 7) score += 22;
  else if (days <= 30) score += 14;
  else if (days <= 90) score += 6;
  return Math.min(100, Math.round(score));
}

function computeRiskScore(
  activeDeals: number,
  engagementScore: number,
  isActive: boolean,
  declinedRatio: number
): number {
  let risk = 20;
  if (!isActive) risk += 35;
  if (engagementScore < 30) risk += 25;
  if (activeDeals === 0) risk += 15;
  risk += Math.round(declinedRatio * 30);
  return Math.min(100, Math.max(0, risk));
}

export function computeInvestorScore(
  engagementScore: number,
  capitalWeight: number,
  responseRate: number,
  historicalInvestments: number
): number {
  const score = engagementScore * 0.35 + capitalWeight * 0.25 + responseRate * 0.2 + historicalInvestments * 0.2;
  return Math.min(100, Math.round(score));
}

function mapDealRow(row: Record<string, unknown>, investorName = 'Investor'): Deal {
  return {
    id: String(row.id),
    investorId: String(row.investor_id),
    investorName,
    title: String(row.title ?? ''),
    amount: Number(row.amount ?? 0),
    stage: (row.stage as DealStage) ?? 'lead',
    probabilityScore: Number(row.probability_score ?? 10),
    expectedCloseDate: (row.expected_close_date as string | null) ?? null,
    notes: String(row.notes ?? ''),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

function enrichInvestor(
  row: Record<string, unknown>,
  deals: Deal[],
  applicationCount: number,
  declinedApps: number
): Investor {
  const id = String(row.id);
  const investorDeals = deals.filter((d) => d.investorId === id);
  const activeDeals = investorDeals.filter((d) => d.stage !== 'closed').length;
  const totalInvested = investorDeals
    .filter((d) => d.stage === 'closed')
    .reduce((sum, d) => sum + d.amount, 0);
  const lastDealActivity = investorDeals.reduce<string | null>((latest, d) => {
    if (!latest || d.updatedAt > latest) return d.updatedAt;
    return latest;
  }, null);
  const lastActivity = lastDealActivity ?? String(row.updated_at ?? row.created_at ?? '');
  const focusIndustries = Array.isArray(row.focus_industries)
    ? (row.focus_industries as string[])
    : [];
  const dbTags = Array.isArray(row.tags) ? (row.tags as string[]) : [];
  const tags = [...new Set([...dbTags, ...focusIndustries.slice(0, 2)])].filter(Boolean);
  const isActive = Boolean(row.is_active);
  const rangeMax = Number(row.investment_range_max ?? 0);
  const engagementScore = computeEngagementScore(applicationCount, activeDeals, lastActivity, isActive);
  const declinedRatio = applicationCount > 0 ? declinedApps / applicationCount : 0;
  const riskScore = computeRiskScore(activeDeals, engagementScore, isActive, declinedRatio);
  const capitalWeight = Math.min(100, Math.round((rangeMax / 5_000_000) * 100));
  const responseRate = applicationCount > 0 ? Math.min(100, Math.round((1 - declinedRatio) * 100)) : 40;
  const historicalInvestments = Math.min(100, Math.round((totalInvested / 1_000_000) * 100));
  const investorScore = computeInvestorScore(engagementScore, capitalWeight, responseRate, historicalInvestments);

  return {
    id,
    name: String(row.name ?? ''),
    email: String(row.contact_email ?? ''),
    company: String(row.name ?? ''),
    type: String(row.type ?? 'angel'),
    totalInvested,
    activeDeals,
    engagementScore,
    riskScore,
    investorScore,
    lastActivity: lastActivity || null,
    tags,
    isActive,
    applicationCount,
    investmentRangeMin: Number(row.investment_range_min ?? 0),
    investmentRangeMax: rangeMax,
  };
}

function applyInvestorFilters(investors: Investor[], filters?: InvestorFilters): Investor[] {
  let list = [...investors];
  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q) ||
        i.company.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  if (filters?.tag && filters.tag !== 'all') {
    list = list.filter((i) => i.tags.some((t) => t.toLowerCase() === filters.tag!.toLowerCase()));
  }
  if (filters?.minScore !== undefined && filters.minScore > 0) {
    list = list.filter((i) => i.investorScore >= filters.minScore!);
  }
  const sortBy = filters?.sortBy ?? 'score';
  list.sort((a, b) => {
    switch (sortBy) {
      case 'engagement':
        return b.engagementScore - a.engagementScore;
      case 'capital':
        return b.investmentRangeMax - a.investmentRangeMax;
      case 'activity':
        return daysSince(a.lastActivity) - daysSince(b.lastActivity);
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return b.investorScore - a.investorScore;
    }
  });
  return list;
}

export async function fetchInvestors(
  filters?: InvestorFilters
): Promise<AdminServiceResult<Investor[]>> {
  try {
    await assertAdminPermission('manage_users');

    const [investorsResult, dealsResult, appsResult] = await Promise.all([
      supabase.from('investors').select(INVESTOR_SELECT).order('updated_at', { ascending: false }),
      supabase.from('investor_deals').select(DEAL_SELECT),
      supabase.from('pitch_investor_applications').select('investor_id, status'),
    ]);

    if (investorsResult.error) throw investorsResult.error;

    const investorNameMap = new Map<string, string>(
      (investorsResult.data ?? []).map((r: Record<string, unknown>) => [
        String(r.id),
        String(r.name ?? ''),
      ])
    );

    const deals: Deal[] = (dealsResult.data ?? []).map((row: Record<string, unknown>) =>
      mapDealRow(row, investorNameMap.get(String(row.investor_id)) ?? 'Investor')
    );

    const appCounts = new Map<string, number>();
    const declinedCounts = new Map<string, number>();
    for (const app of appsResult.data ?? []) {
      const record = app as Record<string, unknown>;
      const id = String(record.investor_id);
      appCounts.set(id, (appCounts.get(id) ?? 0) + 1);
      if (record.status === 'rejected') {
        declinedCounts.set(id, (declinedCounts.get(id) ?? 0) + 1);
      }
    }

    const enriched = (investorsResult.data ?? []).map((row: Record<string, unknown>) =>
      enrichInvestor(
        row as Record<string, unknown>,
        deals,
        appCounts.get(String(row.id)) ?? 0,
        declinedCounts.get(String(row.id)) ?? 0
      )
    );

    return { data: applyInvestorFilters(enriched, filters), error: null };
  } catch (err) {
    return toError(err, 'FETCH_INVESTORS_FAILED');
  }
}

export async function fetchInvestorById(id: string): Promise<AdminServiceResult<Investor>> {
  const result = await fetchInvestors();
  if (result.error) return { data: null, error: result.error };
  const investor = (result.data ?? []).find((i) => i.id === id);
  if (!investor) {
    return { data: null, error: { code: 'NOT_FOUND', message: 'Investor not found' } };
  }
  return { data: investor, error: null };
}

export async function fetchInvestorActivity(
  investorId: string
): Promise<AdminServiceResult<InvestorActivityEvent[]>> {
  try {
    await assertAdminPermission('manage_users');

    const { data: deals, error } = await supabase
      .from('investor_deals')
      .select(DEAL_SELECT)
      .eq('investor_id', investorId)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const events: InvestorActivityEvent[] = (deals ?? []).map((row: Record<string, unknown>) => ({
      id: `deal-${String(row.id)}`,
      investorId,
      type: row.stage === 'closed' ? 'deal_closed' : 'deal_updated',
      label: `${String(row.title)} → ${String(row.stage)}`,
      timestamp: String(row.updated_at),
      metadata: { amount: Number(row.amount ?? 0) },
    }));

    return { data: events, error: null };
  } catch (err) {
    return toError(err, 'FETCH_INVESTOR_ACTIVITY_FAILED');
  }
}

export async function updateInvestorTags(
  investorId: string,
  tags: string[]
): Promise<AdminServiceResult<{ id: string; tags: string[] }>> {
  try {
    await assertAdminPermission('manage_users');
    const { error } = await supabase
      .from('investors')
      .update({ tags, updated_at: new Date().toISOString() })
      .eq('id', investorId);
    if (error) throw error;
    return { data: { id: investorId, tags }, error: null };
  } catch (err) {
    return toError(err, 'UPDATE_INVESTOR_TAGS_FAILED');
  }
}

export function collectAllTags(investors: Investor[]): string[] {
  const set = new Set<string>();
  for (const inv of investors) {
    for (const tag of inv.tags) set.add(tag);
  }
  return [...set].sort();
}

export { mapDealRow, enrichInvestor };
