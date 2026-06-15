import { memo } from 'react';
import { Link } from 'react-router-dom';
import { trackEvent } from '../../lib/communityAnalytics';
import type { FeedFilter } from '../../types/community.types';

interface FeedFiltersSidebarProps {
  filter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
}

const NAV_ITEMS: { id: FeedFilter; label: string }[] = [
  { id: 'all', label: 'All posts' },
  { id: 'research', label: 'Research' },
  { id: 'project', label: 'Projects' },
  { id: 'teams', label: 'Teams' },
  { id: 'trending', label: 'Trending' },
  { id: 'announcement', label: 'Announcements' },
];

const FeedFiltersSidebar = memo(function FeedFiltersSidebar({
  filter,
  onFilterChange,
}: FeedFiltersSidebarProps) {
  return (
    <aside className="mxl-comm__panel mxl-comm__aside--left" aria-label="Feed filters">
      <h2>Discover</h2>
      <nav className="mxl-comm__nav">
        {NAV_ITEMS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={filter === id ? 'is-active' : ''}
            onClick={() => onFilterChange(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <h2 className="mxl-comm__section-gap">Ecosystem</h2>
      <nav className="mxl-comm__nav">
        <Link
          to="/hackathons"
          className="mxl-comm__list-item"
          onClick={() => trackEvent('collaboration_click', { action: 'hackathons' })}
        >
          <strong>Hackathons</strong>
          <span>Live builder events</span>
        </Link>
        <Link
          to="/mentorship"
          className="mxl-comm__list-item"
          onClick={() => trackEvent('collaboration_click', { action: 'mentorship' })}
        >
          <strong>Mentorship</strong>
          <span>Operator circles</span>
        </Link>
        <Link
          to="/ecosystem"
          className="mxl-comm__list-item"
          onClick={() => trackEvent('collaboration_click', { action: 'ecosystem_hub' })}
        >
          <strong>Ecosystem hub</strong>
          <span>Partners & chapters</span>
        </Link>
      </nav>
    </aside>
  );
});

export default FeedFiltersSidebar;
