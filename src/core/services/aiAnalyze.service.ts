import { invokeMayaChat } from '../../lib/maya/mayaChat.service';

export interface AnalysisResult {
  score: number;
  risk_level: 'low' | 'medium' | 'high';
  market_potential: number;
  recommendations: string[];
  competitor_insights: string;
  summary: string;
}

function buildAnalysisPrompt(input: {
  ideaName: string;
  description: string;
  targetAudience: string;
  industry: string;
}): string {
  return `You are an expert innovation advisor. Analyze the following startup idea:

Idea Name: ${input.ideaName}
Description: ${input.description}
Target Audience: ${input.targetAudience || 'Not specified'}
Industry: ${input.industry || 'Not specified'}

Return a JSON object with exactly these fields:
- score (number 0-100)
- risk_level (string: "low", "medium", or "high")
- market_potential (number 0-100)
- recommendations (array of 3-5 strings)
- competitor_insights (string, 1-2 sentences)
- summary (string, 2-3 sentences)

Only output valid JSON. No extra text.`;
}

function parseAnalysisJson(raw: string): AnalysisResult {
  const trimmed = raw.trim();
  const jsonBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? trimmed;
  const parsed = JSON.parse(jsonBlock) as AnalysisResult;
  if (typeof parsed.score !== 'number' || !parsed.summary) {
    throw new Error('AI response was not a valid analysis payload.');
  }
  return parsed;
}

async function analyzeViaOpenRouter(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error('OPENROUTER_KEY_MISSING');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-r1:free',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errData = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(errData.error?.message || `OpenRouter API error (${response.status})`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned no content');
  return content;
}

async function analyzeViaMayaGroq(prompt: string): Promise<string> {
  return invokeMayaChat([{ role: 'user', content: prompt }], 'groq');
}

export async function analyzeIdea(input: {
  ideaName: string;
  description: string;
  targetAudience: string;
  industry: string;
}): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(input);
  const hasOpenRouter = Boolean(import.meta.env.VITE_OPENROUTER_API_KEY?.trim());
  const hasGroq = Boolean(import.meta.env.VITE_GROQ_API_KEY?.trim());

  if (!hasOpenRouter && !hasGroq) {
    throw new Error(
      'No AI provider configured. Add VITE_OPENROUTER_API_KEY or VITE_GROQ_API_KEY to your .env file (see .env.example).'
    );
  }

  let content: string | null = null;
  let lastError: Error | null = null;

  if (hasOpenRouter) {
    try {
      content = await analyzeViaOpenRouter(prompt);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (!hasGroq) throw lastError;
    }
  }

  if (!content && hasGroq) {
    try {
      content = await analyzeViaMayaGroq(prompt);
    } catch (err) {
      const groqErr = err instanceof Error ? err : new Error(String(err));
      if (lastError) {
        throw new Error(`${lastError.message}. Groq fallback also failed: ${groqErr.message}`);
      }
      throw groqErr;
    }
  }

  if (!content) {
    throw lastError ?? new Error('Analysis failed with no AI response.');
  }

  return parseAnalysisJson(content);
}
