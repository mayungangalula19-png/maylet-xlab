import { BaseMayaAgent } from './base.agent';

export class ChatAgent extends BaseMayaAgent {
  readonly role = 'chat' as const;
}

export const chatAgent = new ChatAgent();
