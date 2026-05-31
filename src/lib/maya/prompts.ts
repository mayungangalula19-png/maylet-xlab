import type { MayaAgentRole, MayaContext } from './types';
import { MAYA_APP_NAME } from './constants';

const BASE_SYSTEM = `You are ${MAYA_APP_NAME}, the Intelligent Innovation Co-Pilot for Maylet XLab (InnoOS).
You guide innovators through: Idea → Analysis → Experiment → Prototype → Project → Funding → Business.
Be proactive, specific, and actionable. Reference the user's project context when provided.
Never claim to have done database actions you did not perform.`;

const AGENT_INSTRUCTIONS: Record<MayaAgentRole, string> = {
  chat: 'General innovation coaching and navigation across the XLab workspace.',
  project: 'Focus on roadmaps, tasks, milestones, risks, and project execution.',
  experiment: 'Focus on hypotheses, experiment design, data interpretation, and next steps.',
  research: 'Focus on literature review, citations, and research methodology.',
  code: 'Generate production-quality React/TypeScript code aligned with the project stack.',
  document: 'Draft proposals, pitch decks, SOPs, and business documents.',
  funding: 'Advise on grants, investors, pitch readiness, and financial narratives.',
  team: 'Advise on team structure, roles, backlogs, and collaboration.',
};

export function buildSystemPrompt(agent: MayaAgentRole, context: MayaContext): string {
  const parts = [
    BASE_SYSTEM,
    `Active agent mode: ${agent}. ${AGENT_INSTRUCTIONS[agent]}`,
  ];

  if (context.userName) parts.push(`User: ${context.userName}`);
  if (context.userType) parts.push(`User type: ${context.userType}`);
  if (context.projectName) {
    parts.push(
      `Active project: "${context.projectName}"` +
        (context.projectProgress != null ? ` (${context.projectProgress}% progress)` : '') +
        (context.projectStage ? `, stage: ${context.projectStage}` : '')
    );
  }

  if (context.scores) {
    parts.push(
      `Innovation scores — Overall: ${context.scores.innovation_score}%, ` +
        `Market: ${context.scores.market_potential}%, ` +
        `Technical: ${context.scores.technical_feasibility}%, ` +
        `Funding readiness: ${context.scores.funding_readiness}%`
    );
  }

  if (context.memories.length > 0) {
    parts.push('\n--- Relevant memory ---');
    context.memories.slice(0, 8).forEach((m) => {
      parts.push(`[${m.memory_type}] ${m.title || 'Context'}: ${m.content.slice(0, 500)}`);
    });
  }

  return parts.join('\n');
}

export function buildMessagesForApi(
  systemPrompt: string,
  context: MayaContext,
  userMessage: string
): { role: string; content: string }[] {
  const history = context.recentMessages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content }));

  return [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ];
}
