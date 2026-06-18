import { supabase } from '../../../../lib/supabase/client';
import { assertAdminPermission } from '../../services/adminAuth.service';
import { displayName } from '../../utils/adminPage.utils';
import type { AdminServiceResult } from '../../types/projectAdmin.types';
import {
  extractErrorMessage,
  isSchemaError,
  patchMentorRow,
  queryMentorsWithFallback,
  safeTableQuery,
  schemaMissingError,
  toServiceError,
} from '../utils/mentorOps.utils';
import {
  rankMatchCandidates,
  type InnovatorMatchProfile,
  type MentorMatchProfile,
} from './mentorMatchingEngine';
import type {
  MatchCandidate,
  Mentor,
  MentorActivityItem,
  MentorAnalyticsData,
  MentorAssignment,
  MentorAvailability,
  MentorFeedbackItem,
  MentorFilters,
  MentorOpsStats,
  MentorSession,
  MentorStatus,
  SessionFormValues,
  SessionStatus,
} from '../types/mentorOps.types';

const MENTOR_PROFILE_SELECT =
  'id, full_name, email, phone, organization_name, avatar_url, role, user_type';
const ASSIGNMENT_SELECT =
  'id, mentor_id, innovator_id, match_score, progress_status, assigned_at';
const SESSION_SELECT =
  'id, mentor_id, user_id, scheduled_at, duration_minutes, status, notes, feedback, outcome, rating';
const SESSION_SELECT_MINIMAL =
  'id, mentor_id, user_id, scheduled_at, duration_minutes, status, feedback, rating';
const FEEDBACK_SELECT = 'id, mentor_id, innovator_id, rating, comment, created_at';

function mapSessionStatus(dbStatus: string): SessionStatus {
  switch (dbStatus) {
    case 'upcoming':
      return 'scheduled';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    case 'missed':
      return 'missed';
    case 'rescheduled':
      return 'rescheduled';
    default:
      return 'scheduled';
  }
}

function toDbSessionStatus(status: SessionStatus): string {
  if (status === 'scheduled') return 'upcoming';
  return status;
}

function mapMentor(
  row: Record<string, unknown>,
  activeMentees = 0,
  lastSession: string | null = null
): Mentor {
  return {
    id: String(row.id),
    userId: (row.user_id as string | null) ?? null,
    name: String(row.full_name ?? 'Mentor'),
    photoUrl: (row.avatar_url as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    organization: (row.organization as string | null) ?? null,
    position: String(row.title ?? 'Mentor'),
    expertise: Array.isArray(row.expertise) ? (row.expertise as string[]) : [],
    industry: (row.industry as string | null) ?? null,
    experienceYears: Number(row.years_experience ?? 0),
    country: (row.country as string | null) ?? null,
    availability: ((row.availability_status as MentorAvailability) ?? 'available') as MentorAvailability,
    rating: Number(row.rating ?? 0),
    status: row.is_active === false ? 'suspended' : 'active',
    activeMentees,
    lastSessionDate: lastSession ?? (row.last_session_at as string | null) ?? null,
    totalSessions: Number(row.total_sessions ?? 0),
    bio: String(row.bio ?? ''),
    createdAt: String(row.created_at ?? ''),
  };
}

async function logMentorActivity(
  mentorId: string | null,
  action: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const { error } = await supabase.from('mentor_activity_logs').insert({
    mentor_id: mentorId,
    action,
    metadata,
  });
  if (error && !isSchemaError(error)) {
    console.warn('[mentor-ops] activity log failed:', extractErrorMessage(error));
  }
}

async function patchMentor(mentorId: string, patch: Record<string, unknown>): Promise<void> {
  await patchMentorRow(supabase, mentorId, patch);
}

async function fetchMentorProfiles(): Promise<Record<string, unknown>[]> {
  const attempts = [
    MENTOR_PROFILE_SELECT,
    'id, full_name, email, phone, organization_name, avatar_url',
    'id, full_name, email, phone, organization_name',
    'id, full_name, email, role, organization_name',
    'id, full_name, email',
  ];

  for (const select of attempts) {
    const { data, error } = await supabase
      .from('profiles')
      .select(select)
      .or('role.eq.mentor,user_type.eq.mentor');
    if (!error) return (data ?? []) as unknown as Record<string, unknown>[];
    if (!isSchemaError(error)) throw error;
  }
  return [];
}

async function insertMentorProfiles(rows: Record<string, unknown>[]): Promise<void> {
  const fullPayload = rows.map((p) => ({
    user_id: p.id,
    full_name: String(p.full_name ?? p.email ?? 'Mentor'),
    email: (p.email as string | null) ?? null,
    phone: (p.phone as string | null) ?? null,
    organization: (p.organization_name as string | null) ?? null,
    avatar_url: (p.avatar_url as string | null) ?? null,
    title: 'Innovation Mentor',
    expertise: ['General'],
  }));

  const { error } = await supabase.from('mentors').insert(fullPayload);
  if (!error) return;
  if (!isSchemaError(error)) throw error;

  const minimalPayload = rows.map((p) => ({
    user_id: p.id,
    full_name: String(p.full_name ?? p.email ?? 'Mentor'),
    title: 'Innovation Mentor',
    expertise: ['General'],
  }));
  const { error: retryError } = await supabase.from('mentors').insert(minimalPayload);
  if (retryError) throw retryError;
}

async function ensureMentorProfiles(): Promise<void> {
  const profiles = await fetchMentorProfiles();
  if (!profiles.length) return;

  const { data: existing } = await supabase.from('mentors').select('user_id');
  const existingSet = new Set((existing ?? []).map((m) => String(m.user_id)));

  const missing = profiles.filter((p) => !existingSet.has(String(p.id)));
  if (missing.length === 0) return;

  await insertMentorProfiles(missing);
}

async function queryMentorSessions(
  mentorId: string
): Promise<Record<string, unknown>[]> {
  for (const select of [SESSION_SELECT, SESSION_SELECT_MINIMAL, '*']) {
    const { data, error } = await supabase
      .from('mentorship_sessions')
      .select(select)
      .eq('mentor_id', mentorId)
      .order('scheduled_at', { ascending: false });
    if (!error) return (data ?? []) as unknown as Record<string, unknown>[];
    if (!isSchemaError(error)) throw error;
  }
  return [];
}

async function insertMentorshipSession(
  payload: Record<string, unknown>
): Promise<string> {
  let body = { ...payload };

  for (let attempt = 0; attempt < 6; attempt++) {
    const { data, error } = await supabase
      .from('mentorship_sessions')
      .insert(body)
      .select('id')
      .single();
    if (!error) return String(data.id);
    if (!isSchemaError(error)) throw error;

    const msg = extractErrorMessage(error).toLowerCase();
    const colMatch = msg.match(/could not find the '(\w+)' column/);
    const missingCol = colMatch?.[1];
    if (missingCol && missingCol in body) {
      const next = { ...body };
      delete next[missingCol];
      if (Object.keys(next).length === 0) throw error;
      body = next;
      continue;
    }
    throw error;
  }
  throw new Error('Failed to create mentorship session');
}

export async function fetchMentors(
  filters?: MentorFilters
): Promise<AdminServiceResult<Mentor[]>> {
  try {
    await assertAdminPermission('manage_users');
    await ensureMentorProfiles();

    const rows = await queryMentorsWithFallback(supabase);

    const mentorIds = rows.map((r) => String(r.id));

    const assignmentRows = mentorIds.length
      ? (await safeTableQuery(() =>
          supabase.from('mentor_assignments').select('mentor_id').in('mentor_id', mentorIds)
        )) ?? []
      : [];

    const menteeCounts = new Map<string, number>();
    for (const a of assignmentRows) {
      const id = String(a.mentor_id);
      menteeCounts.set(id, (menteeCounts.get(id) ?? 0) + 1);
    }

    const { data: sessions } = mentorIds.length
      ? await supabase
          .from('mentorship_sessions')
          .select('mentor_id, scheduled_at')
          .in('mentor_id', mentorIds)
          .order('scheduled_at', { ascending: false })
      : { data: [] };

    const lastSessionMap = new Map<string, string>();
    for (const s of sessions ?? []) {
      const id = String(s.mentor_id);
      if (!lastSessionMap.has(id)) lastSessionMap.set(id, String(s.scheduled_at));
    }

    let mentors = rows.map((r) =>
      mapMentor(r, menteeCounts.get(String(r.id)) ?? 0, lastSessionMap.get(String(r.id)) ?? null)
    );

    if (filters?.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      mentors = mentors.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.email?.toLowerCase().includes(q) ?? false) ||
          (m.organization?.toLowerCase().includes(q) ?? false) ||
          m.expertise.some((e) => e.toLowerCase().includes(q))
      );
    }
    if (filters?.industry && filters.industry !== 'All') {
      mentors = mentors.filter((m) => m.industry === filters.industry);
    }
    if (filters?.availability && filters.availability !== 'all') {
      mentors = mentors.filter((m) => m.availability === filters.availability);
    }
    if (filters?.status && filters.status !== 'all') {
      mentors = mentors.filter((m) => m.status === filters.status);
    }
    if (filters?.minRating && filters.minRating > 0) {
      mentors = mentors.filter((m) => m.rating >= filters.minRating!);
    }

    return { data: mentors, error: null };
  } catch (err) {
    if (isSchemaError(err)) return schemaMissingError(err);
    return toServiceError(err, 'FETCH_MENTORS_FAILED');
  }
}

export function computeMentorStats(
  mentors: Mentor[],
  sessionCount: number,
  pendingRequests: number
): MentorOpsStats {
  const active = mentors.filter((m) => m.status === 'active').length;
  const avgRating =
    mentors.length > 0
      ? Math.round((mentors.reduce((s, m) => s + m.rating, 0) / mentors.length) * 10) / 10
      : 0;

  const withRecentSession = mentors.filter((m) => {
    if (!m.lastSessionDate) return false;
    const days = (Date.now() - new Date(m.lastSessionDate).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 30;
  }).length;

  const engagement =
    mentors.length > 0 ? Math.round((withRecentSession / mentors.length) * 100) : 0;

  return {
    totalMentors: mentors.length,
    activeMentors: active,
    totalSessions: sessionCount,
    pendingMatchRequests: pendingRequests,
    averageRating: avgRating,
    monthlyEngagementRate: engagement,
  };
}

export async function fetchMentorStats(): Promise<
  AdminServiceResult<{ sessionCount: number; pendingRequests: number }>
> {
  try {
    await assertAdminPermission('manage_users');
    const [{ count: sessionCount }, { count: pendingRequests }] = await Promise.all([
      supabase.from('mentorship_sessions').select('*', { count: 'exact', head: true }),
      supabase
        .from('mentorship_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ]);
    return {
      data: {
        sessionCount: sessionCount ?? 0,
        pendingRequests: pendingRequests ?? 0,
      },
      error: null,
    };
  } catch (err) {
    return toServiceError(err, 'FETCH_MENTOR_STATS_FAILED');
  }
}

export async function fetchMentorDetail(mentorId: string): Promise<
  AdminServiceResult<{
    assignments: MentorAssignment[];
    sessions: MentorSession[];
    feedback: MentorFeedbackItem[];
  }>
> {
  try {
    await assertAdminPermission('manage_users');

    const { data: assignmentsRaw, error: assignError } = await supabase
      .from('mentor_assignments')
      .select(ASSIGNMENT_SELECT)
      .eq('mentor_id', mentorId)
      .order('assigned_at', { ascending: false });

    if (assignError && !isSchemaError(assignError)) throw assignError;

    const innovatorIds = [...new Set((assignmentsRaw ?? []).map((a) => String(a.innovator_id)))];
    const { data: profiles } = innovatorIds.length
      ? await supabase.from('profiles').select('id, full_name, email').in('id', innovatorIds)
      : { data: [] };

    const { data: pipelines } = innovatorIds.length
      ? await supabase
          .from('innovator_pipeline')
          .select('user_id, idea_title')
          .in('user_id', innovatorIds)
      : { data: [] };

    const profileMap = new Map((profiles ?? []).map((p) => [String(p.id), p]));
    const pipelineMap = new Map((pipelines ?? []).map((p) => [String(p.user_id), p]));

    const assignments: MentorAssignment[] = (assignmentsRaw ?? []).map((a) => {
      const profile = profileMap.get(String(a.innovator_id));
      const pipe = pipelineMap.get(String(a.innovator_id));
      return {
        id: String(a.id),
        mentorId,
        innovatorId: String(a.innovator_id),
        innovatorName: displayName(
          (profile?.full_name as string | null) ?? null,
          (profile?.email as string | null) ?? 'Innovator'
        ),
        ideaTitle: String(pipe?.idea_title ?? 'Innovation'),
        matchScore: Number(a.match_score ?? 0),
        progressStatus: String(a.progress_status ?? 'active'),
        assignedAt: String(a.assigned_at),
      };
    });

    const sessionsRaw = await queryMentorSessions(mentorId);

    const sessionUserIds = [...new Set((sessionsRaw ?? []).map((s) => String(s.user_id)))];
    const { data: sessionProfiles } = sessionUserIds.length
      ? await supabase.from('profiles').select('id, full_name, email').in('id', sessionUserIds)
      : { data: [] };
    const sessionProfileMap = new Map((sessionProfiles ?? []).map((p) => [String(p.id), p]));

    const sessions: MentorSession[] = (sessionsRaw ?? []).map((s) => {
      const profile = sessionProfileMap.get(String(s.user_id));
      return {
        id: String(s.id),
        mentorId,
        innovatorId: String(s.user_id),
        innovatorName: displayName(
          (profile?.full_name as string | null) ?? null,
          (profile?.email as string | null) ?? 'Innovator'
        ),
        sessionDate: String(s.scheduled_at),
        durationMinutes: Number(s.duration_minutes ?? 60),
        status: mapSessionStatus(String(s.status)),
        notes: String(s.notes ?? s.feedback ?? ''),
        outcome: String(s.outcome ?? ''),
        rating: (s.rating as number | null) ?? null,
      };
    });

    const { data: feedbackRaw, error: fbError } = await supabase
      .from('mentor_feedback')
      .select(FEEDBACK_SELECT)
      .eq('mentor_id', mentorId)
      .order('created_at', { ascending: false });

    if (fbError && !isSchemaError(fbError)) throw fbError;

    const fbInnovatorIds = [...new Set((feedbackRaw ?? []).map((f) => String(f.innovator_id)))];
    const { data: fbProfiles } = fbInnovatorIds.length
      ? await supabase.from('profiles').select('id, full_name, email').in('id', fbInnovatorIds)
      : { data: [] };
    const fbMap = new Map((fbProfiles ?? []).map((p) => [String(p.id), p]));

    const feedback: MentorFeedbackItem[] = (feedbackRaw ?? []).map((f) => {
      const profile = f.innovator_id ? fbMap.get(String(f.innovator_id)) : null;
      return {
        id: String(f.id),
        mentorId,
        innovatorId: (f.innovator_id as string | null) ?? null,
        innovatorName: displayName(
          (profile?.full_name as string | null) ?? null,
          (profile?.email as string | null) ?? 'Anonymous'
        ),
        rating: Number(f.rating ?? 5),
        comment: String(f.comment ?? ''),
        createdAt: String(f.created_at),
      };
    });

    return { data: { assignments, sessions, feedback }, error: null };
  } catch (err) {
    return toServiceError(err, 'FETCH_MENTOR_DETAIL_FAILED');
  }
}

export async function fetchInnovatorsForMatching(): Promise<
  AdminServiceResult<InnovatorMatchProfile[]>
> {
  try {
    await assertAdminPermission('manage_users');
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, organization_name')
      .or('role.eq.innovator,user_type.eq.innovator');

    const ids = (profiles ?? []).map((p) => String(p.id));
    const { data: pipelines } = ids.length
      ? await supabase
          .from('innovator_pipeline')
          .select('user_id, idea_title, category, stage')
          .in('user_id', ids)
      : { data: [] };

    const pipeMap = new Map((pipelines ?? []).map((p) => [String(p.user_id), p]));

    const innovators: InnovatorMatchProfile[] = (profiles ?? []).map((p) => {
      const pipe = pipeMap.get(String(p.id));
      return {
        id: String(p.id),
        name: displayName(p.full_name as string | null, p.email as string | null),
        ideaTitle: String(pipe?.idea_title ?? 'Innovation'),
        category: String(pipe?.category ?? 'General'),
        stage: String(pipe?.stage ?? 'IDEA_SUBMITTED'),
        industry: (p.organization_name as string | null) ?? null,
        country: null,
      };
    });

    return { data: innovators, error: null };
  } catch (err) {
    return toServiceError(err, 'FETCH_INNOVATORS_MATCH_FAILED');
  }
}

export async function computeMentorMatches(mentorId: string): Promise<
  AdminServiceResult<MatchCandidate[]>
> {
  try {
    await assertAdminPermission('manage_users');
    const { data: mentorRow, error } = await supabase
      .from('mentors')
      .select('id, expertise, industry, country')
      .eq('id', mentorId)
      .single();
    if (error) throw error;

    const innovatorsResult = await fetchInnovatorsForMatching();
    if (innovatorsResult.error) throw new Error(innovatorsResult.error.message);

    const mentor: MentorMatchProfile = {
      id: String(mentorRow.id),
      expertise: (mentorRow.expertise as string[]) ?? [],
      industry: (mentorRow.industry as string | null) ?? null,
      country: (mentorRow.country as string | null) ?? null,
    };

    return {
      data: rankMatchCandidates(mentor, innovatorsResult.data ?? []),
      error: null,
    };
  } catch (err) {
    return toServiceError(err, 'COMPUTE_MATCHES_FAILED');
  }
}

export async function assignMentorToInnovator(
  mentorId: string,
  innovatorId: string,
  matchScore: number
): Promise<AdminServiceResult<{ id: string }>> {
  try {
    await assertAdminPermission('manage_users');

    const { data: existing } = await supabase
      .from('mentor_assignments')
      .select('id')
      .eq('mentor_id', mentorId)
      .eq('innovator_id', innovatorId)
      .maybeSingle();

    let id: string;
    if (existing?.id) {
      const { data, error } = await supabase
        .from('mentor_assignments')
        .update({
          match_score: matchScore,
          progress_status: 'active',
          assigned_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id')
        .single();
      if (error) throw error;
      id = String(data.id);
    } else {
      const { data, error } = await supabase
        .from('mentor_assignments')
        .insert({
          mentor_id: mentorId,
          innovator_id: innovatorId,
          match_score: matchScore,
          progress_status: 'active',
        })
        .select('id')
        .single();
      if (error) throw error;
      id = String(data.id);
    }

    await logMentorActivity(mentorId, 'innovator_assigned', { innovatorId, matchScore });
    return { data: { id }, error: null };
  } catch (err) {
    if (isSchemaError(err)) return schemaMissingError(err);
    return toServiceError(err, 'ASSIGN_MENTOR_FAILED');
  }
}

export async function updateMentorStatus(
  mentorId: string,
  status: MentorStatus
): Promise<AdminServiceResult<{ id: string }>> {
  try {
    await assertAdminPermission('manage_users');
    await patchMentor(mentorId, { is_active: status === 'active' });
    await logMentorActivity(mentorId, status === 'active' ? 'mentor_activated' : 'mentor_suspended', {});
    return { data: { id: mentorId }, error: null };
  } catch (err) {
    return toServiceError(err, 'UPDATE_MENTOR_STATUS_FAILED');
  }
}

export async function updateMentorAvailability(
  mentorId: string,
  availability: MentorAvailability
): Promise<AdminServiceResult<{ id: string }>> {
  try {
    await assertAdminPermission('manage_users');
    await patchMentor(mentorId, { availability_status: availability });
    await logMentorActivity(mentorId, 'availability_changed', { availability });
    return { data: { id: mentorId }, error: null };
  } catch (err) {
    if (isSchemaError(err)) return schemaMissingError(err);
    return toServiceError(err, 'UPDATE_AVAILABILITY_FAILED');
  }
}

export async function fetchPendingMatchRequests(): Promise<
  AdminServiceResult<Array<{ id: string; mentorName: string; message: string; requestedDate: string }>>
> {
  try {
    await assertAdminPermission('manage_users');
    const { data, error } = await supabase
      .from('mentorship_requests')
      .select('id, message, requested_date, mentor_id')
      .eq('status', 'pending')
      .order('requested_date', { ascending: false })
      .limit(10);
    if (error) throw error;

    const mentorIds = [...new Set((data ?? []).map((r) => String(r.mentor_id)))];
    const { data: mentors } = mentorIds.length
      ? await supabase.from('mentors').select('id, full_name').in('id', mentorIds)
      : { data: [] };
    const mentorMap = new Map((mentors ?? []).map((m) => [String(m.id), m.full_name]));

    return {
      data: (data ?? []).map((r) => ({
        id: String(r.id),
        mentorName: String(mentorMap.get(String(r.mentor_id)) ?? 'Mentor'),
        message: String(r.message ?? ''),
        requestedDate: String(r.requested_date ?? ''),
      })),
      error: null,
    };
  } catch (err) {
    return toServiceError(err, 'FETCH_PENDING_REQUESTS_FAILED');
  }
}

export async function createMentorSession(
  values: SessionFormValues
): Promise<AdminServiceResult<{ id: string }>> {
  try {
    await assertAdminPermission('manage_users');
    const sessionId = await insertMentorshipSession({
      mentor_id: values.mentorId,
      user_id: values.innovatorId,
      scheduled_at: new Date(values.sessionDate).toISOString(),
      duration_minutes: values.durationMinutes,
      notes: values.notes,
      status: toDbSessionStatus(values.status),
    });

    await patchMentor(values.mentorId, {
      last_session_at: new Date(values.sessionDate).toISOString(),
    });

    await logMentorActivity(values.mentorId, 'session_scheduled', {
      innovatorId: values.innovatorId,
      sessionDate: values.sessionDate,
    });

    return { data: { id: sessionId }, error: null };
  } catch (err) {
    return toServiceError(err, 'CREATE_SESSION_FAILED');
  }
}

export async function fetchRecentMentorActivity(
  limit = 15
): Promise<AdminServiceResult<MentorActivityItem[]>> {
  try {
    await assertAdminPermission('manage_users');
    const { data: logs, error } = await supabase
      .from('mentor_activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;

    const mentorIds = [...new Set((logs ?? []).map((l) => l.mentor_id).filter(Boolean))];
    const { data: mentors } = mentorIds.length
      ? await supabase.from('mentors').select('id, full_name').in('id', mentorIds as string[])
      : { data: [] };
    const mentorMap = new Map((mentors ?? []).map((m) => [String(m.id), m.full_name]));

    return {
      data: (logs ?? []).map((row) => ({
        id: String(row.id),
        mentorId: (row.mentor_id as string | null) ?? null,
        mentorName: row.mentor_id ? String(mentorMap.get(String(row.mentor_id)) ?? 'Mentor') : 'System',
        action: String(row.action),
        metadata: (row.metadata as Record<string, unknown>) ?? {},
        createdAt: String(row.created_at),
      })),
      error: null,
    };
  } catch (err) {
    if (isSchemaError(err)) return { data: [], error: null };
    return toServiceError(err, 'FETCH_ACTIVITY_FAILED');
  }
}

export async function fetchMentorAnalytics(): Promise<AdminServiceResult<MentorAnalyticsData>> {
  try {
    await assertAdminPermission('manage_users');

    const { data: sessions } = await supabase
      .from('mentorship_sessions')
      .select('scheduled_at, mentor_id, status')
      .order('scheduled_at', { ascending: false })
      .limit(500);

    const { data: mentors } = await supabase.from('mentors').select('id, full_name, rating, total_sessions, expertise, is_active');
    const assignmentRows =
      (await safeTableQuery(() =>
        supabase.from('mentor_assignments').select('assigned_at, mentor_id')
      )) ?? [];

    const monthCounts = new Map<string, number>();
    const mentorSessionCounts = new Map<string, number>();

    for (const s of sessions ?? []) {
      const month = String(s.scheduled_at).slice(0, 7);
      monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
      const mid = String(s.mentor_id);
      mentorSessionCounts.set(mid, (mentorSessionCounts.get(mid) ?? 0) + 1);
    }

    const sessionsPerMonth = [...monthCounts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => ({ month, count }));

    const topMentors = (mentors ?? [])
      .map((m) => ({
        name: String(m.full_name),
        sessions: mentorSessionCounts.get(String(m.id)) ?? Number(m.total_sessions ?? 0),
        rating: Number(m.rating ?? 0),
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5);

    const expertiseCounts = new Map<string, number>();
    for (const m of mentors ?? []) {
      for (const exp of (m.expertise as string[]) ?? []) {
        expertiseCounts.set(exp, (expertiseCounts.get(exp) ?? 0) + 1);
      }
    }
    const expertiseCoverage = [...expertiseCounts.entries()]
      .map(([expertise, count]) => ({ expertise, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const activeMentors = (mentors ?? []).filter((m) => m.is_active !== false).length;
    const assignedMentors = new Set(assignmentRows.map((a) => String(a.mentor_id))).size;
    const utilizationRate =
      activeMentors > 0 ? Math.round((assignedMentors / activeMentors) * 100) : 0;

    const activityTrend = sessionsPerMonth.map(({ month, count }) => ({
      month,
      sessions: count,
      assignments: assignmentRows.filter((a) => String(a.assigned_at).startsWith(month)).length,
    }));

    return {
      data: {
        sessionsPerMonth,
        topMentors,
        expertiseCoverage,
        utilizationRate,
        activityTrend,
      },
      error: null,
    };
  } catch (err) {
    return toServiceError(err, 'FETCH_ANALYTICS_FAILED');
  }
}

async function mapAllSessions(rows: Record<string, unknown>[]): Promise<MentorSession[]> {
  const userIds = [...new Set(rows.map((r) => String(r.user_id)))];
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [String(p.id), p]));

  return rows.map((s) => {
    const profile = profileMap.get(String(s.user_id));
    return {
      id: String(s.id),
      mentorId: String(s.mentor_id),
      innovatorId: String(s.user_id),
      innovatorName: displayName(
        (profile?.full_name as string | null) ?? null,
        (profile?.email as string | null) ?? 'Innovator'
      ),
      sessionDate: String(s.scheduled_at),
      durationMinutes: Number(s.duration_minutes ?? 60),
      status: mapSessionStatus(String(s.status)),
      notes: String(s.notes ?? s.feedback ?? ''),
      outcome: String(s.outcome ?? ''),
      rating: (s.rating as number | null) ?? null,
    };
  });
}

export async function fetchAllSessions(): Promise<AdminServiceResult<MentorSession[]>> {
  try {
    await assertAdminPermission('manage_users');
    const { data: rows, error } = await supabase
      .from('mentorship_sessions')
      .select(SESSION_SELECT)
      .order('scheduled_at', { ascending: false })
      .limit(50);
    if (error) {
      if (!isSchemaError(error)) throw error;
      const { data: fallbackRows, error: fallbackError } = await supabase
        .from('mentorship_sessions')
        .select(SESSION_SELECT_MINIMAL)
        .order('scheduled_at', { ascending: false })
        .limit(50);
      if (fallbackError) throw fallbackError;
      return {
        data: await mapAllSessions((fallbackRows ?? []) as Record<string, unknown>[]),
        error: null,
      };
    }

    return {
      data: await mapAllSessions((rows ?? []) as Record<string, unknown>[]),
      error: null,
    };
  } catch (err) {
    return toServiceError(err, 'FETCH_SESSIONS_FAILED');
  }
}
