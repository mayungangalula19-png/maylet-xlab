import type {
  MayaAgentRole,
  MayaCompletionRequest,
  MayaCompletionResponse,
  MayaModelId,
} from './types';
import { buildMessagesForApi, buildSystemPrompt } from './prompts';
import { detectAgentFromMessage } from './context-builder';
import { MAYA_MODELS } from './constants';

async function callGroq(
  messages: { role: string; content: string }[],
  apiKey: string
): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });
  if (!res.ok) throw new Error(`Groq API: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? 'No response from model.';
}

async function callGemini(
  messages: { role: string; content: string }[],
  apiKey: string
): Promise<string> {
  const userContent = messages.filter((m) => m.role !== 'system').map((m) => m.content).join('\n\n');
  const system = messages.find((m) => m.role === 'system')?.content ?? '';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${system}\n\n${userContent}` }] }],
    }),
  });
  if (!res.ok) throw new Error(`Gemini API: ${res.status}`);
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response from Gemini.';
}

async function callOpenAI(
  messages: { role: string; content: string }[],
  apiKey: string
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API: ${res.status}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? 'No response.';
}

function localFallback(agent: MayaAgentRole, message: string, context: MayaCompletionRequest['context']): string {
  const project = context.projectName ? ` for **${context.projectName}**` : '';
  const score = context.scores?.innovation_score;
  return (
    `**MAYA (${agent})** — I'm running in offline mode (no API key configured).\n\n` +
    `You asked${project}: "${message.slice(0, 200)}${message.length > 200 ? '…' : ''}"\n\n` +
    (score != null ? `Current innovation score: **${score}%**.\n\n` : '') +
    `**Suggested next steps:**\n` +
    `1. Validate your hypothesis with a structured experiment\n` +
    `2. Document findings in the Innovation Vault\n` +
    `3. Update your project roadmap and funding readiness\n\n` +
    `Add \`VITE_GROQ_API_KEY\` or use Supabase Edge Function \`maya-chat\` for full AI responses.`
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

  const modelConfig = MAYA_MODELS.find((m) => m.id === modelId);
  const apiKey = modelConfig?.envKey
    ? (import.meta.env[modelConfig.envKey] as string | undefined)
    : undefined;

  let content: string;
  try {
    if (modelId === 'maylet' || !apiKey) {
      content = localFallback(agentRole, request.message, request.context);
    } else if (modelId === 'groq') {
      content = await callGroq(messages, apiKey);
    } else if (modelId === 'gemini') {
      content = await callGemini(messages, apiKey);
    } else if (modelId === 'gpt') {
      content = await callOpenAI(messages, apiKey);
    } else {
      content = localFallback(agentRole, request.message, request.context);
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
