/**
 * TypingIndicator — Enterprise Collaboration Presence & Activity Indicator
 *
 * Communicates real-time collaboration activity across Maylet XLab's innovation
 * workspaces. Supports human participants, AI activity, and 8 distinct activity
 * states with accessible animations.
 *
 * Backward compatible: callers using { names: string[] } continue to work exactly
 * as before — names are auto-converted to participants with default role.
 *
 * @example
 * // Legacy (unchanged)
 * <TypingIndicator names={['Sarah', 'David']} />
 *
 * // Enterprise: AI activity
 * <TypingIndicator
 *   participants={[{ id: 'maya', name: 'MAYA', role: 'ai' }]}
 *   activityType="generating"
 *   isAIActivity
 * />
 *
 * // Enterprise: with role + organization
 * <TypingIndicator
 *   participants={[{ id: '1', name: 'Dr. Chen', role: 'researcher', organization: 'MIT' }]}
 *   activityType="reviewing"
 *   showRole
 * />
 */

import { memo, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type ParticipantRole =
  | 'researcher'
  | 'engineer'
  | 'founder'
  | 'mentor'
  | 'investor'
  | 'validator'
  | 'admin'
  | 'member'
  | 'ai';

export type ActivityType =
  | 'typing'
  | 'preparing'
  | 'uploading'
  | 'processing'
  | 'reviewing'
  | 'generating'
  | 'analyzing'
  | 'synchronizing';

export interface TypingParticipant {
  id: string;
  name: string;
  role?: ParticipantRole;
  organization?: string;
  avatarUrl?: string;
}

export interface TypingIndicatorProps {
  // Backward-compatible legacy prop
  names?: string[];

  // Enterprise props
  participants?: TypingParticipant[];
  activityType?: ActivityType;
  isAIActivity?: boolean;
  workspaceType?: string;
  showAvatar?: boolean;
  showRole?: boolean;
  compactMode?: boolean;
  onInteraction?: (event: { type: string; participantCount: number }) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ROLE_LABELS: Record<ParticipantRole, string> = {
  researcher:  'Researcher',
  engineer:    'Engineer',
  founder:     'Founder',
  mentor:      'Mentor',
  investor:    'Investor',
  validator:   'Validator',
  admin:       'Administrator',
  member:      '',
  ai:          'AI Assistant',
};

const ROLE_COLORS: Record<ParticipantRole, string> = {
  researcher:  '#8b5cf6',
  engineer:    '#3b82f6',
  founder:     '#10b981',
  mentor:      '#f59e0b',
  investor:    '#84cc16',
  validator:   '#06b6d4',
  admin:       '#6366f1',
  member:      '#7c5fe6',
  ai:          '#10b981',
};

const ACTIVITY_VERBS: Record<ActivityType, string> = {
  typing:        'is typing',
  preparing:     'is preparing a message',
  uploading:     'is uploading an attachment',
  processing:    'is processing a document',
  reviewing:     'is reviewing content',
  generating:    'is generating a response',
  analyzing:     'is analyzing context',
  synchronizing: 'is synchronizing',
};

const ACTIVITY_VERBS_PLURAL: Record<ActivityType, string> = {
  typing:        'are typing',
  preparing:     'are preparing messages',
  uploading:     'are uploading',
  processing:    'are processing',
  reviewing:     'are reviewing',
  generating:    'are generating responses',
  analyzing:     'are analyzing',
  synchronizing: 'are synchronizing',
};

// AI-specific verb overrides keyed by name hint
const AI_VERBS: Record<string, string> = {
  generating:    'is generating a response',
  analyzing:     'is analyzing the conversation',
  reviewing:     'is reviewing the workspace',
  processing:    'is processing context',
  typing:        'is composing a response',
  preparing:     'is preparing recommendations',
  uploading:     'is processing attachments',
  synchronizing: 'is synchronizing data',
};

// ============================================================================
// STYLE SINGLETON
// ============================================================================

let _stylesInjected = false;
function ensureStyles(): void {
  if (_stylesInjected || typeof document === 'undefined') return;
  _stylesInjected = true;
  const el = document.createElement('style');
  el.setAttribute('data-ti-styles', '1');
  el.textContent = TI_CSS;
  document.head.appendChild(el);
}

const TI_CSS = `
  /* Tokens */
  :root {
    --ti-text:    #94a3b8;
    --ti-dot:     #7c5fe6;
    --ti-ai-dot:  #10b981;
    --ti-ai-text: #34d399;
    --ti-bg:      transparent;
  }
  @media (prefers-color-scheme: light) {
    :root {
      --ti-text:    #64748b;
      --ti-dot:     #7c5fe6;
      --ti-ai-text: #059669;
    }
  }

  /* ── Human typing dots ────────────────────────────────────── */
  @keyframes ti-bounce {
    0%, 80%, 100% { transform: translateY(0);    opacity: 0.4; }
    40%            { transform: translateY(-5px); opacity: 1;   }
  }
  @keyframes ti-ai-pulse {
    0%, 100% { opacity: 0.3; transform: scaleY(0.5); }
    50%      { opacity: 1;   transform: scaleY(1);   }
  }
  @keyframes ti-wave {
    0%, 100% { transform: translateY(0); }
    25%      { transform: translateY(-4px); }
    75%      { transform: translateY(4px); }
  }
  @keyframes ti-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes ti-fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .ti-dot, .ti-ai-bar, .ti-spinner { animation: none !important; }
  }

  /* Root */
  .ti {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0;
    animation: ti-fade-in 0.2s ease;
    min-height: 28px;
  }
  .ti--compact { padding: 0.25rem 0; min-height: 22px; }

  /* Stacked avatars */
  .ti-avatars {
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    flex-shrink: 0;
  }
  .ti-avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1.5px solid #13131f;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.5625rem;
    font-weight: 700;
    color: #fff;
    margin-left: -6px;
    flex-shrink: 0;
    overflow: hidden;
    transition: transform 0.15s;
  }
  .ti-avatar:first-child { margin-left: 0; }
  .ti-avatar img { width: 100%; height: 100%; object-fit: cover; }

  /* ── Human dots ─────────────────────────────────────────────── */
  .ti-dots {
    display: flex;
    align-items: center;
    gap: 3px;
    flex-shrink: 0;
  }
  .ti-dot {
    display: block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--ti-dot);
    animation: ti-bounce 1.4s ease-in-out infinite;
  }
  .ti-dot:nth-child(1) { animation-delay: 0s;    }
  .ti-dot:nth-child(2) { animation-delay: 0.16s; }
  .ti-dot:nth-child(3) { animation-delay: 0.32s; }

  /* ── AI activity bars ───────────────────────────────────────── */
  .ti-ai-bars {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    height: 18px;
  }
  .ti-ai-bar {
    display: block;
    width: 3px;
    border-radius: 2px;
    background: var(--ti-ai-dot);
    animation: ti-ai-pulse 1.0s ease-in-out infinite;
  }
  .ti-ai-bar:nth-child(1) { height: 10px; animation-delay: 0s;    }
  .ti-ai-bar:nth-child(2) { height: 18px; animation-delay: 0.15s; }
  .ti-ai-bar:nth-child(3) { height: 14px; animation-delay: 0.30s; }
  .ti-ai-bar:nth-child(4) { height: 8px;  animation-delay: 0.45s; }
  .ti-ai-bar:nth-child(5) { height: 16px; animation-delay: 0.60s; }

  /* ── Processing spinner ─────────────────────────────────────── */
  .ti-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(124,95,230,0.25);
    border-top-color: #7c5fe6;
    border-radius: 50%;
    animation: ti-spin 0.8s linear infinite;
    flex-shrink: 0;
  }

  /* ── Label ──────────────────────────────────────────────────── */
  .ti-label {
    font-size: 0.8125rem;
    color: var(--ti-text);
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ti-label--ai {
    color: var(--ti-ai-text);
    font-weight: 500;
  }
  .ti-label--compact { font-size: 0.75rem; }

  .ti-name   { font-weight: 600; color: #c4b5fd; }
  .ti-name--ai { color: var(--ti-ai-text); }
  .ti-role   {
    font-size: 0.6875rem;
    color: #64748b;
    margin-left: 0.25rem;
  }

  /* ── AI badge ───────────────────────────────────────────────── */
  .ti-ai-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.375rem;
    background: rgba(16,185,129,0.12);
    border: 1px solid rgba(16,185,129,0.25);
    border-radius: 12px;
    font-size: 0.6875rem;
    font-weight: 600;
    color: #34d399;
    letter-spacing: 0.03em;
    flex-shrink: 0;
  }

  /* High contrast */
  @media (forced-colors: active) {
    .ti-dot, .ti-ai-bar { background: ButtonText; }
    .ti-label { color: ButtonText; }
  }
`;

// ============================================================================
// HELPERS
// ============================================================================

function buildLabel(
  participants: TypingParticipant[],
  activityType: ActivityType,
  isAIActivity: boolean,
  showRole: boolean,
  compactMode: boolean
): { text: string; nameFragment: string; verb: string } {
  const count = participants.length;
  if (count === 0) return { text: '', nameFragment: '', verb: '' };

  if (isAIActivity && count === 1) {
    const p = participants[0];
    const verb = AI_VERBS[activityType] ?? 'is thinking';
    const name = p.name;
    return { text: `${name} ${verb}`, nameFragment: name, verb };
  }

  const verb = count === 1
    ? ACTIVITY_VERBS[activityType]
    : ACTIVITY_VERBS_PLURAL[activityType];

  if (compactMode) {
    const nameFragment = count === 1 ? participants[0].name : `${count}`;
    const suffix = count === 1 ? '' : ' participants';
    return { text: `${nameFragment}${suffix} ${verb}`, nameFragment, verb };
  }

  let nameFragment = '';
  if (count === 1) {
    const p = participants[0];
    nameFragment = p.name;
    if (showRole && p.role && p.role !== 'member') {
      const roleLabel = ROLE_LABELS[p.role];
      if (roleLabel) nameFragment = `${p.name} (${roleLabel})`;
    }
    if (p.organization && showRole) {
      nameFragment += ` · ${p.organization}`;
    }
  } else if (count === 2) {
    nameFragment = `${participants[0].name} and ${participants[1].name}`;
  } else {
    nameFragment = `${count} participants`;
  }

  return { text: `${nameFragment} ${verb}`, nameFragment, verb };
}

function getAnimationForActivity(activityType: ActivityType, isAI: boolean): 'dots' | 'bars' | 'spinner' {
  if (isAI) return 'bars';
  if (activityType === 'uploading' || activityType === 'processing' || activityType === 'synchronizing') {
    return 'spinner';
  }
  return 'dots';
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function AvatarStack({ participants, showAvatar }: { participants: TypingParticipant[]; showAvatar: boolean }) {
  if (!showAvatar || participants.length === 0) return null;

  const shown = participants.slice(0, 3);

  return (
    <div className="ti-avatars" aria-hidden="true">
      {shown.map((p) => {
        const color = p.role ? ROLE_COLORS[p.role] : ROLE_COLORS.member;
        return (
          <div
            key={p.id}
            className="ti-avatar"
            style={{ background: color }}
            title={p.name}
          >
            {p.avatarUrl ? (
              <img src={p.avatarUrl} alt={p.name} loading="lazy" />
            ) : (
              p.name[0]?.toUpperCase()
            )}
          </div>
        );
      })}
    </div>
  );
}

function TypingAnimation({ type, compact }: { type: 'dots' | 'bars' | 'spinner'; compact: boolean }) {
  if (type === 'bars') {
    return (
      <span className="ti-ai-bars" aria-hidden="true">
        <span className="ti-ai-bar" />
        <span className="ti-ai-bar" />
        <span className="ti-ai-bar" />
        <span className="ti-ai-bar" />
        <span className="ti-ai-bar" />
      </span>
    );
  }

  if (type === 'spinner') {
    return <span className="ti-spinner" aria-hidden="true" />;
  }

  // Default: bouncing dots
  const size = compact ? 4 : 5;
  return (
    <span className="ti-dots" aria-hidden="true">
      <span className="ti-dot" style={{ width: size, height: size }} />
      <span className="ti-dot" style={{ width: size, height: size }} />
      <span className="ti-dot" style={{ width: size, height: size }} />
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function TypingIndicatorBase({
  names,
  participants: rawParticipants,
  activityType = 'typing',
  isAIActivity = false,
  workspaceType: _workspaceType,
  showAvatar = false,
  showRole = false,
  compactMode = false,
  onInteraction,
}: TypingIndicatorProps) {
  ensureStyles();

  // Convert legacy `names` array to participants if no explicit participants given
  const participants = useMemo<TypingParticipant[]>(() => {
    if (rawParticipants && rawParticipants.length > 0) return rawParticipants;
    if (names && names.length > 0) {
      return names.map((name) => ({ id: name, name, role: 'member' as ParticipantRole }));
    }
    return [];
  }, [rawParticipants, names]);

  // Nothing to show
  if (participants.length === 0) return null;

  // Emit telemetry on render (no state — just fire-and-forget side effect on prop change)
  onInteraction?.({ type: activityType, participantCount: participants.length });

  const animationType = getAnimationForActivity(activityType, isAIActivity);
  const { text, nameFragment, verb } = buildLabel(
    participants, activityType, isAIActivity, showRole, compactMode
  );

  const isMultiple = participants.length > 1;
  const labelClass = [
    'ti-label',
    isAIActivity ? 'ti-label--ai' : '',
    compactMode ? 'ti-label--compact' : '',
  ].filter(Boolean).join(' ');

  // The screen-reader text is the full label.
  // The visible label marks up the name portion distinctly.
  const visibleLabel = (() => {
    if (!nameFragment || !verb) return text;
    const rest = ` ${verb}`;
    const nameClass = isAIActivity ? 'ti-name ti-name--ai' : 'ti-name';
    return (
      <>
        <span className={nameClass}>{nameFragment}</span>
        {rest}
        {isAIActivity && !compactMode && (
          <span className="ti-ai-badge" style={{ marginLeft: '0.5rem' }}>AI</span>
        )}
        {!isAIActivity && !compactMode && isMultiple && participants.length <= 2 && (
          // Show compact role chips for named dual participants
          participants.slice(0, 2).some(p => p.role && p.role !== 'member') ? (
            <span className="ti-role">
              {participants.map(p =>
                p.role && p.role !== 'member' ? ROLE_LABELS[p.role] : null
              ).filter(Boolean).join(' · ')}
            </span>
          ) : null
        )}
      </>
    );
  })();

  return (
    <div
      className={`ti${compactMode ? ' ti--compact' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={text}
      data-testid="typing-indicator"
      data-activity={activityType}
      data-ai={isAIActivity}
    >
      {/* Screen-reader only full label */}
      <span
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </span>

      <AvatarStack participants={participants} showAvatar={showAvatar && !isMultiple} />

      <TypingAnimation type={animationType} compact={compactMode} />

      <span className={labelClass} aria-hidden="true">
        {visibleLabel}
      </span>
    </div>
  );
}

export const TypingIndicator = memo(TypingIndicatorBase);
TypingIndicatorBase.displayName = 'TypingIndicator';
