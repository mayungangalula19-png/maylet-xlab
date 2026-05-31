import type { InnovationScores } from './types';

export interface ScoreInput {
  title: string;
  description?: string;
  stage?: string;
  hasTeam?: boolean;
  hasExperiment?: boolean;
  hasPrototype?: boolean;
  hasFundingPitch?: boolean;
}

/**
 * Heuristic innovation scoring (replace with ML model in Predictive Engine phase).
 */
export function calculateInnovationScores(input: ScoreInput): InnovationScores {
  const text = `${input.title} ${input.description || ''}`.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  let market = 35 + Math.min(wordCount * 2, 30);
  let technical = 40;
  let funding = 25;

  if (input.hasExperiment) technical += 15;
  if (input.hasPrototype) technical += 20;
  if (input.hasTeam) {
    market += 10;
    technical += 5;
  }
  if (input.hasFundingPitch) funding += 25;

  const stageBoost: Record<string, number> = {
    idea: 0,
    experiment: 8,
    prototype: 15,
    project: 20,
    funding: 25,
    business: 30,
  };
  const boost = stageBoost[input.stage || 'idea'] ?? 0;
  market += boost;
  funding += Math.floor(boost / 2);

  if (/ai|ml|software|app|platform|saas/.test(text)) technical += 10;
  if (/solar|health|fintech|agri|education|climate/.test(text)) market += 12;

  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const market_potential = clamp(market);
  const technical_feasibility = clamp(technical);
  const funding_readiness = clamp(funding);
  const innovation_score = clamp(
    (market_potential + technical_feasibility + funding_readiness) / 3
  );

  return {
    innovation_score,
    market_potential,
    technical_feasibility,
    funding_readiness,
  };
}
