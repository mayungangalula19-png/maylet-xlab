import { BaseMayaAgent } from './base.agent';

export class DocumentAgent extends BaseMayaAgent {
  readonly role = 'document' as const;
}

export const documentAgent = new DocumentAgent();
