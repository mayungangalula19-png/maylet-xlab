import type {
  FindingType,
  LiteratureType,
  ProjectResearchSnapshot,
  ResearchDashboardStats,
  ResearchDocument,
  ResearchFinding,
  ResearchNote,
  ResearchProfile,
  LiteratureItem,
} from '../../types/research.types';

export function computeProjectCompletion(snapshot: {
  profile: ResearchProfile | null;
  notes: ResearchNote[];
  literature: LiteratureItem[];
  findings: ResearchFinding[];
  documents: ResearchDocument[];
}): number {
  const checks = [
    Boolean(snapshot.profile?.problem_statement?.trim()),
    Boolean(snapshot.profile?.target_users?.trim()),
    Boolean(snapshot.profile?.pain_points?.trim()),
    Boolean(snapshot.profile?.research_questions?.trim()),
    snapshot.notes.length > 0,
    snapshot.literature.length > 0,
    snapshot.findings.length > 0,
    snapshot.documents.length > 0,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export function buildDashboardStats(
  projectCount: number,
  notes: ResearchNote[],
  literature: LiteratureItem[],
  documents: ResearchDocument[],
  snapshots: ProjectResearchSnapshot[]
): ResearchDashboardStats {
  const papers = literature.filter((l) => l.item_type === 'paper' || l.item_type === 'journal').length;
  const literatureReviews = literature.filter((l) => l.item_type === 'reference' || l.notes?.trim()).length;
  const knowledgeAssets = notes.length + literature.length + documents.length;

  const completionRate =
    snapshots.length > 0
      ? Math.round(snapshots.reduce((sum, s) => sum + s.completionRate, 0) / snapshots.length)
      : 0;

  return {
    researchProjects: projectCount,
    notes: notes.length,
    literatureReviews,
    papers,
    documents: documents.length,
    knowledgeAssets,
    completionRate,
  };
}

export function buildMayaResearchContext(
  projectName: string,
  snapshot: ProjectResearchSnapshot
): string {
  const lines = [`Project: ${projectName}`];
  if (snapshot.profile?.problem_statement) lines.push(`Problem: ${snapshot.profile.problem_statement}`);
  if (snapshot.profile?.research_questions) lines.push(`Questions: ${snapshot.profile.research_questions}`);
  lines.push(`Notes: ${snapshot.notes.length}, Literature: ${snapshot.literature.length}, Findings: ${snapshot.findings.length}, Documents: ${snapshot.documents.length}`);
  if (snapshot.findings.length > 0) {
    lines.push('Recent findings:');
    snapshot.findings.slice(0, 3).forEach((f) => lines.push(`- ${f.title}: ${f.content.slice(0, 120)}`));
  }
  return lines.join('\n');
}

export const MAYA_RESEARCH_PROMPTS = [
  { id: 'summarize', label: 'Summarize research', prompt: 'Summarize the current research state for this project based on the context provided. Be concise and factual.' },
  { id: 'literature', label: 'Literature review outline', prompt: 'Generate a structured literature review outline based on the literature items and notes in context.' },
  { id: 'gaps', label: 'Identify knowledge gaps', prompt: 'Identify knowledge gaps in the research. List what is missing before moving to prototype and experiment.' },
  { id: 'questions', label: 'Suggest research questions', prompt: 'Suggest 5 specific research questions based on the problem definition and existing findings.' },
  { id: 'insights', label: 'Generate insights', prompt: 'Synthesize insights from the findings and notes. Do not invent data not in context.' },
  { id: 'next', label: 'Recommend next steps', prompt: 'Recommend the next operational steps to advance from Research to Prototype stage.' },
] as const;

export type { LiteratureType, FindingType };
