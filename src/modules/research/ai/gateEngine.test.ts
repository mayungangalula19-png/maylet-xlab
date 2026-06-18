import { describe, expect, it } from 'vitest';
import { canAuthorizePrototype, evaluateGate } from './gateEngine';
import type { ProjectResearchSnapshot } from '../types/research.types';

function emptySnapshot(overrides: Partial<ProjectResearchSnapshot> = {}): ProjectResearchSnapshot {
  return {
    profile: null,
    notes: [],
    literature: [],
    findings: [],
    documents: [],
    completionRate: 0,
    ...overrides,
  };
}

const baseProfile = {
  id: 'p1',
  project_id: 'proj-1',
  user_id: 'u1',
  problem_statement: 'Farmers lose yield to pests',
  target_users: 'Smallholder farmers',
  pain_points: 'Crop loss, late detection',
  existing_solutions: 'Manual scouting',
  research_questions: 'How can early detection reduce loss?',
  created_at: '',
  updated_at: '',
};

describe('canAuthorizePrototype', () => {
  it('allows go and conditional_go', () => {
    expect(canAuthorizePrototype('go')).toBe(true);
    expect(canAuthorizePrototype('conditional_go')).toBe(true);
  });

  it('blocks hold, no_go, and pending', () => {
    expect(canAuthorizePrototype('hold')).toBe(false);
    expect(canAuthorizePrototype('no_go')).toBe(false);
    expect(canAuthorizePrototype('pending')).toBe(false);
  });
});

describe('evaluateGate', () => {
  it('returns hold when evidence is incomplete', () => {
    const result = evaluateGate(emptySnapshot({ profile: baseProfile }));
    expect(result.recommendedDecision).toBe('hold');
    expect(result.prototypeAuthorized).toBe(false);
    expect(result.blockers.some((b) => b.includes('System evidence incomplete'))).toBe(true);
  });

  it('flags missing section A checks when profile fields are empty', () => {
    const result = evaluateGate(
      emptySnapshot({
        profile: { ...baseProfile, problem_statement: '', target_users: '' },
      })
    );
    const failedA = result.sectionA.filter((c) => c.status === 'fail');
    expect(failedA.length).toBeGreaterThanOrEqual(2);
  });
});
