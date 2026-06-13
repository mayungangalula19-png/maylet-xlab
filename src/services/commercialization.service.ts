import { supabase } from '../lib/supabase/client';

export type LaunchStatus = 'draft' | 'preparing' | 'scheduled' | 'launched';
export type RevenueModel = 'saas' | 'subscription' | 'licensing' | 'api';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface MarketStrategy {
  targetUsers: string;
  marketSize: string;
  competitors: string;
  positioning: string;
}

export interface ProductPackaging {
  productName: string;
  pricingModel: string;
  distributionPlan: string;
}

export interface MayaInsights {
  marketPrediction: string;
  pricingSuggestion: string;
  riskLevel: RiskLevel;
  riskNote: string;
  launchRecommendation: string;
}

export interface LaunchState {
  status: LaunchStatus;
  checklist: Record<string, boolean>;
  launchedAt?: string;
}

export interface CommercializationWorkspaceState {
  marketStrategy: MarketStrategy;
  packaging: ProductPackaging;
  revenueModel: RevenueModel;
  mayaInsights: MayaInsights;
  launch: LaunchState;
}

export interface CommercializationWorkspaceRow {
  id: string;
  project_id: string;
  user_id: string;
  market_strategy: MarketStrategy;
  product_packaging: ProductPackaging;
  revenue_model: RevenueModel;
  maya_insights: MayaInsights;
  launch_status: LaunchStatus;
  launch_checklist: Record<string, boolean>;
  launched_at: string | null;
  created_at: string;
  updated_at: string;
}

const STORAGE_PREFIX = 'maylet:comm:v1:';

export function readLocalCommercializationWorkspace(
  projectId: string
): Partial<CommercializationWorkspaceState> | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${projectId}`);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<CommercializationWorkspaceState>;
  } catch {
    return null;
  }
}

export function writeLocalCommercializationWorkspace(
  projectId: string,
  state: CommercializationWorkspaceState
): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${projectId}`, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

export function rowToWorkspaceState(row: CommercializationWorkspaceRow): CommercializationWorkspaceState {
  return {
    marketStrategy: row.market_strategy ?? {
      targetUsers: '',
      marketSize: '',
      competitors: '',
      positioning: '',
    },
    packaging: row.product_packaging ?? {
      productName: '',
      pricingModel: 'tiered',
      distributionPlan: '',
    },
    revenueModel: row.revenue_model ?? 'saas',
    mayaInsights: row.maya_insights ?? {
      marketPrediction: '',
      pricingSuggestion: '',
      riskLevel: 'medium',
      riskNote: '',
      launchRecommendation: '',
    },
    launch: {
      status: row.launch_status ?? 'draft',
      checklist: row.launch_checklist ?? {},
      launchedAt: row.launched_at ?? undefined,
    },
  };
}

export function workspaceStateToPayload(
  projectId: string,
  userId: string,
  state: CommercializationWorkspaceState
) {
  return {
    project_id: projectId,
    user_id: userId,
    market_strategy: state.marketStrategy,
    product_packaging: state.packaging,
    revenue_model: state.revenueModel,
    maya_insights: state.mayaInsights,
    launch_status: state.launch.status,
    launch_checklist: state.launch.checklist,
    launched_at: state.launch.launchedAt ?? null,
    updated_at: new Date().toISOString(),
  };
}

export function formatCommercializationError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes('commercialization_workspaces') &&
    (lower.includes('does not exist') ||
      lower.includes('could not find the table') ||
      lower.includes('schema cache'))
  ) {
    return 'Run scripts/create-commercialization-workspace-table.sql in Supabase SQL Editor to enable cloud save.';
  }
  return message;
}

export async function fetchCommercializationWorkspace(
  projectId: string
): Promise<{ data: CommercializationWorkspaceRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('commercialization_workspaces')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();

  if (error) {
    return { data: null, error: formatCommercializationError(error.message) };
  }
  return { data: data as CommercializationWorkspaceRow | null, error: null };
}

export async function upsertCommercializationWorkspace(
  projectId: string,
  userId: string,
  state: CommercializationWorkspaceState
): Promise<{ data: CommercializationWorkspaceRow | null; error: string | null }> {
  const payload = workspaceStateToPayload(projectId, userId, state);

  const { data: existing } = await supabase
    .from('commercialization_workspaces')
    .select('id')
    .eq('project_id', projectId)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from('commercialization_workspaces')
      .update(payload)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) return { data: null, error: formatCommercializationError(error.message) };
    return { data: data as CommercializationWorkspaceRow, error: null };
  }

  const { data, error } = await supabase
    .from('commercialization_workspaces')
    .insert(payload)
    .select()
    .single();

  if (error) return { data: null, error: formatCommercializationError(error.message) };
  return { data: data as CommercializationWorkspaceRow, error: null };
}
