import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';
import { projectAgent } from '../../maya/ai/agents/project.agent';
import type { MayaInsight, Project } from '../../../types/project.types';
import { getProjectPipelineStage } from '../../../types/project.types';
import './projects-pipeline.css';

interface Props {
  project: Project | null;
}

function buildFallbackInsight(project: Project): MayaInsight {
  const score = project.ai_score ?? Math.min(95, 40 + project.progress);
  const stage = getProjectPipelineStage(project);
  return {
    recommendation: `Your project "${project.name}" is at the ${stage} stage with ${project.progress}% progress.`,
    tip:
      stage === 'Idea' || stage === 'Analysis'
        ? 'Run an experiment to validate your core assumptions before building a prototype.'
        : stage === 'Funding'
          ? 'Prepare a pitch deck and funding readiness summary for investor outreach.'
          : 'Break remaining work into tasks and track milestones in the innovation pipeline.',
    score,
    riskLevel: score >= 75 ? 'low' : score >= 50 ? 'medium' : 'high',
  };
}

function parseMayaInsight(content: string, project: Project): MayaInsight | null {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Partial<MayaInsight>;
    if (!parsed.recommendation || !parsed.tip) return null;

    const score = Number(parsed.score ?? project.ai_score ?? 70);
    const risk = parsed.riskLevel;
    const riskLevel: MayaInsight['riskLevel'] =
      risk === 'low' || risk === 'medium' || risk === 'high' ? risk : score >= 75 ? 'low' : score >= 50 ? 'medium' : 'high';

    return {
      recommendation: parsed.recommendation,
      tip: parsed.tip,
      score: Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 70,
      riskLevel,
    };
  } catch {
    return null;
  }
}

export function MayaInsightCard({ project }: Props) {
  const [insight, setInsight] = useState<MayaInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!project) {
      setInsight(null);
      setError(null);
      return;
    }

    let cancelled = false;
    const activeProject = project;

    async function fetchInsight() {
      setLoading(true);
      setError(null);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const stage = getProjectPipelineStage(activeProject);
        const prompt =
          `Analyze this Maylet XLab innovation project. Respond with JSON only, no markdown:\n` +
          `{"recommendation":"one sentence","tip":"one actionable tip","score":0-100,"riskLevel":"low|medium|high"}\n\n` +
          `Name: ${activeProject.name}\nSector: ${activeProject.sector}\nStage: ${stage}\nProgress: ${activeProject.progress}%\n` +
          `Description: ${activeProject.description}`;

        const response = await projectAgent.run({
          message: prompt,
          context: {
            userId: session.user.id,
            projectId: activeProject.id,
            projectName: activeProject.name,
            projectStage: stage,
            projectProgress: activeProject.progress,
            memories: [],
            recentMessages: [],
          },
          modelId: 'groq',
        });

        if (cancelled) return;

        const parsed = parseMayaInsight(response.content, activeProject);
        setInsight(parsed ?? buildFallbackInsight(activeProject));
      } catch (err) {
        if (cancelled) return;
        console.warn('[MayaInsightCard]', err);
        setInsight(buildFallbackInsight(activeProject));
        setError('MAYA is offline — showing heuristic insights.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchInsight();
    return () => {
      cancelled = true;
    };
  }, [project]);

  if (!project) {
    return (
      <div className="card ai-insights-card maya-insight-card">
        <div className="card-header">
          <h3>MAYA Insights</h3>
          <Link to="/ai-assistant" className="card-link">Ask MAYA</Link>
        </div>
        <p className="empty-text">Create a project to unlock AI-powered insights.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card ai-insights-card maya-insight-card">
        <div className="card-header">
          <h3>MAYA Insights</h3>
          <Link to="/ai-assistant" className="card-link">Ask MAYA</Link>
        </div>
        <div className="maya-insight-loading">
          <div className="maya-insight-skeleton" />
          <div className="maya-insight-skeleton" />
          <div className="maya-insight-skeleton maya-insight-skeleton--short" />
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
            MAYA is analyzing &quot;{project.name}&quot;...
          </p>
        </div>
      </div>
    );
  }

  const data = insight ?? buildFallbackInsight(project);
  const riskClass =
    data.riskLevel === 'low' ? 'maya-risk-low' : data.riskLevel === 'medium' ? 'maya-risk-medium' : 'maya-risk-high';

  return (
    <div className="card ai-insights-card maya-insight-card">
      <div className="card-header">
        <h3>MAYA Insights</h3>
        <Link to="/ai-assistant" className="card-link">Ask MAYA</Link>
      </div>
      <div className="ai-recommendation">
        <p>{data.recommendation}</p>
        <p className="maya-insight-tip">Tip: {data.tip}</p>
      </div>
      {error && (
        <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>{error}</p>
      )}
      <div className="maya-insight-scores">
        <div className="maya-insight-score-box">
          <span>AI Score</span>
          <strong style={{ color: '#2fd4ff' }}>{data.score}/100</strong>
        </div>
        <div className="maya-insight-score-box">
          <span>Risk Level</span>
          <strong className={riskClass}>{data.riskLevel}</strong>
        </div>
      </div>
      <Link to={`/ai-assistant/analyze?projectId=${project.id}`} className="btn-analyze">
        Run Full Analysis
      </Link>
    </div>
  );
}
