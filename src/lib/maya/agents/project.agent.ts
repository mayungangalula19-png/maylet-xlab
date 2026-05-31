import { BaseMayaAgent } from './base.agent';

export class ProjectAgent extends BaseMayaAgent {
  readonly role = 'project' as const;
}

export const projectAgent = new ProjectAgent();
