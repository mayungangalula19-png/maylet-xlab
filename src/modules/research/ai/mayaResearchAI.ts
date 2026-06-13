import { buildResearchContextBlock, RESEARCH_PROMPTS } from './prompts';
import type { ProjectResearchSnapshot } from '../types/research.types';

export interface MayaResearchInput {
  projectName: string;
  snapshot: ProjectResearchSnapshot;
}

export interface MayaResearchOutput {
  summary: string;
  insights: string[];
  knowledgeGaps: string[];
  researchQuestions: string[];
  prompt: string;
  context: string;
}


/** Deterministic local analysis — ready for OpenAI/API swap */
export function summarizeResearch(input: MayaResearchInput): MayaResearchOutput {
  const { snapshot, projectName } = input;
  const context = buildResearchContextBlock({
    projectName,
    problemStatement: snapshot.profile?.problem_statement,
    researchQuestions: snapshot.profile?.research_questions,
    notesCount: snapshot.notes.length,
    literatureCount: snapshot.literature.length,
    findingsCount: snapshot.findings.length,
    documentsCount: snapshot.documents.length,
    recentFindings: snapshot.findings.slice(0, 3).map((f) => ({ title: f.title, content: f.content })),
  });

  const summary = [
    `${projectName} research is ${snapshot.completionRate}% complete.`,
    `${snapshot.notes.length} notes, ${snapshot.literature.length} literature items, ${snapshot.findings.length} findings, ${snapshot.documents.length} documents on record.`,
    snapshot.profile?.problem_statement
      ? `Problem focus: ${snapshot.profile.problem_statement.slice(0, 120)}`
      : 'Problem statement not yet defined.',
  ].join(' ');

  return {
    summary,
    insights: generateInsights(input),
    knowledgeGaps: detectKnowledgeGaps(input),
    researchQuestions: suggestResearchQuestions(input),
    prompt: RESEARCH_PROMPTS.summarize,
    context,
  };
}

export function generateInsights(input: MayaResearchInput): string[] {
  const insights: string[] = [];
  const { snapshot } = input;

  for (const f of snapshot.findings.filter((x) => x.finding_type === 'insight').slice(0, 5)) {
    insights.push(`${f.title}: ${f.content.slice(0, 160)}`);
  }

  if (insights.length === 0 && snapshot.findings.length > 0) {
    insights.push(`Primary finding recorded: ${snapshot.findings[0].title}`);
  }

  if (snapshot.literature.length >= 3) {
    const avgRelevance =
      snapshot.literature
        .filter((l) => l.relevance_score != null)
        .reduce((sum, l) => sum + (l.relevance_score ?? 0), 0) /
      Math.max(1, snapshot.literature.filter((l) => l.relevance_score != null).length);
    if (avgRelevance > 0) {
      insights.push(`Literature relevance average: ${Math.round(avgRelevance)}/100 across recorded sources.`);
    }
  }

  if (insights.length === 0) {
    insights.push('No structured insights yet. Add findings or literature to enable synthesis.');
  }

  return insights;
}

export function detectKnowledgeGaps(input: MayaResearchInput): string[] {
  const gaps: string[] = [];
  const { snapshot } = input;

  if (!snapshot.profile?.problem_statement?.trim()) gaps.push('Problem statement missing');
  if (!snapshot.profile?.target_users?.trim()) gaps.push('Target users not defined');
  if (!snapshot.profile?.research_questions?.trim()) gaps.push('Research questions not documented');
  if (snapshot.literature.length === 0) gaps.push('No literature sources recorded');
  if (snapshot.findings.length === 0) gaps.push('No findings repository entries');
  if (snapshot.documents.length === 0) gaps.push('No supporting documents uploaded');
  if (snapshot.notes.length < 2) gaps.push('Insufficient research notes for triangulation');

  return gaps;
}

export function suggestResearchQuestions(input: MayaResearchInput): string[] {
  const existing = (input.snapshot.profile?.research_questions ?? '')
    .split('\n')
    .map((q) => q.trim())
    .filter(Boolean);

  if (existing.length >= 3) return existing.slice(0, 5);

  const sector = input.projectName;
  const suggested = [
    `What is the root cause of the problem in ${sector}?`,
    'Who are the primary beneficiaries and what outcomes do they need?',
    'What existing solutions fail and why?',
    'What evidence is required before building a prototype?',
    'What metrics will validate research conclusions?',
  ];

  return [...existing, ...suggested].slice(0, 5);
}

/** Format prompt for external LLM API */
export function buildMayaApiPayload(input: MayaResearchInput, task: keyof typeof RESEARCH_PROMPTS) {
  const base = summarizeResearch(input);
  return {
    system: 'MAYA Research Assistant',
    user: `${RESEARCH_PROMPTS[task]}\n\n--- Context ---\n${base.context}`,
  };
}
