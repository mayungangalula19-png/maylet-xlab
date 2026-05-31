import { BaseMayaAgent } from './base.agent';

export class ExperimentAgent extends BaseMayaAgent {
  readonly role = 'experiment' as const;
}

export const experimentAgent = new ExperimentAgent();
