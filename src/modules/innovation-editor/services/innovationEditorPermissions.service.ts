import { supabase } from '../../../lib/supabase/client';
import { fetchTeamMembersForProject } from '../../../lib/supabase/dbHelpers';
import { hasAdminPermission } from '../../admin/config/adminRbac.config';
import type { InnovationEntityType } from '../types/innovationEditor.types';

export async function resolveInnovationProjectId(
  entityType: InnovationEntityType,
  entityId: string
): Promise<string | null> {
  switch (entityType) {
    case 'research':
    case 'commercialization':
      return entityId;
    case 'experiment': {
      const { data } = await supabase
        .from('experiments')
        .select('project_id')
        .eq('id', entityId)
        .maybeSingle();
      return data?.project_id ? String(data.project_id) : null;
    }
    case 'prototype':
    case 'testing': {
      const { data } = await supabase
        .from('prototypes')
        .select('project_id')
        .eq('id', entityId)
        .maybeSingle();
      return data?.project_id ? String(data.project_id) : null;
    }
    case 'validation': {
      const { data } = await supabase
        .from('validations')
        .select('project_id')
        .eq('id', entityId)
        .maybeSingle();
      return data?.project_id ? String(data.project_id) : null;
    }
    case 'funding': {
      const { data } = await supabase
        .from('funding_pitches')
        .select('project_id')
        .eq('id', entityId)
        .maybeSingle();
      return data?.project_id ? String(data.project_id) : null;
    }
    default:
      return null;
  }
}

async function hasProjectAccess(userId: string, projectId: string): Promise<boolean> {
  const { data: project } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', projectId)
    .maybeSingle();

  if (!project) return false;
  if (String(project.user_id) === userId) return true;

  const members = await fetchTeamMembersForProject(projectId);
  return members.some((member) => member.user_id === userId);
}

export async function canUserEditInnovationEntity(options: {
  userId: string;
  userRole: string | null;
  entityType: InnovationEntityType;
  entityId: string;
  isAdminContext?: boolean;
}): Promise<{ allowed: boolean; reason?: string }> {
  if (options.isAdminContext) {
    if (hasAdminPermission(options.userRole, 'manage_projects')) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Admin manage_projects permission required.' };
  }

  const { userId, entityType, entityId } = options;

  switch (entityType) {
    case 'research':
    case 'commercialization': {
      const allowed = await hasProjectAccess(userId, entityId);
      return allowed
        ? { allowed: true }
        : { allowed: false, reason: 'You do not have access to this project.' };
    }
    case 'experiment': {
      const { data } = await supabase
        .from('experiments')
        .select('user_id, project_id')
        .eq('id', entityId)
        .maybeSingle();
      if (!data) return { allowed: false, reason: 'Experiment not found.' };
      if (String(data.user_id) === userId) return { allowed: true };
      if (data.project_id && (await hasProjectAccess(userId, String(data.project_id)))) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'You do not own this experiment.' };
    }
    case 'prototype':
    case 'testing': {
      const { data } = await supabase
        .from('prototypes')
        .select('user_id, project_id')
        .eq('id', entityId)
        .maybeSingle();
      if (!data) return { allowed: false, reason: 'Prototype not found.' };
      if (String(data.user_id) === userId) return { allowed: true };
      if (data.project_id && (await hasProjectAccess(userId, String(data.project_id)))) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'You do not own this prototype.' };
    }
    case 'validation': {
      const { data } = await supabase
        .from('validations')
        .select('user_id, project_id')
        .eq('id', entityId)
        .maybeSingle();
      if (!data) return { allowed: false, reason: 'Validation not found.' };
      if (String(data.user_id) === userId) return { allowed: true };
      if (data.project_id && (await hasProjectAccess(userId, String(data.project_id)))) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'You do not own this validation.' };
    }
    case 'funding': {
      const { data } = await supabase
        .from('funding_pitches')
        .select('user_id, project_id')
        .eq('id', entityId)
        .maybeSingle();
      if (!data) return { allowed: false, reason: 'Funding pitch not found.' };
      if (String(data.user_id) === userId) return { allowed: true };
      if (data.project_id && (await hasProjectAccess(userId, String(data.project_id)))) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'You do not own this funding pitch.' };
    }
    default:
      return { allowed: false, reason: 'Unknown entity type.' };
  }
}
