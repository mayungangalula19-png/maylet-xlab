import { calculateInnovationScores } from '../maya/scoring';

/** @deprecated Prefer `src/lib/maya/scoring` and `maya.service` */
export const analyzeIdea = async (idea: string): Promise<{
  score: number;
  feedback: string;
  scores: ReturnType<typeof calculateInnovationScores>;
}> => {
  const scores = calculateInnovationScores({ title: idea, description: idea, stage: 'idea' });
  return {
    score: scores.innovation_score,
    scores,
    feedback: `Innovation analysis for "${idea}": market ${scores.market_potential}%, technical ${scores.technical_feasibility}%, funding ${scores.funding_readiness}%.`,
  };
};
