import type { MayaAgentRole } from '../types';
import { chatAgent } from './chat.agent';
import { projectAgent } from './project.agent';
import { experimentAgent } from './experiment.agent';
import { fundingAgent } from './funding.agent';
import { codeAgent } from './code.agent';
import { documentAgent } from './document.agent';
import { BaseMayaAgent } from './base.agent';

const agents: Record<MayaAgentRole, BaseMayaAgent | undefined> = {
  chat: chatAgent,
  project: projectAgent,
  experiment: experimentAgent,
  funding: fundingAgent,
  code: codeAgent,
  document: documentAgent,
  research: undefined,
  team: undefined,
};

export function getMayaAgent(role: MayaAgentRole): BaseMayaAgent {
  return agents[role] ?? chatAgent;
}

export * from './chat.agent';
export * from './project.agent';
export * from './experiment.agent';
export * from './funding.agent';
export * from './code.agent';
export * from './document.agent';
