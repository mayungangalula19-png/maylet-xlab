import { Link } from 'react-router-dom';
import { formatTimeAgo } from '../../../lib/innovation/lifecycle';
import { getActivityRoute } from '../../../lib/innovation/navigation';
import { getInnovationOnboardingSteps } from '../../../lib/innovation/recommendations';
import type { TimelineEvent } from '../../../lib/supabase/commandCenter.queries';
import type { Project } from '../../../types/project.types';

interface Props {
  events: TimelineEvent[];
  legacyActivities?: {
    id: string;
    user_name: string;
    action: string;
    project_name: string;
    created_at: string;
  }[];
  projects?: Project[];
}

function formatEventType(type: string): string {
  const map: Record<string, string> = {
    project: 'Project Created',
    research: 'Research Added',
    experiment: 'Experiment Started',
    document: 'Document Uploaded',
    team: 'Team Joined',
    ai: 'MAYA Recommendation Generated',
    funding: 'Funding Application Submitted',
    activity: 'Innovation Activity',
  };
  return map[type] ?? type.replace(/_/g, ' ');
}

export function ActivityTimeline({ events, legacyActivities = [], projects = [] }: Props) {
  const items: {
    id: string;
    title: string;
    subtitle: string;
    time: string;
    route: string;
  }[] = [];

  for (const e of events) {
    items.push({
      id: e.id,
      title: formatEventType(e.type),
      subtitle: `${e.title} — ${e.subtitle}`,
      time: e.created_at,
      route: getActivityRoute(e.type, e.project_id),
    });
  }

  for (const a of legacyActivities) {
    items.push({
      id: `legacy-${a.id}`,
      title: a.action,
      subtitle: `${a.user_name} · ${a.project_name}`,
      time: a.created_at,
      route: '/projects',
    });
  }

  items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const onboarding = getInnovationOnboardingSteps(projects);

  return (
    <div className="icc-glass icc-widget">
      <div className="icc-widget-header">
        <h3>Activity</h3>
        <Link to="/notifications" className="icc-widget-link">All</Link>
      </div>
      {items.length === 0 ? (
        <div className="icc-onboarding-block">
          <p className="icc-widget-empty-text">No activity yet.</p>
          <ul className="icc-onboarding-list">
            {onboarding.map((step, i) => (
              <li key={step.id}>
                <Link to={step.route} className="icc-onboarding-step icc-clickable">
                  {i + 1}. {step.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        items.slice(0, 6).map((item) => (
          <Link key={item.id} to={item.route} className="icc-timeline-item icc-clickable">
            <div className="icc-timeline-dot" />
            <div>
              <div className="icc-timeline-title">{item.title}</div>
              <div className="icc-timeline-subtitle">{item.subtitle}</div>
              <div className="icc-timeline-time">{formatTimeAgo(item.time)}</div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
