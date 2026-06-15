/**
 * MessageInput — Enterprise Communication Composer
 *
 * The primary communication creation interface for Maylet XLab Innovation
 * Operating System. Supports 13 message types, @mentions, file attachments,
 * AI assistance, keyboard shortcuts, auto-growing textarea, and draft control.
 *
 * Backward compatible with the existing MessagesPage props contract:
 *   { value, sending, onChange, onSend, onTyping }
 *
 * Extended with optional enterprise props for richer payloads, mention
 * search, AI assistance, and telemetry.
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
  ChangeEvent,
  memo,
} from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type MessageType =
  | 'standard'
  | 'research_insight'
  | 'project_update'
  | 'prototype_review'
  | 'experiment_observation'
  | 'validation_feedback'
  | 'funding_discussion'
  | 'commercialization_rec'
  | 'team_announcement'
  | 'decision_record'
  | 'task_assignment'
  | 'community_discussion'
  | 'ai_prompt';

export type ComposerPriority = 'normal' | 'high' | 'critical';

export interface PendingAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  file: File;
  previewUrl?: string;
}

export interface MentionSuggestion {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
}

export interface ComposerPayload {
  content: string;
  messageType: MessageType;
  priority: ComposerPriority;
  attachments: PendingAttachment[];
  mentionedIds: string[];
  metadata: Record<string, string>;
}

export interface AiAssistAction {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export interface MessageInputProps {
  // Backward-compatible core props
  value: string;
  sending: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onTyping: (typing: boolean) => void;

  // Extended enterprise props (all optional)
  conversationId?: string;
  conversationType?: string;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  onSubmitPayload?: (payload: ComposerPayload) => void;
  searchMentions?: (query: string) => Promise<MentionSuggestion[]>;
  onAiAssist?: (action: string, content: string) => Promise<string>;
  onInteraction?: (event: { action: string; messageType: MessageType }) => void;
}

// ============================================================================
// MODULE-LEVEL CONSTANTS  (allocated once, never re-created during renders)
// ============================================================================

const TYPE_META: Record<MessageType, { icon: string; label: string; color: string; shortLabel: string }> = {
  standard:               { icon: '💬', label: 'Standard Message',          shortLabel: 'Message',     color: '#7c5fe6' },
  research_insight:       { icon: '🔬', label: 'Research Insight',          shortLabel: 'Research',    color: '#8b5cf6' },
  project_update:         { icon: '📁', label: 'Project Update',            shortLabel: 'Project',     color: '#10b981' },
  prototype_review:       { icon: '🛠️', label: 'Prototype Review',          shortLabel: 'Prototype',   color: '#f59e0b' },
  experiment_observation: { icon: '🧪', label: 'Experiment Observation',    shortLabel: 'Experiment',  color: '#ec4899' },
  validation_feedback:    { icon: '✅', label: 'Validation Feedback',       shortLabel: 'Validation',  color: '#06b6d4' },
  funding_discussion:     { icon: '💰', label: 'Funding Discussion',        shortLabel: 'Funding',     color: '#84cc16' },
  commercialization_rec:  { icon: '🚀', label: 'Commercialization Rec.',    shortLabel: 'GTM',         color: '#f97316' },
  team_announcement:      { icon: '📢', label: 'Team Announcement',         shortLabel: 'Announce',    color: '#3b82f6' },
  decision_record:        { icon: '⚖️', label: 'Decision Record',           shortLabel: 'Decision',    color: '#6366f1' },
  task_assignment:        { icon: '✓',  label: 'Task Assignment',           shortLabel: 'Task',        color: '#14b8a6' },
  community_discussion:   { icon: '🌐', label: 'Community Discussion',      shortLabel: 'Community',   color: '#d946ef' },
  ai_prompt:              { icon: '✦',  label: 'AI Prompt',                 shortLabel: 'AI Prompt',   color: '#a855f7' },
};

const AI_ACTIONS: AiAssistAction[] = [
  { id: 'rewrite',            icon: '✍️',  label: 'Rewrite',                description: 'Rewrite for clarity and conciseness' },
  { id: 'improve',            icon: '✨',  label: 'Improve Writing',        description: 'Improve grammar and professionalism' },
  { id: 'summarize',          icon: '📋',  label: 'Summarize Draft',        description: 'Compress to key points' },
  { id: 'gen_questions',      icon: '❓',  label: 'Generate Questions',     description: 'Generate research questions from draft' },
  { id: 'gen_validation',     icon: '✅',  label: 'Validation Questions',   description: 'Create validation criteria' },
  { id: 'gen_funding',        icon: '💰',  label: 'Funding Request',        description: 'Structure as funding proposal' },
  { id: 'gen_commercialization', icon: '🚀', label: 'GTM Suggestions',    description: 'Add commercialization recommendations' },
  { id: 'gen_ideas',          icon: '💡',  label: 'Generate Ideas',        description: 'Expand with related ideas' },
];

const QUICK_EMOJI = ['👍', '✅', '🚀', '💡', '❓', '⚠️', '🎉', '📌'];

const ACCEPT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'image/*',
  'video/*',
].join(',');

// ============================================================================
// STYLE SINGLETON
// ============================================================================

let _stylesInjected = false;
function ensureStyles(): void {
  if (_stylesInjected || typeof document === 'undefined') return;
  _stylesInjected = true;
  const el = document.createElement('style');
  el.setAttribute('data-mic-styles', '1');
  el.textContent = MIC_CSS;
  document.head.appendChild(el);
}

const MIC_CSS = `
  /* ── Design tokens ─────────────────────────────────────────── */
  :root {
    --mic-bg:          #13131f;
    --mic-surface:     #1a1a2e;
    --mic-border:      #2d2d3f;
    --mic-border-focus:#7c5fe6;
    --mic-text:        #e2e8f0;
    --mic-text-sub:    #94a3b8;
    --mic-text-muted:  #475569;
    --mic-primary:     #7c5fe6;
    --mic-primary-h:   #8b6df5;
    --mic-danger:      #ef4444;
    --mic-radius:      12px;
    --mic-radius-sm:   8px;
  }
  @media (prefers-color-scheme: light) {
    :root {
      --mic-bg:        #ffffff;
      --mic-surface:   #f8fafc;
      --mic-border:    #e2e8f0;
      --mic-text:      #0f172a;
      --mic-text-sub:  #475569;
      --mic-text-muted:#94a3b8;
    }
  }

  /* ── Root ───────────────────────────────────────────────────── */
  .mic {
    display: flex;
    flex-direction: column;
    background: var(--mic-bg);
    border-top: 1px solid var(--mic-border);
    padding: 0.75rem 1rem;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  /* ── Type bar ───────────────────────────────────────────────── */
  .mic-type-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
  }
  .mic-type-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.625rem;
    border-radius: 20px;
    border: 1px solid;
    background: none;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
    letter-spacing: 0.02em;
  }
  .mic-type-btn:hover { opacity: 0.8; }
  .mic-type-icon { font-size: 0.875rem; }

  /* Type menu */
  .mic-type-menu {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 0;
    background: #1a1a2e;
    border: 1px solid var(--mic-border);
    border-radius: var(--mic-radius);
    padding: 0.5rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.25rem;
    z-index: 100;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    min-width: 340px;
  }
  .mic-type-option {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.5rem 0.75rem;
    border-radius: var(--mic-radius-sm);
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.1s;
  }
  .mic-type-option:hover { background: rgba(255,255,255,0.06); }
  .mic-type-option--active { background: rgba(124,95,230,0.15); }
  .mic-type-option__icon { font-size: 1rem; flex-shrink: 0; }
  .mic-type-option__label { font-size: 0.8125rem; font-weight: 500; color: var(--mic-text); }
  .mic-type-option__desc  { font-size: 0.6875rem; color: var(--mic-text-muted); }

  /* ── Composer box ───────────────────────────────────────────── */
  .mic-box {
    position: relative;
    background: var(--mic-surface);
    border: 1px solid var(--mic-border);
    border-radius: var(--mic-radius);
    transition: border-color 0.15s;
  }
  .mic-box:focus-within { border-color: var(--mic-border-focus); }

  /* Textarea */
  .mic-textarea {
    display: block;
    width: 100%;
    min-height: 56px;
    max-height: 260px;
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    outline: none;
    color: var(--mic-text);
    font-size: 0.9375rem;
    font-family: inherit;
    line-height: 1.5;
    resize: none;
    box-sizing: border-box;
    overflow-y: auto;
  }
  .mic-textarea::placeholder { color: var(--mic-text-muted); }
  .mic-textarea:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Mention dropdown */
  .mic-mention-dropdown {
    position: absolute;
    bottom: calc(100% + 4px);
    left: 0.5rem;
    right: 0.5rem;
    background: #1a1a2e;
    border: 1px solid var(--mic-border);
    border-radius: var(--mic-radius-sm);
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    z-index: 90;
    max-height: 200px;
    overflow-y: auto;
  }
  .mic-mention-item {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.5rem 0.75rem;
    border: none;
    background: none;
    cursor: pointer;
    width: 100%;
    text-align: left;
    transition: background 0.1s;
  }
  .mic-mention-item:hover,
  .mic-mention-item--focused { background: rgba(124,95,230,0.12); }
  .mic-mention-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--mic-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6875rem;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
    overflow: hidden;
  }
  .mic-mention-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .mic-mention-name { font-size: 0.875rem; font-weight: 500; color: var(--mic-text); }
  .mic-mention-role { font-size: 0.75rem; color: var(--mic-text-muted); }
  .mic-mention-loading { padding: 0.75rem; text-align: center; font-size: 0.8125rem; color: var(--mic-text-muted); }

  /* ── Attachments ────────────────────────────────────────────── */
  .mic-attachments {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    border-top: 1px solid var(--mic-border);
  }
  .mic-attachment {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.5rem;
    background: rgba(124,95,230,0.1);
    border: 1px solid rgba(124,95,230,0.25);
    border-radius: 6px;
    font-size: 0.75rem;
    color: var(--mic-text);
    max-width: 180px;
  }
  .mic-attachment__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
  .mic-attachment__size { color: var(--mic-text-muted); font-size: 0.6875rem; flex-shrink: 0; }
  .mic-attachment__remove {
    background: none;
    border: none;
    color: var(--mic-text-muted);
    cursor: pointer;
    padding: 0;
    font-size: 0.875rem;
    line-height: 1;
    flex-shrink: 0;
    transition: color 0.1s;
  }
  .mic-attachment__remove:hover { color: var(--mic-danger); }

  /* ── Toolbar ────────────────────────────────────────────────── */
  .mic-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.375rem 0.75rem;
    border-top: 1px solid var(--mic-border);
    gap: 0.25rem;
  }
  .mic-toolbar__left  { display: flex; align-items: center; gap: 0.125rem; }
  .mic-toolbar__right { display: flex; align-items: center; gap: 0.375rem; }

  .mic-tool-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    background: none;
    cursor: pointer;
    font-size: 1rem;
    color: var(--mic-text-muted);
    transition: all 0.12s;
    position: relative;
  }
  .mic-tool-btn:hover { background: rgba(255,255,255,0.06); color: var(--mic-text); }
  .mic-tool-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .mic-tool-btn--active { background: rgba(124,95,230,0.15); color: var(--mic-primary); }
  .mic-tool-btn:focus-visible { outline: 2px solid var(--mic-primary); outline-offset: 1px; }

  /* AI menu */
  .mic-ai-menu {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 0;
    background: #1a1a2e;
    border: 1px solid var(--mic-border);
    border-radius: var(--mic-radius);
    padding: 0.375rem;
    z-index: 100;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    min-width: 260px;
  }
  .mic-ai-label {
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--mic-text-muted);
    padding: 0.25rem 0.5rem;
  }
  .mic-ai-action {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.5rem 0.625rem;
    border-radius: 6px;
    border: none;
    background: none;
    cursor: pointer;
    width: 100%;
    text-align: left;
    transition: background 0.1s;
  }
  .mic-ai-action:hover { background: rgba(255,255,255,0.06); }
  .mic-ai-action:disabled { opacity: 0.4; cursor: not-allowed; }
  .mic-ai-action__icon { font-size: 1rem; flex-shrink: 0; }
  .mic-ai-action__label { font-size: 0.8125rem; font-weight: 500; color: var(--mic-text); }
  .mic-ai-action__desc  { font-size: 0.6875rem; color: var(--mic-text-muted); }

  /* Emoji quick-pick */
  .mic-emoji-row {
    display: flex;
    gap: 0.125rem;
    padding: 0.25rem 0.625rem;
    position: absolute;
    bottom: calc(100% + 6px);
    left: 0;
    background: #1a1a2e;
    border: 1px solid var(--mic-border);
    border-radius: var(--mic-radius-sm);
    z-index: 100;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  }
  .mic-emoji-btn {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: background 0.1s;
  }
  .mic-emoji-btn:hover { background: rgba(255,255,255,0.08); }

  /* Priority toggle */
  .mic-priority {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border-radius: 20px;
    border: 1px solid;
    font-size: 0.6875rem;
    font-weight: 600;
    cursor: pointer;
    background: none;
    transition: opacity 0.15s;
    letter-spacing: 0.03em;
  }
  .mic-priority:hover { opacity: 0.8; }
  .mic-priority--normal   { color: var(--mic-text-muted); border-color: var(--mic-border); }
  .mic-priority--high     { color: #f59e0b; border-color: #f59e0b50; background: #f59e0b15; }
  .mic-priority--critical { color: #ef4444; border-color: #ef444450; background: #ef444415; }

  /* Char count */
  .mic-charcount {
    font-size: 0.6875rem;
    color: var(--mic-text-muted);
  }
  .mic-charcount--warn { color: #f59e0b; }
  .mic-charcount--over { color: #ef4444; }

  /* Send button */
  .mic-send {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 1rem;
    background: var(--mic-primary);
    border: none;
    border-radius: var(--mic-radius-sm);
    color: #fff;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .mic-send:hover:not(:disabled) { background: var(--mic-primary-h); }
  .mic-send:disabled {
    background: #252538;
    color: var(--mic-text-muted);
    cursor: not-allowed;
  }
  .mic-send:focus-visible { outline: 2px solid var(--mic-primary); outline-offset: 2px; }

  /* Keyboard hint */
  .mic-hint {
    font-size: 0.625rem;
    color: var(--mic-text-muted);
    letter-spacing: 0.02em;
  }
  kbd.mic-kbd {
    display: inline-block;
    padding: 0.0625rem 0.25rem;
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--mic-border);
    border-radius: 3px;
    font-family: inherit;
    font-size: 0.5625rem;
  }

  /* AI processing overlay */
  .mic-ai-processing {
    position: absolute;
    inset: 0;
    background: rgba(19,19,31,0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--mic-radius);
    font-size: 0.875rem;
    color: var(--mic-text-sub);
    gap: 0.5rem;
    z-index: 5;
  }

  /* Spin animation */
  @keyframes mic-spin { to { transform: rotate(360deg); } }
  .mic-spin { display: inline-block; animation: mic-spin 0.7s linear infinite; }

  /* Responsive */
  @media (max-width: 480px) {
    .mic { padding: 0.5rem; }
    .mic-type-menu { grid-template-columns: 1fr; min-width: 200px; }
    .mic-hint { display: none; }
  }
`;

// ============================================================================
// HELPERS
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function detectMentionAtCursor(
  value: string,
  cursorPos: number
): { query: string; start: number } | null {
  const before = value.slice(0, cursorPos);
  const match = before.match(/@(\w*)$/);
  if (!match) return null;
  return {
    query: match[1],
    start: before.length - match[0].length,
  };
}

function insertMentionIntoText(
  value: string,
  cursorPos: number,
  start: number,
  suggestion: MentionSuggestion
): string {
  const before = value.slice(0, start);
  const after  = value.slice(cursorPos);
  return `${before}@${suggestion.name} ${after}`;
}

function nextPriority(current: ComposerPriority): ComposerPriority {
  if (current === 'normal')   return 'high';
  if (current === 'high')     return 'critical';
  return 'normal';
}

// ============================================================================
// COMPONENT
// ============================================================================

function MessageInputBase({
  value,
  sending,
  onChange,
  onSend,
  onTyping,
  conversationId: _conversationId,
  conversationType: _conversationType,
  placeholder = 'Compose a message… (Enter to send, Shift+Enter for new line)',
  maxLength = 8000,
  disabled = false,
  onSubmitPayload,
  searchMentions,
  onAiAssist,
  onInteraction,
}: MessageInputProps) {
  ensureStyles();

  const [messageType,      setMessageType]      = useState<MessageType>('standard');
  const [priority,         setPriority]         = useState<ComposerPriority>('normal');
  const [attachments,      setAttachments]      = useState<PendingAttachment[]>([]);
  const [showTypeMenu,     setShowTypeMenu]     = useState(false);
  const [showAiMenu,       setShowAiMenu]       = useState(false);
  const [showEmoji,        setShowEmoji]        = useState(false);
  const [aiProcessing,     setAiProcessing]     = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([]);
  const [mentionLoading,   setMentionLoading]   = useState(false);
  const [mentionDetection, setMentionDetection] = useState<{ query: string; start: number } | null>(null);
  const [mentionFocusIdx,  setMentionFocusIdx]  = useState(0);
  const [mentionedIds,     setMentionedIds]     = useState<string[]>([]);

  const textareaRef        = useRef<HTMLTextAreaElement>(null);
  const fileInputRef       = useRef<HTMLInputElement>(null);
  const typingTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mentionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorPosRef       = useRef(0);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 260)}px`;
  }, [value]);

  // Typing indicator debounce
  const signalTyping = useCallback((active: boolean) => {
    onTyping(active);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (active) {
      typingTimerRef.current = setTimeout(() => onTyping(false), 3000);
    }
  }, [onTyping]);

  // Handle textarea change
  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursor   = e.target.selectionStart ?? newValue.length;
    cursorPosRef.current = cursor;

    if (newValue.length > maxLength) return;

    onChange(newValue);
    signalTyping(newValue.length > 0);

    // Mention detection
    const detection = detectMentionAtCursor(newValue, cursor);
    setMentionDetection(detection);
    setMentionFocusIdx(0);

    if (detection && searchMentions) {
      if (mentionDebounceRef.current) clearTimeout(mentionDebounceRef.current);
      mentionDebounceRef.current = setTimeout(async () => {
        setMentionLoading(true);
        try {
          const results = await searchMentions(detection.query);
          setMentionSuggestions(results.slice(0, 8));
        } catch {
          setMentionSuggestions([]);
        } finally {
          setMentionLoading(false);
        }
      }, 250);
    } else {
      setMentionSuggestions([]);
    }
  }, [maxLength, onChange, signalTyping, searchMentions]);

  // Insert mention
  const handleSelectMention = useCallback((suggestion: MentionSuggestion) => {
    if (!mentionDetection) return;
    const cursor = cursorPosRef.current;
    const newValue = insertMentionIntoText(value, cursor, mentionDetection.start, suggestion);
    onChange(newValue);
    setMentionDetection(null);
    setMentionSuggestions([]);
    setMentionedIds((prev) =>
      prev.includes(suggestion.id) ? prev : [...prev, suggestion.id]
    );
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [mentionDetection, value, onChange]);

  // Submit
  const handleSubmit = useCallback(() => {
    if (!value.trim() || sending || disabled) return;

    onInteraction?.({ action: 'send', messageType });

    if (onSubmitPayload) {
      onSubmitPayload({
        content: value,
        messageType,
        priority,
        attachments,
        mentionedIds,
        metadata: {
          type: messageType,
          priority,
          attachmentCount: String(attachments.length),
        },
      });
    }

    onSend();
    setAttachments([]);
    setMentionedIds([]);
    signalTyping(false);
  }, [
    value, sending, disabled, messageType, priority, attachments,
    mentionedIds, onSend, onSubmitPayload, onInteraction, signalTyping,
  ]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Mention navigation
    if (mentionSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionFocusIdx((i) => Math.min(i + 1, mentionSuggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionFocusIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSelectMention(mentionSuggestions[mentionFocusIdx]);
        return;
      }
      if (e.key === 'Escape') {
        setMentionSuggestions([]);
        setMentionDetection(null);
        return;
      }
    }

    // Enter → send
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleSubmit();
      return;
    }

    // Ctrl+Shift+A → attach
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      fileInputRef.current?.click();
      return;
    }

    // Ctrl+Shift+D → decision record
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      setMessageType('decision_record');
      setShowTypeMenu(false);
      return;
    }

    // Ctrl+Enter → submit review
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      setMessageType('validation_feedback');
      handleSubmit();
      return;
    }
  }, [mentionSuggestions, mentionFocusIdx, handleSelectMention, handleSubmit]);

  // File attach
  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const next: PendingAttachment[] = files.map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setAttachments((prev) => [...prev, ...next]);
    e.target.value = '';
  }, []);

  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const item = prev.find((a) => a.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  // AI assist
  const handleAiAction = useCallback(async (action: AiAssistAction) => {
    if (!onAiAssist || !value.trim()) return;
    setShowAiMenu(false);
    setAiProcessing(true);
    try {
      const result = await onAiAssist(action.id, value);
      onChange(result);
    } catch {
      // silently fail — original content preserved
    } finally {
      setAiProcessing(false);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [onAiAssist, value, onChange]);

  // Emoji insert
  const insertEmoji = useCallback((emoji: string) => {
    const el = textareaRef.current;
    const cursor = el?.selectionStart ?? value.length;
    const newValue = `${value.slice(0, cursor)}${emoji}${value.slice(cursor)}`;
    if (newValue.length <= maxLength) onChange(newValue);
    setShowEmoji(false);
    setTimeout(() => {
      el?.focus();
      el?.setSelectionRange(cursor + emoji.length, cursor + emoji.length);
    }, 0);
  }, [value, maxLength, onChange]);

  const typeMeta     = TYPE_META[messageType];
  const charCount    = value.length;
  const charWarn     = charCount > maxLength * 0.85;
  const charOver     = charCount >= maxLength;
  const canSend      = !!value.trim() && !sending && !disabled && !charOver && !aiProcessing;
  const showMentions = mentionDetection !== null && (mentionLoading || mentionSuggestions.length > 0);

  return (
    <div className="mic" role="region" aria-label="Message composer">
      {/* Message type selector */}
      <div className="mic-type-bar">
        <button
          type="button"
          className="mic-type-btn"
          style={{ color: typeMeta.color, borderColor: `${typeMeta.color}50`, background: `${typeMeta.color}15` }}
          onClick={() => { setShowTypeMenu((v) => !v); setShowAiMenu(false); setShowEmoji(false); }}
          aria-label={`Message type: ${typeMeta.label}. Click to change.`}
          aria-haspopup="listbox"
          aria-expanded={showTypeMenu}
          data-testid="composer-type-btn"
        >
          <span className="mic-type-icon">{typeMeta.icon}</span>
          {typeMeta.shortLabel}
          <span style={{ fontSize: '0.625rem', opacity: 0.7 }}>▾</span>
        </button>

        {showTypeMenu && (
          <div className="mic-type-menu" role="listbox" aria-label="Select message type">
            {(Object.keys(TYPE_META) as MessageType[]).map((t) => {
              const m = TYPE_META[t];
              return (
                <button
                  key={t}
                  type="button"
                  role="option"
                  aria-selected={t === messageType}
                  className={`mic-type-option ${t === messageType ? 'mic-type-option--active' : ''}`}
                  onClick={() => { setMessageType(t); setShowTypeMenu(false); onInteraction?.({ action: 'type_change', messageType: t }); }}
                >
                  <span className="mic-type-option__icon">{m.icon}</span>
                  <div>
                    <div className="mic-type-option__label">{m.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Composer box */}
      <div className="mic-box" onClick={() => { setShowTypeMenu(false); setShowAiMenu(false); setShowEmoji(false); }}>
        {aiProcessing && (
          <div className="mic-ai-processing" aria-live="polite">
            <span className="mic-spin">⟳</span> AI is processing…
          </div>
        )}

        {/* @mention dropdown */}
        {showMentions && (
          <div className="mic-mention-dropdown" role="listbox" aria-label="Mention suggestions">
            {mentionLoading ? (
              <div className="mic-mention-loading">Searching…</div>
            ) : (
              mentionSuggestions.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  role="option"
                  aria-selected={idx === mentionFocusIdx}
                  className={`mic-mention-item ${idx === mentionFocusIdx ? 'mic-mention-item--focused' : ''}`}
                  onClick={() => handleSelectMention(s)}
                >
                  <div className="mic-mention-avatar">
                    {s.avatarUrl
                      ? <img src={s.avatarUrl} alt="" />
                      : s.name[0]?.toUpperCase()
                    }
                  </div>
                  <div>
                    <div className="mic-mention-name">{s.name}</div>
                    {s.role && <div className="mic-mention-role">{s.role}</div>}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        <textarea
          ref={textareaRef}
          className="mic-textarea"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || sending || aiProcessing}
          rows={2}
          aria-label="Compose message"
          aria-multiline="true"
          aria-describedby="mic-shortcuts"
          data-testid="composer-textarea"
          spellCheck
        />

        {/* Pending attachments */}
        {attachments.length > 0 && (
          <div className="mic-attachments" aria-label={`${attachments.length} pending attachment${attachments.length > 1 ? 's' : ''}`}>
            {attachments.map((att) => (
              <div key={att.id} className="mic-attachment">
                <span style={{ fontSize: '0.875rem' }}>
                  {att.mimeType.startsWith('image/') ? '🖼️'
                    : att.mimeType === 'application/pdf' ? '📄'
                    : att.mimeType.includes('presentation') ? '📊'
                    : att.mimeType.includes('spreadsheet') || att.mimeType === 'text/csv' ? '📈'
                    : '📎'}
                </span>
                <span className="mic-attachment__name" title={att.name}>{att.name}</span>
                <span className="mic-attachment__size">{formatBytes(att.size)}</span>
                <button
                  type="button"
                  className="mic-attachment__remove"
                  onClick={() => handleRemoveAttachment(att.id)}
                  aria-label={`Remove attachment ${att.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="mic-toolbar">
          <div className="mic-toolbar__left">
            {/* Attach */}
            <button
              type="button"
              className="mic-tool-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file (Ctrl+Shift+A)"
              aria-label="Attach file"
              disabled={disabled || sending}
            >
              📎
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_TYPES}
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
              aria-hidden="true"
            />

            {/* Emoji */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={`mic-tool-btn ${showEmoji ? 'mic-tool-btn--active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setShowEmoji((v) => !v); setShowAiMenu(false); }}
                title="Insert emoji"
                aria-label="Insert emoji"
                aria-haspopup="true"
                aria-expanded={showEmoji}
                disabled={disabled || sending}
              >
                😊
              </button>
              {showEmoji && (
                <div className="mic-emoji-row">
                  {QUICK_EMOJI.map((em) => (
                    <button
                      key={em}
                      type="button"
                      className="mic-emoji-btn"
                      onClick={() => insertEmoji(em)}
                      aria-label={`Insert ${em}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* AI Assist */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={`mic-tool-btn ${showAiMenu ? 'mic-tool-btn--active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setShowAiMenu((v) => !v); setShowEmoji(false); }}
                title="AI assistance"
                aria-label="AI assistance"
                aria-haspopup="true"
                aria-expanded={showAiMenu}
                disabled={disabled || sending || !value.trim()}
                style={{ color: showAiMenu ? '#a855f7' : undefined }}
              >
                ✦
              </button>
              {showAiMenu && (
                <div className="mic-ai-menu" role="menu" aria-label="AI assist actions">
                  <div className="mic-ai-label">AI Assistance</div>
                  {AI_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      role="menuitem"
                      className="mic-ai-action"
                      onClick={() => handleAiAction(action)}
                      disabled={!onAiAssist || aiProcessing}
                      title={onAiAssist ? action.description : 'Connect onAiAssist prop to enable'}
                    >
                      <span className="mic-ai-action__icon">{action.icon}</span>
                      <div>
                        <div className="mic-ai-action__label">{action.label}</div>
                        <div className="mic-ai-action__desc">{action.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ width: '1px', height: '18px', background: 'var(--mic-border)', margin: '0 0.25rem' }} aria-hidden="true" />

            {/* Priority toggle */}
            <button
              type="button"
              className={`mic-priority mic-priority--${priority}`}
              onClick={() => setPriority(nextPriority(priority))}
              aria-label={`Priority: ${priority}. Click to change.`}
              title="Toggle message priority"
            >
              {priority === 'critical' ? '⚡ Critical'
                : priority === 'high'   ? '▲ High'
                : '─ Normal'}
            </button>
          </div>

          <div className="mic-toolbar__right">
            {/* Char count */}
            {charWarn && (
              <span
                className={`mic-charcount ${charOver ? 'mic-charcount--over' : 'mic-charcount--warn'}`}
                aria-live="polite"
              >
                {charCount}/{maxLength}
              </span>
            )}

            <span className="mic-hint" id="mic-shortcuts" aria-label="Keyboard shortcuts">
              <kbd className="mic-kbd">Enter</kbd> send &nbsp;
              <kbd className="mic-kbd">⇧Enter</kbd> newline
            </span>

            <button
              type="button"
              className="mic-send"
              onClick={handleSubmit}
              disabled={!canSend}
              aria-label={sending ? 'Sending message' : 'Send message'}
              aria-busy={sending}
              data-testid="composer-send"
            >
              {sending
                ? <><span className="mic-spin">⟳</span> Sending</>
                : <>Send ↑</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORT — memo for stable rendering
// ============================================================================

export const MessageInput = memo(MessageInputBase);
MessageInputBase.displayName = 'MessageInput';
