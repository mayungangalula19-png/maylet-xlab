import type { ProjectResearchSnapshot, ResearchFinding } from '../types/research.types';
import { detectKnowledgeGaps, generateInsights, suggestResearchQuestions } from './mayaResearchAI';

const RISK_KEYWORDS = ['risk', 'blocker', 'failure', 'delay', 'cost', 'regulatory', 'ethical', 'safety'];
const PRIORITY_KEYWORDS = ['urgent', 'critical', 'immediate', 'high priority', 'blocker'];
const OPPORTUNITY_KEYWORDS = ['opportunity', 'breakthrough', 'validated', 'promising', 'strong signal'];

export interface InsightSignal {
  findingId: string;
  title: string;
  signals: ('risk' | 'priority' | 'opportunity')[];
  excerpt: string;
}

export function scanFindings(findings: ResearchFinding[]): InsightSignal[] {
  return findings.map((f) => {
    const text = `${f.title} ${f.content}`.toLowerCase();
    const signals: InsightSignal['signals'] = [];
    if (RISK_KEYWORDS.some((k) => text.includes(k))) signals.push('risk');
    if (PRIORITY_KEYWORDS.some((k) => text.includes(k))) signals.push('priority');
    if (OPPORTUNITY_KEYWORDS.some((k) => text.includes(k))) signals.push('opportunity');
    return {
      findingId: f.id,
      title: f.title,
      signals,
      excerpt: f.content.slice(0, 120),
    };
  });
}

export function computeKnowledgeGrowth(snapshot: ProjectResearchSnapshot): number {
  return snapshot.notes.length + snapshot.literature.length + snapshot.findings.length;
}

export function buildInsightReport(projectName: string, snapshot: ProjectResearchSnapshot) {
  const signals = scanFindings(snapshot.findings);
  const gaps = detectKnowledgeGaps({ projectName, snapshot });
  const insights = generateInsights({ projectName, snapshot });
  const questions = suggestResearchQuestions({ projectName, snapshot });

  return {
    completionRate: snapshot.completionRate,
    knowledgeGrowth: computeKnowledgeGrowth(snapshot),
    documentCount: snapshot.documents.length,
    riskSignals: signals.filter((s) => s.signals.includes('risk')),
    prioritySignals: signals.filter((s) => s.signals.includes('priority')),
    opportunitySignals: signals.filter((s) => s.signals.includes('opportunity')),
    gaps,
    insights,
    questions,
  };
}
