import { BaseMayaAgent } from './base.agent';

export class FundingAgent extends BaseMayaAgent {
  readonly role = 'funding' as const;
}

export const fundingAgent = new FundingAgent();
