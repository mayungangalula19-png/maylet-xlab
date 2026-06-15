import { useState, useMemo, useCallback } from 'react';
import { ErrorState } from '../../../design-system';
import { Button } from '../../../modules/shared';
import { MessagesEmptyState } from './MessagesEmptyState';
import { MessagesSkeleton } from './MessagesSkeleton';
import { formatMessageTime, truncatePreview } from '../lib/messageUtils';
import type { AsyncState, Conversation } from '../types/messages.types';

// ============================================================================
// TYPES
// ============================================================================

type InnovationCategory =
  | 'direct'
  | 'team'
  | 'project'
  | 'research'
  | 'prototype'
  | 'experiment'
  | 'validation'
  | 'funding'
  | 'commercialization'
  | 'community'
  | 'enterprise';

type Priority = 'critical' | 'high' | 'medium' | 'low';

type FilterId =
  | 'all'
  | 'unread'
  | 'pinned'
  | 'project'
  | 'research'
  | 'team'
  | 'funding'
  | 'mentions'
  | 'archived';

interface EnrichedConversation extends Conversation {
  category: InnovationCategory;
  priority: Priority;
  activityScore: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  isFollowed: boolean;
}

interface CategoryMeta {
  id: InnovationCategory;
  icon: string;
  label: string;
  color: string;
}

interface Props {
  state: AsyncState<Conversation[]>;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewMessage: () => void;
  onRetry: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORIES: CategoryMeta[] = [
  { id: 'direct', icon: '💬', label: 'Direct', color: '#7c5fe6' },
  { id: 'team', icon: '👥', label: 'Teams', color: '#3b82f6' },
  { id: 'project', icon: '📁', label: 'Projects', color: '#10b981' },
  { id: 'research', icon: '🔬', label: 'Research', color: '#8b5cf6' },
  { id: 'prototype', icon: '🛠️', label: 'Prototypes', color: '#f59e0b' },
  { id: 'experiment', icon: '🧪', label: 'Experiments', color: '#ec4899' },
  { id: 'validation', icon: '✅', label: 'Validation', color: '#06b6d4' },
  { id: 'funding', icon: '💰', label: 'Funding', color: '#84cc16' },
  { id: 'commercialization', icon: '🚀', label: 'Commercialization', color: '#f97316' },
  { id: 'community', icon: '🌐', label: 'Community', color: '#14b8a6' },
  { id: 'enterprise', icon: '🏢', label: 'Enterprise', color: '#6366f1' },
];

const FILTERS: { id: FilterId; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '⊞' },
  { id: 'unread', label: 'Unread', icon: '●' },
  { id: 'pinned', label: 'Pinned', icon: '📌' },
  { id: 'project', label: 'Projects', icon: '📁' },
  { id: 'team', label: 'Teams', icon: '👥' },
  { id: 'funding', label: 'Funding', icon: '💰' },
  { id: 'mentions', label: 'Mentions', icon: '@' },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  critical: { label: 'Critical', color: '#ef4444', dot: '#ef4444' },
  high: { label: 'High', color: '#f97316', dot: '#f97316' },
  medium: { label: 'Medium', color: '#f59e0b', dot: '#f59e0b' },
  low: { label: 'Low', color: '#64748b', dot: '#475569' },
};

// ============================================================================
// ENRICHMENT UTILITIES
// ============================================================================

function deriveCategory(conv: Conversation): InnovationCategory {
  if (conv.type === 'dm') return 'direct';
  if (conv.teamId && !conv.projectId) return 'team';
  if (conv.projectId) return 'project';

  const title = conv.title.toLowerCase();
  if (title.includes('research') || title.includes('paper') || title.includes('literature'))
    return 'research';
  if (title.includes('prototype') || title.includes('hardware') || title.includes('build'))
    return 'prototype';
  if (title.includes('experiment') || title.includes('hypothesis') || title.includes('trial'))
    return 'experiment';
  if (title.includes('validation') || title.includes('review') || title.includes('audit'))
    return 'validation';
  if (
    title.includes('funding') ||
    title.includes('investor') ||
    title.includes('grant') ||
    title.includes('pitch')
  )
    return 'funding';
  if (
    title.includes('commerci') ||
    title.includes('launch') ||
    title.includes('market') ||
    title.includes('sales')
  )
    return 'commercialization';
  if (
    title.includes('community') ||
    title.includes('forum') ||
    title.includes('public')
  )
    return 'community';
  if (conv.workspaceId) return 'enterprise';
  if (conv.type === 'group') return 'team';
  return 'direct';
}

function computePriority(conv: Conversation): Priority {
  if (conv.unreadCount >= 10) return 'critical';
  if (conv.unreadCount >= 5) return 'high';
  if (conv.unreadCount >= 1) return 'medium';

  if (!conv.lastMessage) return 'low';

  const minutesAgo = (Date.now() - new Date(conv.lastMessage.createdAt).getTime()) / 60000;
  if (minutesAgo < 30) return 'medium';
  return 'low';
}

function computeActivityScore(conv: Conversation): number {
  let score = 0;
  score += Math.min(conv.unreadCount * 10, 50);
  if (conv.lastMessage) {
    const minutesAgo =
      (Date.now() - new Date(conv.lastMessage.createdAt).getTime()) / 60000;
    if (minutesAgo < 5) score += 50;
    else if (minutesAgo < 30) score += 30;
    else if (minutesAgo < 120) score += 15;
    else if (minutesAgo < 1440) score += 5;
  }
  if (conv.projectId) score += 10;
  if (conv.members.length > 3) score += 5;
  return Math.min(score, 100);
}

function enrich(
  conv: Conversation,
  pinned: Set<string>,
  muted: Set<string>,
  archived: Set<string>,
  followed: Set<string>
): EnrichedConversation {
  return {
    ...conv,
    category: deriveCategory(conv),
    priority: computePriority(conv),
    activityScore: computeActivityScore(conv),
    isPinned: pinned.has(conv.id),
    isMuted: muted.has(conv.id),
    isArchived: archived.has(conv.id),
    isFollowed: followed.has(conv.id),
  };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function PriorityDot({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_CONFIG[priority];
  if (priority === 'low') return null;
  return (
    <span
      className="cnl-priority-dot"
      style={{ background: cfg.dot }}
      title={`${cfg.label} priority`}
    />
  );
}

function ActivityBar({ score }: { score: number }) {
  const color =
    score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#475569';
  return (
    <div className="cnl-activity-bar" title={`Activity: ${score}/100`}>
      <div
        className="cnl-activity-bar__fill"
        style={{ width: `${score}%`, background: color }}
      />
    </div>
  );
}

interface ConversationCardProps {
  conv: EnrichedConversation;
  active: boolean;
  onSelect: (id: string) => void;
  onPin: (id: string) => void;
  onMute: (id: string) => void;
  onArchive: (id: string) => void;
  onFollow: (id: string) => void;
}

function ConversationCard({
  conv,
  active,
  onSelect,
  onPin,
  onMute,
  onArchive,
  onFollow,
}: ConversationCardProps) {
  const [showActions, setShowActions] = useState(false);
  const catMeta = CATEGORIES.find((c) => c.id === conv.category);
  const preview = conv.lastMessage
    ? truncatePreview(conv.lastMessage.content, 56)
    : 'No messages yet';
  const time = conv.lastMessage ? formatMessageTime(conv.lastMessage.createdAt) : '';

  const handleAction = (e: React.MouseEvent, fn: () => void) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div
      className={`cnl-card ${active ? 'cnl-card--active' : ''} ${conv.isMuted ? 'cnl-card--muted' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <button
        type="button"
        className="cnl-card__main"
        onClick={() => onSelect(conv.id)}
        aria-label={`Open ${conv.title}`}
      >
        <div className="cnl-card__avatar" style={{ background: `${catMeta?.color}25`, borderColor: `${catMeta?.color}50` }}>
          <span className="cnl-card__cat-icon">{catMeta?.icon}</span>
          {conv.isPinned && <span className="cnl-card__pin">📌</span>}
        </div>

        <div className="cnl-card__content">
          <div className="cnl-card__row">
            <span className="cnl-card__title">{conv.title}</span>
            <div className="cnl-card__meta">
              {conv.unreadCount > 0 && !conv.isMuted && (
                <span className="cnl-card__badge">{conv.unreadCount > 99 ? '99+' : conv.unreadCount}</span>
              )}
              <PriorityDot priority={conv.priority} />
              <span className="cnl-card__time">{time}</span>
            </div>
          </div>

          <div className="cnl-card__row cnl-card__row--sub">
            <span className="cnl-card__preview">{preview}</span>
          </div>

          <div className="cnl-card__footer">
            <span className="cnl-card__type-badge" style={{ color: catMeta?.color, borderColor: `${catMeta?.color}40`, background: `${catMeta?.color}12` }}>
              {catMeta?.label}
            </span>
            {conv.members.length > 0 && (
              <div className="cnl-card__avatars">
                {conv.members.slice(0, 3).map((m, i) => (
                  <span
                    key={m.id}
                    className="cnl-card__member"
                    title={m.name}
                    style={{ zIndex: 3 - i }}
                  >
                    {m.name[0]}
                  </span>
                ))}
                {conv.members.length > 3 && (
                  <span className="cnl-card__member cnl-card__member--more">
                    +{conv.members.length - 3}
                  </span>
                )}
              </div>
            )}
            <ActivityBar score={conv.activityScore} />
          </div>
        </div>
      </button>

      {showActions && (
        <div className="cnl-card__actions">
          <button
            type="button"
            className="cnl-card__action"
            onClick={(e) => handleAction(e, () => onPin(conv.id))}
            title={conv.isPinned ? 'Unpin' : 'Pin'}
          >
            📌
          </button>
          <button
            type="button"
            className="cnl-card__action"
            onClick={(e) => handleAction(e, () => onFollow(conv.id))}
            title={conv.isFollowed ? 'Unfollow' : 'Follow'}
          >
            {conv.isFollowed ? '👁' : '👁'}
          </button>
          <button
            type="button"
            className="cnl-card__action"
            onClick={(e) => handleAction(e, () => onMute(conv.id))}
            title={conv.isMuted ? 'Unmute' : 'Mute'}
          >
            {conv.isMuted ? '🔔' : '🔕'}
          </button>
          <button
            type="button"
            className="cnl-card__action"
            onClick={(e) => handleAction(e, () => onArchive(conv.id))}
            title="Archive"
          >
            📦
          </button>
        </div>
      )}
    </div>
  );
}

interface CategoryGroupProps {
  meta: CategoryMeta;
  conversations: EnrichedConversation[];
  activeId: string | null;
  expanded: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onPin: (id: string) => void;
  onMute: (id: string) => void;
  onArchive: (id: string) => void;
  onFollow: (id: string) => void;
}

function CategoryGroup({
  meta,
  conversations,
  activeId,
  expanded,
  onToggle,
  onSelect,
  onPin,
  onMute,
  onArchive,
  onFollow,
}: CategoryGroupProps) {
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const hasCritical = conversations.some((c) => c.priority === 'critical');

  return (
    <div className="cnl-group">
      <button type="button" className="cnl-group__header" onClick={onToggle}>
        <span className="cnl-group__icon">{meta.icon}</span>
        <span className="cnl-group__label">{meta.label}</span>
        <span className="cnl-group__count">{conversations.length}</span>
        {totalUnread > 0 && (
          <span
            className="cnl-group__unread"
            style={{ background: hasCritical ? '#ef4444' : '#7c5fe6' }}
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
        <span className="cnl-group__chevron">{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div className="cnl-group__body">
          {conversations.map((conv) => (
            <ConversationCard
              key={conv.id}
              conv={conv}
              active={conv.id === activeId}
              onSelect={onSelect}
              onPin={onPin}
              onMute={onMute}
              onArchive={onArchive}
              onFollow={onFollow}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConversationList({
  state,
  activeId,
  onSelect,
  onNewMessage,
  onRetry,
}: Props) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['direct', 'team', 'project', 'research', 'funding'])
  );
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [muted, setMuted] = useState<Set<string>>(new Set());
  const [archived, setArchived] = useState<Set<string>>(new Set());
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const togglePin = useCallback((id: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleMute = useCallback((id: string) => {
    setMuted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleArchive = useCallback((id: string) => {
    setArchived((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleFollow = useCallback((id: string) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleCategory = useCallback((catId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }, []);

  const enriched = useMemo<EnrichedConversation[]>(() => {
    const list = state.data ?? [];
    return list.map((c) => enrich(c, pinned, muted, archived, followed));
  }, [state.data, pinned, muted, archived, followed]);

  const filtered = useMemo(() => {
    let list = enriched.filter((c) => !c.isArchived || activeFilter === 'archived');

    if (activeFilter === 'unread') list = list.filter((c) => c.unreadCount > 0);
    else if (activeFilter === 'pinned') list = list.filter((c) => c.isPinned);
    else if (activeFilter === 'project') list = list.filter((c) => c.category === 'project');
    else if (activeFilter === 'research') list = list.filter((c) => c.category === 'research');
    else if (activeFilter === 'team') list = list.filter((c) => c.category === 'team');
    else if (activeFilter === 'funding') list = list.filter((c) => c.category === 'funding');
    else if (activeFilter === 'archived') list = list.filter((c) => c.isArchived);

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.lastMessage?.content.toLowerCase().includes(q) ||
          c.members.some((m) => m.name.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.activityScore - a.activityScore;
    });
  }, [enriched, activeFilter, query]);

  const grouped = useMemo(() => {
    const map = new Map<InnovationCategory, EnrichedConversation[]>();
    for (const conv of filtered) {
      const arr = map.get(conv.category) ?? [];
      arr.push(conv);
      map.set(conv.category, arr);
    }
    return map;
  }, [filtered]);

  const stats = useMemo(() => {
    const total = enriched.length;
    const totalUnread = enriched.reduce((s, c) => s + c.unreadCount, 0);
    const critical = enriched.filter((c) => c.priority === 'critical').length;
    const active = enriched.filter((c) => c.activityScore >= 50).length;
    return { total, totalUnread, critical, active };
  }, [enriched]);

  const categoriesWithConvs = CATEGORIES.filter((cat) => grouped.has(cat.id));

  return (
    <div className="cnl-root">
      {/* HEADER */}
      <div className="cnl-header">
        <div className="cnl-header__top">
          <div className="cnl-header__identity">
            <span className="cnl-header__eyebrow">Innovation Workspaces</span>
            <h2 className="cnl-header__title">
              Communications
              {stats.totalUnread > 0 && (
                <span className="cnl-header__unread-pill">{stats.totalUnread}</span>
              )}
            </h2>
          </div>
          <div className="cnl-header__actions">
            <button
              type="button"
              className={`cnl-icon-btn ${showStats ? 'cnl-icon-btn--active' : ''}`}
              onClick={() => setShowStats((s) => !s)}
              title="Activity overview"
            >
              📊
            </button>
            <button
              type="button"
              className={`cnl-icon-btn ${showSearch ? 'cnl-icon-btn--active' : ''}`}
              onClick={() => setShowSearch((s) => !s)}
              title="Search"
            >
              🔍
            </button>
            <Button onClick={onNewMessage}>+ New</Button>
          </div>
        </div>

        {/* STATS STRIP */}
        {showStats && (
          <div className="cnl-stats">
            <div className="cnl-stat">
              <span className="cnl-stat__value">{stats.total}</span>
              <span className="cnl-stat__label">Workspaces</span>
            </div>
            <div className="cnl-stat">
              <span className="cnl-stat__value" style={{ color: stats.totalUnread > 0 ? '#7c5fe6' : undefined }}>
                {stats.totalUnread}
              </span>
              <span className="cnl-stat__label">Unread</span>
            </div>
            <div className="cnl-stat">
              <span className="cnl-stat__value" style={{ color: stats.critical > 0 ? '#ef4444' : undefined }}>
                {stats.critical}
              </span>
              <span className="cnl-stat__label">Critical</span>
            </div>
            <div className="cnl-stat">
              <span className="cnl-stat__value" style={{ color: '#10b981' }}>{stats.active}</span>
              <span className="cnl-stat__label">Active</span>
            </div>
          </div>
        )}

        {/* SEARCH */}
        {showSearch && (
          <div className="cnl-search">
            <span className="cnl-search__icon">🔍</span>
            <input
              className="cnl-search__input"
              type="text"
              placeholder="Search workspaces, participants, topics…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button
                type="button"
                className="cnl-search__clear"
                onClick={() => setQuery('')}
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* FILTER CHIPS */}
        <div className="cnl-filters">
          {FILTERS.map((f) => {
            const count =
              f.id === 'unread'
                ? enriched.filter((c) => c.unreadCount > 0).length
                : f.id === 'pinned'
                ? enriched.filter((c) => c.isPinned).length
                : 0;

            return (
              <button
                key={f.id}
                type="button"
                className={`cnl-filter-chip ${activeFilter === f.id ? 'cnl-filter-chip--active' : ''}`}
                onClick={() => setActiveFilter(f.id)}
              >
                {f.label}
                {count > 0 && (
                  <span className="cnl-filter-chip__count">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* BODY */}
      <div className="cnl-body">
        {state.loading && !state.data && <MessagesSkeleton rows={6} />}

        {state.error && !state.data && (
          <ErrorState message={state.error} onRetry={onRetry} />
        )}

        {!state.loading && filtered.length === 0 && (
          <MessagesEmptyState
            title={query ? 'No results found' : 'No workspaces'}
            description={
              query
                ? `No conversations match "${query}". Try a different search.`
                : 'Create a new workspace to start collaborating on innovation projects.'
            }
            actionLabel="Create Workspace"
            onAction={onNewMessage}
          />
        )}

        {/* PINNED SECTION */}
        {activeFilter === 'all' && pinned.size > 0 && (
          <div className="cnl-group">
            <div className="cnl-group__header cnl-group__header--static">
              <span className="cnl-group__icon">📌</span>
              <span className="cnl-group__label">Pinned</span>
              <span className="cnl-group__count">{pinned.size}</span>
            </div>
            <div className="cnl-group__body">
              {filtered
                .filter((c) => c.isPinned)
                .map((conv) => (
                  <ConversationCard
                    key={conv.id}
                    conv={conv}
                    active={conv.id === activeId}
                    onSelect={onSelect}
                    onPin={togglePin}
                    onMute={toggleMute}
                    onArchive={toggleArchive}
                    onFollow={toggleFollow}
                  />
                ))}
            </div>
          </div>
        )}

        {/* PRIORITY ALERT */}
        {activeFilter === 'all' && stats.critical > 0 && (
          <div className="cnl-alert">
            <span className="cnl-alert__icon">⚡</span>
            <span className="cnl-alert__text">
              {stats.critical} workspace{stats.critical > 1 ? 's' : ''} need{stats.critical === 1 ? 's' : ''} immediate attention
            </span>
            <button
              type="button"
              className="cnl-alert__btn"
              onClick={() => setActiveFilter('unread')}
            >
              View
            </button>
          </div>
        )}

        {/* CATEGORY GROUPS */}
        {categoriesWithConvs.map((cat) => {
          const convs = grouped.get(cat.id) ?? [];
          return (
            <CategoryGroup
              key={cat.id}
              meta={cat}
              conversations={convs}
              activeId={activeId}
              expanded={expandedCategories.has(cat.id)}
              onToggle={() => toggleCategory(cat.id)}
              onSelect={onSelect}
              onPin={togglePin}
              onMute={toggleMute}
              onArchive={toggleArchive}
              onFollow={toggleFollow}
            />
          );
        })}

        {/* FLAT LIST when filtered */}
        {activeFilter !== 'all' && (
          <div className="cnl-flat-list">
            {filtered.map((conv) => (
              <ConversationCard
                key={conv.id}
                conv={conv}
                active={conv.id === activeId}
                onSelect={onSelect}
                onPin={togglePin}
                onMute={toggleMute}
                onArchive={toggleArchive}
                onFollow={toggleFollow}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        /* ROOT */
        .cnl-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #0f0f1a;
          border-right: 1px solid #1e1e30;
          min-width: 280px;
          max-width: 340px;
          overflow: hidden;
        }

        /* HEADER */
        .cnl-header {
          flex-shrink: 0;
          border-bottom: 1px solid #1e1e30;
        }

        .cnl-header__top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 1rem 1rem 0.75rem;
          gap: 0.5rem;
        }

        .cnl-header__eyebrow {
          display: block;
          font-size: 0.625rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #7c5fe6;
          margin-bottom: 0.25rem;
        }

        .cnl-header__title {
          margin: 0;
          font-size: 1.0625rem;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .cnl-header__unread-pill {
          padding: 0.125rem 0.5rem;
          background: #7c5fe6;
          border-radius: 10px;
          font-size: 0.6875rem;
          font-weight: 700;
          color: #fff;
        }

        .cnl-header__actions {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          flex-shrink: 0;
        }

        .cnl-icon-btn {
          background: none;
          border: 1px solid #2d2d3f;
          border-radius: 7px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.9375rem;
          transition: all 0.15s;
          color: #64748b;
        }
        .cnl-icon-btn:hover { border-color: #7c5fe6; background: rgba(124,95,230,0.1); }
        .cnl-icon-btn--active { border-color: #7c5fe6; background: rgba(124,95,230,0.15); color: #a78bfa; }

        /* STATS */
        .cnl-stats {
          display: flex;
          gap: 0;
          padding: 0 1rem 0.75rem;
        }
        .cnl-stat {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem;
          border-right: 1px solid #1e1e30;
        }
        .cnl-stat:last-child { border-right: none; }
        .cnl-stat__value {
          font-size: 1.125rem;
          font-weight: 700;
          color: #e2e8f0;
          line-height: 1;
        }
        .cnl-stat__label {
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #475569;
          margin-top: 0.25rem;
        }

        /* SEARCH */
        .cnl-search {
          display: flex;
          align-items: center;
          margin: 0 0.75rem 0.75rem;
          background: #1a1a2e;
          border: 1px solid #2d2d3f;
          border-radius: 8px;
          padding: 0 0.75rem;
          gap: 0.5rem;
        }
        .cnl-search__icon { font-size: 0.875rem; color: #475569; flex-shrink: 0; }
        .cnl-search__input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: #e2e8f0;
          font-size: 0.875rem;
          padding: 0.625rem 0;
        }
        .cnl-search__input::placeholder { color: #475569; }
        .cnl-search__clear {
          background: none;
          border: none;
          color: #475569;
          font-size: 1.125rem;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        /* FILTERS */
        .cnl-filters {
          display: flex;
          gap: 0.375rem;
          padding: 0 0.75rem 0.75rem;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .cnl-filters::-webkit-scrollbar { display: none; }

        .cnl-filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.625rem;
          background: #1a1a2e;
          border: 1px solid #2d2d3f;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .cnl-filter-chip:hover { border-color: #7c5fe6; color: #a78bfa; }
        .cnl-filter-chip--active {
          background: rgba(124,95,230,0.15);
          border-color: #7c5fe6;
          color: #a78bfa;
        }
        .cnl-filter-chip__count {
          padding: 0.0625rem 0.375rem;
          background: #7c5fe6;
          border-radius: 10px;
          font-size: 0.625rem;
          font-weight: 700;
          color: #fff;
        }

        /* BODY */
        .cnl-body {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem 0;
        }
        .cnl-body::-webkit-scrollbar { width: 4px; }
        .cnl-body::-webkit-scrollbar-track { background: transparent; }
        .cnl-body::-webkit-scrollbar-thumb { background: #2d2d3f; border-radius: 2px; }

        /* PRIORITY ALERT */
        .cnl-alert {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 0.75rem 0.5rem;
          padding: 0.625rem 0.75rem;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 8px;
          font-size: 0.8125rem;
        }
        .cnl-alert__icon { font-size: 1rem; }
        .cnl-alert__text { flex: 1; color: #f87171; font-weight: 500; }
        .cnl-alert__btn {
          background: rgba(239,68,68,0.15);
          border: none;
          border-radius: 5px;
          padding: 0.25rem 0.625rem;
          color: #f87171;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .cnl-alert__btn:hover { background: rgba(239,68,68,0.25); }

        /* GROUP */
        .cnl-group { margin-bottom: 0.25rem; }

        .cnl-group__header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.5rem 1rem;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background 0.1s;
        }
        .cnl-group__header:hover { background: rgba(255,255,255,0.03); }
        .cnl-group__header--static { cursor: default; }
        .cnl-group__header--static:hover { background: none; }

        .cnl-group__icon { font-size: 0.875rem; flex-shrink: 0; }
        .cnl-group__label {
          flex: 1;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #64748b;
        }
        .cnl-group__count {
          font-size: 0.6875rem;
          color: #475569;
          font-weight: 500;
          background: #1e1e30;
          padding: 0.0625rem 0.375rem;
          border-radius: 10px;
        }
        .cnl-group__unread {
          font-size: 0.625rem;
          font-weight: 700;
          color: #fff;
          padding: 0.125rem 0.375rem;
          border-radius: 10px;
        }
        .cnl-group__chevron {
          font-size: 0.6875rem;
          color: #475569;
          flex-shrink: 0;
        }

        .cnl-group__body { padding-bottom: 0.25rem; }

        /* FLAT LIST */
        .cnl-flat-list { padding: 0 0 0.5rem; }

        /* CONVERSATION CARD */
        .cnl-card {
          position: relative;
          margin: 0 0.375rem 0.25rem;
          border-radius: 9px;
          transition: background 0.1s;
        }
        .cnl-card:hover { background: rgba(255,255,255,0.04); }
        .cnl-card--active { background: rgba(124,95,230,0.12) !important; }
        .cnl-card--muted { opacity: 0.6; }

        .cnl-card__main {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.625rem 0.75rem;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          width: 100%;
          border-radius: 9px;
        }

        .cnl-card__avatar {
          position: relative;
          flex-shrink: 0;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1px solid;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cnl-card__cat-icon { font-size: 1.125rem; }
        .cnl-card__pin {
          position: absolute;
          top: -6px;
          right: -6px;
          font-size: 0.625rem;
        }

        .cnl-card__content { flex: 1; min-width: 0; }

        .cnl-card__row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          margin-bottom: 0.125rem;
        }
        .cnl-card__row--sub { margin-bottom: 0.375rem; }

        .cnl-card__title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #e2e8f0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
        }

        .cnl-card__meta {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          flex-shrink: 0;
        }

        .cnl-card__badge {
          padding: 0.125rem 0.4375rem;
          background: #7c5fe6;
          border-radius: 10px;
          font-size: 0.625rem;
          font-weight: 700;
          color: #fff;
        }

        .cnl-card__time {
          font-size: 0.6875rem;
          color: #475569;
          white-space: nowrap;
        }

        .cnl-card__preview {
          margin: 0;
          font-size: 0.8125rem;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cnl-card__footer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: nowrap;
        }

        .cnl-card__type-badge {
          font-size: 0.625rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          padding: 0.0625rem 0.375rem;
          border-radius: 4px;
          border: 1px solid;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .cnl-card__avatars {
          display: flex;
          flex-direction: row-reverse;
          margin-left: auto;
          flex-shrink: 0;
        }
        .cnl-card__member {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #7c5fe6;
          border: 1.5px solid #0f0f1a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.5625rem;
          font-weight: 700;
          color: #fff;
          margin-left: -5px;
          cursor: default;
        }
        .cnl-card__member--more { background: #252538; color: #94a3b8; }

        /* ACTIVITY BAR */
        .cnl-activity-bar {
          flex: 1;
          height: 3px;
          background: #1e1e30;
          border-radius: 2px;
          overflow: hidden;
          min-width: 24px;
          max-width: 48px;
        }
        .cnl-activity-bar__fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s;
        }

        /* PRIORITY DOT */
        .cnl-priority-dot {
          display: block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* HOVER ACTIONS */
        .cnl-card__actions {
          position: absolute;
          top: 4px;
          right: 4px;
          display: flex;
          gap: 0.125rem;
          background: #13131f;
          border: 1px solid #2d2d3f;
          border-radius: 7px;
          padding: 0.25rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        .cnl-card__action {
          background: none;
          border: none;
          width: 26px;
          height: 26px;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background 0.15s;
        }
        .cnl-card__action:hover { background: #252538; }
      `}</style>
    </div>
  );
}
