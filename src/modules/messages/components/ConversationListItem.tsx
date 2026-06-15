/**
 * ConversationListItem — Enterprise Collaboration Record
 *
 * A pure presentational component representing a single Innovation Workspace,
 * Research Workspace, Funding Workspace, or any structured collaboration
 * environment within Maylet XLab's Innovation Operating System.
 *
 * Performance: styles injected once at module level (not per-render).
 * Suitable for virtualized lists of 10,000+ records.
 *
 * @example
 * <ConversationListItem
 *   conversationId="conv-abc"
 *   title="Smart Irrigation System"
 *   type="project"
 *   status="active"
 *   priority="high"
 *   lastActivityAt={new Date().toISOString()}
 *   unreadCount={3}
 *   participantCount={8}
 *   associatedProject="Smart Irrigation System"
 *   activityScore={82}
 *   onSelect={(id) => navigate(`/messages/${id}`)}
 * />
 */

import { memo, useCallback, KeyboardEvent } from 'react';

// ============================================================================
// 1. TYPE DEFINITIONS
// ============================================================================

export type ConversationType =
  | 'direct'
  | 'group'
  | 'project'
  | 'research'
  | 'prototype'
  | 'experiment'
  | 'validation'
  | 'funding'
  | 'commercialization'
  | 'community'
  | 'enterprise';

export type ConversationStatus =
  | 'active'
  | 'pending'
  | 'review'
  | 'blocked'
  | 'at_risk'
  | 'completed'
  | 'archived'
  | 'cancelled';

export type PriorityLevel =
  | 'critical'
  | 'escalated'
  | 'high'
  | 'medium'
  | 'low'
  | 'dormant';

export interface InteractionEvent {
  conversationId: string;
  action: 'select' | 'pin' | 'mute' | 'archive' | 'follow' | 'escalate';
  timestamp: number;
}

export interface ConversationListItemProps {
  // Core identity
  conversationId: string;
  title: string;
  description?: string;
  type: ConversationType;
  status: ConversationStatus;
  priority: PriorityLevel;

  // Activity
  lastMessage?: string;
  lastActivityAt: string;
  lastActivityActor?: string;
  activityScore?: number; // 0–100

  // Counts
  unreadCount: number;
  participantCount: number;
  mentionsCount?: number;

  // State flags
  isPinned?: boolean;
  isMuted?: boolean;
  isSelected?: boolean;

  // Associations
  associatedProject?: string;
  associatedResearch?: string;
  associatedWorkspace?: string;

  // Display
  avatarUrl?: string;

  // Action callbacks
  onSelect?: (id: string) => void;
  onPin?: (id: string) => void;
  onArchive?: (id: string) => void;
  onMute?: (id: string) => void;
  onFollow?: (id: string) => void;
  onEscalate?: (id: string) => void;

  // Telemetry (optional observability hook)
  onInteraction?: (event: InteractionEvent) => void;
}

// ============================================================================
// 2. MODULE-LEVEL CONSTANTS
// All lookups are O(1) and allocated once — never recreated during renders.
// ============================================================================

const TYPE_META: Record<
  ConversationType,
  { icon: string; label: string; colorVar: string }
> = {
  direct:            { icon: '💬', label: 'Direct',          colorVar: 'var(--clir-type-direct)' },
  group:             { icon: '👥', label: 'Group',           colorVar: 'var(--clir-type-group)' },
  project:           { icon: '📁', label: 'Project',         colorVar: 'var(--clir-type-project)' },
  research:          { icon: '🔬', label: 'Research',        colorVar: 'var(--clir-type-research)' },
  prototype:         { icon: '🛠️', label: 'Prototype',       colorVar: 'var(--clir-type-prototype)' },
  experiment:        { icon: '🧪', label: 'Experiment',      colorVar: 'var(--clir-type-experiment)' },
  validation:        { icon: '✅', label: 'Validation',      colorVar: 'var(--clir-type-validation)' },
  funding:           { icon: '💰', label: 'Funding',         colorVar: 'var(--clir-type-funding)' },
  commercialization: { icon: '🚀', label: 'Commercial.',     colorVar: 'var(--clir-type-commercialization)' },
  community:         { icon: '🌐', label: 'Community',       colorVar: 'var(--clir-type-community)' },
  enterprise:        { icon: '🏢', label: 'Enterprise',      colorVar: 'var(--clir-type-enterprise)' },
};

const STATUS_META: Record<
  ConversationStatus,
  { label: string; colorVar: string }
> = {
  active:    { label: 'Active',     colorVar: 'var(--clir-status-active)' },
  pending:   { label: 'Pending',    colorVar: 'var(--clir-status-pending)' },
  review:    { label: 'Review',     colorVar: 'var(--clir-status-review)' },
  blocked:   { label: 'Blocked',    colorVar: 'var(--clir-status-blocked)' },
  at_risk:   { label: 'At Risk',    colorVar: 'var(--clir-status-at-risk)' },
  completed: { label: 'Completed',  colorVar: 'var(--clir-status-completed)' },
  archived:  { label: 'Archived',   colorVar: 'var(--clir-status-archived)' },
  cancelled: { label: 'Cancelled',  colorVar: 'var(--clir-status-cancelled)' },
};

const PRIORITY_META: Record<
  PriorityLevel,
  { label: string; colorVar: string; hasPulse: boolean }
> = {
  critical:  { label: 'Critical',  colorVar: 'var(--clir-priority-critical)',  hasPulse: true },
  escalated: { label: 'Escalated', colorVar: 'var(--clir-priority-escalated)', hasPulse: true },
  high:      { label: 'High',      colorVar: 'var(--clir-priority-high)',       hasPulse: false },
  medium:    { label: 'Medium',    colorVar: 'var(--clir-priority-medium)',     hasPulse: false },
  low:       { label: 'Low',       colorVar: 'var(--clir-priority-low)',        hasPulse: false },
  dormant:   { label: 'Dormant',   colorVar: 'var(--clir-priority-dormant)',    hasPulse: false },
};

// ============================================================================
// 3. UTILITY HELPERS
// ============================================================================

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const min = Math.floor(diffMs / 60_000);
  if (min < 1)  return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr  < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d   <  7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function truncate(text: string, max = 72): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function buildAriaLabel(props: ConversationListItemProps): string {
  const type  = TYPE_META[props.type]?.label ?? props.type;
  const status = STATUS_META[props.status]?.label ?? props.status;
  const parts: string[] = [`${type} workspace: ${props.title}`, `Status: ${status}`];
  if (props.unreadCount > 0) parts.push(`${props.unreadCount} unread`);
  if (props.mentionsCount && props.mentionsCount > 0) parts.push(`${props.mentionsCount} mentions`);
  if (props.isPinned)  parts.push('Pinned');
  if (props.isMuted)   parts.push('Muted');
  return parts.join('. ');
}

function rootClass(props: ConversationListItemProps): string {
  const classes = ['clir'];
  if (props.isSelected)               classes.push('clir--selected');
  if (props.unreadCount > 0)          classes.push('clir--unread');
  if (props.isPinned)                 classes.push('clir--pinned');
  if (props.isMuted)                  classes.push('clir--muted');
  if (props.priority === 'critical' || props.priority === 'escalated') {
    classes.push('clir--critical');
  }
  return classes.join(' ');
}

// ============================================================================
// 4. STYLE SINGLETON — injected exactly once, never per render
// ============================================================================

let _stylesInjected = false;

function ensureStyles(): void {
  if (_stylesInjected || typeof document === 'undefined') return;
  _stylesInjected = true;

  const el = document.createElement('style');
  el.setAttribute('data-clir-styles', '1');
  el.textContent = CLIR_CSS;
  document.head.appendChild(el);
}

// CSS is defined as a module-level string constant.
// Using CSS custom properties for every design token so consumers can override
// by setting variables on a parent element or :root.
const CLIR_CSS = `
  /* ── Design Tokens ──────────────────────────────────────────────────── */
  :root {
    /* Type colors */
    --clir-type-direct:            #7c5fe6;
    --clir-type-group:             #3b82f6;
    --clir-type-project:           #10b981;
    --clir-type-research:          #8b5cf6;
    --clir-type-prototype:         #f59e0b;
    --clir-type-experiment:        #ec4899;
    --clir-type-validation:        #06b6d4;
    --clir-type-funding:           #84cc16;
    --clir-type-commercialization: #f97316;
    --clir-type-community:         #14b8a6;
    --clir-type-enterprise:        #6366f1;

    /* Status colors */
    --clir-status-active:    #10b981;
    --clir-status-pending:   #f59e0b;
    --clir-status-review:    #3b82f6;
    --clir-status-blocked:   #ef4444;
    --clir-status-at-risk:   #f97316;
    --clir-status-completed: #64748b;
    --clir-status-archived:  #475569;
    --clir-status-cancelled: #94a3b8;

    /* Priority colors */
    --clir-priority-critical:  #ef4444;
    --clir-priority-escalated: #f97316;
    --clir-priority-high:      #f59e0b;
    --clir-priority-medium:    #7c5fe6;
    --clir-priority-low:       #64748b;
    --clir-priority-dormant:   #334155;

    /* Surface */
    --clir-bg:           transparent;
    --clir-bg-hover:     rgba(255, 255, 255, 0.04);
    --clir-bg-selected:  rgba(124, 95, 230, 0.13);
    --clir-bg-critical:  rgba(239, 68, 68, 0.06);
    --clir-border:       rgba(255, 255, 255, 0.05);

    /* Text */
    --clir-text-primary:   #e2e8f0;
    --clir-text-secondary: #94a3b8;
    --clir-text-muted:     #475569;

    /* Radius / spacing */
    --clir-radius: 10px;
    --clir-gap:    0.625rem;
  }

  /* Light mode overrides */
  @media (prefers-color-scheme: light) {
    :root {
      --clir-bg-hover:     rgba(0, 0, 0, 0.04);
      --clir-bg-selected:  rgba(124, 95, 230, 0.10);
      --clir-bg-critical:  rgba(239, 68, 68, 0.05);
      --clir-border:       rgba(0, 0, 0, 0.08);
      --clir-text-primary:   #0f172a;
      --clir-text-secondary: #475569;
      --clir-text-muted:     #94a3b8;
    }
  }

  /* ── Root ────────────────────────────────────────────────────────────── */
  .clir {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: var(--clir-gap);
    padding: 0.625rem 0.75rem;
    margin: 0 0.25rem 0.125rem;
    border-radius: var(--clir-radius);
    background: var(--clir-bg);
    border: 1px solid transparent;
    cursor: pointer;
    transition: background 0.12s ease, border-color 0.12s ease;
    text-align: left;
    width: 100%;
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
    outline: none;
  }
  .clir:hover   { background: var(--clir-bg-hover); }
  .clir:focus-visible {
    outline: 2px solid var(--clir-type-project);
    outline-offset: 1px;
  }
  .clir--selected { background: var(--clir-bg-selected); border-color: var(--clir-border); }
  .clir--critical { background: var(--clir-bg-critical); }
  .clir--unread .clir-title { font-weight: 700; color: var(--clir-text-primary); }
  .clir--muted  { opacity: 0.55; }
  .clir--pinned .clir-avatar { position: relative; }

  /* ── Avatar ──────────────────────────────────────────────────────────── */
  .clir-avatar {
    position: relative;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    overflow: visible;
  }
  .clir-avatar__img {
    width: 100%;
    height: 100%;
    border-radius: 10px;
    object-fit: cover;
  }
  .clir-avatar__initials {
    width: 100%;
    height: 100%;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.03em;
    user-select: none;
  }
  .clir-avatar__pin {
    position: absolute;
    top: -5px;
    right: -5px;
    font-size: 0.6rem;
    line-height: 1;
    background: #0f0f1a;
    border-radius: 50%;
    padding: 1px;
  }
  .clir-avatar__pulse {
    position: absolute;
    inset: -3px;
    border-radius: 13px;
    border: 2px solid var(--clir-priority-critical);
    animation: clir-pulse 1.8s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes clir-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(1.08); }
  }

  /* ── Content ─────────────────────────────────────────────────────────── */
  .clir-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  /* Title row */
  .clir-title-row {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    min-width: 0;
  }
  .clir-title {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--clir-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
  }
  .clir-title-badges {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  /* Meta row */
  .clir-meta-row {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex-wrap: nowrap;
    overflow: hidden;
    min-width: 0;
  }
  .clir-type-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.0625rem 0.375rem;
    border-radius: 4px;
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    border: 1px solid;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .clir-sep {
    color: var(--clir-text-muted);
    font-size: 0.625rem;
    flex-shrink: 0;
  }
  .clir-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.6875rem;
    color: var(--clir-text-secondary);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .clir-status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .clir-priority-pill {
    display: inline-flex;
    align-items: center;
    padding: 0.0625rem 0.375rem;
    border-radius: 4px;
    font-size: 0.5625rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* Preview */
  .clir-preview {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--clir-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
  }
  .clir-preview--empty {
    color: var(--clir-text-muted);
    font-style: italic;
  }

  /* Context (associated assets) */
  .clir-context {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex-wrap: nowrap;
    overflow: hidden;
  }
  .clir-context__item {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.6875rem;
    color: var(--clir-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
  }
  .clir-context__icon { flex-shrink: 0; font-size: 0.625rem; }

  /* Activity bar */
  .clir-health {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    height: 3px;
    border-radius: 2px;
    background: rgba(255,255,255,0.07);
    overflow: hidden;
    min-width: 32px;
    max-width: 56px;
  }
  .clir-health__fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.4s ease;
  }

  /* Footer */
  .clir-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: nowrap;
    overflow: hidden;
  }
  .clir-participants {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.6875rem;
    color: var(--clir-text-muted);
    flex-shrink: 0;
  }
  .clir-actor {
    flex: 1;
    font-size: 0.6875rem;
    color: var(--clir-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .clir-time {
    font-size: 0.6875rem;
    color: var(--clir-text-muted);
    white-space: nowrap;
    flex-shrink: 0;
    margin-left: auto;
  }

  /* ── Right column: badges ────────────────────────────────────────────── */
  .clir-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.3rem;
    flex-shrink: 0;
  }
  .clir-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 0.3rem;
    border-radius: 9px;
    font-size: 0.625rem;
    font-weight: 700;
    color: #fff;
    line-height: 1;
  }
  .clir-badge--unread  { background: var(--clir-type-project); }
  .clir-badge--mention { background: var(--clir-priority-high); }
  .clir-badge--muted   { background: transparent; border: 1px solid var(--clir-text-muted); color: var(--clir-text-muted); font-size: 0.5625rem; }

  /* ── Hover Actions (CSS-only reveal — zero JS state) ─────────────────── */
  .clir-actions {
    display: none;
    position: absolute;
    top: 0.375rem;
    right: 0.375rem;
    align-items: center;
    gap: 0.125rem;
    background: #13131f;
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 8px;
    padding: 0.25rem;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    z-index: 10;
  }
  .clir:hover        .clir-actions { display: flex; }
  .clir:focus-within .clir-actions { display: flex; }

  .clir-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: none;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.12s;
    color: var(--clir-text-secondary);
  }
  .clir-action-btn:hover        { background: rgba(255,255,255,0.08); }
  .clir-action-btn:focus-visible {
    outline: 2px solid var(--clir-type-project);
    outline-offset: 1px;
  }

  /* ── Responsive ──────────────────────────────────────────────────────── */
  @media (max-width: 480px) {
    .clir { padding: 0.5rem; gap: 0.5rem; }
    .clir-avatar { width: 34px; height: 34px; font-size: 1rem; }
    .clir-meta-row { display: none; }
    .clir-context { display: none; }
  }

  /* Collapsed sidebar: icon-only mode */
  .clir-collapsed .clir { padding: 0.5rem; justify-content: center; }
  .clir-collapsed .clir-content,
  .clir-collapsed .clir-right { display: none; }
  .clir-collapsed .clir-avatar { width: 36px; height: 36px; }

  /* ── High-contrast ───────────────────────────────────────────────────── */
  @media (forced-colors: active) {
    .clir-badge { border: 1px solid ButtonText; }
    .clir--selected { border-color: Highlight; }
  }
`;

// ============================================================================
// 5. COMPONENT IMPLEMENTATION
// ============================================================================

function ConversationListItemBase(props: ConversationListItemProps) {
  // Inject global styles exactly once per page load
  ensureStyles();

  const {
    conversationId,
    title,
    description,
    type,
    status,
    priority,
    lastMessage,
    lastActivityAt,
    lastActivityActor,
    activityScore,
    unreadCount,
    participantCount,
    mentionsCount = 0,
    isPinned = false,
    isMuted = false,
    isSelected = false,
    associatedProject,
    associatedResearch,
    associatedWorkspace,
    avatarUrl,
    onSelect,
    onPin,
    onArchive,
    onMute,
    onFollow,
    onEscalate,
    onInteraction,
  } = props;

  // ── Stable event handlers (useCallback ensures no prop-change re-renders
  //    when parent passes stable onSelect etc. via its own useCallback)
  const handleSelect = useCallback(() => {
    onInteraction?.({ conversationId, action: 'select', timestamp: Date.now() });
    onSelect?.(conversationId);
  }, [conversationId, onSelect, onInteraction]);

  const handlePin = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onInteraction?.({ conversationId, action: 'pin', timestamp: Date.now() });
    onPin?.(conversationId);
  }, [conversationId, onPin, onInteraction]);

  const handleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onInteraction?.({ conversationId, action: 'mute', timestamp: Date.now() });
    onMute?.(conversationId);
  }, [conversationId, onMute, onInteraction]);

  const handleArchive = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onInteraction?.({ conversationId, action: 'archive', timestamp: Date.now() });
    onArchive?.(conversationId);
  }, [conversationId, onArchive, onInteraction]);

  const handleFollow = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onInteraction?.({ conversationId, action: 'follow', timestamp: Date.now() });
    onFollow?.(conversationId);
  }, [conversationId, onFollow, onInteraction]);

  const handleEscalate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onInteraction?.({ conversationId, action: 'escalate', timestamp: Date.now() });
    onEscalate?.(conversationId);
  }, [conversationId, onEscalate, onInteraction]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onInteraction?.({ conversationId, action: 'select', timestamp: Date.now() });
      onSelect?.(conversationId);
    }
  }, [conversationId, onSelect, onInteraction]);

  // ── Derived display values (computed inline, no state)
  const typeMeta     = TYPE_META[type]     ?? TYPE_META.direct;
  const statusMeta   = STATUS_META[status] ?? STATUS_META.active;
  const priorityMeta = PRIORITY_META[priority] ?? PRIORITY_META.low;

  const relativeTime = formatRelativeTime(lastActivityAt);
  const preview      = lastMessage ? truncate(lastMessage) : description ?? '';
  const healthScore  = activityScore != null ? Math.min(100, Math.max(0, activityScore)) : null;
  const healthColor  =
    healthScore === null  ? 'transparent'
    : healthScore >= 70   ? 'var(--clir-status-active)'
    : healthScore >= 40   ? 'var(--clir-priority-high)'
    : 'var(--clir-priority-critical)';

  const hasContext    = !!(associatedProject || associatedResearch || associatedWorkspace);
  const showPulse     = priorityMeta.hasPulse && unreadCount > 0;
  const clirClass     = rootClass(props);
  const ariaLabel     = buildAriaLabel(props);

  return (
    <div
      className={clirClass}
      role="option"
      aria-selected={isSelected}
      aria-label={ariaLabel}
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      data-testid="conversation-item"
      data-conversation-id={conversationId}
      data-type={type}
      data-status={status}
      data-priority={priority}
    >
      {/* ── Avatar ────────────────────────────────────────────────────── */}
      <div className="clir-avatar" aria-hidden="true">
        {showPulse && <span className="clir-avatar__pulse" />}

        {avatarUrl ? (
          <img
            className="clir-avatar__img"
            src={avatarUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onError={(e) => {
              // Graceful fallback if image fails
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              const sib = e.currentTarget.nextElementSibling;
              if (sib) (sib as HTMLElement).style.display = 'flex';
            }}
          />
        ) : null}

        <span
          className="clir-avatar__initials"
          style={{
            background: `${typeMeta.colorVar}22`,
            color: typeMeta.colorVar,
            border: `1.5px solid ${typeMeta.colorVar}40`,
            display: avatarUrl ? 'none' : 'flex',
          }}
        >
          {typeMeta.icon}
        </span>

        {isPinned && (
          <span className="clir-avatar__pin" title="Pinned">📌</span>
        )}
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="clir-content">

        {/* Row 1 — Title + inline badges */}
        <div className="clir-title-row">
          <span
            className="clir-title"
            data-testid="conversation-title"
            title={title}
          >
            {title}
          </span>

          <div className="clir-title-badges" aria-hidden="true">
            {isMuted && (
              <span className="clir-badge clir-badge--muted" title="Muted">🔕</span>
            )}
          </div>
        </div>

        {/* Row 2 — Type · Status · Priority */}
        <div className="clir-meta-row" aria-hidden="true">
          <span
            className="clir-type-badge"
            data-testid="conversation-type"
            style={{
              color: typeMeta.colorVar,
              borderColor: `${typeMeta.colorVar}50`,
              background: `${typeMeta.colorVar}15`,
            }}
          >
            {typeMeta.icon} {typeMeta.label}
          </span>

          <span className="clir-sep">·</span>

          <span className="clir-status-pill" data-testid="conversation-status">
            <span
              className="clir-status-dot"
              style={{ background: statusMeta.colorVar }}
            />
            {statusMeta.label}
          </span>

          {priority !== 'low' && priority !== 'dormant' && (
            <>
              <span className="clir-sep">·</span>
              <span
                className="clir-priority-pill"
                data-testid="conversation-priority"
                style={{
                  color: priorityMeta.colorVar,
                  background: `${priorityMeta.colorVar}18`,
                  border: `1px solid ${priorityMeta.colorVar}40`,
                }}
              >
                {priorityMeta.label}
              </span>
            </>
          )}
        </div>

        {/* Row 3 — Preview */}
        {preview ? (
          <p
            className="clir-preview"
            data-testid="conversation-preview"
          >
            {preview}
          </p>
        ) : (
          <p className="clir-preview clir-preview--empty">No messages yet</p>
        )}

        {/* Row 4 — Innovation context associations */}
        {hasContext && (
          <div className="clir-context" aria-label="Associated assets">
            {associatedProject && (
              <span className="clir-context__item" title={`Project: ${associatedProject}`}>
                <span className="clir-context__icon">📁</span>
                {associatedProject}
              </span>
            )}
            {associatedResearch && (
              <span className="clir-context__item" title={`Research: ${associatedResearch}`}>
                <span className="clir-context__icon">🔬</span>
                {associatedResearch}
              </span>
            )}
            {associatedWorkspace && !associatedProject && !associatedResearch && (
              <span className="clir-context__item" title={`Workspace: ${associatedWorkspace}`}>
                <span className="clir-context__icon">🏢</span>
                {associatedWorkspace}
              </span>
            )}
          </div>
        )}

        {/* Row 5 — Footer: participants, activity, time */}
        <div className="clir-footer" aria-hidden="true">
          <span className="clir-participants" title={`${participantCount} participants`}>
            👤 {participantCount}
          </span>

          {healthScore !== null && (
            <div
              className="clir-health"
              title={`Activity score: ${healthScore}/100`}
              role="meter"
              aria-valuenow={healthScore}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Activity score"
            >
              <div
                className="clir-health__fill"
                style={{ width: `${healthScore}%`, background: healthColor }}
              />
            </div>
          )}

          {lastActivityActor && (
            <span className="clir-actor" title={`Last activity by ${lastActivityActor}`}>
              {lastActivityActor}
            </span>
          )}

          <span className="clir-time" title={new Date(lastActivityAt).toLocaleString()}>
            {relativeTime}
          </span>
        </div>
      </div>

      {/* ── Right column: count badges ────────────────────────────────── */}
      <div className="clir-right" aria-hidden="true">
        {unreadCount > 0 && !isMuted && (
          <span
            className="clir-badge clir-badge--unread"
            data-testid="conversation-unread"
            title={`${unreadCount} unread`}
            style={{ background: typeMeta.colorVar }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {mentionsCount > 0 && (
          <span
            className="clir-badge clir-badge--mention"
            title={`${mentionsCount} mention${mentionsCount > 1 ? 's' : ''}`}
          >
            @{mentionsCount > 9 ? '9+' : mentionsCount}
          </span>
        )}
      </div>

      {/* ── Hover action toolbar (CSS-revealed, zero JS state) ────────── */}
      <div
        className="clir-actions"
        data-testid="conversation-actions"
        role="toolbar"
        aria-label="Workspace actions"
        onClick={(e) => e.stopPropagation()}
      >
        {onPin && (
          <button
            type="button"
            className="clir-action-btn"
            onClick={handlePin}
            aria-label={isPinned ? 'Unpin workspace' : 'Pin workspace'}
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            📌
          </button>
        )}
        {onFollow && (
          <button
            type="button"
            className="clir-action-btn"
            onClick={handleFollow}
            aria-label="Follow workspace"
            title="Follow"
          >
            👁
          </button>
        )}
        {onMute && (
          <button
            type="button"
            className="clir-action-btn"
            onClick={handleMute}
            aria-label={isMuted ? 'Unmute workspace' : 'Mute workspace'}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔔' : '🔕'}
          </button>
        )}
        {onEscalate && (
          <button
            type="button"
            className="clir-action-btn"
            onClick={handleEscalate}
            aria-label="Escalate workspace"
            title="Escalate"
          >
            ⚡
          </button>
        )}
        {onArchive && (
          <button
            type="button"
            className="clir-action-btn"
            onClick={handleArchive}
            aria-label="Archive workspace"
            title="Archive"
          >
            📦
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 6. PERFORMANCE — React.memo with shallow prop equality (default)
//    All props are primitives or stable callbacks → zero unnecessary re-renders
//    when parent correctly applies useCallback to action handlers.
// ============================================================================

export const ConversationListItem = memo(ConversationListItemBase);

// Named display for React DevTools
ConversationListItemBase.displayName = 'ConversationListItem';
