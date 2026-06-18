import { supabase } from '../../../lib/supabase/client';
import { normalizeExperimentRow } from '../../../lib/experiment/experimentOps';
import { fetchResearchProfile, upsertResearchProfile } from '../../../lib/supabase/research.queries';
import { prototypeService } from '../../prototype/services/prototypeService';
import { sanitizePitchNumbers } from '../../funding/services/funding.service';
import {
  fetchCommercializationWorkspace,
  upsertCommercializationWorkspace,
  readLocalCommercializationWorkspace,
  writeLocalCommercializationWorkspace,
  rowToWorkspaceState,
  type CommercializationWorkspaceState,
} from '../../commercialization/services/commercialization.service';
import { getValidation, updateValidationDecision } from '../../validation/services/validationService';
import type { PrototypeLifecycleStatus } from '../../prototype/types/prototype.types';
import type { ValidationDecision } from '../../validation/types/validation.types';
import type { InnovationEntityAdapter } from '../types/innovationEditor.types';

export type { CommercializationWorkspaceState };

export interface ExperimentEditValues {
  title: string;
  hypothesis: string;
  type: string;
  status: string;
  results: string;
  objectives: string;
  methodology: string;
}

export interface PrototypeEditValues {
  name: string;
  description: string;
  status: string;
  version: string;
}

export interface ResearchEditValues {
  problem_statement: string;
  target_users: string;
  pain_points: string;
  existing_solutions: string;
  research_questions: string;
}

export interface TestingEditValues {
  test_plan_summary: string;
  execution_notes: string;
  status: string;
}

export interface ValidationEditValues {
  reviewer_notes: string;
  decision: string;
}

export interface FundingEditValues {
  title: string;
  amount: string;
  equity_offered: string;
  summary: string;
  status: string;
}

export const researchAdapter: InnovationEntityAdapter<ResearchEditValues> = {
  entityType: 'research',
  workflowStageId: 'research',
  entityLabel: 'Research profile',
  async load(projectId) {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;
    if (!userId) throw new Error('Not authenticated');
    const profile = await fetchResearchProfile(projectId, userId);
    return profile ?? { project_id: projectId };
  },
  toValues(record) {
    const row = record as Record<string, unknown>;
    return {
      problem_statement: String(row.problem_statement ?? ''),
      target_users: String(row.target_users ?? ''),
      pain_points: String(row.pain_points ?? ''),
      existing_solutions: String(row.existing_solutions ?? ''),
      research_questions: String(row.research_questions ?? ''),
    };
  },
  validate(values, mode) {
    if (mode === 'publish' && !values.problem_statement.trim()) {
      return 'Problem statement is required to publish research.';
    }
    return null;
  },
  async persist(values, ctx) {
    const result = await upsertResearchProfile(ctx.entityId, ctx.userId, values);
    return { entityId: ctx.entityId, record: result };
  },
  readinessScore(values) {
    const fields = Object.values(values).filter((v) => v.trim().length > 0);
    return Math.round((fields.length / 5) * 100);
  },
};

export const prototypeAdapter: InnovationEntityAdapter<PrototypeEditValues> = {
  entityType: 'prototype',
  workflowStageId: 'prototype',
  entityLabel: 'Prototype',
  async load(id) {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;
    if (!userId) throw new Error('Not authenticated');
    const record = await prototypeService.getById(id, userId);
    if (!record) throw new Error('Prototype not found');
    return record;
  },
  toValues(record) {
    const row = record as Record<string, unknown>;
    return {
      name: String(row.name ?? ''),
      description: String(row.description ?? ''),
      status: String(row.status ?? 'draft'),
      version: String(row.version ?? '1.0'),
    };
  },
  validate(values, mode) {
    if (!values.name.trim()) return 'Prototype name is required.';
    if (mode === 'publish' && !values.description.trim()) {
      return 'Description is required to publish prototype.';
    }
    return null;
  },
  async persist(values, ctx) {
    const updated = await prototypeService.update(ctx.entityId, ctx.userId, {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      lifecycle_status: values.status as PrototypeLifecycleStatus,
      version: values.version,
    });
    return { entityId: ctx.entityId, record: updated };
  },
  readinessScore(values) {
    let score = values.name.trim() ? 40 : 0;
    if (values.description.trim()) score += 35;
    if (values.status !== 'draft') score += 25;
    return score;
  },
};

export const experimentAdapter: InnovationEntityAdapter<ExperimentEditValues> = {
  entityType: 'experiment',
  workflowStageId: 'experiment',
  entityLabel: 'Experiment',
  async load(id) {
    const { data, error } = await supabase.from('experiments').select('*').eq('id', id).single();
    if (error) throw error;
    return normalizeExperimentRow(data as Record<string, unknown>);
  },
  toValues(record) {
    const row = record as Record<string, unknown> & { config?: Record<string, string> };
    const config = row.config ?? {};
    return {
      title: String(row.title ?? ''),
      hypothesis: String(row.hypothesis ?? ''),
      type: String(row.type ?? 'structured'),
      status: String(row.status ?? 'draft'),
      results: String(row.results ?? ''),
      objectives: String(config.objectives ?? ''),
      methodology: String(config.methodology ?? ''),
    };
  },
  validate(values, mode) {
    if (!values.title.trim()) return 'Experiment title is required.';
    if (!values.hypothesis.trim()) return 'Hypothesis is required.';
    if (mode === 'publish' && !values.results.trim() && !values.objectives.trim()) {
      return 'Add objectives or results before publishing.';
    }
    return null;
  },
  async persist(values, ctx) {
    const config = {
      objectives: values.objectives,
      methodology: values.methodology,
      version: Date.now(),
    };
    const { data, error } = await supabase
      .from('experiments')
      .update({
        title: values.title.trim(),
        hypothesis: values.hypothesis.trim(),
        type: values.type,
        status: values.status,
        results: values.results.trim() || null,
        findings: JSON.stringify(config),
        updated_at: new Date().toISOString(),
      })
      .eq('id', ctx.entityId)
      .select('*')
      .single();
    if (error) throw error;
    return {
      entityId: ctx.entityId,
      record: normalizeExperimentRow(data as Record<string, unknown>),
    };
  },
  readinessScore(values) {
    let score = 0;
    if (values.hypothesis.trim()) score += 25;
    if (values.objectives.trim()) score += 25;
    if (values.methodology.trim()) score += 25;
    if (values.results.trim()) score += 25;
    return score;
  },
};

export const testingAdapter: InnovationEntityAdapter<TestingEditValues> = {
  entityType: 'testing',
  workflowStageId: 'prototype',
  entityLabel: 'Testing workspace',
  async load(prototypeId) {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;
    if (!userId) throw new Error('Not authenticated');
    const record = await prototypeService.getById(prototypeId, userId);
    if (!record) throw new Error('Prototype not found');
    return record;
  },
  toValues(record) {
    const row = record as Record<string, unknown>;
    return {
      test_plan_summary: String(row.description ?? ''),
      execution_notes: '',
      status: String(row.lifecycle_status ?? row.status ?? 'draft'),
    };
  },
  validate(values) {
    if (!values.test_plan_summary.trim()) return 'Test plan summary is required.';
    return null;
  },
  async persist(values, ctx) {
    const updated = await prototypeService.update(ctx.entityId, ctx.userId, {
      description: values.test_plan_summary.trim(),
      lifecycle_status: values.status as PrototypeLifecycleStatus,
    });
    return { entityId: ctx.entityId, record: updated };
  },
  readinessScore(values) {
    return values.test_plan_summary.trim() ? 70 : 20;
  },
};

export const validationAdapter: InnovationEntityAdapter<ValidationEditValues> = {
  entityType: 'validation',
  workflowStageId: 'validation',
  entityLabel: 'Validation',
  async load(id) {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;
    if (!userId) throw new Error('Not authenticated');
    const record = await getValidation(id, userId);
    if (!record) throw new Error('Validation not found');
    return record;
  },
  toValues(record) {
    const row = record as Record<string, unknown>;
    return {
      reviewer_notes: String(row.reviewer_notes ?? ''),
      decision: String(row.decision ?? 'pending'),
    };
  },
  validate(values, mode) {
    if (mode === 'publish' && values.decision === 'pending') {
      return 'Select a validation decision before publishing.';
    }
    return null;
  },
  async persist(values, ctx) {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id ?? ctx.userId;
    const updated = await updateValidationDecision(
      ctx.entityId,
      userId,
      values.decision as ValidationDecision,
      values.reviewer_notes.trim() || undefined
    );
    return { entityId: ctx.entityId, record: updated };
  },
  readinessScore(values) {
    return values.decision !== 'pending' ? 85 : 40;
  },
};

export const fundingAdapter: InnovationEntityAdapter<FundingEditValues> = {
  entityType: 'funding',
  workflowStageId: 'funding',
  entityLabel: 'Funding pitch',
  async load(id) {
    const { data, error } = await supabase.from('funding_pitches').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  toValues(record) {
    const row = record as Record<string, unknown>;
    return {
      title: String(row.title ?? ''),
      amount: String(row.amount ?? ''),
      equity_offered: String(row.equity_offered ?? ''),
      summary: String(row.summary ?? ''),
      status: String(row.status ?? 'draft'),
    };
  },
  validate(values, mode) {
    if (!values.title.trim()) return 'Pitch title is required.';
    try {
      sanitizePitchNumbers(values.amount, values.equity_offered);
    } catch (err) {
      return err instanceof Error ? err.message : 'Invalid funding numbers.';
    }
    if (mode === 'publish' && !values.summary.trim()) {
      return 'Summary is required to publish pitch.';
    }
    return null;
  },
  async persist(values, ctx) {
    const numbers = sanitizePitchNumbers(values.amount, values.equity_offered);
    const { data, error } = await supabase
      .from('funding_pitches')
      .update({
        title: values.title.trim(),
        amount: numbers.amount,
        equity_offered: numbers.equity_offered,
        summary: values.summary.trim() || null,
        status: values.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ctx.entityId)
      .select('*')
      .single();
    if (error) throw error;
    return { entityId: ctx.entityId, record: data };
  },
  readinessScore(values) {
    let score = values.title.trim() ? 30 : 0;
    if (values.summary.trim()) score += 40;
    if (Number(values.amount) > 0) score += 30;
    return score;
  },
};

export const commercializationAdapter: InnovationEntityAdapter<
  CommercializationWorkspaceState,
  CommercializationWorkspaceState
> = {
  entityType: 'commercialization',
  workflowStageId: 'commercialization',
  entityLabel: 'Commercialization',
  async load(projectId) {
    const local = readLocalCommercializationWorkspace(projectId);
    const { data } = await fetchCommercializationWorkspace(projectId);
    if (data) {
      return {
        marketStrategy: data.market_strategy,
        packaging: data.product_packaging,
        revenueModel: data.revenue_model,
        mayaInsights: data.maya_insights,
        launch: {
          status: data.launch_status,
          checklist: data.launch_checklist,
          launchedAt: data.launched_at ?? undefined,
        },
      } satisfies CommercializationWorkspaceState;
    }
    return (local as CommercializationWorkspaceState) ?? {
      marketStrategy: { targetUsers: '', marketSize: '', competitors: '', positioning: '' },
      packaging: { productName: '', pricingModel: '', distributionPlan: '' },
      revenueModel: 'saas',
      mayaInsights: {
        marketPrediction: '',
        pricingSuggestion: '',
        riskLevel: 'medium',
        riskNote: '',
        launchRecommendation: '',
      },
      launch: { status: 'draft', checklist: {} },
    };
  },
  toValues(state) {
    return state;
  },
  validate(values, mode) {
    if (mode === 'publish' && !values.marketStrategy.targetUsers.trim()) {
      return 'Target users are required to publish commercialization plan.';
    }
    return null;
  },
  async persist(values, ctx) {
    writeLocalCommercializationWorkspace(ctx.entityId, values);
    const { data, error } = await upsertCommercializationWorkspace(
      ctx.entityId,
      ctx.userId,
      values
    );
    if (error) throw new Error(error);
    const record = data ? rowToWorkspaceState(data) : values;
    return { entityId: ctx.entityId, record };
  },
  readinessScore(values) {
    let score = 0;
    if (values.marketStrategy.targetUsers.trim()) score += 30;
    if (values.packaging.productName.trim()) score += 25;
    if (values.mayaInsights.launchRecommendation.trim()) score += 25;
    if (values.launch.status !== 'draft') score += 20;
    return score;
  },
};

export const INNOVATION_ENTITY_ADAPTERS = {
  research: researchAdapter,
  prototype: prototypeAdapter,
  experiment: experimentAdapter,
  testing: testingAdapter,
  validation: validationAdapter,
  funding: fundingAdapter,
  commercialization: commercializationAdapter,
} as const;
