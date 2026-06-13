import { computeProjectCompletion } from '../../../lib/research/utils';
import type { ProjectResearchSnapshot } from '../types/research.types';
import type { GateCheckItem, GateDecision, GateEvaluation } from '../types/gate.types';

function check(id: string, label: string, pass: boolean, detail?: string, auto = true): GateCheckItem {
  return { id, label, status: pass ? 'pass' : 'fail', detail, auto };
}

function pending(id: string, label: string, detail?: string): GateCheckItem {
  return { id, label, status: 'pending', detail, auto: false };
}

export function evaluateGate(snapshot: ProjectResearchSnapshot): GateEvaluation {
  const p = snapshot.profile;
  const interviewNotes = snapshot.notes.filter((n) => n.category === 'interview' || n.category === 'fieldwork');
  const hasConclusion = snapshot.findings.some((f) => f.finding_type === 'conclusion' || f.finding_type === 'insight');
  const avgRelevance =
    snapshot.literature.length > 0
      ? snapshot.literature.reduce((s, l) => s + (l.relevance_score ?? 0), 0) / snapshot.literature.length
      : 0;

  const sectionA: GateCheckItem[] = [
    check('A1', 'Problem statement', Boolean(p?.problem_statement?.trim())),
    check('A2', 'Target users', Boolean(p?.target_users?.trim())),
    check('A3', 'Pain points', Boolean(p?.pain_points?.trim())),
    check('A4', 'Research questions', Boolean(p?.research_questions?.trim())),
    check('A5', 'Research notes recorded', snapshot.notes.length > 0, `${snapshot.notes.length} notes`),
    check('A6', 'Literature sources recorded', snapshot.literature.length > 0, `${snapshot.literature.length} sources`),
    check('A7', 'Findings documented', snapshot.findings.length > 0, `${snapshot.findings.length} findings`),
    check('A8', 'Evidence documents uploaded', snapshot.documents.length > 0, `${snapshot.documents.length} files`),
  ];

  const sectionB: GateCheckItem[] = [
    check('B1', 'User evidence (≥3 interview/fieldwork notes)', interviewNotes.length >= 3, `${interviewNotes.length} notes`),
    check('B2', 'Existing solutions analyzed', Boolean(p?.existing_solutions?.trim())),
    check('B3', 'Findings evidence-linked', snapshot.findings.length >= 1),
    check('B4', 'Insight or conclusion recorded', hasConclusion),
    check('B5', 'Literature depth (≥3 sources)', snapshot.literature.length >= 3),
    check('B6', 'Literature relevance (avg ≥50)', snapshot.literature.length === 0 ? false : avgRelevance >= 50, `avg ${Math.round(avgRelevance)}`),
    check('B7', 'Problem + questions alignment', Boolean(p?.problem_statement?.trim() && p?.research_questions?.trim())),
    check('B8', 'Document evidence attached', snapshot.documents.length >= 1),
  ];

  const sectionC: GateCheckItem[] = [
    pending('C1', 'Problem validated as real'),
    pending('C2', 'User segment clearly defined'),
    pending('C3', 'Solution gap documented'),
    pending('C4', 'Primary prototype direction chosen'),
    pending('C5', 'Critical unknowns acceptable or deferred'),
    pending('C6', 'V1 scope realistic for team/resources'),
    pending('C7', 'Prototype will test core hypothesis'),
    pending('C8', 'Research supports stage transition'),
  ];

  const systemCompletion = computeProjectCompletion(snapshot);
  const aFails = sectionA.filter((c) => c.status === 'fail').length;
  const bFails = sectionB.filter((c) => c.status === 'fail').length;
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (systemCompletion < 100) blockers.push(`System evidence incomplete (${systemCompletion}% — need 100%)`);
  if (!hasConclusion) warnings.push('No insight or conclusion finding recorded');
  if (interviewNotes.length < 3) warnings.push('Fewer than 3 interview/fieldwork notes');
  if (snapshot.literature.length < 8) warnings.push('Professional target: ≥8 literature sources');

  let recommendedDecision: GateDecision = 'hold';
  if (systemCompletion === 100 && bFails <= 1 && aFails === 0) {
    recommendedDecision = bFails === 0 && hasConclusion ? 'go' : 'conditional_go';
  } else if (aFails >= 4) {
    recommendedDecision = 'hold';
  }

  const prototypeAuthorized = recommendedDecision === 'go' || recommendedDecision === 'conditional_go';

  return {
    systemCompletion,
    sectionA,
    sectionB,
    sectionC,
    recommendedDecision,
    blockers,
    warnings,
    prototypeAuthorized,
  };
}

export function canAuthorizePrototype(decision: GateDecision): boolean {
  return decision === 'go' || decision === 'conditional_go';
}
