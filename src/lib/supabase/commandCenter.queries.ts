import { supabase } from './client';
import { fetchOwnedTeamIds } from './dbHelpers';
import { dedupeAsync, getCached, setCached } from '../utils/queryCache';
import type { Project } from '../../types/project.types';
import {
  computeInnovationStageCounts,
  getInnovationStage,
  type InnovationStage,
} from '../innovation/lifecycle';

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  created_at: string;
  project_id?: string;
}

export interface DocumentPreview {
  id: string;
  name: string;
  file_type: string | null;
  created_at: string;
  project_id: string;
}

export interface TeamMemberPreview {
  id: string;
  name: string;
  role: string;
}

export interface FundingPitchPreview {
  id: string;
  title: string;
  status: string | null;
  created_at: string;
}

export interface VaultSummary {
  vaultEntries: number;
  vaultItems: number;
  protectedIdeas: number;
  /** @deprecated use vaultEntries + vaultItems */
  ownershipRecords?: number;
  /** @deprecated not computed from DB */
  patentCandidates?: number;
}

export interface ResearchStatus {
  totalDocuments: number;
  researchTaggedCount: number;
  recentDocuments: DocumentPreview[];
}

export interface ExperimentStatus {
  total: number;
  running: number;
  completed: number;
}

export interface FundingStatus {
  totalPitches: number;
  recentPitches: FundingPitchPreview[];
}

export interface TeamStatus {
  memberCount: number;
  members: TeamMemberPreview[];
  pendingInvitations: number;
}

export interface RealDashboardSnapshot {
  projectCount: number;
  stageCounts: Record<InnovationStage, number>;
  research: ResearchStatus;
  experiments: ExperimentStatus;
  funding: FundingStatus;
  team: TeamStatus;
  vault: VaultSummary;
  timeline: TimelineEvent[];
}

/** Legacy type for older widgets */
export interface CommandCenterMetrics {
  activeResearch: number;
  runningExperiments: number;
  validatedInnovations: number;
  fundingOpportunities: number;
  teamMembers: number;
  documentsUploaded: number;
  prototypes: number;
  commercialized: number;
  totalExperiments: number;
}

/** Legacy — funding catalog removed; pitches come from DB */
export interface FundingMatch {
  id: string;
  title: string;
  type: string;
  matchScore: number;
  description: string;
  /** @deprecated synthetic catalog field */
  eligibility?: string;
  /** @deprecated synthetic catalog field */
  fundingAmount?: string;
  /** @deprecated synthetic catalog field */
  deadline?: string;
}

/** Legacy */
export interface KnowledgeOverview {
  researchPapers: number;
  researchNotes: number;
  literatureReviews: number;
  uploadedDocuments: number;
  knowledgeBaseGrowth: number;
  recentItems: DocumentPreview[];
}
async function safeQuery<T>(
  fn: () => PromiseLike<{ data: T | null; error: { message?: string } | null }>,
  fallback: T,
  label?: string
): Promise<T> {
  try {
    const { data, error } = await fn();
    if (error) {
      if (label) console.warn(`[commandCenter] ${label}:`, error.message ?? error);
      return fallback;
    }
    return data ?? fallback;
  } catch (err) {
    console.warn('[commandCenter]', label ?? 'query', err);
    return fallback;
  }
}

const RUNNING_STATUSES = new Set(['running', 'active', 'in_progress']);
const COMPLETED_STATUSES = new Set(['completed', 'done', 'finished', 'launched']);

export async function fetchRealDashboardSnapshot(
  userId: string,
  projects: Project[]
): Promise<RealDashboardSnapshot> {
  const projectKey = projects.map((p) => p.id).sort().join(',');
  const cacheKey = `commandCenter:${userId}:${projectKey}`;

  const cached = getCached<RealDashboardSnapshot>(cacheKey);
  if (cached) return cached;

  return dedupeAsync(cacheKey, async () => {
    const snapshot = await fetchRealDashboardSnapshotUncached(userId, projects);
    setCached(cacheKey, snapshot, 30_000);
    return snapshot;
  });
}

async function fetchRealDashboardSnapshotUncached(
  userId: string,
  projects: Project[]
): Promise<RealDashboardSnapshot> {
  const [experiments, documents, ownedTeamIds, vaultEntries, vaultItems, fundingPitches, timeline] =
    await Promise.all([
      safeQuery(
        () => supabase.from('experiments').select('id, status').eq('user_id', userId),
        [] as { id: string; status: string | null }[],
        'experiments'
      ),
      safeQuery(
        () =>
          supabase
            .from('documents')
            .select('id, name, file_type, created_at, project_id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
        [] as DocumentPreview[],
        'documents'
      ),
      fetchOwnedTeamIds(userId),
      safeQuery(
        () => supabase.from('vault_entries').select('id').eq('user_id', userId),
        [] as { id: string }[],
        'vault_entries'
      ),
      safeQuery(
        () => supabase.from('vault_items').select('id').eq('user_id', userId),
        [] as { id: string }[],
        'vault_items'
      ),
      safeQuery(
        () =>
          supabase
            .from('funding_pitches')
            .select('id, title, status, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5),
        [] as FundingPitchPreview[],
        'funding_pitches'
      ),
      fetchActivityTimeline(userId, projects),
    ]);

  const members: TeamMemberPreview[] = [];

  const researchTaggedCount = documents.filter((d) =>
    /paper|journal|publication|note|research|finding|literature|review|survey|proposal/i.test(d.name)
  ).length;

  const running = experiments.filter((e) => e.status && RUNNING_STATUSES.has(e.status.toLowerCase())).length;
  const completed = experiments.filter((e) => e.status && COMPLETED_STATUSES.has(e.status.toLowerCase())).length;

  return {
    projectCount: projects.length,
    stageCounts: computeInnovationStageCounts(projects),
    research: {
      totalDocuments: documents.length,
      researchTaggedCount,
      recentDocuments: documents.slice(0, 6),
    },
    experiments: {
      total: experiments.length,
      running,
      completed,
    },
    funding: {
      totalPitches: fundingPitches.length,
      recentPitches: fundingPitches,
    },
    team: {
      memberCount: ownedTeamIds.length,
      members,
      pendingInvitations: 0,
    },
    vault: {
      vaultEntries: vaultEntries.length,
      vaultItems: vaultItems.length,
      protectedIdeas: vaultEntries.length,
      ownershipRecords: vaultEntries.length + vaultItems.length,
      patentCandidates: 0,
    },
    timeline,
  };
}

export async function fetchActivityTimeline(
  _userId: string,
  projects: Project[],
  limit = 8
): Promise<TimelineEvent[]> {
  const data = await safeQuery(
    () =>
      supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(limit),
    [] as Record<string, unknown>[]
  );

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  return data.map((row: Record<string, unknown>) => {
    const meta = (row.metadata as Record<string, string>) ?? {};
    const projectId = row.project_id as string | undefined;
    const projectName =
      meta.project_name ??
      (projectId ? projectMap.get(projectId) : undefined) ??
      (row.target_name as string) ??
      'Innovation project';

    return {
      id: row.id as string,
      type: (row.type as string) ?? (row.target_type as string) ?? 'activity',
      title: (row.title as string) ?? (row.action as string) ?? 'Activity recorded',
      subtitle: projectName,
      created_at: row.created_at as string,
      project_id: projectId,
    };
  });
}

/** @deprecated Use fetchRealDashboardSnapshot */
export async function fetchCommandCenterMetrics(userId: string, projects: Project[]) {
  const snap = await fetchRealDashboardSnapshot(userId, projects);
  const researchProjects = projects.filter((p) => getInnovationStage(p) === 'Research').length;
  return {
    activeResearch: researchProjects,
    runningExperiments: snap.experiments.running,
    validatedInnovations: projects.filter((p) => {
      const s = getInnovationStage(p);
      return s === 'Validation' || s === 'Funding' || s === 'Commercialization';
    }).length,
    fundingOpportunities: snap.funding.totalPitches,
    teamMembers: snap.team.memberCount,
    documentsUploaded: snap.research.totalDocuments,
    prototypes: projects.filter((p) => {
      const s = getInnovationStage(p);
      return s === 'Prototype' || s === 'Experiment';
    }).length,
    commercialized: projects.filter(
      (p) => getInnovationStage(p) === 'Commercialization' || p.status === 'Launched'
    ).length,
    totalExperiments: snap.experiments.total,
  };
}

export async function fetchRecentDocuments(userId: string, limit = 6) {
  const snap = await fetchRealDashboardSnapshot(userId, []);
  return snap.research.recentDocuments.slice(0, limit);
}

export async function fetchTeamOverview(userId: string) {
  const snap = await fetchRealDashboardSnapshot(userId, []);
  return {
    members: snap.team.members,
    pendingInvitations: snap.team.pendingInvitations,
    collaborationStatus:
      snap.team.memberCount > 0 ? `${snap.team.memberCount} members` : 'No team data yet',
  };
}

export async function fetchVaultSummary(userId: string): Promise<VaultSummary> {
  const snap = await fetchRealDashboardSnapshot(userId, []);
  return snap.vault;
}
