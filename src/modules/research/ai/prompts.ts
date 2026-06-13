export const RESEARCH_SYSTEM_PROMPT = `You are MAYA Research Assistant for Maylet XLab.
Focus on literature review, research methodology, knowledge gaps, and actionable next steps.
Only use information provided in context. Do not invent citations or data.`;

export const RESEARCH_PROMPTS = {
  summarize: 'Summarize the current research state for this project. Be concise and factual.',
  literature: 'Generate a structured literature review outline from the provided sources and notes.',
  gaps: 'Identify knowledge gaps before moving to prototype and experiment stages.',
  questions: 'Suggest 5 specific research questions based on problem definition and findings.',
  insights: 'Synthesize insights from findings and notes. Do not invent data.',
  nextSteps: 'Recommend next operational steps to advance from Research to Prototype.',
} as const;

export type ResearchPromptKey = keyof typeof RESEARCH_PROMPTS;

export function buildResearchContextBlock(input: {
  projectName: string;
  problemStatement?: string | null;
  researchQuestions?: string | null;
  notesCount: number;
  literatureCount: number;
  findingsCount: number;
  documentsCount: number;
  recentFindings?: { title: string; content: string }[];
}): string {
  const lines = [
    `Project: ${input.projectName}`,
    input.problemStatement ? `Problem: ${input.problemStatement}` : null,
    input.researchQuestions ? `Questions: ${input.researchQuestions}` : null,
    `Counts — Notes: ${input.notesCount}, Literature: ${input.literatureCount}, Findings: ${input.findingsCount}, Documents: ${input.documentsCount}`,
  ].filter(Boolean) as string[];

  if (input.recentFindings?.length) {
    lines.push('Recent findings:');
    input.recentFindings.forEach((f) => lines.push(`- ${f.title}: ${f.content.slice(0, 200)}`));
  }

  return lines.join('\n');
}
