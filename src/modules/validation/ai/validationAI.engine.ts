import type {
  ValidationDecision,
  ValidationEvaluationInput,
  ValidationEvaluationResult,
  ValidationMayaInsight,
  ValidationScores,
} from '../types/validation.types';

function clamp(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

function scoreTechnical(evidence: ValidationEvaluationInput['evidence']): number {
  const { prototypes, experiments } = evidence;
  let score = 20;
  if (prototypes.count > 0) score += 15;
  if (prototypes.withBuildCount > 0) score += 20;
  if (prototypes.successCount > 0) score += 25;
  score += prototypes.avgTestPassRate * 20;
  if (experiments.completedCount > 0) score += 10;
  if (experiments.withResultsCount > 0) score += 10;
  return clamp(score);
}

function scoreUser(evidence: ValidationEvaluationInput['evidence']): number {
  const { research, experiments } = evidence;
  let score = 15;
  score += Math.min(25, research.interviewNotesCount * 8);
  score += Math.min(20, research.findingsCount * 5);
  if (experiments.userTypeCount > 0) score += 25;
  score += research.completionPct * 0.15;
  return clamp(score);
}

function scoreMarket(evidence: ValidationEvaluationInput['evidence']): number {
  const { research, experiments } = evidence;
  let score = 10;
  score += Math.min(30, research.literatureCount * 5);
  score += Math.min(20, research.findingsCount * 4);
  if (experiments.marketTypeCount > 0) score += 30;
  score += research.completionPct * 0.1;
  return clamp(score);
}

function scoreFinancial(input: ValidationEvaluationInput): number {
  const { evidence, projectProgress } = input;
  let score = projectProgress * 0.35;
  if (evidence.experiments.completedCount >= 2) score += 20;
  if (evidence.prototypes.successCount > 0) score += 15;
  if (evidence.research.completionPct >= 70) score += 15;
  if (evidence.research.documentsCount > 0) score += 10;
  return clamp(score);
}

function deriveDecision(scores: ValidationScores): ValidationDecision {
  const dims = [scores.technical, scores.user, scores.market, scores.financial];
  const lowCount = dims.filter((d) => d < 40).length;
  const midCount = dims.filter((d) => d >= 40 && d < 60).length;

  if (scores.overall >= 75 && lowCount === 0 && scores.overall >= 50) return 'pass';
  if (scores.overall < 50 || lowCount >= 2) return 'fail';
  if (scores.overall < 75 || midCount >= 2 || lowCount === 1) return 'hold';
  return scores.overall >= 60 ? 'hold' : 'fail';
}

function buildInsights(
  scores: ValidationScores,
  decision: ValidationDecision,
  evidence: ValidationEvaluationInput['evidence']
): ValidationMayaInsight[] {
  const insights: ValidationMayaInsight[] = [];

  if (scores.technical < 60) {
    insights.push({
      id: 'tech',
      title: 'Technical evidence gap',
      detail: 'Strengthen prototype builds and test pass rates before funding.',
      severity: scores.technical < 40 ? 'critical' : 'warning',
    });
  }
  if (scores.user < 60) {
    insights.push({
      id: 'user',
      title: 'User validation incomplete',
      detail: 'Add interview notes, user findings, or user-focused experiments.',
      severity: scores.user < 40 ? 'critical' : 'warning',
    });
  }
  if (scores.market < 60) {
    insights.push({
      id: 'market',
      title: 'Market proof needed',
      detail: 'Expand literature review and run market validation experiments.',
      severity: 'warning',
    });
  }
  if (scores.financial < 60) {
    insights.push({
      id: 'financial',
      title: 'Financial readiness low',
      detail: 'Document unit economics assumptions and complete experiment outcomes.',
      severity: 'warning',
    });
  }
  if (decision === 'pass') {
    insights.push({
      id: 'pass',
      title: 'Funding gate open',
      detail: `${evidence.projectName} meets readiness thresholds. Promote to Funding when ready.`,
      severity: 'info',
    });
  }
  if (insights.length === 0) {
    insights.push({
      id: 'ok',
      title: 'Balanced validation profile',
      detail: 'Review dimension scores and confirm evidence before final decision.',
      severity: 'info',
    });
  }
  return insights;
}

export function evaluateValidation(input: ValidationEvaluationInput): ValidationEvaluationResult {
  const technical = scoreTechnical(input.evidence);
  const user = scoreUser(input.evidence);
  const market = scoreMarket(input.evidence);
  const financial = scoreFinancial(input);
  const overall = clamp(technical * 0.25 + user * 0.25 + market * 0.25 + financial * 0.25);

  const scores: ValidationScores = { technical, user, market, financial, overall };
  const decision = deriveDecision(scores);
  const maya_insights = buildInsights(scores, decision, input.evidence);

  const summary =
    decision === 'pass'
      ? `Overall readiness ${overall}/100 — approved for Funding promotion.`
      : decision === 'hold'
        ? `Overall readiness ${overall}/100 — improve evidence before Funding.`
        : `Overall readiness ${overall}/100 — not viable for Funding at this stage.`;

  return { scores, decision, maya_insights, summary };
}
