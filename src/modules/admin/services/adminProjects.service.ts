import { supabase } from '../../../lib/supabase/client';
import {
  deleteProjectRelations,
  enrichActivitiesForAdmin,
  fetchTeamMembersForProject,
} from '../../../lib/supabase/dbHelpers';
import {
  normalizeProjectStatus,
  toDbProjectStatus,
  type ProjectStatus,
} from '../../projects/types/commandCenter.types';
import { displayName } from '../utils/adminPage.utils';
import { assertAdminPermission } from './adminAuth.service';
import { logAdminAudit } from './adminAudit.service';
import type {
  AdminListParams,
  AdminProjectActivity,
  AdminProjectDetail,
  AdminProjectDetailBundle,
  AdminProjectDocument,
  AdminProjectFilters,
  AdminProjectRow,
  AdminProjectStats,
  AdminProjectTask,
  AdminProjectTeamMember,
  AdminServiceResult,
} from '../types/projectAdmin.types';

const PROJECT_SELECT =
  'id, name, description, sector, progress, status, user_id, team_size, tasks_completed, tasks_total, created_at, updated_at';

function mapProjectRow(
  row: Record<string, unknown>,
  owner?: { full_name: string | null; email: string | null } | null
): AdminProjectRow {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    description: (row.description as string | null) ?? null,
    sector: (row.sector as string | null) ?? null,
    progress: Number(row.progress ?? 0),
    status: normalizeProjectStatus(String(row.status ?? 'idea')),
    user_id: String(row.user_id ?? ''),
    user_name: displayName(owner?.full_name, owner?.email),
    user_email: owner?.email ?? 'Unknown',
    team_size: Number(row.team_size ?? 1),
    tasks_completed: Number(row.tasks_completed ?? 0),
    tasks_total: Number(row.tasks_total ?? 0),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

function applyProjectFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  filters?: AdminProjectFilters
) {
  let q = query;
  if (filters?.status && filters.status !== 'all') {
    q = q.eq('status', toDbProjectStatus(filters.status));
  }
  if (filters?.sector && filters.sector !== 'All' && filters.sector !== 'all') {
    q = q.eq('sector', filters.sector);
  }
  if (filters?.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    q = q.or(`name.ilike.${term},description.ilike.${term},sector.ilike.${term}`);
  }
  return q;
}

export async function fetchAdminProjectsPage(
  params: AdminListParams
): Promise<AdminServiceResult<AdminProjectRow[]>> {
  try {
    const { page, pageSize, filters } = params;
    const from = page * pageSize;

    let query = supabase
      .from('projects')
      .select(PROJECT_SELECT, { count: 'exact' });

    query = applyProjectFilters(query, filters);

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;

    const rows = data ?? [];
    const ownerIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
    const { data: owners } = ownerIds.length
      ? await supabase.from('profiles').select('id, full_name, email').in('id', ownerIds)
      : { data: [] };
    const ownerMap = new Map((owners ?? []).map((o) => [o.id, o]));

    return {
      data: rows.map((row) => mapProjectRow(row as Record<string, unknown>, ownerMap.get(row.user_id))),
      error: null,
      meta: { total: count ?? 0, page, pageSize },
    };
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'FETCH_PROJECTS_FAILED',
        message: err instanceof Error ? err.message : 'Failed to load projects',
      },
    };
  }
}

export async function fetchAdminProjectStats(): Promise<AdminServiceResult<AdminProjectStats>> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('status, progress, team_size, tasks_total');

    if (error) throw error;

    const rows = data ?? [];
    const total = rows.length;
    const byStatus = { idea: 0, experiment: 0, prototype: 0, launched: 0 };

    for (const row of rows) {
      const status = normalizeProjectStatus(String(row.status ?? 'idea')).toLowerCase();
      if (status in byStatus) {
        byStatus[status as keyof typeof byStatus] += 1;
      }
    }

    const avgProgress =
      total > 0 ? Math.round(rows.reduce((sum, r) => sum + Number(r.progress ?? 0), 0) / total) : 0;

    return {
      data: {
        total,
        byStatus,
        avgProgress,
        totalTeamMembers: rows.reduce((sum, r) => sum + Number(r.team_size ?? 1), 0),
        totalTasks: rows.reduce((sum, r) => sum + Number(r.tasks_total ?? 0), 0),
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'FETCH_STATS_FAILED',
        message: err instanceof Error ? err.message : 'Failed to load project stats',
      },
    };
  }
}

export async function fetchAdminProjectById(id: string): Promise<AdminServiceResult<AdminProjectRow>> {
  try {
    const { data, error } = await supabase.from('projects').select(PROJECT_SELECT).eq('id', id).single();
    if (error) throw error;

    const { data: owner } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', data.user_id)
      .maybeSingle();

    return {
      data: mapProjectRow(data as Record<string, unknown>, owner),
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'FETCH_PROJECT_FAILED',
        message: err instanceof Error ? err.message : 'Project not found',
      },
    };
  }
}

export async function updateAdminProjectStatus(
  id: string,
  status: ProjectStatus,
  projectName: string
): Promise<AdminServiceResult<void>> {
  try {
    await assertAdminPermission('manage_projects');
    const { error } = await supabase
      .from('projects')
      .update({ status: toDbProjectStatus(status), updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    await logAdminAudit({
      resourceType: 'project',
      resourceId: id,
      resourceName: projectName,
      action: 'update',
      projectId: id,
      after: { status },
    });

    return { data: undefined, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'UPDATE_PROJECT_FAILED',
        message: err instanceof Error ? err.message : 'Failed to update project',
      },
    };
  }
}

export async function deleteAdminProject(
  id: string,
  projectName: string
): Promise<AdminServiceResult<void>> {
  try {
    await assertAdminPermission('delete_records');
    await deleteProjectRelations(id);

    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;

    await logAdminAudit({
      resourceType: 'project',
      resourceId: id,
      resourceName: projectName,
      action: 'delete',
      projectId: id,
    });

    return { data: undefined, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'DELETE_PROJECT_FAILED',
        message: err instanceof Error ? err.message : 'Failed to delete project',
      },
    };
  }
}

export async function fetchAdminProjectCounts(id: string) {
  const [experiments, prototypes, pitches] = await Promise.all([
    supabase.from('experiments').select('*', { count: 'exact', head: true }).eq('project_id', id),
    supabase.from('prototypes').select('*', { count: 'exact', head: true }).eq('project_id', id),
    supabase.from('funding_pitches').select('*', { count: 'exact', head: true }).eq('project_id', id),
  ]);

  return {
    experiments: experiments.count ?? 0,
    prototypes: prototypes.count ?? 0,
    fundingPitches: pitches.count ?? 0,
  };
}

function mapProjectDetail(
  row: Record<string, unknown>,
  owner?: { full_name: string | null; email: string | null } | null
): AdminProjectDetail {
  const base = mapProjectRow(row, owner);
  const techStack = row.tech_stack;
  return {
    ...base,
    budget_used: Number(row.budget_used ?? 0),
    budget_total: Number(row.budget_total ?? 0),
    tech_stack: Array.isArray(techStack) ? techStack.map(String) : [],
  };
}

export async function fetchAdminProjectDetail(
  projectId: string
): Promise<AdminServiceResult<AdminProjectDetailBundle>> {
  try {
    const { data: projectRow, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;

    const ownerId = String(projectRow.user_id ?? '');
    const [{ data: owner }, { data: tasksData }, teamRaw, { data: docsData }, { data: activitiesRaw }] =
      await Promise.all([
        ownerId
          ? supabase.from('profiles').select('full_name, email').eq('id', ownerId).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from('tasks')
          .select('id, title, description, status, assigned_to, due_date, created_at')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
        fetchTeamMembersForProject(projectId),
        supabase
          .from('documents')
          .select('id, name, file_url, file_type, size, uploaded_by, created_at')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
        supabase
          .from('activities')
          .select('id, user_id, project_id, type, title, metadata, created_at')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(25),
      ]);

    const assigneeIds = [
      ...new Set((tasksData ?? []).map((t) => t.assigned_to).filter(Boolean) as string[]),
    ];
    const uploaderIds = [
      ...new Set((docsData ?? []).map((d) => d.uploaded_by).filter(Boolean) as string[]),
    ];
    const profileIds = [...new Set([...assigneeIds, ...uploaderIds])];

    const { data: profiles } = profileIds.length
      ? await supabase.from('profiles').select('id, full_name, email').in('id', profileIds)
      : { data: [] };
    const profileMap = new Map(
      (profiles ?? []).map((p) => [
        p.id,
        displayName(p.full_name, p.email),
      ])
    );

    const tasks: AdminProjectTask[] = (tasksData ?? []).map((task) => ({
      id: String(task.id),
      title: String(task.title ?? 'Untitled'),
      description: (task.description as string | null) ?? null,
      status: String(task.status ?? 'todo'),
      assigned_to: (task.assigned_to as string | null) ?? null,
      assigned_to_name: task.assigned_to
        ? profileMap.get(task.assigned_to) ?? 'Unknown'
        : 'Unassigned',
      due_date: (task.due_date as string | null) ?? null,
      created_at: (task.created_at as string | null) ?? null,
    }));

    const teamMembers: AdminProjectTeamMember[] = teamRaw.map((member) => {
      const profile = member.profiles as { full_name?: string; email?: string } | null;
      return {
        id: String(member.id),
        user_id: String(member.user_id),
        role: String(member.role ?? 'member'),
        full_name: displayName(profile?.full_name, profile?.email),
        email: profile?.email ?? '',
        joined_at: (member.joined_at as string | null) ?? null,
      };
    });

    const documents: AdminProjectDocument[] = (docsData ?? []).map((doc) => ({
      id: String(doc.id),
      name: String(doc.name ?? 'Document'),
      file_url: (doc.file_url as string | null) ?? null,
      file_type: (doc.file_type as string | null) ?? null,
      size: Number(doc.size ?? 0),
      uploaded_by: (doc.uploaded_by as string | null) ?? null,
      uploaded_by_name: doc.uploaded_by
        ? profileMap.get(doc.uploaded_by) ?? 'Unknown'
        : 'Unknown',
      created_at: (doc.created_at as string | null) ?? null,
    }));

    const activities: AdminProjectActivity[] = await enrichActivitiesForAdmin(
      (activitiesRaw ?? []) as Record<string, unknown>[]
    );

    return {
      data: {
        project: mapProjectDetail(projectRow as Record<string, unknown>, owner),
        tasks,
        teamMembers,
        documents,
        activities,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: {
        code: 'FETCH_PROJECT_DETAIL_FAILED',
        message: err instanceof Error ? err.message : 'Failed to load project',
      },
    };
  }
}
