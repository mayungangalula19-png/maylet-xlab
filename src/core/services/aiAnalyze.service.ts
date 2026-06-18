import { invokeMayaChat } from '../../lib/maya/mayaChat.service';

export interface AnalysisResult {
  score: number;
  risk_level: 'low' | 'medium' | 'high';
  market_potential: number;
  recommendations: string[];
  competitor_insights: string;
  summary: string;
}

/**
 * Builds the analysis prompt for the AI.
 */
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

/**
 * Parses the AI response, extracting JSON even if wrapped in markdown.
 */
function parseAnalysisJson(raw: string): AnalysisResult {
  const trimmed = raw.trim();
  // Extract JSON from markdown code block if present
  const jsonBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? trimmed;
  const parsed = JSON.parse(jsonBlock) as AnalysisResult;
  // Basic validation
  if (typeof parsed.score !== 'number' || !parsed.summary) {
    throw new Error('AI response was not a valid analysis payload.');
  }
  return parsed;
}

/**
 * Calls the Groq AI via the Maya chat service.
 */
async function analyzeViaGroq(prompt: string): Promise<string> {
  return invokeMayaChat([{ role: 'user', content: prompt }], 'groq');
}

/**
 * Main function – analyzes a startup idea using Groq.
 * Requires VITE_GROQ_API_KEY in the environment.
 */
export async function analyzeIdea(input: {
  ideaName: string;
  description: string;
  targetAudience: string;
  industry: string;
}): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(input);

  // Check for Groq API key
  const hasGroq = Boolean(import.meta.env.VITE_GROQ_API_KEY?.trim());
  if (!hasGroq) {
    throw new Error(
      'Missing VITE_GROQ_API_KEY. Please add your Groq API key to the .env file.'
    );
  }

  let content: string | null = null;
  try {
    content = await analyzeViaGroq(prompt);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Groq analysis failed: ${errorMsg}`);
  }

  if (!content) {
    throw new Error('Analysis failed with no AI response.');
  }

  return parseAnalysisJson(content);
}