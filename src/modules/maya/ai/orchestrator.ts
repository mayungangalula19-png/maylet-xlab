import type {
  MayaAgentRole,
  MayaCompletionRequest,
  MayaCompletionResponse,
  MayaModelId,
} from './types';
import { buildMessagesForApi, buildSystemPrompt } from './prompts';
import { detectAgentFromMessage } from './context-builder';
import { invokeMayaChat } from '../../../lib/maya/mayaChat.service';

/**
 * All AI provider calls go through the `maya-chat` Supabase Edge Function.
 * API keys live only on the server (Deno.env) and are never shipped to the
 * browser bundle.
 */
async function callMayaChatFunction(
  messages: { role: string; content: string }[],
  modelId: MayaModelId
): Promise<string> {
  return invokeMayaChat(messages, modelId);
}

function localFallback(agent: MayaAgentRole, message: string, context: MayaCompletionRequest['context']): string {
  const project = context.projectName ? ` for **${context.projectName}**` : '';
  const score = context.scores?.innovation_score;
  return (
    `**MAYA (${agent})** — I'm running in offline mode (AI service unavailable).\n\n` +
    `You asked${project}: "${message.slice(0, 200)}${message.length > 200 ? '…' : ''}"\n\n` +
    (score != null ? `Current innovation score: **${score}%**.\n\n` : '') +
    `**Suggested next steps:**\n` +
    `1. Validate your hypothesis with a structured experiment\n` +
    `2. Document findings in the Innovation Vault\n` +
    `3. Update your project roadmap and funding readiness\n\n` +
    `Deploy the \`maya-chat\` Edge Function and set GROQ_API_KEY in Supabase secrets for full AI responses.`
  );
}

export async function runMayaCompletion(
  request: MayaCompletionRequest
): Promise<MayaCompletionResponse> {
  const agentRole: MayaAgentRole =
    request.agentRole ?? detectAgentFromMessage(request.message);
  const modelId: MayaModelId = request.modelId ?? 'groq';

  const systemPrompt = buildSystemPrompt(agentRole, request.context);
  const messages = buildMessagesForApi(systemPrompt, request.context, request.message);

  let content: string;
  try {
    if (modelId === 'maylet') {
      content = localFallback(agentRole, request.message, request.context);
    } else {
      content = await callMayaChatFunction(messages, modelId);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    content = `⚠️ AI request failed: ${msg}\n\n${localFallback(agentRole, request.message, request.context)}`;
  }

  return {
    content,
    agentRole,
    modelId,
    suggestedActions: [
      'Save to Innovation Vault',
      'Create experiment',
      'Generate pitch outline',
    ],
  };
}
