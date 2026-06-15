import type { AgentHandler, AgentInsight, WorkspaceContext } from '../../types/workspace.types.js';

export const projectAgent: AgentHandler = {
  id: 'project',
  async handle(ctx: WorkspaceContext): Promise<AgentInsight[]> {
    if (ctx.event.type !== 'project:updated' && ctx.event.type !== 'workspace:activity') {
      return [];
    }
    return [
      {
        agentId: 'project',
        event: 'agent:recommendation',
        workspaceId: ctx.workspaceId,
        content: 'Review project status and update milestones based on recent workspace activity.',
        confidence: 0.62,
      },
    ];
  },
};
