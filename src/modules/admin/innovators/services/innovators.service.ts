import { supabase } from '../../../../lib/supabase/client';
import { assertAdminPermission } from '../../services/adminAuth.service';
import { displayName } from '../../utils/adminPage.utils';
import type { AdminServiceResult } from '../../types/projectAdmin.types';
import {
  averageReviewScores,
  priorityFromScore,
  stageFromDecision,
} from './evaluation.service';
import type {
  Innovator,
  InnovatorActivity,
  InnovatorActivityFeedItem,
  InnovatorFilters,
  InnovatorFollowUp,
  InnovatorOpsStats,
  InnovatorPriority,
  InnovatorReview,
  InnovatorStage,
  ReviewDecision,
  ReviewFormValues,
} from '../types/innovatorOps.types';

const PIPELINE_SELECT =
  'id, user_id, idea_title, idea_description, category, stage, impact_score, feasibility_score, market_score, final_score, priority, last_contacted_at, next_follow_up_date, created_at, updated_at';

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.length > 0) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === 'string') return msg;
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

function mapInnovator(
  pipeline: Record<string, unknown>,
  profile: Record<string, unknown>,
  reviewCount = 0
): Innovator {
  return {
    id: String(pipeline.id),
    userId: String(pipeline.user_id),
    fullName: displayName(profile.full_name as string | null, profile.email as string | null),
    email: String(profile.email ?? ''),
    phone: (profile.phone as string | null) ?? null,
    organization: (profile.organization_name as string | null) ?? null,
    ideaTitle: String(pipeline.idea_title ?? 'Untitled innovation'),
    ideaDescription: String(pipeline.idea_description ?? ''),
    category: String(pipeline.category ?? 'General'),
    stage: (pipeline.stage as InnovatorStage) ?? 'IDEA_SUBMITTED',
    impactScore: Number(pipeline.impact_score ?? 0),
    feasibilityScore: Number(pipeline.feasibility_score ?? 0),
    marketScore: Number(pipeline.market_score ?? 0),
    finalScore: Number(pipeline.final_score ?? 0),
    priority: (pipeline.priority as InnovatorPriority) ?? 'medium',
    lastContactedAt: (pipeline.last_contacted_at as string | null) ?? null,
    nextFollowUpDate: (pipeline.next_follow_up_date as string | null) ?? null,
    updatedAt: String(pipeline.updated_at ?? ''),
    createdAt: String(pipeline.created_at ?? ''),
    reviewCount,
    messageCount: 0,
  };
}

async function ensurePipelineRows(profileIds: string[]): Promise<void> {
  if (profileIds.length === 0) return;
  const { data: existing } = await supabase
    .from('innovator_pipeline')
    .select('user_id')
    .in('user_id', profileIds);
  const existingSet = new Set((existing ?? []).map((r) => String(r.user_id)));
  const missing = profileIds.filter((id) => !existingSet.has(id));
  if (missing.length === 0) return;
  await supabase.from('innovator_pipeline').insert(
    missing.map((user_id) => ({
      user_id,
      idea_title: 'Innovation pipeline entry',
      category: 'General',
    }))
  );
}

async function fetchInnovatorProfiles(): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, organization_name, created_at, role, user_type')
    .or('role.eq.innovator,user_type.eq.innovator')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Record<string, unknown>[];
}

export async function fetchInnovators(
  filters?: InnovatorFilters
): Promise<AdminServiceResult<Innovator[]>> {
  try {
    await assertAdminPermission('manage_users');

    const profileList = await fetchInnovatorProfiles();
    const profileIds = profileList.map((p) => String(p.id));
    if (profileIds.length === 0) {
      return { data: [], error: null };
    }

    await ensurePipelineRows(profileIds);

    const { data: pipelines, error: pipeError } = await supabase
      .from('innovator_pipeline')
      .select(PIPELINE_SELECT)
      .in('user_id', profileIds);

    if (pipeError) throw pipeError;

    const pipelineByUser = new Map(
      (pipelines ?? []).map((p) => [String(p.user_id), p as Record<string, unknown>])
    );

    const pipelineIds = (pipelines ?? []).map((p) => String(p.id));
    const { data: reviewCounts } = pipelineIds.length
      ? await supabase.from('innovator_reviews').select('innovator_id').in('innovator_id', pipelineIds)
      : { data: [] };

    const countMap = new Map<string, number>();
    for (const row of reviewCounts ?? []) {
      const id = String(row.innovator_id);
      countMap.set(id, (countMap.get(id) ?? 0) + 1);
    }

    let innovators: Innovator[] = profileList
      .map((profile) => {
        const pipe = pipelineByUser.get(String(profile.id));
        if (!pipe) return null;
        return mapInnovator(pipe, profile as Record<string, unknown>, countMap.get(String(pipe.id)) ?? 0);
      })
      .filter(Boolean) as Innovator[];

    if (filters?.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      innovators = innovators.filter(
        (i) =>
          i.fullName.toLowerCase().includes(q) ||
          i.email.toLowerCase().includes(q) ||
          i.ideaTitle.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }
    if (filters?.category && filters.category !== 'All') {
      innovators = innovators.filter((i) => i.category === filters.category);
    }
    if (filters?.stage && filters.stage !== 'all') {
      innovators = innovators.filter((i) => i.stage === filters.stage);
    }
    if (filters?.priority && filters.priority !== 'all') {
      innovators = innovators.filter((i) => i.priority === filters.priority);
    }

    innovators.sort((a, b) => b.finalScore - a.finalScore);
    return { data: innovators, error: null };
  } catch (err) {
    return toError(err, 'FETCH_INNOVATORS_FAILED');
  }
}

export function computeInnovatorStats(innovators: Innovator[]): InnovatorOpsStats {
  const today = new Date().toISOString().slice(0, 10);
  const underReviewStages: InnovatorStage[] = ['SCREENING', 'TECH_REVIEW', 'BUSINESS_REVIEW'];

  return {
    total: innovators.length,
    activeInnovations: innovators.filter((i) => i.stage !== 'REJECTED').length,
    underReview: innovators.filter((i) => underReviewStages.includes(i.stage)).length,
    approvedFundable: innovators.filter((i) => i.stage === 'APPROVED').length,
    overdueFollowUps: innovators.filter(
      (i) => i.nextFollowUpDate && i.nextFollowUpDate < today
    ).length,
  };
}

export function computeFollowUps(innovators: Innovator[]): InnovatorFollowUp[] {
  const today = new Date().toISOString().slice(0, 10);
  const items: InnovatorFollowUp[] = [];

  for (const innovator of innovators) {
    if (innovator.nextFollowUpDate && innovator.nextFollowUpDate < today) {
      items.push({
        innovator,
        reason: 'overdue',
        urgencyScore: 100 + daysSince(innovator.nextFollowUpDate),
      });
    } else if (daysSince(innovator.lastContactedAt) >= 7) {
      items.push({
        innovator,
        reason: 'stale_contact',
        urgencyScore: 70 + daysSince(innovator.lastContactedAt),
      });
    } else if (['SCREENING', 'TECH_REVIEW'].includes(innovator.stage)) {
      items.push({
        innovator,
        reason: 'pending_evaluation',
        urgencyScore: 50 + innovator.finalScore,
      });
    }
  }

  return items.sort((a, b) => b.urgencyScore - a.urgencyScore);
}

export function groupInnovatorsByStage(
  innovators: Innovator[]
): Record<InnovatorStage, Innovator[]> {
  return {
    IDEA_SUBMITTED: innovators.filter((i) => i.stage === 'IDEA_SUBMITTED'),
    SCREENING: innovators.filter((i) => i.stage === 'SCREENING'),
    TECH_REVIEW: innovators.filter((i) => i.stage === 'TECH_REVIEW'),
    BUSINESS_REVIEW: innovators.filter((i) => i.stage === 'BUSINESS_REVIEW'),
    APPROVED: innovators.filter((i) => i.stage === 'APPROVED'),
    REJECTED: innovators.filter((i) => i.stage === 'REJECTED'),
  };
}

export async function updateInnovatorStage(
  innovatorId: string,
  stage: InnovatorStage
): Promise<AdminServiceResult<{ id: string; stage: InnovatorStage }>> {
  try {
    await assertAdminPermission('manage_users');
    const { data, error } = await supabase
      .from('innovator_pipeline')
      .update({ stage, updated_at: new Date().toISOString() })
      .eq('id', innovatorId)
      .select('id, stage')
      .single();
    if (error) throw error;

    await logInnovatorActivity(innovatorId, 'stage_changed', { stage });

    return { data: { id: String(data.id), stage: data.stage as InnovatorStage }, error: null };
  } catch (err) {
    return toError(err, 'UPDATE_STAGE_FAILED');
  }
}

export async function logInnovatorActivity(
  innovatorId: string,
  action: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await supabase.from('innovator_activity_logs').insert({
    innovator_id: innovatorId,
    action,
    metadata,
  });
}

export async function evaluateInnovator(
  innovatorId: string
): Promise<AdminServiceResult<Innovator>> {
  try {
    await assertAdminPermission('manage_users');

    const { data: reviews, error: reviewError } = await supabase
      .from('innovator_reviews')
      .select('impact_score, feasibility_score, market_score')
      .eq('innovator_id', innovatorId);

    if (reviewError) throw reviewError;

    const scores = averageReviewScores(
      (reviews ?? []).map((r) => ({
        impactScore: Number(r.impact_score),
        feasibilityScore: Number(r.feasibility_score),
        marketScore: Number(r.market_score),
      }))
    );

    const { error: updateError } = await supabase
      .from('innovator_pipeline')
      .update({
        impact_score: scores.impact,
        feasibility_score: scores.feasibility,
        market_score: scores.market,
        final_score: scores.final,
        priority: priorityFromScore(scores.final),
        updated_at: new Date().toISOString(),
      })
      .eq('id', innovatorId);

    if (updateError) throw updateError;

    await logInnovatorActivity(innovatorId, 'scores_recalculated', scores);

    const list = await fetchInnovators();
    const innovator = (list.data ?? []).find((i) => i.id === innovatorId);
    if (!innovator) {
      return { data: null, error: { code: 'NOT_FOUND', message: 'Innovator not found' } };
    }
    return { data: innovator, error: null };
  } catch (err) {
    return toError(err, 'EVALUATE_INNOVATOR_FAILED');
  }
}

export async function submitInnovatorReview(
  innovatorId: string,
  values: ReviewFormValues,
  reviewerId: string,
  reviewerName: string
): Promise<AdminServiceResult<InnovatorReview>> {
  try {
    await assertAdminPermission('manage_users');

    const { data, error } = await supabase
      .from('innovator_reviews')
      .insert({
        innovator_id: innovatorId,
        reviewer_id: reviewerId,
        reviewer_name: reviewerName,
        impact_score: values.impactScore,
        feasibility_score: values.feasibilityScore,
        market_score: values.marketScore,
        notes: values.notes.trim(),
        decision: values.decision,
      })
      .select('*')
      .single();

    if (error) throw error;

    const newStage = stageFromDecision(values.decision);
    if (newStage) {
      await updateInnovatorStage(innovatorId, newStage);
    }

    await evaluateInnovator(innovatorId);
    await logInnovatorActivity(innovatorId, 'review_submitted', {
      decision: values.decision,
      impact: values.impactScore,
    });

    const review: InnovatorReview = {
      id: String(data.id),
      innovatorId,
      reviewerId,
      reviewerName,
      impactScore: values.impactScore,
      feasibilityScore: values.feasibilityScore,
      marketScore: values.marketScore,
      notes: values.notes,
      decision: values.decision,
      createdAt: String(data.created_at),
    };

    return { data: review, error: null };
  } catch (err) {
    return toError(err, 'SUBMIT_REVIEW_FAILED');
  }
}

export async function fetchInnovatorReviews(
  innovatorId: string
): Promise<AdminServiceResult<InnovatorReview[]>> {
  try {
    await assertAdminPermission('manage_users');
    const { data, error } = await supabase
      .from('innovator_reviews')
      .select('*')
      .eq('innovator_id', innovatorId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return {
      data: (data ?? []).map((row) => ({
        id: String(row.id),
        innovatorId,
        reviewerId: (row.reviewer_id as string | null) ?? null,
        reviewerName: String(row.reviewer_name ?? 'Admin'),
        impactScore: Number(row.impact_score),
        feasibilityScore: Number(row.feasibility_score),
        marketScore: Number(row.market_score),
        notes: String(row.notes ?? ''),
        decision: row.decision as ReviewDecision,
        createdAt: String(row.created_at),
      })),
      error: null,
    };
  } catch (err) {
    return toError(err, 'FETCH_REVIEWS_FAILED');
  }
}

export async function fetchRecentInnovatorActivity(
  limit = 20
): Promise<AdminServiceResult<InnovatorActivityFeedItem[]>> {
  try {
    await assertAdminPermission('manage_users');

    const { data: logs, error } = await supabase
      .from('innovator_activity_logs')
      .select('id, innovator_id, action, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!logs?.length) return { data: [], error: null };

    const pipelineIds = [...new Set(logs.map((l) => String(l.innovator_id)))];
    const { data: pipelines } = await supabase
      .from('innovator_pipeline')
      .select('id, user_id, idea_title')
      .in('id', pipelineIds);

    const userIds = [...new Set((pipelines ?? []).map((p) => String(p.user_id)))];
    const { data: profiles } = userIds.length
      ? await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
      : { data: [] };

    const profileMap = new Map((profiles ?? []).map((p) => [String(p.id), p]));
    const pipelineMap = new Map(
      (pipelines ?? []).map((p) => [
        String(p.id),
        {
          userId: String(p.user_id),
          ideaTitle: String(p.idea_title ?? 'Innovation'),
        },
      ])
    );

    return {
      data: logs.map((row) => {
        const pipe = pipelineMap.get(String(row.innovator_id));
        const profile = pipe ? profileMap.get(pipe.userId) : null;
        const innovatorName = displayName(
          (profile?.full_name as string | null) ?? null,
          (profile?.email as string | null) ?? pipe?.ideaTitle ?? 'Innovator'
        );
        return {
          id: String(row.id),
          innovatorId: String(row.innovator_id),
          action: String(row.action),
          metadata: (row.metadata as Record<string, unknown>) ?? {},
          createdAt: String(row.created_at),
          innovatorName,
        };
      }),
      error: null,
    };
  } catch (err) {
    return toError(err, 'FETCH_ACTIVITY_FEED_FAILED');
  }
}

export async function fetchInnovatorActivity(
  innovatorId: string
): Promise<AdminServiceResult<InnovatorActivity[]>> {
  try {
    await assertAdminPermission('manage_users');
    const { data, error } = await supabase
      .from('innovator_activity_logs')
      .select('*')
      .eq('innovator_id', innovatorId)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) throw error;

    return {
      data: (data ?? []).map((row) => ({
        id: String(row.id),
        innovatorId,
        action: String(row.action),
        metadata: (row.metadata as Record<string, unknown>) ?? {},
        createdAt: String(row.created_at),
      })),
      error: null,
    };
  } catch (err) {
    return toError(err, 'FETCH_ACTIVITY_FAILED');
  }
}

export async function recordInnovatorContact(
  innovatorId: string,
  nextFollowUpDate?: string
): Promise<AdminServiceResult<{ id: string }>> {
  try {
    await assertAdminPermission('manage_users');
    const { error } = await supabase
      .from('innovator_pipeline')
      .update({
        last_contacted_at: new Date().toISOString(),
        next_follow_up_date: nextFollowUpDate ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', innovatorId);
    if (error) throw error;
    await logInnovatorActivity(innovatorId, 'contact_logged', { nextFollowUpDate });
    return { data: { id: innovatorId }, error: null };
  } catch (err) {
    return toError(err, 'RECORD_CONTACT_FAILED');
  }
}

export { mapInnovator };
