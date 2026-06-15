import { memo } from 'react';
import { Link } from 'react-router-dom';
import { trackEvent } from '../../lib/communityAnalytics';
import { timeAgo } from '../../lib/communityUtils';
import type { CommunityPost, SuggestionsPayload } from '../../types/community.types';

interface DiscoverySidebarProps {
  trending: CommunityPost[];
  suggestions: SuggestionsPayload;
}

const DiscoverySidebar = memo(function DiscoverySidebar({ trending, suggestions }: DiscoverySidebarProps) {
  return (
    <aside className="mxl-comm__panel mxl-comm__aside--right" aria-label="Suggestions">
      <h2>Trending</h2>
      {trending.map((t) => (
        <Link
          key={t.id}
          to={`/ecosystem/community?post=${t.id}`}
          className="mxl-comm__list-item"
          onClick={() => trackEvent('post_open', { postId: t.id, surface: 'trending' })}
        >
          <strong>{t.title}</strong>
          <span>
            {t.engagement.likes} likes · {timeAgo(t.createdAt)}
          </span>
        </Link>
      ))}

      <h2 className="mxl-comm__section-gap">Suggested collaborators</h2>
      {suggestions.users.map((u) => (
        <div key={u.id} className="mxl-comm__list-item">
          <strong>{u.name}</strong>
          <span>
            {u.role} · {u.expertise} · {u.mutualProjects} mutual projects
          </span>
        </div>
      ))}

      <h2 className="mxl-comm__section-gap">Suggested projects</h2>
      {suggestions.projects.map((p) => (
        <Link
          key={p.id}
          to={`/projects/${p.id}`}
          className="mxl-comm__list-item"
          onClick={() => trackEvent('collaboration_click', { action: 'suggested_project', projectId: p.id })}
        >
          <strong>{p.name}</strong>
          <span>
            {p.sector} · {p.contributors} contributors
          </span>
        </Link>
      ))}
    </aside>
  );
});

export default DiscoverySidebar;
