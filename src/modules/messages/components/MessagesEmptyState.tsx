/**
 * MessagesEmptyState — Enterprise Collaboration Activation Experience
 *
 * Transforms an empty workspace into an onboarding and engagement surface.
 * Each scenario has distinct guidance, illustrations, and actions that help
 * users immediately understand how communication fits into Maylet XLab.
 *
 * Backward compatible: callers using { title, description, actionLabel, onAction }
 * continue to work exactly as before, now with an enhanced visual presentation.
 */

import { memo, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type EmptyStateVariant =
  | 'no_selection'   // User has conversations but none selected
  | 'no_conversations' // First-time / no conversations exist
  | 'no_results'     // Search returned zero matches
  | 'no_team'        // No team workspaces
  | 'no_project'     // No project workspaces
  | 'no_research'    // No research workspaces
  | 'no_community';  // No community workspaces

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  description: string;
  color: string;
}

interface MessagesEmptyStateProps {
  // Backward-compatible props (all callers continue to work)
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;

  // Enterprise scenario
  variant?: EmptyStateVariant;
  searchQuery?: string;
  context?: 'project' | 'research' | 'validation' | 'funding' | 'community' | 'team' | 'general';

  // Action callbacks
  onCreateConversation?: () => void;
  onCreateWorkspace?: () => void;
  onBrowseAll?: () => void;
  onInviteTeam?: () => void;
  onClearSearch?: () => void;
  onQuickStart?: (workspaceType: string) => void;

  // Telemetry
  onActionClick?: (actionId: string) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const WORKSPACE_TYPES: QuickAction[] = [
  {
    id: 'project',
    icon: '📁',
    label: 'Project Workspace',
    description: 'Collaborate around innovation projects',
    color: '#10b981',
  },
  {
    id: 'research',
    icon: '🔬',
    label: 'Research Workspace',
    description: 'Drive scientific and technical research',
    color: '#8b5cf6',
  },
  {
    id: 'validation',
    icon: '✅',
    label: 'Validation Review',
    description: 'Manage reviews and approvals',
    color: '#06b6d4',
  },
  {
    id: 'funding',
    icon: '💰',
    label: 'Funding Discussion',
    description: 'Connect with investors and grant bodies',
    color: '#84cc16',
  },
  {
    id: 'team',
    icon: '👥',
    label: 'Team Workspace',
    description: 'Internal team collaboration hub',
    color: '#3b82f6',
  },
  {
    id: 'community',
    icon: '🌐',
    label: 'Community',
    description: 'Open innovation community discussions',
    color: '#14b8a6',
  },
];

const PLATFORM_FEATURES = [
  {
    icon: '🔗',
    label: 'Asset-Connected',
    desc: 'Every conversation links to projects, research, prototypes, and innovation assets.',
  },
  {
    icon: '⚖️',
    label: 'Decision-Ready',
    desc: 'Track decisions, actions, and approvals directly inside collaboration workspaces.',
  },
  {
    icon: '✦',
    label: 'AI-Assisted',
    desc: 'MAYA provides real-time insights, summaries, and recommendations as you collaborate.',
  },
];

// ============================================================================
// STYLE SINGLETON
// ============================================================================

let _stylesInjected = false;
function ensureStyles(): void {
  if (_stylesInjected || typeof document === 'undefined') return;
  _stylesInjected = true;
  const el = document.createElement('style');
  el.setAttribute('data-mes-styles', '1');
  el.textContent = MES_CSS;
  document.head.appendChild(el);
}

const MES_CSS = `
  :root {
    --mes-bg:        transparent;
    --mes-surface:   rgba(255,255,255,0.03);
    --mes-border:    rgba(255,255,255,0.07);
    --mes-primary:   #7c5fe6;
    --mes-text:      #e2e8f0;
    --mes-text-sub:  #94a3b8;
    --mes-text-muted:#475569;
    --mes-radius:    12px;
  }
  @media (prefers-color-scheme: light) {
    :root {
      --mes-surface:   rgba(0,0,0,0.02);
      --mes-border:    rgba(0,0,0,0.07);
      --mes-text:      #0f172a;
      --mes-text-sub:  #475569;
      --mes-text-muted:#94a3b8;
    }
  }

  /* Root */
  .mes {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    text-align: center;
    padding: 2rem 1.5rem;
    gap: 1.5rem;
    width: 100%;
    max-width: 560px;
    margin: 0 auto;
    box-sizing: border-box;
  }

  /* Illustration area */
  .mes-illustration {
    width: 120px;
    height: 120px;
    flex-shrink: 0;
  }

  /* Hero text */
  .mes-hero { display: flex; flex-direction: column; gap: 0.5rem; }
  .mes-eyebrow {
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--mes-primary);
  }
  .mes-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--mes-text);
    line-height: 1.3;
  }
  .mes-desc {
    margin: 0;
    font-size: 0.9375rem;
    color: var(--mes-text-sub);
    line-height: 1.6;
    max-width: 400px;
  }

  /* Actions */
  .mes-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.625rem;
    justify-content: center;
  }
  .mes-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5625rem 1.125rem;
    border-radius: 8px;
    border: 1px solid transparent;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .mes-btn:focus-visible { outline: 2px solid var(--mes-primary); outline-offset: 2px; }
  .mes-btn--primary {
    background: var(--mes-primary);
    color: #fff;
    border-color: var(--mes-primary);
  }
  .mes-btn--primary:hover { background: #8b6df5; }
  .mes-btn--secondary {
    background: var(--mes-surface);
    color: var(--mes-text-sub);
    border-color: var(--mes-border);
  }
  .mes-btn--secondary:hover {
    background: rgba(124,95,230,0.1);
    border-color: var(--mes-primary);
    color: var(--mes-text);
  }
  .mes-btn--ghost {
    background: none;
    color: var(--mes-text-muted);
    border-color: var(--mes-border);
  }
  .mes-btn--ghost:hover { background: var(--mes-surface); color: var(--mes-text-sub); }

  /* Divider */
  .mes-divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
  }
  .mes-divider::before,
  .mes-divider::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid var(--mes-border);
  }
  .mes-divider__text {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--mes-text-muted);
    white-space: nowrap;
  }

  /* Workspace type grid */
  .mes-workspace-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    width: 100%;
  }
  @media (max-width: 480px) { .mes-workspace-grid { grid-template-columns: repeat(2, 1fr); } }

  .mes-ws-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    padding: 0.75rem;
    background: var(--mes-surface);
    border: 1px solid var(--mes-border);
    border-radius: var(--mes-radius);
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
  }
  .mes-ws-card:hover {
    background: rgba(124,95,230,0.08);
    border-color: rgba(124,95,230,0.3);
    transform: translateY(-1px);
  }
  .mes-ws-card:focus-visible { outline: 2px solid var(--mes-primary); outline-offset: 2px; }
  .mes-ws-card__icon { font-size: 1.25rem; }
  .mes-ws-card__label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--mes-text);
    line-height: 1.2;
  }
  .mes-ws-card__desc {
    font-size: 0.625rem;
    color: var(--mes-text-muted);
    line-height: 1.4;
  }

  /* Platform features */
  .mes-features {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }
  .mes-feature {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--mes-surface);
    border: 1px solid var(--mes-border);
    border-radius: 8px;
    text-align: left;
  }
  .mes-feature__icon {
    font-size: 1.125rem;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
  .mes-feature__label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--mes-text);
    margin-bottom: 0.125rem;
  }
  .mes-feature__desc {
    font-size: 0.75rem;
    color: var(--mes-text-sub);
    line-height: 1.4;
  }

  /* Search tip */
  .mes-search-tip {
    padding: 0.75rem 1rem;
    background: var(--mes-surface);
    border: 1px solid var(--mes-border);
    border-radius: 8px;
    text-align: left;
    width: 100%;
    box-sizing: border-box;
  }
  .mes-search-tip__label {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--mes-text-muted);
    margin-bottom: 0.5rem;
  }
  .mes-search-tip__list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .mes-search-tip__item {
    font-size: 0.8125rem;
    color: var(--mes-text-sub);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .mes-search-tip__item::before {
    content: '→';
    color: var(--mes-text-muted);
    flex-shrink: 0;
  }

  /* Responsive */
  @media (max-width: 360px) {
    .mes { padding: 1.5rem 1rem; }
    .mes-title { font-size: 1.0625rem; }
    .mes-desc { font-size: 0.875rem; }
  }
`;

// ============================================================================
// INLINE SVG ILLUSTRATIONS
// ============================================================================

function IllustrationSelect() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="60" cy="60" r="54" fill="#7c5fe615" stroke="#7c5fe630" strokeWidth="1" />
      {/* Central node */}
      <circle cx="60" cy="60" r="12" fill="#7c5fe6" opacity="0.9" />
      {/* Orbit nodes */}
      <circle cx="60" cy="22" r="7" fill="#10b981" opacity="0.8" />
      <circle cx="93" cy="42" r="7" fill="#3b82f6" opacity="0.8" />
      <circle cx="93" cy="78" r="7" fill="#8b5cf6" opacity="0.8" />
      <circle cx="60" cy="98" r="7" fill="#06b6d4" opacity="0.8" />
      <circle cx="27" cy="78" r="7" fill="#f59e0b" opacity="0.8" />
      <circle cx="27" cy="42" r="7" fill="#ec4899" opacity="0.8" />
      {/* Connection lines */}
      <line x1="60" y1="48" x2="60" y2="29" stroke="#7c5fe640" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="71" y1="54" x2="87" y2="46" stroke="#7c5fe640" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="71" y1="66" x2="87" y2="74" stroke="#7c5fe640" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="60" y1="72" x2="60" y2="91" stroke="#7c5fe640" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="49" y1="66" x2="33" y2="74" stroke="#7c5fe640" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="49" y1="54" x2="33" y2="46" stroke="#7c5fe640" strokeWidth="1.5" strokeDasharray="3 2" />
      {/* Center sparkle */}
      <circle cx="60" cy="60" r="4" fill="#fff" opacity="0.9" />
    </svg>
  );
}

function IllustrationEmpty() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="60" cy="60" r="54" fill="#7c5fe610" stroke="#7c5fe625" strokeWidth="1" />
      {/* Rocket */}
      <ellipse cx="60" cy="52" rx="10" ry="16" fill="#7c5fe6" opacity="0.9" />
      <polygon points="50,60 44,72 60,66" fill="#5b43c4" opacity="0.8" />
      <polygon points="70,60 76,72 60,66" fill="#5b43c4" opacity="0.8" />
      {/* Window */}
      <circle cx="60" cy="49" r="4" fill="#fff" opacity="0.85" />
      {/* Exhaust */}
      <ellipse cx="60" cy="72" rx="5" ry="3" fill="#f97316" opacity="0.7" />
      <ellipse cx="60" cy="76" rx="3" ry="2" fill="#f59e0b" opacity="0.5" />
      {/* Stars */}
      <circle cx="30" cy="30" r="1.5" fill="#7c5fe6" opacity="0.5" />
      <circle cx="90" cy="35" r="1.5" fill="#3b82f6" opacity="0.5" />
      <circle cx="85" cy="85" r="1.5" fill="#10b981" opacity="0.5" />
      <circle cx="35" cy="80" r="1.5" fill="#ec4899" opacity="0.5" />
      <circle cx="100" cy="60" r="1" fill="#f59e0b" opacity="0.4" />
      <circle cx="20" cy="55" r="1" fill="#8b5cf6" opacity="0.4" />
    </svg>
  );
}

function IllustrationSearch() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="60" cy="60" r="54" fill="#64748b10" stroke="#64748b25" strokeWidth="1" />
      {/* Search circle */}
      <circle cx="52" cy="50" r="18" stroke="#7c5fe6" strokeWidth="3" opacity="0.7" />
      {/* Handle */}
      <line x1="64" y1="63" x2="80" y2="80" stroke="#7c5fe6" strokeWidth="3.5" strokeLinecap="round" opacity="0.8" />
      {/* Inner "?" suggestion */}
      <circle cx="52" cy="50" r="10" fill="#7c5fe615" />
      <text x="52" y="55" textAnchor="middle" fontSize="12" fill="#7c5fe6" opacity="0.8" fontWeight="700">?</text>
    </svg>
  );
}

function IllustrationContext({ icon }: { icon: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="60" cy="60" r="54" fill="#7c5fe610" stroke="#7c5fe625" strokeWidth="1" />
      <circle cx="60" cy="60" r="32" fill="#7c5fe615" />
      <text x="60" y="73" textAnchor="middle" fontSize="34">{icon}</text>
    </svg>
  );
}

// ============================================================================
// VARIANT CONFIGS
// ============================================================================

interface VariantConfig {
  eyebrow: string;
  title: string;
  description: string;
  illustration: React.ReactNode;
  showWorkspaceGrid: boolean;
  showFeatures: boolean;
}

function getVariantConfig(
  variant: EmptyStateVariant,
  searchQuery?: string,
  context?: string
): VariantConfig {
  switch (variant) {
    case 'no_selection':
      return {
        eyebrow: 'Innovation Communication Hub',
        title: 'Select a workspace to begin',
        description:
          'Choose a collaboration workspace from the left panel to view discussions, share assets, and drive innovation forward.',
        illustration: <IllustrationSelect />,
        showWorkspaceGrid: false,
        showFeatures: true,
      };

    case 'no_conversations':
      return {
        eyebrow: 'Welcome to Maylet XLab',
        title: 'Your innovation collaboration starts here',
        description:
          'Create your first workspace to start connecting projects, research, teams, and ideas in a single structured environment.',
        illustration: <IllustrationEmpty />,
        showWorkspaceGrid: true,
        showFeatures: true,
      };

    case 'no_results':
      return {
        eyebrow: 'Search',
        title: searchQuery
          ? `No results for "${searchQuery}"`
          : 'No matching workspaces',
        description:
          'Try a different search term, adjust your filters, or browse all available workspaces.',
        illustration: <IllustrationSearch />,
        showWorkspaceGrid: false,
        showFeatures: false,
      };

    case 'no_team':
      return {
        eyebrow: 'Team Collaboration',
        title: 'No team workspaces yet',
        description:
          'Team workspaces keep your innovation team aligned. Create one to start collaborating with colleagues.',
        illustration: <IllustrationContext icon="👥" />,
        showWorkspaceGrid: false,
        showFeatures: false,
      };

    case 'no_project':
      return {
        eyebrow: 'Project Collaboration',
        title: 'No project workspaces yet',
        description:
          'Link conversations directly to projects. Create a project workspace to keep all project discussions organised.',
        illustration: <IllustrationContext icon="📁" />,
        showWorkspaceGrid: false,
        showFeatures: false,
      };

    case 'no_research':
      return {
        eyebrow: 'Research Collaboration',
        title: 'No research workspaces yet',
        description:
          'Research workspaces connect your team around literature, hypotheses, and findings. Start your first one now.',
        illustration: <IllustrationContext icon="🔬" />,
        showWorkspaceGrid: false,
        showFeatures: false,
      };

    case 'no_community':
      return {
        eyebrow: 'Community',
        title: 'No community discussions yet',
        description:
          'Community workspaces are open innovation forums. Join one or create a new topic to engage with the ecosystem.',
        illustration: <IllustrationContext icon="🌐" />,
        showWorkspaceGrid: false,
        showFeatures: false,
      };

    default: {
      const ctxMap: Record<string, Partial<VariantConfig>> = {
        project:    { eyebrow: 'Project', illustration: <IllustrationContext icon="📁" /> },
        research:   { eyebrow: 'Research', illustration: <IllustrationContext icon="🔬" /> },
        validation: { eyebrow: 'Validation', illustration: <IllustrationContext icon="✅" /> },
        funding:    { eyebrow: 'Funding', illustration: <IllustrationContext icon="💰" /> },
        community:  { eyebrow: 'Community', illustration: <IllustrationContext icon="🌐" /> },
        team:       { eyebrow: 'Team', illustration: <IllustrationContext icon="👥" /> },
      };
      const ctx = context ? ctxMap[context] ?? {} : {};
      return {
        eyebrow: ctx.eyebrow ?? 'Collaboration',
        title: 'Nothing here yet',
        description: 'Create a workspace to start collaborating.',
        illustration: ctx.illustration ?? <IllustrationEmpty />,
        showWorkspaceGrid: false,
        showFeatures: false,
      };
    }
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

function MessagesEmptyStateBase({
  title,
  description,
  actionLabel,
  onAction,
  variant,
  searchQuery,
  context,
  onCreateConversation,
  onCreateWorkspace,
  onBrowseAll,
  onInviteTeam,
  onClearSearch,
  onQuickStart,
  onActionClick,
}: MessagesEmptyStateProps) {
  ensureStyles();

  // Derive the effective variant from legacy props when no explicit variant
  const effectiveVariant = ((): EmptyStateVariant => {
    if (variant) return variant;
    if (searchQuery || title?.toLowerCase().includes('no result')) return 'no_results';
    if (title?.toLowerCase().includes('no workspace') || title?.toLowerCase().includes('no conversation'))
      return 'no_conversations';
    if (title?.toLowerCase().includes('select')) return 'no_selection';
    return 'no_conversations';
  })();

  const cfg = getVariantConfig(effectiveVariant, searchQuery, context);

  // Use legacy title/description if explicitly provided (backward compat)
  const displayTitle = title ?? cfg.title;
  const displayDesc  = description ?? cfg.description;

  const handleAction = useCallback((id: string, cb?: () => void) => {
    onActionClick?.(id);
    cb?.();
  }, [onActionClick]);

  const handleQuickStart = useCallback((wsType: string) => {
    onActionClick?.(`quickstart_${wsType}`);
    onQuickStart?.(wsType);
    onCreateWorkspace?.();
  }, [onActionClick, onQuickStart, onCreateWorkspace]);

  // Build primary action set
  const primaryAction = (() => {
    if (actionLabel && onAction) {
      return { label: actionLabel, onClick: onAction, icon: '✦' };
    }
    if (effectiveVariant === 'no_conversations' || effectiveVariant === 'no_selection') {
      return {
        label: 'Create Workspace',
        onClick: () => handleAction('create_workspace', onCreateWorkspace ?? onAction),
        icon: '✦',
      };
    }
    if (effectiveVariant === 'no_results') {
      return {
        label: 'Clear Filters',
        onClick: () => handleAction('clear_search', onClearSearch ?? onAction),
        icon: '↩',
      };
    }
    return {
      label: 'Get Started',
      onClick: () => handleAction('get_started', onCreateWorkspace ?? onAction),
      icon: '→',
    };
  })();

  const secondaryActions = (() => {
    const actions: { label: string; onClick: () => void }[] = [];

    if (effectiveVariant === 'no_conversations') {
      if (onInviteTeam) actions.push({ label: 'Invite Team', onClick: () => handleAction('invite_team', onInviteTeam) });
      if (onBrowseAll)  actions.push({ label: 'Browse Workspaces', onClick: () => handleAction('browse_all', onBrowseAll) });
    }

    if (effectiveVariant === 'no_selection') {
      if (onCreateConversation) actions.push({ label: 'Start Direct Message', onClick: () => handleAction('create_dm', onCreateConversation) });
      if (onBrowseAll) actions.push({ label: 'Browse All', onClick: () => handleAction('browse_all', onBrowseAll) });
    }

    if (effectiveVariant === 'no_results') {
      if (onBrowseAll) actions.push({ label: 'Browse All Workspaces', onClick: () => handleAction('browse_all', onBrowseAll) });
      if (onCreateWorkspace) actions.push({ label: 'Create Workspace', onClick: () => handleAction('create_workspace', onCreateWorkspace) });
    }

    if (['no_team', 'no_project', 'no_research', 'no_community'].includes(effectiveVariant)) {
      if (onBrowseAll) actions.push({ label: 'Browse All', onClick: () => handleAction('browse_all', onBrowseAll) });
    }

    return actions;
  })();

  return (
    <div
      className="mes"
      role="region"
      aria-label="Empty state"
      data-testid="messages-empty-state"
      data-variant={effectiveVariant}
    >
      {/* Illustration */}
      <div className="mes-illustration" aria-hidden="true">
        {cfg.illustration}
      </div>

      {/* Hero text */}
      <div className="mes-hero">
        <span className="mes-eyebrow">{cfg.eyebrow}</span>
        <h2 className="mes-title" data-testid="empty-state-title">{displayTitle}</h2>
        <p className="mes-desc" data-testid="empty-state-description">{displayDesc}</p>
      </div>

      {/* Primary + secondary actions */}
      <div className="mes-actions" role="group" aria-label="Quick actions">
        {(onCreateWorkspace || onAction || onClearSearch || onBrowseAll) && (
          <button
            type="button"
            className="mes-btn mes-btn--primary"
            onClick={primaryAction.onClick}
            data-testid="empty-state-primary-action"
          >
            <span aria-hidden="true">{primaryAction.icon}</span>
            {primaryAction.label}
          </button>
        )}
        {secondaryActions.map((a) => (
          <button
            key={a.label}
            type="button"
            className="mes-btn mes-btn--secondary"
            onClick={a.onClick}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Search tips for no_results */}
      {effectiveVariant === 'no_results' && (
        <div className="mes-search-tip" aria-label="Search tips">
          <div className="mes-search-tip__label">Search tips</div>
          <ul className="mes-search-tip__list">
            <li className="mes-search-tip__item">Search by workspace name or participant</li>
            <li className="mes-search-tip__item">Try broader keywords</li>
            <li className="mes-search-tip__item">Remove active filters and try again</li>
            <li className="mes-search-tip__item">Create a new workspace if none exist</li>
          </ul>
        </div>
      )}

      {/* Workspace type quick-start grid */}
      {cfg.showWorkspaceGrid && (onQuickStart || onCreateWorkspace) && (
        <>
          <div className="mes-divider">
            <span className="mes-divider__text">Start with a workspace type</span>
          </div>
          <div
            className="mes-workspace-grid"
            role="list"
            aria-label="Workspace types"
          >
            {WORKSPACE_TYPES.map((ws) => (
              <button
                key={ws.id}
                type="button"
                role="listitem"
                className="mes-ws-card"
                onClick={() => handleQuickStart(ws.id)}
                aria-label={`Create ${ws.label}`}
                data-testid={`workspace-type-${ws.id}`}
              >
                <span className="mes-ws-card__icon">{ws.icon}</span>
                <span className="mes-ws-card__label">{ws.label}</span>
                <span className="mes-ws-card__desc">{ws.description}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Platform features for no_selection + no_conversations */}
      {cfg.showFeatures && (
        <>
          <div className="mes-divider">
            <span className="mes-divider__text">Why Maylet XLab</span>
          </div>
          <div
            className="mes-features"
            role="list"
            aria-label="Platform capabilities"
          >
            {PLATFORM_FEATURES.map((f) => (
              <div key={f.label} className="mes-feature" role="listitem">
                <span className="mes-feature__icon" aria-hidden="true">{f.icon}</span>
                <div>
                  <div className="mes-feature__label">{f.label}</div>
                  <div className="mes-feature__desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export const MessagesEmptyState = memo(MessagesEmptyStateBase);
MessagesEmptyStateBase.displayName = 'MessagesEmptyState';
