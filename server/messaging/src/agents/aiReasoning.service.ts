import type { WorkspaceContext } from './types/workspace.types.js';

export interface ReasoningResult {
  summary: string;
  tasks: string[];
  decisions: string[];
  risks: string[];
  insights: string[];
  confidence: number;
}

const TASK_RE = /\b(todo|task|follow up|deadline|assign|ship)\b/i;
const DECISION_RE = /\b(decided|agreed|approved|confirmed)\b/i;
const RISK_RE = /\b(blocker|risk|delay|urgent|stuck|concern)\b/i;

export class AiReasoningService {
  analyze(ctx: WorkspaceContext): ReasoningResult {
    const tasks: string[] = [];
    const decisions: string[] = [];
    const risks: string[] = [];
    const insights: string[] = [];

    for (const msg of ctx.recentMessages) {
      const text = msg.content;
      if (TASK_RE.test(text)) tasks.push(text.slice(0, 120));
      if (DECISION_RE.test(text)) decisions.push(text.slice(0, 120));
      if (RISK_RE.test(text)) risks.push(text.slice(0, 120));
    }

    if (ctx.recentMessages.filter((m) => m.content.includes('?')).length >= 2) {
      insights.push('Multiple open questions detected — schedule a sync.');
    }
    if (tasks.length >= 3) insights.push('High task density — consider workload balancing.');
    if (risks.length) insights.push(`${risks.length} risk signal(s) in recent activity.`);

    const last = ctx.recentMessages[ctx.recentMessages.length - 1];
    const summary = last
      ? `Thread active with ${ctx.recentMessages.length} recent messages. Latest: "${last.content.slice(0, 90)}"`
      : 'No recent messages in context.';

    const signalCount = tasks.length + decisions.length + risks.length;
    const confidence = Math.min(0.95, 0.45 + signalCount * 0.08);

    return {
      summary,
      tasks: [...new Set(tasks)].slice(0, 6),
      decisions: [...new Set(decisions)].slice(0, 5),
      risks: [...new Set(risks)].slice(0, 5),
      insights: insights.length ? insights : ['Workspace activity is stable.'],
      confidence,
    };
  }
}
