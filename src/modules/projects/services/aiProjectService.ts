/**
 * AI layer for Projects — fetches real ai_analyses when available,
 * falls back to heuristic insights. Ready to wire to Edge Function / OpenAI.
 */
import { supabase } from '../../../lib/supabase/client';
import type { AIProjectInsight, ProjectAccessContext, ProjectViewModel } from '../types';

export async function fetchAIInsightForProject(
  ctx: ProjectAccessContext,
  project: ProjectViewModel
): Promise<AIProjectInsight> {
  const { data } = await supabase
    .from('ai_analyses')
    .select('score, feedback, created_at')
    .eq('project_id', project.id)
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data?.score != null) {
    const score = Number(data.score);
    const feedback = data.feedback as Record<string, string> | null;
    return {
      projectId: project.id,
      projectName: project.name,
      score,
      riskLevel: score >= 75 ? 'low' : score >= 50 ? 'medium' : 'high',
      recommendation:
        feedback?.summary ??
        `Your project "${project.name}" shows strong innovation potential based on recent AI analysis.`,
      tip:
        feedback?.tip ??
        'Run a full analysis to unlock tailored recommendations for your next milestone.',
      source: 'ai_analyses',
    };
  }

  return buildHeuristicInsight(project);
}

function buildHeuristicInsight(project: ProjectViewModel): AIProjectInsight {
  const score = project.ai_score ?? Math.min(95, 40 + project.progress);
  return {
    projectId: project.id,
    projectName: project.name,
    score,
    riskLevel: score >= 75 ? 'low' : score >= 50 ? 'medium' : 'high',
    recommendation: `Your project "${project.name}" is at the ${project.status} stage with ${project.progress}% progress.`,
    tip:
      project.status === 'Idea'
        ? 'Tip: Run an experiment to validate core assumptions before building a prototype.'
        : project.progress < 50
          ? 'Tip: Break remaining work into tasks and assign team members to accelerate delivery.'
          : 'Tip: Consider funding outreach — projects above 70% progress attract more investor interest.',
    source: 'heuristic',
  };
}

/** Future: POST /api/ai/projects/analyze */
export async function requestFullProjectAnalysis(
  _ctx: ProjectAccessContext,
  projectId: string
): Promise<{ jobId: string }> {
  return { jobId: `local-${projectId}-${Date.now()}` };
}
