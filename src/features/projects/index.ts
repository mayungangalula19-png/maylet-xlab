export * from '../../modules/projects/types';
export { useProjectsDashboard } from '../../modules/projects/hooks/useProjectsDashboard';
export { useAIProjects } from '../../modules/projects/hooks/useAIProjects';
export {
  fetchAccessibleProjects,
  fetchUserProjects,
  listProjects,
  deleteProjectById,
} from '../../modules/projects/services/projectService';
export {
  inviteTeamMember,
  ensureProjectTeam,
  fetchCollaborationStats,
} from '../../modules/projects/services/teamService';
