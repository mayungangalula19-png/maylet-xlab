import type { MayaAgentRole, MayaCompletionRequest, MayaCompletionResponse } from '../types';
import { runMayaCompletion } from '../orchestrator';

export abstract class BaseMayaAgent {
  abstract readonly role: MayaAgentRole;

  async run(request: Omit<MayaCompletionRequest, 'agentRole'>): Promise<MayaCompletionResponse> {
    return runMayaCompletion({ ...request, agentRole: this.role });
  }
}
