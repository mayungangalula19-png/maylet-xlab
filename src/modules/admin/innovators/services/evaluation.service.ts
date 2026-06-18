import type {
  InnovatorStage,
  ReviewDecision,
} from '../types/innovatorOps.types';
import { computeFinalScore } from '../types/innovatorOps.types';

export interface ReviewScoreInput {
  impactScore: number;
  feasibilityScore: number;
  marketScore: number;
}

export function averageReviewScores(
  reviews: ReviewScoreInput[]
): { impact: number; feasibility: number; market: number; final: number } {
  if (reviews.length === 0) {
    return { impact: 0, feasibility: 0, market: 0, final: 0 };
  }
  const impact = Math.round(
    reviews.reduce((s, r) => s + r.impactScore, 0) / reviews.length
  );
  const feasibility = Math.round(
    reviews.reduce((s, r) => s + r.feasibilityScore, 0) / reviews.length
  );
  const market = Math.round(
    reviews.reduce((s, r) => s + r.marketScore, 0) / reviews.length
  );
  return {
    impact,
    feasibility,
    market,
    final: computeFinalScore(impact, feasibility, market),
  };
}

export function stageFromDecision(decision: ReviewDecision): InnovatorStage | null {
  switch (decision) {
    case 'approve':
      return 'APPROVED';
    case 'reject':
      return 'REJECTED';
    case 'request_revision':
      return 'IDEA_SUBMITTED';
    default:
      return null;
  }
}

export function priorityFromScore(finalScore: number): 'low' | 'medium' | 'high' | 'critical' {
  if (finalScore >= 85) return 'critical';
  if (finalScore >= 70) return 'high';
  if (finalScore >= 45) return 'medium';
  return 'low';
}
