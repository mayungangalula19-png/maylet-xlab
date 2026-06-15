/**
 * MessagesSkeleton — Enterprise Messaging Loading Experience
 *
 * Renders content-aware loading placeholders that precisely mirror
 * the layout of Maylet XLab's conversation workspace, reducing perceived
 * latency and orienting users to the structure before data arrives.
 *
 * Backward compatible: callers using { rows } continue to work exactly as
 * before. Context-specific variants available via the `variant` prop.
 *
 * Auto-detection: rows >= 5 → conversation list, rows < 5 → chat messages.
 *
 * @example
 * // Legacy (unchanged callers)
 * <MessagesSkeleton rows={6} />   // → conversation list skeleton
 * <MessagesSkeleton rows={4} />   // → chat message skeleton
 *
 * // Explicit variant
 * <MessagesSkeleton variant="chat_header" />
 * <MessagesSkeleton variant="ai_panel" />
 * <MessagesSkeleton variant="full_workspace" />
 */

import { memo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type SkeletonVariant =
  | 'conversation_list'  // Sidebar: conversation rows with avatar + meta
  | 'chat_messages'      // Chat body: natural mix of incoming/outgoing bubbles
  | 'chat_header'        // Workspace header bar
  | 'composer'           // Message input area
  | 'ai_panel'           // AI assistant panel
  | 'thread'             // Thread reply list
  | 'full_workspace';    // Complete workspace (header + messages + composer)

interface MessagesSkeletonProps {
  rows?: number;          // Backward-compatible row count
  variant?: SkeletonVariant;
  compact?: boolean;      // Reduced vertical spacing
}

// ============================================================================
// STYLE SINGLETON
// ============================================================================

let _stylesInjected = false;
function ensureStyles(): void {
  if (_stylesInjected || typeof document === 'undefined') return;
  _stylesInjected = true;
  const el = document.createElement('style');
  el.setAttribute('data-msk-styles', '1');
  el.textContent = MSK_CSS;
  document.head.appendChild(el);
}

const MSK_CSS = `
  /* Design tokens */
  :root {
    --msk-bg:      #1e1e30;
    --msk-shine:   #252540;
    --msk-bg-alt:  #252538;
    --msk-radius:  6px;
  }
  @media (prefers-color-scheme: light) {
    :root {
      --msk-bg:    #e8ecf0;
      --msk-shine: #f0f3f7;
      --msk-bg-alt:#dde2e8;
    }
  }

  /* Shimmer keyframes */
  @keyframes msk-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .msk-block { animation: none !important; }
  }

  /* Base shimmer block */
  .msk-block {
    display: block;
    border-radius: var(--msk-radius);
    background: linear-gradient(
      90deg,
      var(--msk-bg) 25%,
      var(--msk-shine) 50%,
      var(--msk-bg) 75%
    );
    background-size: 800px 100%;
    animation: msk-shimmer 1.6s ease-in-out infinite;
    flex-shrink: 0;
  }

  /* ── Conversation list skeleton ─────────────────────────────────── */
  .msk-convlist { display: flex; flex-direction: column; gap: 0; padding: 0.25rem 0; }

  .msk-conv-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 1rem;
  }

  .msk-conv-avatar {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }

  .msk-conv-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.375rem; }
  .msk-conv-row1    { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
  .msk-conv-row2    { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
  .msk-conv-badges  { display: flex; align-items: center; gap: 0.25rem; }

  /* ── Chat message skeleton ──────────────────────────────────────── */
  .msk-chatlist {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 1rem;
  }

  .msk-date-sep {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0.75rem 0;
  }
  .msk-date-sep-line {
    flex: 1;
    height: 1px;
    border-radius: 1px;
    opacity: 0.5;
  }
  .msk-date-sep-text { flex-shrink: 0; }

  .msk-msg {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.875rem;
  }
  .msk-msg--own    { flex-direction: row-reverse; }
  .msk-msg--system { justify-content: center; }
  .msk-msg--compact { margin-bottom: 0.375rem; }

  .msk-msg-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .msk-msg-body { display: flex; flex-direction: column; gap: 0.25rem; max-width: 70%; }
  .msk-msg--own .msk-msg-body { align-items: flex-end; }

  .msk-msg-name  { margin-bottom: 0.125rem; }
  .msk-msg-bubble {
    border-radius: 12px;
    padding: 0;
    overflow: hidden;
  }
  .msk-msg-thread { margin-top: 0.25rem; }
  .msk-msg-react  { margin-top: 0.25rem; }

  .msk-system-msg {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.25rem auto;
  }

  /* ── Header skeleton ────────────────────────────────────────────── */
  .msk-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    gap: 1rem;
  }
  .msk-header-left  { display: flex; flex-direction: column; gap: 0.375rem; }
  .msk-header-right { display: flex; align-items: center; gap: 0.5rem; }
  .msk-header-icon  { width: 36px; height: 36px; border-radius: 8px; }

  /* ── Composer skeleton ──────────────────────────────────────────── */
  .msk-composer {
    padding: 0.75rem 1rem;
    border-top: 1px solid rgba(255,255,255,0.05);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .msk-composer-box {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.07);
  }
  .msk-composer-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.375rem 0.75rem;
    border-top: 1px solid rgba(255,255,255,0.05);
    gap: 0.5rem;
  }
  .msk-composer-tools { display: flex; gap: 0.5rem; }
  .msk-tool-icon      { width: 28px; height: 28px; border-radius: 6px; }

  /* ── AI panel skeleton ──────────────────────────────────────────── */
  .msk-ai-panel { display: flex; flex-direction: column; gap: 0; }

  .msk-ai-header {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .msk-ai-badge { width: 32px; height: 32px; border-radius: 8px; }

  .msk-ai-body { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }

  .msk-ai-card {
    padding: 0.75rem;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.06);
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .msk-ai-actions { display: flex; flex-direction: column; gap: 0.5rem; padding: 0 1rem 1rem; }
  .msk-ai-action-row { height: 36px; border-radius: 8px; }

  /* ── Thread skeleton ────────────────────────────────────────────── */
  .msk-thread { display: flex; flex-direction: column; gap: 0; padding: 1rem; }
  .msk-thread-parent {
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .msk-thread-replies { display: flex; flex-direction: column; gap: 0.625rem; }
  .msk-thread-reply   { display: flex; gap: 0.625rem; align-items: flex-start; }
  .msk-thread-body    { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }

  /* ── Full workspace ─────────────────────────────────────────────── */
  .msk-full { display: flex; flex-direction: column; height: 100%; }
  .msk-full-body { flex: 1; overflow: hidden; }

  /* High-contrast */
  @media (forced-colors: active) {
    .msk-block { background: ButtonFace; border: 1px solid ButtonText; }
  }
`;

// ============================================================================
// DETERMINISTIC SIZING  — avoids random values that cause hydration issues
// Widths cycle through predefined arrays so every render is identical.
// ============================================================================

const TITLE_WIDTHS    = [55, 70, 45, 80, 60, 72, 50, 65] as const;
const PREVIEW_WIDTHS  = [80, 60, 90, 50, 75, 85, 55, 70] as const;
const BUBBLE_WIDTHS   = [75, 55, 90, 45, 80, 60, 95, 50, 70, 85] as const;
const BUBBLE_HEIGHTS  = [20, 36, 20, 52, 20, 36, 68, 20, 36, 52] as const;

// ============================================================================
// PRIMITIVE: Skeleton block
// ============================================================================

interface BlockProps {
  w?: number | string;
  h?: number | string;
  radius?: number;
  style?: React.CSSProperties;
  className?: string;
}

function Block({ w = '100%', h = 14, radius, style, className = '' }: BlockProps) {
  return (
    <span
      className={`msk-block ${className}`}
      style={{
        width: typeof w === 'number' ? `${w}%` : w,
        height: typeof h === 'number' ? h : h,
        borderRadius: radius !== undefined ? radius : undefined,
        display: 'block',
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

// ============================================================================
// CONVERSATION LIST SKELETON
// ============================================================================

function ConvRow({ idx }: { idx: number }) {
  const titleW   = TITLE_WIDTHS[idx % TITLE_WIDTHS.length];
  const previewW = PREVIEW_WIDTHS[idx % PREVIEW_WIDTHS.length];
  const showBadge = idx % 3 === 0;
  const showDot   = idx % 4 === 1;

  return (
    <div className="msk-conv-row">
      <Block className="msk-conv-avatar" w={40} h={40} />
      <div className="msk-conv-content">
        <div className="msk-conv-row1">
          <Block w={titleW} h={13} />
          <Block w={28} h={10} />
        </div>
        <div className="msk-conv-row2">
          <Block w={previewW} h={11} />
          <div className="msk-conv-badges">
            {showDot  && <Block w={8}  h={8}  radius={4} />}
            {showBadge && <Block w={20} h={16} radius={10} />}
          </div>
        </div>
        <Block w={30} h={3} radius={2} style={{ marginTop: 4, opacity: 0.5 }} />
      </div>
    </div>
  );
}

function ConversationListSkeleton({ rows }: { rows: number }) {
  return (
    <div
      className="msk-convlist"
      role="status"
      aria-label="Loading conversations"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
        Loading conversations…
      </span>
      {Array.from({ length: rows }, (_, i) => (
        <ConvRow key={i} idx={i} />
      ))}
    </div>
  );
}

// ============================================================================
// CHAT MESSAGES SKELETON
// ============================================================================

type MsgKind = 'incoming' | 'outgoing' | 'system' | 'ai';

// Deterministic message pattern — avoids random, looks natural
function getMsgPattern(total: number): MsgKind[] {
  const pattern: MsgKind[] = [];
  for (let i = 0; i < total; i++) {
    if (i === 0) { pattern.push('incoming'); continue; }
    if (i % 7 === 3) { pattern.push('system'); continue; }
    if (i % 7 === 6) { pattern.push('ai'); continue; }
    pattern.push(i % 3 === 2 ? 'outgoing' : 'incoming');
  }
  return pattern;
}

interface MsgBubbleSkeletonProps {
  idx: number;
  kind: MsgKind;
  compact?: boolean;
}

function MsgBubbleSkeleton({ idx, kind, compact }: MsgBubbleSkeletonProps) {
  if (kind === 'system') {
    return (
      <div className="msk-msg msk-msg--system" style={{ marginBottom: compact ? 6 : 12 }}>
        <Block w={6} h={6} radius={3} style={{ opacity: 0.5 }} />
        <Block w={`${PREVIEW_WIDTHS[idx % PREVIEW_WIDTHS.length] * 0.4}%`} h={10} style={{ opacity: 0.5 }} />
        <Block w={6} h={6} radius={3} style={{ opacity: 0.5 }} />
      </div>
    );
  }

  const bubbleW = BUBBLE_WIDTHS[idx % BUBBLE_WIDTHS.length];
  const bubbleH = BUBBLE_HEIGHTS[idx % BUBBLE_HEIGHTS.length];
  const isOwn   = kind === 'outgoing';
  const showThread  = idx % 5 === 4;
  const showReact   = idx % 6 === 2;
  const showName    = !isOwn && idx % 3 !== 1;
  const isCompact   = compact;

  return (
    <div
      className={`msk-msg${isOwn ? ' msk-msg--own' : ''}${isCompact ? ' msk-msg--compact' : ''}`}
    >
      {!isOwn && (
        <Block
          className="msk-msg-avatar"
          w={36}
          h={36}
          radius={18}
        />
      )}

      <div className="msk-msg-body">
        {showName && (
          <Block className="msk-msg-name" w={`${TITLE_WIDTHS[idx % TITLE_WIDTHS.length] * 0.6}%`} h={10} />
        )}

        <Block
          className="msk-msg-bubble"
          w={`${bubbleW}%`}
          h={bubbleH}
          radius={12}
        />

        {showReact && (
          <Block className="msk-msg-react" w={48} h={20} radius={10} style={{ opacity: 0.6 }} />
        )}

        {showThread && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
            <Block w={16} h={16} radius={8} style={{ opacity: 0.5 }} />
            <Block w={`${PREVIEW_WIDTHS[(idx + 1) % PREVIEW_WIDTHS.length] * 0.35}%`} h={11} style={{ opacity: 0.5 }} />
          </div>
        )}
      </div>
    </div>
  );
}

function DateSepSkeleton() {
  return (
    <div className="msk-date-sep" aria-hidden="true">
      <Block className="msk-date-sep-line" h={1} />
      <Block className="msk-date-sep-text" w={56} h={11} />
      <Block className="msk-date-sep-line" h={1} />
    </div>
  );
}

function ChatMessagesSkeleton({ rows, compact }: { rows: number; compact?: boolean }) {
  const pattern = getMsgPattern(rows);
  const showDate = rows >= 4;

  return (
    <div
      className="msk-chatlist"
      role="status"
      aria-label="Loading messages"
      aria-busy="true"
      aria-live="polite"
    >
      <span
        className="sr-only"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
      >
        Loading messages…
      </span>

      {showDate && <DateSepSkeleton />}

      {pattern.map((kind, i) => (
        <MsgBubbleSkeleton key={i} idx={i} kind={kind} compact={compact} />
      ))}
    </div>
  );
}

// ============================================================================
// HEADER SKELETON
// ============================================================================

function ChatHeaderSkeleton() {
  return (
    <div className="msk-header" role="status" aria-label="Loading workspace header" aria-busy="true">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Block className="msk-header-icon" w={40} h={40} radius={10} />
        <div className="msk-header-left">
          <Block w={160} h={15} />
          <Block w={110} h={11} />
        </div>
      </div>
      <div className="msk-header-right">
        <Block w={30} h={30} radius={8} />
        <Block w={30} h={30} radius={8} />
        <Block w={30} h={30} radius={8} />
      </div>
    </div>
  );
}

// ============================================================================
// COMPOSER SKELETON
// ============================================================================

function ComposerSkeleton() {
  return (
    <div className="msk-composer" role="status" aria-label="Loading composer" aria-busy="true">
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: 2 }}>
        <Block w={80} h={20} radius={12} />
      </div>
      <div className="msk-composer-box">
        <Block w="100%" h={56} radius={0} style={{ border: 'none' }} />
        <div className="msk-composer-toolbar">
          <div className="msk-composer-tools">
            <Block className="msk-tool-icon" w={28} h={28} />
            <Block className="msk-tool-icon" w={28} h={28} />
            <Block className="msk-tool-icon" w={28} h={28} />
            <Block w={1} h={18} style={{ opacity: 0.2, margin: '0 4px' }} />
            <Block w={60} h={22} radius={12} style={{ opacity: 0.7 }} />
          </div>
          <Block w={70} h={32} radius={8} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// AI PANEL SKELETON
// ============================================================================

function AiPanelSkeleton() {
  return (
    <div className="msk-ai-panel" role="status" aria-label="Loading AI assistant" aria-busy="true">
      <div className="msk-ai-header">
        <Block className="msk-ai-badge" w={32} h={32} radius={8} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <Block w={90} h={13} />
          <Block w={50} h={10} />
        </div>
      </div>
      <div className="msk-ai-body">
        {/* Quick actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[72, 88, 60, 80].map((w, i) => (
            <Block key={i} w={w} h={28} radius={20} />
          ))}
        </div>

        {/* Suggested cards */}
        {[0, 1, 2].map((i) => (
          <div key={i} className="msk-ai-card">
            <Block w={`${TITLE_WIDTHS[i % TITLE_WIDTHS.length]}%`} h={12} />
            <Block w={`${PREVIEW_WIDTHS[i % PREVIEW_WIDTHS.length]}%`} h={10} />
            <Block w={45} h={10} style={{ opacity: 0.5 }} />
          </div>
        ))}
      </div>

      <div className="msk-ai-actions">
        <Block className="msk-ai-action-row" w="100%" h={36} radius={8} />
        <Block className="msk-ai-action-row" w="100%" h={36} radius={8} style={{ opacity: 0.7 }} />
      </div>
    </div>
  );
}

// ============================================================================
// THREAD SKELETON
// ============================================================================

function ThreadSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="msk-thread" role="status" aria-label="Loading thread" aria-busy="true">
      {/* Parent message */}
      <div className="msk-thread-parent">
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Block w={36} h={36} radius={18} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Block w={100} h={12} />
            <Block w="75%" h={20} radius={10} />
            <Block w="55%" h={20} radius={10} />
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="msk-thread-replies">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="msk-thread-reply">
            <Block w={28} h={28} radius={14} style={{ flexShrink: 0 }} />
            <div className="msk-thread-body">
              <Block w={`${TITLE_WIDTHS[i % TITLE_WIDTHS.length] * 0.6}%`} h={10} />
              <Block w={`${BUBBLE_WIDTHS[i % BUBBLE_WIDTHS.length]}%`} h={BUBBLE_HEIGHTS[i % BUBBLE_HEIGHTS.length]} radius={10} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// FULL WORKSPACE SKELETON (header + messages + composer)
// ============================================================================

function FullWorkspaceSkeleton({ rows = 4, compact }: { rows?: number; compact?: boolean }) {
  return (
    <div className="msk-full" role="status" aria-label="Loading workspace" aria-busy="true">
      <ChatHeaderSkeleton />
      <div className="msk-full-body">
        <ChatMessagesSkeleton rows={rows} compact={compact} />
      </div>
      <ComposerSkeleton />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function MessagesSkeletonBase({
  rows = 3,
  variant,
  compact = false,
}: MessagesSkeletonProps) {
  ensureStyles();

  // Auto-detect variant from rows when not explicitly provided
  const effectiveVariant: SkeletonVariant = variant ?? (rows >= 5 ? 'conversation_list' : 'chat_messages');

  switch (effectiveVariant) {
    case 'conversation_list':
      return <ConversationListSkeleton rows={rows} />;

    case 'chat_messages':
      return <ChatMessagesSkeleton rows={rows} compact={compact} />;

    case 'chat_header':
      return <ChatHeaderSkeleton />;

    case 'composer':
      return <ComposerSkeleton />;

    case 'ai_panel':
      return <AiPanelSkeleton />;

    case 'thread':
      return <ThreadSkeleton rows={rows} />;

    case 'full_workspace':
      return <FullWorkspaceSkeleton rows={rows} compact={compact} />;

    default:
      return <ChatMessagesSkeleton rows={rows} compact={compact} />;
  }
}

export const MessagesSkeleton = memo(MessagesSkeletonBase);
MessagesSkeletonBase.displayName = 'MessagesSkeleton';
