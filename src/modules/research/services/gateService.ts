import {
  fetchLatestGateReview,
  saveGateReview,
  type GateReviewRow,
} from '../../../lib/supabase/research.queries';
import type { GateCheckItem, GateReviewInput, GateReviewRecord } from '../types/gate.types';

function mapRow(row: GateReviewRow): GateReviewRecord {
  return {
    id: row.id,
    project_id: row.project_id,
    user_id: row.user_id,
    system_completion: row.system_completion,
    section_a: row.section_a as GateCheckItem[],
    section_b: row.section_b as GateCheckItem[],
    section_c: row.section_c as GateCheckItem[],
    decision: row.decision as GateReviewRecord['decision'],
    v1_scope: row.v1_scope,
    out_of_scope: row.out_of_scope,
    open_risks: row.open_risks,
    reviewer_name: row.reviewer_name,
    reviewed_at: row.reviewed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const gateService = {
  async getLatest(projectId: string): Promise<GateReviewRecord | null> {
    const row = await fetchLatestGateReview(projectId);
    return row ? mapRow(row) : null;
  },

  async submit(
    projectId: string,
    userId: string,
    evaluation: {
      systemCompletion: number;
      sectionA: GateCheckItem[];
      sectionB: GateCheckItem[];
      sectionC: GateCheckItem[];
    },
    input: GateReviewInput
  ): Promise<GateReviewRecord | null> {
    const row = await saveGateReview(projectId, userId, {
      system_completion: evaluation.systemCompletion,
      section_a: evaluation.sectionA,
      section_b: input.sectionB,
      section_c: input.sectionC,
      decision: input.decision,
      v1_scope: input.v1Scope || null,
      out_of_scope: input.outOfScope || null,
      open_risks: input.openRisks || null,
      reviewer_name: input.reviewerName || null,
      reviewed_at: new Date().toISOString(),
    });
    return row ? mapRow(row) : null;
  },
};
