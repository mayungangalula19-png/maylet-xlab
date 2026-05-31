import { BaseMayaAgent } from './base.agent';

export class CodeAgent extends BaseMayaAgent {
  readonly role = 'code' as const;
}

export const codeAgent = new CodeAgent();
