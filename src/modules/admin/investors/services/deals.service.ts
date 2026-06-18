import { supabase } from '../../../../lib/supabase/client';
import { assertAdminPermission } from '../../services/adminAuth.service';
import { logAdminAudit } from '../../services/adminAudit.service';
import type { AdminServiceResult } from '../../types/projectAdmin.types';
import type {
  Deal,
  DealFilters,
  DealFormValues,
  DealStage,
  STAGE_PROBABILITY_DEFAULTS,
} from '../types/investorOps.types';
import { mapDealRow } from './investors.service';

const DEAL_SELECT =
  'id, investor_id, title, amount, stage, probability_score, expected_close_date, notes, created_at, updated_at';

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.length > 0) return err.message;
  return 'Request failed';
}

function toError(err: unknown, code: string): AdminServiceResult<never> {
  return { data: null, error: { code, message: extractErrorMessage(err) } };
}

function applyDealFilters(deals: Deal[], filters?: DealFilters): Deal[] {
  let list = [...deals];
  if (filters?.investorId) {
    list = list.filter((d) => d.investorId === filters.investorId);
  }
  if (filters?.stage && filters.stage !== 'all') {
    list = list.filter((d) => d.stage === filters.stage);
  }
  return list;
}

async function fetchInvestorNames(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabase.from('investors').select('id, name').in('id', ids);
  return new Map((data ?? []).map((r: Record<string, unknown>) => [String(r.id), String(r.name ?? '')]));
}

export async function fetchDeals(filters?: DealFilters): Promise<AdminServiceResult<Deal[]>> {
  try {
    await assertAdminPermission('manage_users');

    const { data, error } = await supabase
      .from('investor_deals')
      .select(DEAL_SELECT)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const ids = [...new Set((data ?? []).map((r: Record<string, unknown>) => String(r.investor_id)))];
    const nameMap = await fetchInvestorNames(ids);

    const deals = (data ?? []).map((row: Record<string, unknown>) =>
      mapDealRow(row, nameMap.get(String(row.investor_id)) ?? 'Investor')
    );

    return { data: applyDealFilters(deals, filters), error: null };
  } catch (err) {
    return toError(err, 'FETCH_DEALS_FAILED');
  }
}

export async function createDeal(values: DealFormValues): Promise<AdminServiceResult<Deal>> {
  try {
    await assertAdminPermission('manage_users');

    const { data, error } = await supabase
      .from('investor_deals')
      .insert({
        investor_id: values.investorId,
        title: values.title.trim(),
        amount: values.amount,
        stage: values.stage,
        probability_score: values.probabilityScore,
        expected_close_date: values.expectedCloseDate || null,
        notes: values.notes.trim(),
      })
      .select(DEAL_SELECT)
      .single();

    if (error) throw error;

    const nameMap = await fetchInvestorNames([values.investorId]);
    const deal = mapDealRow(data as Record<string, unknown>, nameMap.get(values.investorId) ?? 'Investor');

    await logAdminAudit({
      resourceType: 'investor_deal',
      resourceId: deal.id,
      resourceName: deal.title,
      action: 'create',
      after: { stage: deal.stage, amount: deal.amount },
    });

    return { data: deal, error: null };
  } catch (err) {
    return toError(err, 'CREATE_DEAL_FAILED');
  }
}

export async function updateDealStage(
  dealId: string,
  stage: DealStage,
  before?: Deal | null
): Promise<AdminServiceResult<Deal>> {
  try {
    await assertAdminPermission('manage_users');

    const probabilityDefaults: typeof STAGE_PROBABILITY_DEFAULTS = {
      lead: 10,
      contacted: 25,
      negotiation: 55,
      committed: 85,
      closed: 100,
    };

    const { data, error } = await supabase
      .from('investor_deals')
      .update({
        stage,
        probability_score: probabilityDefaults[stage],
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId)
      .select(DEAL_SELECT)
      .single();

    if (error) throw error;

    const nameMap = await fetchInvestorNames([String(data.investor_id)]);
    const deal = mapDealRow(data as Record<string, unknown>, nameMap.get(String(data.investor_id)) ?? 'Investor');

    await logAdminAudit({
      resourceType: 'investor_deal',
      resourceId: dealId,
      resourceName: deal.title,
      action: 'update',
      before: before ? { stage: before.stage } : undefined,
      after: { stage },
      metadata: { field: 'stage' },
    });

    return { data: deal, error: null };
  } catch (err) {
    return toError(err, 'UPDATE_DEAL_STAGE_FAILED');
  }
}

export async function updateDeal(
  dealId: string,
  values: Partial<DealFormValues>,
  before?: Deal | null
): Promise<AdminServiceResult<Deal>> {
  try {
    await assertAdminPermission('manage_users');

    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (values.title !== undefined) payload.title = values.title.trim();
    if (values.amount !== undefined) payload.amount = values.amount;
    if (values.stage !== undefined) payload.stage = values.stage;
    if (values.probabilityScore !== undefined) payload.probability_score = values.probabilityScore;
    if (values.expectedCloseDate !== undefined) {
      payload.expected_close_date = values.expectedCloseDate || null;
    }
    if (values.notes !== undefined) payload.notes = values.notes.trim();

    const { data, error } = await supabase
      .from('investor_deals')
      .update(payload)
      .eq('id', dealId)
      .select(DEAL_SELECT)
      .single();

    if (error) throw error;

    const nameMap = await fetchInvestorNames([String(data.investor_id)]);
    const deal = mapDealRow(data as Record<string, unknown>, nameMap.get(String(data.investor_id)) ?? 'Investor');

    await logAdminAudit({
      resourceType: 'investor_deal',
      resourceId: dealId,
      resourceName: deal.title,
      action: 'update',
      before: before ? { title: before.title, stage: before.stage } : undefined,
      after: { title: deal.title, stage: deal.stage },
    });

    return { data: deal, error: null };
  } catch (err) {
    return toError(err, 'UPDATE_DEAL_FAILED');
  }
}

export async function deleteDeal(dealId: string, before?: Deal | null): Promise<AdminServiceResult<{ id: string }>> {
  try {
    await assertAdminPermission('delete_records');
    const { error } = await supabase.from('investor_deals').delete().eq('id', dealId);
    if (error) throw error;

    await logAdminAudit({
      resourceType: 'investor_deal',
      resourceId: dealId,
      resourceName: before?.title ?? dealId,
      action: 'delete',
    });

    return { data: { id: dealId }, error: null };
  } catch (err) {
    return toError(err, 'DELETE_DEAL_FAILED');
  }
}

export function groupDealsByStage(deals: Deal[]): Record<DealStage, Deal[]> {
  return {
    lead: deals.filter((d) => d.stage === 'lead'),
    contacted: deals.filter((d) => d.stage === 'contacted'),
    negotiation: deals.filter((d) => d.stage === 'negotiation'),
    committed: deals.filter((d) => d.stage === 'committed'),
    closed: deals.filter((d) => d.stage === 'closed'),
  };
}
