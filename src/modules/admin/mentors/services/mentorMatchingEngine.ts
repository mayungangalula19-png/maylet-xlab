import type { MatchCandidate, MatchTier } from '../types/mentorOps.types';
import { matchTier } from '../types/mentorOps.types';

export interface InnovatorMatchProfile {
  id: string;
  name: string;
  ideaTitle: string;
  category: string;
  stage: string;
  industry: string | null;
  country: string | null;
}

export interface MentorMatchProfile {
  id: string;
  expertise: string[];
  industry: string | null;
  country: string | null;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function overlapScore(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b.map(normalize));
  let hits = 0;
  for (const item of a) {
    const n = normalize(item);
    if (setB.has(n)) hits += 1;
    else {
      for (const bItem of setB) {
        if (n.includes(bItem) || bItem.includes(n)) {
          hits += 0.5;
          break;
        }
      }
    }
  }
  return Math.min(100, Math.round((hits / Math.max(a.length, 1)) * 100));
}

function categoryExpertiseScore(category: string, expertise: string[]): number {
  const cat = normalize(category);
  if (!cat || expertise.length === 0) return 0;
  for (const exp of expertise) {
    const e = normalize(exp);
    if (cat.includes(e) || e.includes(cat)) return 100;
    if (
      (cat.includes('health') && e.includes('health')) ||
      (cat.includes('fin') && e.includes('fin')) ||
      (cat.includes('agri') && e.includes('agri')) ||
      (cat.includes('ai') && (e.includes('ai') || e.includes('ml')))
    ) {
      return 85;
    }
  }
  return 20;
}

function stageScore(stage: string): number {
  switch (stage) {
    case 'IDEA_SUBMITTED':
      return 60;
    case 'SCREENING':
      return 70;
    case 'TECH_REVIEW':
      return 85;
    case 'BUSINESS_REVIEW':
      return 90;
    case 'APPROVED':
      return 75;
    default:
      return 50;
  }
}

function locationScore(mentorCountry: string | null, innovatorCountry: string | null): number {
  if (!mentorCountry || !innovatorCountry) return 50;
  return normalize(mentorCountry) === normalize(innovatorCountry) ? 100 : 30;
}

export function computeMatchScore(
  mentor: MentorMatchProfile,
  innovator: InnovatorMatchProfile
): number {
  const industryScore =
    mentor.industry && innovator.industry
      ? normalize(mentor.industry) === normalize(innovator.industry)
        ? 100
        : 40
      : 50;

  const expertiseScore = Math.max(
    overlapScore(mentor.expertise, [innovator.category]),
    categoryExpertiseScore(innovator.category, mentor.expertise)
  );

  const stage = stageScore(innovator.stage);
  const location = locationScore(mentor.country, innovator.country);

  const final = Math.round(
    industryScore * 0.25 +
      expertiseScore * 0.35 +
      stage * 0.25 +
      location * 0.15
  );

  return Math.min(100, Math.max(0, final));
}

export function rankMatchCandidates(
  mentor: MentorMatchProfile,
  innovators: InnovatorMatchProfile[]
): MatchCandidate[] {
  return innovators
    .map((inv) => {
      const matchScore = computeMatchScore(mentor, inv);
      const tier: MatchTier = matchTier(matchScore);
      return {
        innovatorId: inv.id,
        innovatorName: inv.name,
        ideaTitle: inv.ideaTitle,
        category: inv.category,
        stage: inv.stage,
        industry: inv.industry,
        matchScore,
        tier,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
