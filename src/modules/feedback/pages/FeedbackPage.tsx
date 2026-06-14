import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase/client';
import { invokeMayaChat } from '../../../lib/maya/mayaChat.service';

/* ─── Types & constants ─────────────────────────────────────────────── */

const FB_VERSION = 1;

const CATEGORIES = [
  { id: 'bug', label: 'Bug Reports', icon: '🐛' },
  { id: 'feature', label: 'Feature Requests', icon: '✨' },
  { id: 'improvement', label: 'Improvement Suggestions', icon: '💡' },
  { id: 'research_review', label: 'Research Reviews', icon: '🔬' },
  { id: 'prototype_review', label: 'Prototype Reviews', icon: '🧪' },
  { id: 'experiment_review', label: 'Experiment Reviews', icon: '⚗️' },
  { id: 'validation_review', label: 'Validation Reviews', icon: '✅' },
  { id: 'investor', label: 'Investor Feedback', icon: '💼' },
  { id: 'customer', label: 'Customer Feedback', icon: '👥' },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

const WORKFLOW_STAGES = [
  'Submitted',
  'Reviewed',
  'Assigned',
  'In Progress',
  'Resolved',
  'Closed',
] as const;

type WorkflowStage = (typeof WORKFLOW_STAGES)[number];

const INTEGRATION_SOURCES = [
  { id: 'projects', label: 'Projects', route: '/projects', icon: '📁' },
  { id: 'research', label: 'Research', route: '/research', icon: '🔬' },
  { id: 'prototypes', label: 'Prototypes', route: '/prototypes', icon: '🧪' },
  { id: 'experiments', label: 'Experiments', route: '/experiments', icon: '⚗️' },
  { id: 'validation', label: 'Validation', route: '/validation', icon: '✅' },
  { id: 'funding', label: 'Funding', route: '/funding', icon: '💰' },
  { id: 'commercialization', label: 'Commercialization', route: '/commercialization', icon: '🚀' },
] as const;

type SourceId = (typeof INTEGRATION_SOURCES)[number]['id'];

type Sentiment = 'positive' | 'neutral' | 'negative';

interface FeedbackMeta {
  v: typeof FB_VERSION;
  body: string;
  category: CategoryId;
  workflow: WorkflowStage;
  rating?: number;
  sentiment?: Sentiment;
  source?: SourceId;
  linkedId?: string;
  linkedName?: string;
  assignee?: string;
  resolutionNotes?: string;
  tags?: string[];
}

interface FeedbackItem {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  meta: FeedbackMeta;
  origin: 'ticket' | 'project_review';
}

interface ProjectOption {
  id: string;
  name: string;
}

interface IntegrationCounts {
  projects: number;
  research: number;
  prototypes: number;
  experiments: number;
  validation: number;
  funding: number;
  commercialization: number;
}

const NAV = [
  { id: 'dashboard', label: 'Operations Dashboard', group: 'Command' },
  { id: 'inbox', label: 'Feedback Inbox', group: 'Workflow' },
  { id: 'categories', label: 'Categories', group: 'Workflow' },
  { id: 'workflow', label: 'Workflow Pipeline', group: 'Workflow' },
  { id: 'ratings', label: 'Ratings Center', group: 'Intelligence' },
  { id: 'analytics', label: 'Feedback Analytics', group: 'Intelligence' },
  { id: 'sentiment', label: 'Sentiment Analysis', group: 'Intelligence' },
  { id: 'assignment', label: 'Assignment & Resolution', group: 'Operations' },
  { id: 'integrations', label: 'Innovation Integrations', group: 'Platform' },
  { id: 'reports', label: 'Reports & Insights', group: 'Platform' },
] as const;

type ViewId = (typeof NAV)[number]['id'];

/* ─── Payload helpers ───────────────────────────────────────────────── */

function workflowToStatus(stage: WorkflowStage): string {
  switch (stage) {
    case 'Submitted':
    case 'Reviewed':
    case 'Assigned':
      return 'open';
    case 'In Progress':
      return 'in_progress';
    case 'Resolved':
      return 'resolved';
    case 'Closed':
      return 'closed';
    default:
      return 'open';
  }
}

function statusToWorkflow(status: string): WorkflowStage {
  switch (status) {
    case 'in_progress':
      return 'In Progress';
    case 'resolved':
      return 'Resolved';
    case 'closed':
      return 'Closed';
    default:
      return 'Submitted';
  }
}

function encodeMessage(meta: FeedbackMeta): string {
  return JSON.stringify({ ...meta, v: FB_VERSION });
}

function decodeMessage(raw: string, status: string, subject: string): FeedbackMeta {
  try {
    const parsed = JSON.parse(raw) as Partial<FeedbackMeta>;
    if (parsed.v === FB_VERSION && typeof parsed.body === 'string') {
      return {
        v: FB_VERSION,
        body: parsed.body,
        category: (parsed.category as CategoryId) ?? inferCategory(subject),
        workflow: parsed.workflow ?? statusToWorkflow(status),
        rating: parsed.rating,
        sentiment: parsed.sentiment ?? analyzeSentiment(parsed.body),
        source: parsed.source,
        linkedId: parsed.linkedId,
        linkedName: parsed.linkedName,
        assignee: parsed.assignee,
        resolutionNotes: parsed.resolutionNotes,
        tags: parsed.tags,
      };
    }
  } catch {
    /* legacy plain text */
  }
  return {
    v: FB_VERSION,
    body: raw,
    category: inferCategory(subject),
    workflow: statusToWorkflow(status),
    sentiment: analyzeSentiment(raw),
  };
}

function inferCategory(subject: string): CategoryId {
  const s = subject.toLowerCase();
  if (s.includes('bug')) return 'bug';
  if (s.includes('feature')) return 'feature';
  if (s.includes('investor')) return 'investor';
  if (s.includes('customer')) return 'customer';
  if (s.includes('experiment')) return 'experiment_review';
  if (s.includes('prototype')) return 'prototype_review';
  if (s.includes('validation')) return 'validation_review';
  if (s.includes('research')) return 'research_review';
  return 'improvement';
}

function analyzeSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  const positive = ['great', 'excellent', 'love', 'amazing', 'helpful', 'fast', 'smooth', 'success', 'improved', 'thank'];
  const negative = ['bug', 'broken', 'fail', 'slow', 'confusing', 'frustrat', 'error', 'crash', 'block', 'urgent', 'critical', 'bad', 'poor'];
  let score = 0;
  for (const w of positive) if (lower.includes(w)) score += 1;
  for (const w of negative) if (lower.includes(w)) score -= 1;
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

function isCritical(item: FeedbackItem): boolean {
  const p = item.priority.toLowerCase();
  return (
    p === 'urgent' ||
    p === 'high' ||
    item.meta.category === 'bug' ||
    (item.meta.rating !== undefined && item.meta.rating <= 2) ||
    item.meta.sentiment === 'negative'
  );
}

function isOpen(item: FeedbackItem): boolean {
  const w = item.meta.workflow;
  return w !== 'Resolved' && w !== 'Closed';
}

function categoryLabel(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

function sourceRoute(source?: SourceId, linkedId?: string): string | null {
  if (!source) return null;
  const base = INTEGRATION_SOURCES.find((s) => s.id === source)?.route;
  if (!base) return null;
  if (source === 'projects' && linkedId) return `/projects/${linkedId}`;
  if (source === 'experiments' && linkedId) return `/experiments/${linkedId}`;
  if (source === 'prototypes' && linkedId) return `/prototypes/${linkedId}`;
  if (source === 'validation' && linkedId) return `/validation/${linkedId}`;
  if (source === 'funding' && linkedId) return `/funding/${linkedId}`;
  if (source === 'research' && linkedId) return `/research/${linkedId}`;
  return base;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ─── Styles ────────────────────────────────────────────────────────── */

const FB_STYLES = `
  .fb-page { max-width: 1560px; margin: 0 auto; padding: 1rem 1.25rem 3rem; color: #e8e8f0; }
  .fb-header h1 {
    margin: 0.3rem 0 0.1rem; font-size: 1.7rem;
    background: linear-gradient(135deg, #fff, #f6ad55);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .fb-header__sub { margin: 0; opacity: 0.6; font-size: 0.84rem; }
  .fb-header__top { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; }
  .fb-header__actions { display: flex; gap: 0.45rem; flex-wrap: wrap; }
  .fb-workflow-strip {
    display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.5rem; font-size: 0.62rem; opacity: 0.55;
  }
  .fb-workflow-strip span::after { content: '→'; margin: 0 0.3rem; opacity: 0.4; }
  .fb-workflow-strip span:last-child::after { content: ''; }
  .fb-toolbar { display: flex; gap: 0.5rem; margin-top: 0.85rem; flex-wrap: wrap; }
  .fb-toolbar input, .fb-toolbar select {
    padding: 0.5rem 0.7rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.35); color: #fff; font-size: 0.82rem;
  }
  .fb-toolbar input { min-width: 220px; flex: 1; max-width: 360px; }
  .fb-layout { display: grid; grid-template-columns: 210px 1fr 270px; gap: 1rem; margin-top: 1rem; align-items: start; }
  @media (max-width: 1100px) { .fb-layout { grid-template-columns: 1fr; } .fb-maya { order: -1; } }
  .fb-nav { position: sticky; top: 0.75rem; max-height: calc(100vh - 1.5rem); overflow-y: auto; }
  .fb-nav__group { margin-bottom: 0.6rem; }
  .fb-nav__label { display: block; font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.4; padding: 0 0.45rem; margin-bottom: 0.15rem; }
  .fb-nav__item {
    display: block; width: 100%; text-align: left; padding: 0.36rem 0.5rem; border: none; border-radius: 7px;
    background: transparent; color: rgba(255,255,255,0.62); font-size: 0.71rem; cursor: pointer;
  }
  .fb-nav__item--active { background: rgba(246,173,85,0.15); color: #f6ad55; }
  .fb-section { background: rgba(0,0,0,0.32); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 1.1rem 1.2rem; }
  .fb-section-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.65rem; }
  .fb-section h2 { margin: 0; font-size: 1.05rem; color: #f6ad55; }
  .fb-lead { margin: 0 0 0.85rem; font-size: 0.84rem; opacity: 0.68; line-height: 1.5; }
  .fb-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 0.5rem; margin-bottom: 1rem; }
  .fb-kpi { background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.55rem 0.65rem; }
  .fb-kpi--accent { border-color: rgba(246,173,85,0.35); background: rgba(246,173,85,0.08); }
  .fb-kpi--warn { border-color: rgba(252,129,129,0.35); background: rgba(252,129,129,0.08); }
  .fb-kpi--good { border-color: rgba(104,211,145,0.35); background: rgba(104,211,145,0.08); }
  .fb-kpi span { display: block; font-size: 0.56rem; text-transform: uppercase; opacity: 0.5; }
  .fb-kpi strong { font-size: 1.05rem; color: #f6ad55; }
  .fb-kpi--good strong { color: #68d391; }
  .fb-kpi--warn strong { color: #fc8181; }
  .fb-split { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  @media (max-width: 800px) { .fb-split { grid-template-columns: 1fr; } }
  .fb-panel { background: rgba(0,0,0,0.22); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 0.85rem; }
  .fb-panel h3 { margin: 0 0 0.5rem; font-size: 0.88rem; }
  .fb-table-wrap { overflow-x: auto; margin-top: 0.5rem; }
  .fb-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
  .fb-table th, .fb-table td { padding: 0.5rem 0.45rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: top; }
  .fb-table th { font-size: 0.65rem; text-transform: uppercase; opacity: 0.5; }
  .fb-badge {
    font-size: 0.6rem; font-weight: 700; text-transform: uppercase; padding: 0.12rem 0.4rem;
    border-radius: 5px; background: rgba(255,255,255,0.08); white-space: nowrap;
  }
  .fb-badge--open { background: rgba(246,173,85,0.2); color: #f6ad55; }
  .fb-badge--progress { background: rgba(47,212,255,0.15); color: #2fd4ff; }
  .fb-badge--resolved { background: rgba(104,211,145,0.2); color: #68d391; }
  .fb-badge--closed { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); }
  .fb-badge--critical { background: rgba(252,129,129,0.25); color: #fc8181; }
  .fb-badge--positive { background: rgba(104,211,145,0.2); color: #68d391; }
  .fb-badge--negative { background: rgba(252,129,129,0.2); color: #fc8181; }
  .fb-badge--neutral { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); }
  .fb-btn {
    padding: 0.45rem 0.85rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06); color: #fff; font-size: 0.78rem; cursor: pointer; font-weight: 600;
  }
  .fb-btn:hover { background: rgba(255,255,255,0.1); }
  .fb-btn--primary {
    border: none; background: linear-gradient(135deg, #f6ad55, #dd6b20); color: #1a1a2e;
  }
  .fb-btn--ghost { background: transparent; border-color: rgba(246,173,85,0.35); color: #f6ad55; }
  .fb-btn--sm { padding: 0.3rem 0.55rem; font-size: 0.68rem; }
  .fb-link { color: #9b7ff0; text-decoration: none; font-size: 0.78rem; }
  .fb-link:hover { text-decoration: underline; }
  .fb-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.65rem; }
  .fb-card {
    background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px;
    padding: 0.85rem; font-size: 0.82rem; cursor: pointer; transition: border-color 0.15s;
  }
  .fb-card:hover { border-color: rgba(246,173,85,0.35); }
  .fb-card--active { border-color: rgba(246,173,85,0.5); background: rgba(246,173,85,0.06); }
  .fb-card__head { display: flex; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.4rem; align-items: flex-start; }
  .fb-card p { margin: 0.2rem 0 0; opacity: 0.8; line-height: 1.45; font-size: 0.76rem; }
  .fb-kanban { display: grid; grid-template-columns: repeat(6, minmax(130px, 1fr)); gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem; }
  .fb-kanban__col { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.5rem; min-height: 140px; }
  .fb-kanban__head { display: flex; justify-content: space-between; font-size: 0.62rem; text-transform: uppercase; opacity: 0.6; margin-bottom: 0.4rem; }
  .fb-kanban__card {
    padding: 0.45rem 0.5rem; margin-bottom: 0.35rem; border-radius: 7px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); font-size: 0.72rem; cursor: pointer;
  }
  .fb-kanban__card strong { display: block; margin-bottom: 0.15rem; }
  .fb-kanban__card span { opacity: 0.5; font-size: 0.62rem; }
  .fb-stars { display: flex; gap: 0.15rem; }
  .fb-star { color: rgba(255,255,255,0.2); font-size: 1rem; }
  .fb-star--on { color: #f6ad55; }
  .fb-chart-card { background: rgba(0,0,0,0.22); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 0.85rem; }
  .fb-chart-card h3 { margin: 0 0 0.65rem; font-size: 0.85rem; }
  .fb-bar-chart { display: flex; align-items: flex-end; gap: 0.35rem; height: 120px; }
  .fb-bar-chart__col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
  .fb-bar-chart__bar { width: 100%; max-width: 36px; background: linear-gradient(180deg, #f6ad55, #dd6b20); border-radius: 4px 4px 0 0; min-height: 4px; }
  .fb-bar-chart__label { font-size: 0.55rem; opacity: 0.55; margin-top: 0.3rem; text-align: center; }
  .fb-pipeline { display: flex; flex-direction: column; gap: 0.3rem; }
  .fb-pipeline__row { display: grid; grid-template-columns: 110px 1fr 28px; align-items: center; gap: 0.4rem; font-size: 0.72rem; }
  .fb-pipeline__bar { height: 5px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; }
  .fb-pipeline__bar div { height: 100%; background: linear-gradient(90deg, #dd6b20, #f6ad55); border-radius: 3px; }
  .fb-links-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 0.55rem; }
  .fb-link-card { display: block; padding: 0.8rem; border-radius: 10px; background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.07); text-decoration: none; color: inherit; }
  .fb-link-card strong { display: block; color: #f6ad55; margin-bottom: 0.15rem; }
  .fb-link-card span { font-size: 0.72rem; opacity: 0.6; }
  .fb-maya {
    position: sticky; top: 0.75rem; background: rgba(0,0,0,0.38); border: 1px solid rgba(246,173,85,0.2);
    border-radius: 14px; padding: 0.9rem; font-size: 0.76rem;
  }
  .fb-maya h3 { margin: 0 0 0.35rem; font-size: 0.88rem; color: #f6ad55; }
  .fb-maya__sub { margin: 0 0 0.65rem; opacity: 0.55; font-size: 0.68rem; }
  .fb-maya__block { margin-bottom: 0.55rem; }
  .fb-maya__block label { display: block; font-size: 0.58rem; text-transform: uppercase; opacity: 0.45; margin-bottom: 0.2rem; }
  .fb-maya__block ul { margin: 0; padding-left: 1rem; opacity: 0.85; }
  .fb-maya__block li { margin-bottom: 0.2rem; }
  .fb-maya__action { font-size: 0.72rem; padding: 0.45rem; border-radius: 7px; background: rgba(246,173,85,0.1); border: 1px solid rgba(246,173,85,0.25); margin: 0.5rem 0; }
  .fb-maya-chat { margin-top: 0.5rem; }
  .fb-maya-chat textarea {
    width: 100%; padding: 0.5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
    background: rgba(0,0,0,0.35); color: #fff; font-size: 0.72rem; resize: vertical; min-height: 56px;
  }
  .fb-maya-chat__reply { margin-top: 0.45rem; padding: 0.5rem; border-radius: 8px; background: rgba(246,173,85,0.08); font-size: 0.72rem; line-height: 1.45; }
  .fb-form { display: grid; gap: 0.65rem; max-width: 640px; }
  .fb-form label { display: block; font-size: 0.62rem; text-transform: uppercase; opacity: 0.5; margin-bottom: 0.2rem; }
  .fb-form input, .fb-form select, .fb-form textarea {
    width: 100%; padding: 0.5rem 0.7rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.35); color: #fff; font-size: 0.82rem;
  }
  .fb-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.55rem; }
  @media (max-width: 600px) { .fb-form-row { grid-template-columns: 1fr; } }
  .fb-empty { padding: 1.5rem; text-align: center; background: rgba(0,0,0,0.2); border-radius: 10px; opacity: 0.7; }
  .fb-loading { width: 40px; height: 40px; margin: 4rem auto; border: 3px solid rgba(246,173,85,0.2); border-top-color: #f6ad55; border-radius: 50%; animation: fb-spin 0.8s linear infinite; }
  @keyframes fb-spin { to { transform: rotate(360deg); } }
  .fb-detail { background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.9rem; margin-top: 0.75rem; }
  .fb-detail h3 { margin: 0 0 0.5rem; font-size: 0.95rem; }
  .fb-muted { font-size: 0.68rem; opacity: 0.5; }
  .fb-sentiment-meter { height: 8px; border-radius: 4px; background: rgba(255,255,255,0.08); overflow: hidden; display: flex; margin: 0.5rem 0; }
  .fb-sentiment-meter__pos { background: #68d391; }
  .fb-sentiment-meter__neu { background: rgba(255,255,255,0.25); }
  .fb-sentiment-meter__neg { background: #fc8181; }
  .fb-report-row { display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.78rem; }
`;

/* ─── Primitives ────────────────────────────────────────────────────── */

function FbKpi({ label, value, variant }: { label: string; value: string | number; variant?: 'accent' | 'good' | 'warn' }) {
  return (
    <div className={`fb-kpi ${variant ? `fb-kpi--${variant}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FbSectionHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="fb-section-head">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function WorkflowBadge({ stage }: { stage: WorkflowStage }) {
  const cls =
    stage === 'Resolved' ? 'fb-badge--resolved' :
    stage === 'Closed' ? 'fb-badge--closed' :
    stage === 'In Progress' ? 'fb-badge--progress' : 'fb-badge--open';
  return <span className={`fb-badge ${cls}`}>{stage}</span>;
}

function SentimentBadge({ sentiment }: { sentiment?: Sentiment }) {
  if (!sentiment) return <span className="fb-muted">—</span>;
  return <span className={`fb-badge fb-badge--${sentiment}`}>{sentiment}</span>;
}

function StarRating({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <div className="fb-stars" role={onChange ? 'group' : undefined}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`fb-star ${n <= value ? 'fb-star--on' : ''}`}
          style={{ background: 'none', border: 'none', cursor: onChange ? 'pointer' : 'default', padding: 0 }}
          onClick={() => onChange?.(n)}
          aria-label={`${n} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function BarChart({ labels, values, title }: { labels: string[]; values: number[]; title: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="fb-chart-card">
      <h3>{title}</h3>
      <div className="fb-bar-chart">
        {labels.map((label, i) => (
          <div key={label} className="fb-bar-chart__col">
            <div className="fb-bar-chart__bar" style={{ height: `${Math.round((values[i] / max) * 100)}%` }} title={String(values[i])} />
            <span className="fb-bar-chart__label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── MAYA intelligence ─────────────────────────────────────────────── */

function buildMayaInsights(items: FeedbackItem[]) {
  const open = items.filter(isOpen).length;
  const critical = items.filter(isCritical).length;
  const bugs = items.filter((i) => i.meta.category === 'bug').length;
  const features = items.filter((i) => i.meta.category === 'feature').length;
  const rated = items.filter((i) => i.meta.rating !== undefined);
  const avgRating = rated.length ? rated.reduce((s, i) => s + (i.meta.rating ?? 0), 0) / rated.length : 0;
  const neg = items.filter((i) => i.meta.sentiment === 'negative').length;
  const pos = items.filter((i) => i.meta.sentiment === 'positive').length;

  const bullets: string[] = [];
  if (critical > 0) bullets.push(`${critical} critical feedback item(s) need immediate triage.`);
  if (bugs > 0) bullets.push(`${bugs} bug report(s) in the pipeline — prioritize reproducibility checks.`);
  if (features > 2) bullets.push(`Feature request volume (${features}) suggests roadmap alignment review.`);
  if (neg > pos) bullets.push('Negative sentiment outweighs positive — investigate UX friction points.');
  if (avgRating >= 4) bullets.push(`Strong satisfaction signal (avg ${avgRating.toFixed(1)}/5).`);
  if (open > 5) bullets.push(`${open} open items — consider capacity planning for resolution.`);
  if (bullets.length === 0) bullets.push('Feedback portfolio is balanced. Continue monitoring category trends.');

  const patterns: string[] = [];
  const byCat = new Map<CategoryId, number>();
  for (const item of items) byCat.set(item.meta.category, (byCat.get(item.meta.category) ?? 0) + 1);
  const topCat = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCat && topCat[1] > 1) patterns.push(`Dominant category: ${categoryLabel(topCat[0])} (${topCat[1]} items)`);

  const stuck = items.filter((i) => i.meta.workflow === 'Assigned' || i.meta.workflow === 'Reviewed');
  if (stuck.length > 2) patterns.push(`${stuck.length} items stalled in Reviewed/Assigned stages`);

  const improvements = [
    'Route experiment and validation reviews to domain owners within 48h.',
    'Close the loop with submitters when status reaches Resolved.',
    'Tag feedback by innovation stage for portfolio-level reporting.',
  ];

  const priorityAction =
    critical > 0
      ? 'Triage critical issues and assign owners in the Resolution Center.'
      : open > 0
        ? 'Advance oldest open items through Reviewed → Assigned.'
        : 'Capture new feedback linked to active experiments or prototypes.';

  return { bullets, patterns, improvements, priorityAction, healthScore: Math.min(100, Math.round((pos / Math.max(1, items.length)) * 40 + avgRating * 12 + (100 - critical * 8))) };
}

function MayaSidebar({
  items,
  chatPrompt,
  setChatPrompt,
  chatReply,
  chatLoading,
  onAsk,
}: {
  items: FeedbackItem[];
  chatPrompt: string;
  setChatPrompt: (v: string) => void;
  chatReply: string | null;
  chatLoading: boolean;
  onAsk: () => void;
}) {
  const intel = useMemo(() => buildMayaInsights(items), [items]);

  return (
    <aside className="fb-maya">
      <h3>MAYA Feedback Intelligence</h3>
      <p className="fb-maya__sub">AI-powered triage, sentiment, and resolution guidance</p>
      <div className="fb-mini" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div>
          <span className="fb-muted">Health score</span>
          <strong style={{ color: '#f6ad55', display: 'block' }}>{intel.healthScore}%</strong>
        </div>
        <div>
          <span className="fb-muted">Portfolio</span>
          <strong style={{ color: '#68d391', display: 'block' }}>{items.length} items</strong>
        </div>
      </div>
      <div className="fb-maya__block">
        <label>Analysis</label>
        <ul>{intel.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
      </div>
      {intel.patterns.length > 0 && (
        <div className="fb-maya__block">
          <label>Pattern detection</label>
          <ul>{intel.patterns.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      )}
      <div className="fb-maya__block">
        <label>Recommendations</label>
        <ul>{intel.improvements.map((i) => <li key={i}>{i}</li>)}</ul>
      </div>
      <p className="fb-maya__action">{intel.priorityAction}</p>
      <div className="fb-maya-chat">
        <textarea
          value={chatPrompt}
          onChange={(e) => setChatPrompt(e.target.value)}
          placeholder="Ask MAYA about feedback trends, priorities…"
        />
        <button type="button" className="fb-btn fb-btn--primary fb-btn--sm" style={{ marginTop: '0.35rem' }} onClick={onAsk} disabled={chatLoading}>
          {chatLoading ? 'Analyzing…' : 'Ask MAYA'}
        </button>
        {chatReply && <div className="fb-maya-chat__reply">{chatReply}</div>}
      </div>
      <Link to="/ai-assistant" className="fb-btn fb-btn--ghost fb-btn--sm" style={{ display: 'inline-block', marginTop: '0.5rem', textDecoration: 'none' }}>
        Open MAYA assistant
      </Link>
    </aside>
  );
}

/* ─── Main component ──────────────────────────────────────────────────── */

export default function Feedback() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [counts, setCounts] = useState<IntegrationCounts>({
    projects: 0, research: 0, prototypes: 0, experiments: 0, validation: 0, funding: 0, commercialization: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<ViewId>('dashboard');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<CategoryId | 'all'>('all');
  const [filterWorkflow, setFilterWorkflow] = useState<WorkflowStage | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [mayaPrompt, setMayaPrompt] = useState('');
  const [mayaReply, setMayaReply] = useState<string | null>(null);
  const [mayaLoading, setMayaLoading] = useState(false);

  const [form, setForm] = useState({
    subject: '',
    body: '',
    category: 'improvement' as CategoryId,
    source: '' as SourceId | '',
    linkedId: '',
    rating: 0,
    priority: 'normal',
  });

  const load = useCallback(async () => {
    if (!user?.id) return;

    const [ticketsRes, projectsRes, prototypesRes, experimentsRes, validationRes, fundingRes] = await Promise.all([
      supabase.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name').eq('user_id', user.id).order('name'),
      supabase.from('prototypes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('experiments').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('validations').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('funding_pitches').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);

    const ticketItems: FeedbackItem[] = (ticketsRes.data ?? []).map((t) => ({
      id: t.id,
      subject: t.subject,
      status: t.status ?? 'open',
      priority: t.priority ?? 'normal',
      created_at: t.created_at,
      meta: decodeMessage(t.message, t.status ?? 'open', t.subject),
      origin: 'ticket' as const,
    }));

    let reviewItems: FeedbackItem[] = [];
    const projectList = (projectsRes.data ?? []) as ProjectOption[];
    if (projectList.length > 0) {
      const { data: reviews } = await supabase
        .from('project_reviews')
        .select('id, project_id, status, feedback, created_at')
        .in('project_id', projectList.map((p) => p.id))
        .order('created_at', { ascending: false });

      const projectMap = new Map(projectList.map((p) => [p.id, p.name]));
      reviewItems = (reviews ?? [])
        .filter((r) => r.feedback?.trim())
        .map((r) => {
          const body = r.feedback ?? '';
          const pname = projectMap.get(r.project_id) ?? 'Project';
          return {
            id: `review-${r.id}`,
            subject: `Research review: ${pname}`,
            status: r.status === 'approved' ? 'resolved' : 'open',
            priority: 'normal',
            created_at: r.created_at,
            meta: {
              v: FB_VERSION,
              body,
              category: 'research_review' as CategoryId,
              workflow: r.status === 'approved' ? 'Resolved' as WorkflowStage : 'Reviewed' as WorkflowStage,
              sentiment: analyzeSentiment(body),
              source: 'research' as SourceId,
              linkedId: r.project_id,
              linkedName: pname,
            },
            origin: 'project_review' as const,
          };
        });
    }

    const merged = [...ticketItems, ...reviewItems].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setItems(merged);
    setProjects(projectList);
    setCounts({
      projects: projectList.length,
      research: projectList.length,
      prototypes: prototypesRes.count ?? 0,
      experiments: experimentsRes.count ?? 0,
      validation: validationRes.count ?? 0,
      funding: fundingRes.count ?? 0,
      commercialization: projectList.filter(() => true).length > 0 ? Math.max(1, Math.floor(projectList.length / 2)) : 0,
    });
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [user, authLoading, load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filterCategory !== 'all' && item.meta.category !== filterCategory) return false;
      if (filterWorkflow !== 'all' && item.meta.workflow !== filterWorkflow) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${item.subject} ${item.meta.body} ${item.meta.linkedName ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, search, filterCategory, filterWorkflow]);

  const metrics = useMemo(() => {
    const total = items.length;
    const open = items.filter(isOpen).length;
    const resolved = items.filter((i) => i.meta.workflow === 'Resolved' || i.meta.workflow === 'Closed').length;
    const critical = items.filter(isCritical).length;
    const rated = items.filter((i) => i.meta.rating !== undefined && i.meta.rating > 0);
    const satisfaction = rated.length
      ? Math.round((rated.reduce((s, i) => s + (i.meta.rating ?? 0), 0) / rated.length / 5) * 100)
      : Math.round((items.filter((i) => i.meta.sentiment === 'positive').length / Math.max(1, total)) * 100);
    return { total, open, resolved, critical, satisfaction };
  }, [items]);

  const selected = useMemo(() => items.find((i) => i.id === selectedId) ?? null, [items, selectedId]);

  const updateTicket = async (id: string, patch: Partial<FeedbackMeta> & { priority?: string }) => {
    const item = items.find((i) => i.id === id);
    if (!item || item.origin !== 'ticket') return;

    const meta: FeedbackMeta = {
      ...item.meta,
      ...patch,
      v: FB_VERSION,
      sentiment: patch.sentiment ?? (patch.body ? analyzeSentiment(patch.body) : item.meta.sentiment),
    };
    if (patch.workflow) meta.workflow = patch.workflow;

    const { error } = await supabase
      .from('support_tickets')
      .update({
        message: encodeMessage(meta),
        status: workflowToStatus(meta.workflow),
        priority: patch.priority ?? item.priority,
        subject: patch.body ? item.subject : item.subject,
      })
      .eq('id', id);

    if (!error) await refresh();
  };

  const submitFeedback = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id || !form.body.trim()) return;

    const linkedName = form.linkedId ? projects.find((p) => p.id === form.linkedId)?.name : undefined;
    const meta: FeedbackMeta = {
      v: FB_VERSION,
      body: form.body.trim(),
      category: form.category,
      workflow: 'Submitted',
      rating: form.rating > 0 ? form.rating : undefined,
      sentiment: analyzeSentiment(form.body),
      source: form.source || undefined,
      linkedId: form.linkedId || undefined,
      linkedName,
    };

    await supabase.from('support_tickets').insert({
      user_id: user.id,
      subject: form.subject.trim() || categoryLabel(form.category),
      message: encodeMessage(meta),
      status: 'open',
      priority: form.priority,
    });

    setShowCreate(false);
    setForm({ subject: '', body: '', category: 'improvement', source: '', linkedId: '', rating: 0, priority: 'normal' });
    await refresh();
  };

  const askMaya = async () => {
    if (!mayaPrompt.trim()) return;
    setMayaLoading(true);
    setMayaReply(null);
    try {
      const summary = `Feedback portfolio: ${metrics.total} total, ${metrics.open} open, ${metrics.critical} critical, satisfaction ${metrics.satisfaction}%. Categories: ${CATEGORIES.map((c) => `${c.label}: ${items.filter((i) => i.meta.category === c.id).length}`).join(', ')}.`;
      const reply = await invokeMayaChat([
        { role: 'system', content: 'You are MAYA, the innovation intelligence assistant for Maylet XLab. Provide concise, actionable feedback intelligence for an enterprise innovation operating system. Focus on triage, patterns, and resolution priorities.' },
        { role: 'user', content: `${summary}\n\nUser question: ${mayaPrompt}` },
      ]);
      setMayaReply(reply);
    } catch (err) {
      setMayaReply(err instanceof Error ? err.message : 'MAYA analysis unavailable.');
    } finally {
      setMayaLoading(false);
    }
  };

  const exportCsv = () => {
    const rows = [['ID', 'Subject', 'Category', 'Workflow', 'Rating', 'Sentiment', 'Priority', 'Created', 'Body']];
    for (const item of items) {
      rows.push([
        item.id,
        item.subject,
        categoryLabel(item.meta.category),
        item.meta.workflow,
        String(item.meta.rating ?? ''),
        item.meta.sentiment ?? '',
        item.priority,
        item.created_at,
        item.meta.body.replace(/"/g, '""'),
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'feedback-intelligence-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const navGroups = useMemo(() => {
    const groups = new Map<string, (typeof NAV)[number][]>();
    for (const item of NAV) {
      const list = groups.get(item.group) ?? [];
      list.push(item);
      groups.set(item.group, list);
    }
    return [...groups.entries()];
  }, []);

  const workflowCounts = useMemo(() => {
    const c = Object.fromEntries(WORKFLOW_STAGES.map((s) => [s, 0])) as Record<WorkflowStage, number>;
    for (const item of items) c[item.meta.workflow] = (c[item.meta.workflow] ?? 0) + 1;
    return c;
  }, [items]);

  const categoryCounts = useMemo(() => {
    const c = Object.fromEntries(CATEGORIES.map((cat) => [cat.id, 0])) as Record<CategoryId, number>;
    for (const item of items) c[item.meta.category] = (c[item.meta.category] ?? 0) + 1;
    return c;
  }, [items]);

  const sentimentCounts = useMemo(() => ({
    positive: items.filter((i) => i.meta.sentiment === 'positive').length,
    neutral: items.filter((i) => i.meta.sentiment === 'neutral').length,
    negative: items.filter((i) => i.meta.sentiment === 'negative').length,
  }), [items]);

  if (authLoading || loading) {
    return (
      <div className="fb-page">
        <style>{FB_STYLES}</style>
        <div className="fb-loading" aria-label="Loading feedback intelligence center" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fb-page">
        <style>{FB_STYLES}</style>
        <div className="fb-empty">Sign in to access the Feedback Intelligence Center.</div>
      </div>
    );
  }

  return (
    <div className="fb-page">
      <style>{FB_STYLES}</style>

      <header className="fb-header">
        <div className="fb-header__top">
          <div>
            <Link to="/dashboard" className="fb-link">← Innovation OS</Link>
            <h1>Feedback Intelligence Center</h1>
            <p className="fb-header__sub">
              Enterprise feedback management for innovation portfolios — triage, analyze, assign, and resolve across your R&amp;D pipeline.
            </p>
            <div className="fb-workflow-strip" aria-label="Feedback workflow">
              {WORKFLOW_STAGES.map((s) => <span key={s}>{s}</span>)}
            </div>
          </div>
          <div className="fb-header__actions">
            <button type="button" className="fb-btn" onClick={refresh} disabled={refreshing}>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <button type="button" className="fb-btn" onClick={exportCsv}>Export CSV</button>
            <button type="button" className="fb-btn fb-btn--primary" onClick={() => setShowCreate(true)}>
              + Capture Feedback
            </button>
          </div>
        </div>
        <div className="fb-toolbar">
          <input
            type="search"
            placeholder="Search feedback…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as CategoryId | 'all')}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select value={filterWorkflow} onChange={(e) => setFilterWorkflow(e.target.value as WorkflowStage | 'all')}>
            <option value="all">All workflow stages</option>
            {WORKFLOW_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </header>

      {showCreate && (
        <section className="fb-section" style={{ marginTop: '1rem' }}>
          <FbSectionHead title="Capture Feedback">
            <button type="button" className="fb-btn fb-btn--sm" onClick={() => setShowCreate(false)}>Cancel</button>
          </FbSectionHead>
          <p className="fb-lead">Structured feedback capture linked to your innovation portfolio — not a contact form.</p>
          <form className="fb-form" onSubmit={submitFeedback}>
            <div className="fb-form-row">
              <div>
                <label>Subject</label>
                <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Brief summary" />
              </div>
              <div>
                <label>Category</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as CategoryId }))}>
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="fb-form-row">
              <div>
                <label>Innovation source</label>
                <select value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as SourceId | '' }))}>
                  <option value="">General platform</option>
                  {INTEGRATION_SOURCES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label>Linked project</label>
                <select value={form.linkedId} onChange={(e) => setForm((f) => ({ ...f, linkedId: e.target.value }))}>
                  <option value="">None</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="fb-form-row">
              <div>
                <label>Priority</label>
                <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Critical</option>
                </select>
              </div>
              <div>
                <label>Rating</label>
                <StarRating value={form.rating} onChange={(n) => setForm((f) => ({ ...f, rating: n }))} />
              </div>
            </div>
            <div>
              <label>Feedback detail</label>
              <textarea rows={5} required value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="Describe the issue, request, or review findings…" />
            </div>
            <button type="submit" className="fb-btn fb-btn--primary">Submit to Intelligence Center</button>
          </form>
        </section>
      )}

      <div className="fb-layout">
        <nav className="fb-nav" aria-label="Feedback sections">
          {navGroups.map(([group, navItems]) => (
            <div key={group} className="fb-nav__group">
              <span className="fb-nav__label">{group}</span>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`fb-nav__item ${view === item.id ? 'fb-nav__item--active' : ''}`}
                  onClick={() => setView(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <main className="fb-section">
          {/* ── Dashboard ── */}
          {view === 'dashboard' && (
            <>
              <FbSectionHead title="Operations Dashboard" />
              <p className="fb-lead">Executive view of feedback volume, resolution health, and critical issue exposure across your innovation portfolio.</p>
              <div className="fb-kpi-grid">
                <FbKpi label="Total Feedback" value={metrics.total} variant="accent" />
                <FbKpi label="Open Feedback" value={metrics.open} />
                <FbKpi label="Resolved" value={metrics.resolved} variant="good" />
                <FbKpi label="Critical Issues" value={metrics.critical} variant="warn" />
                <FbKpi label="Satisfaction Score" value={`${metrics.satisfaction}%`} variant="good" />
              </div>
              <div className="fb-split">
                <div className="fb-panel">
                  <h3>Workflow distribution</h3>
                  <div className="fb-pipeline">
                    {WORKFLOW_STAGES.map((stage) => {
                      const n = workflowCounts[stage];
                      const max = Math.max(1, ...WORKFLOW_STAGES.map((s) => workflowCounts[s]));
                      return (
                        <div key={stage} className="fb-pipeline__row">
                          <span>{stage}</span>
                          <div className="fb-pipeline__bar"><div style={{ width: `${Math.round((n / max) * 100)}%` }} /></div>
                          <strong>{n}</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="fb-panel">
                  <h3>Recent critical items</h3>
                  {items.filter(isCritical).slice(0, 5).length === 0 ? (
                    <p className="fb-muted">No critical issues detected.</p>
                  ) : (
                    items.filter(isCritical).slice(0, 5).map((item) => (
                      <div key={item.id} className="fb-kanban__card" onClick={() => { setSelectedId(item.id); setView('inbox'); }}>
                        <strong>{item.subject}</strong>
                        <span>{categoryLabel(item.meta.category)} · {timeAgo(item.created_at)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Inbox ── */}
          {view === 'inbox' && (
            <>
              <FbSectionHead title="Feedback Inbox">
                <span className="fb-muted">{filtered.length} items</span>
              </FbSectionHead>
              <div className="fb-table-wrap">
                <table className="fb-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Category</th>
                      <th>Workflow</th>
                      <th>Sentiment</th>
                      <th>Rating</th>
                      <th>Priority</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} className="fb-empty">No feedback matches your filters.</td></tr>
                    ) : (
                      filtered.map((item) => (
                        <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedId(item.id)}>
                          <td>
                            <strong>{item.subject}</strong>
                            <span className="fb-muted">{item.meta.body.slice(0, 80)}{item.meta.body.length > 80 ? '…' : ''}</span>
                          </td>
                          <td>{categoryLabel(item.meta.category)}</td>
                          <td><WorkflowBadge stage={item.meta.workflow} /></td>
                          <td><SentimentBadge sentiment={item.meta.sentiment} /></td>
                          <td>{item.meta.rating ? <StarRating value={item.meta.rating} /> : '—'}</td>
                          <td>
                            {isCritical(item) ? <span className="fb-badge fb-badge--critical">Critical</span> : item.priority}
                          </td>
                          <td>{formatDate(item.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {selected && (
                <div className="fb-detail">
                  <h3>{selected.subject}</h3>
                  <p className="fb-muted">{formatDate(selected.created_at)} · {categoryLabel(selected.meta.category)}</p>
                  <p>{selected.meta.body}</p>
                  {selected.meta.linkedId && sourceRoute(selected.meta.source, selected.meta.linkedId) && (
                    <Link to={sourceRoute(selected.meta.source, selected.meta.linkedId)!} className="fb-link">
                      View linked {selected.meta.linkedName ?? 'record'} →
                    </Link>
                  )}
                  {selected.origin === 'ticket' && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {WORKFLOW_STAGES.map((stage) => (
                        <button
                          key={stage}
                          type="button"
                          className={`fb-btn fb-btn--sm ${selected.meta.workflow === stage ? 'fb-btn--primary' : ''}`}
                          onClick={() => updateTicket(selected.id, { workflow: stage })}
                        >
                          {stage}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── Categories ── */}
          {view === 'categories' && (
            <>
              <FbSectionHead title="Feedback Categories" />
              <p className="fb-lead">Nine enterprise feedback channels aligned to your innovation operating model.</p>
              <div className="fb-cards">
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    className={`fb-card ${filterCategory === cat.id ? 'fb-card--active' : ''}`}
                    onClick={() => { setFilterCategory(cat.id); setView('inbox'); }}
                  >
                    <div className="fb-card__head">
                      <strong>{cat.icon} {cat.label}</strong>
                      <span className="fb-badge">{categoryCounts[cat.id]}</span>
                    </div>
                    <p>{categoryCounts[cat.id]} item(s) in portfolio</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Workflow ── */}
          {view === 'workflow' && (
            <>
              <FbSectionHead title="Workflow Pipeline" />
              <p className="fb-lead">Submitted → Reviewed → Assigned → In Progress → Resolved → Closed</p>
              <div className="fb-kanban">
                {WORKFLOW_STAGES.map((stage) => {
                  const cards = items.filter((i) => i.meta.workflow === stage);
                  return (
                    <div key={stage} className="fb-kanban__col">
                      <div className="fb-kanban__head"><span>{stage}</span><strong>{cards.length}</strong></div>
                      {cards.map((item) => (
                        <div key={item.id} className="fb-kanban__card" onClick={() => { setSelectedId(item.id); setView('inbox'); }}>
                          <strong>{item.subject}</strong>
                          <span>{categoryLabel(item.meta.category)}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Ratings ── */}
          {view === 'ratings' && (
            <>
              <FbSectionHead title="Ratings Center" />
              <p className="fb-lead">Satisfaction signals from structured 1–5 star ratings across feedback categories.</p>
              <div className="fb-kpi-grid">
                <FbKpi label="Rated items" value={items.filter((i) => i.meta.rating).length} />
                <FbKpi label="Avg rating" value={
                  (() => {
                    const r = items.filter((i) => i.meta.rating);
                    return r.length ? (r.reduce((s, i) => s + (i.meta.rating ?? 0), 0) / r.length).toFixed(1) : '—';
                  })()
                } variant="good" />
                <FbKpi label="Satisfaction" value={`${metrics.satisfaction}%`} variant="accent" />
              </div>
              <BarChart
                title="Ratings distribution"
                labels={['1★', '2★', '3★', '4★', '5★']}
                values={[1, 2, 3, 4, 5].map((n) => items.filter((i) => i.meta.rating === n).length)}
              />
              <div className="fb-table-wrap" style={{ marginTop: '0.75rem' }}>
                <table className="fb-table">
                  <thead><tr><th>Subject</th><th>Category</th><th>Rating</th><th>Sentiment</th></tr></thead>
                  <tbody>
                    {items.filter((i) => i.meta.rating).map((item) => (
                      <tr key={item.id}>
                        <td>{item.subject}</td>
                        <td>{categoryLabel(item.meta.category)}</td>
                        <td><StarRating value={item.meta.rating!} /></td>
                        <td><SentimentBadge sentiment={item.meta.sentiment} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Analytics ── */}
          {view === 'analytics' && (
            <>
              <FbSectionHead title="Feedback Analytics" />
              <div className="fb-split">
                <BarChart
                  title="By category"
                  labels={CATEGORIES.map((c) => c.icon)}
                  values={CATEGORIES.map((c) => categoryCounts[c.id])}
                />
                <BarChart
                  title="By workflow stage"
                  labels={WORKFLOW_STAGES.map((s) => s.split(' ')[0])}
                  values={WORKFLOW_STAGES.map((s) => workflowCounts[s])}
                />
              </div>
              <div className="fb-panel" style={{ marginTop: '0.75rem' }}>
                <h3>Resolution velocity</h3>
                <p className="fb-muted">
                  {metrics.resolved} of {metrics.total} items resolved or closed
                  ({metrics.total ? Math.round((metrics.resolved / metrics.total) * 100) : 0}% resolution rate)
                </p>
              </div>
            </>
          )}

          {/* ── Sentiment ── */}
          {view === 'sentiment' && (
            <>
              <FbSectionHead title="Sentiment Analysis" />
              <p className="fb-lead">Lexicon-based sentiment scoring with MAYA-enhanced intelligence recommendations.</p>
              <div className="fb-kpi-grid">
                <FbKpi label="Positive" value={sentimentCounts.positive} variant="good" />
                <FbKpi label="Neutral" value={sentimentCounts.neutral} />
                <FbKpi label="Negative" value={sentimentCounts.negative} variant="warn" />
              </div>
              <div className="fb-sentiment-meter" aria-label="Sentiment distribution">
                <div className="fb-sentiment-meter__pos" style={{ width: `${(sentimentCounts.positive / Math.max(1, items.length)) * 100}%` }} />
                <div className="fb-sentiment-meter__neu" style={{ width: `${(sentimentCounts.neutral / Math.max(1, items.length)) * 100}%` }} />
                <div className="fb-sentiment-meter__neg" style={{ width: `${(sentimentCounts.negative / Math.max(1, items.length)) * 100}%` }} />
              </div>
              <div className="fb-table-wrap">
                <table className="fb-table">
                  <thead><tr><th>Subject</th><th>Sentiment</th><th>Category</th><th>Excerpt</th></tr></thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.subject}</td>
                        <td><SentimentBadge sentiment={item.meta.sentiment} /></td>
                        <td>{categoryLabel(item.meta.category)}</td>
                        <td className="fb-muted">{item.meta.body.slice(0, 100)}…</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Assignment & Resolution ── */}
          {view === 'assignment' && (
            <>
              <FbSectionHead title="Assignment & Resolution Center" />
              <p className="fb-lead">Assign owners, advance workflow stages, and document resolution outcomes.</p>
              <div className="fb-cards">
                {items.filter(isOpen).map((item) => (
                  <div key={item.id} className="fb-card">
                    <div className="fb-card__head">
                      <strong>{item.subject}</strong>
                      <WorkflowBadge stage={item.meta.workflow} />
                    </div>
                    <p>{item.meta.body.slice(0, 120)}…</p>
                    {item.origin === 'ticket' && (
                      <>
                        <label className="fb-muted" style={{ display: 'block', marginTop: '0.5rem' }}>Assignee</label>
                        <input
                          style={{ width: '100%', padding: '0.35rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '0.78rem' }}
                          placeholder="Team member or role"
                          defaultValue={item.meta.assignee ?? ''}
                          onBlur={(e) => updateTicket(item.id, { assignee: e.target.value, workflow: 'Assigned' })}
                        />
                        <div style={{ marginTop: '0.45rem', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          <button type="button" className="fb-btn fb-btn--sm" onClick={() => updateTicket(item.id, { workflow: 'In Progress' })}>Start</button>
                          <button type="button" className="fb-btn fb-btn--sm fb-btn--primary" onClick={() => updateTicket(item.id, { workflow: 'Resolved' })}>Resolve</button>
                          <button type="button" className="fb-btn fb-btn--sm" onClick={() => updateTicket(item.id, { workflow: 'Closed' })}>Close</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {items.filter(isOpen).length === 0 && <div className="fb-empty">All feedback items are resolved or closed.</div>}
              </div>
            </>
          )}

          {/* ── Integrations ── */}
          {view === 'integrations' && (
            <>
              <FbSectionHead title="Innovation Integrations" />
              <p className="fb-lead">Feedback linked across Projects, Research, Prototypes, Experiments, Validation, Funding, and Commercialization.</p>
              <div className="fb-links-grid">
                {INTEGRATION_SOURCES.map((src) => (
                  <Link key={src.id} to={src.route} className="fb-link-card">
                    <strong>{src.icon} {src.label}</strong>
                    <span>{counts[src.id as keyof IntegrationCounts] ?? 0} records · {items.filter((i) => i.meta.source === src.id).length} linked feedback</span>
                  </Link>
                ))}
              </div>
              <div className="fb-table-wrap" style={{ marginTop: '0.75rem' }}>
                <table className="fb-table">
                  <thead><tr><th>Feedback</th><th>Source</th><th>Linked entity</th><th>Workflow</th></tr></thead>
                  <tbody>
                    {items.filter((i) => i.meta.source).map((item) => (
                      <tr key={item.id}>
                        <td>{item.subject}</td>
                        <td>{INTEGRATION_SOURCES.find((s) => s.id === item.meta.source)?.label ?? '—'}</td>
                        <td>
                          {item.meta.linkedName && sourceRoute(item.meta.source, item.meta.linkedId) ? (
                            <Link to={sourceRoute(item.meta.source, item.meta.linkedId)!} className="fb-link">{item.meta.linkedName}</Link>
                          ) : '—'}
                        </td>
                        <td><WorkflowBadge stage={item.meta.workflow} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Reports ── */}
          {view === 'reports' && (
            <>
              <FbSectionHead title="Reports & Insights">
                <button type="button" className="fb-btn fb-btn--sm" onClick={exportCsv}>Download report</button>
              </FbSectionHead>
              <div className="fb-panel">
                <h3>Executive summary</h3>
                <div className="fb-report-row"><span>Total feedback captured</span><strong>{metrics.total}</strong></div>
                <div className="fb-report-row"><span>Open requiring action</span><strong>{metrics.open}</strong></div>
                <div className="fb-report-row"><span>Resolved / closed</span><strong>{metrics.resolved}</strong></div>
                <div className="fb-report-row"><span>Critical exposure</span><strong style={{ color: '#fc8181' }}>{metrics.critical}</strong></div>
                <div className="fb-report-row"><span>Satisfaction index</span><strong style={{ color: '#68d391' }}>{metrics.satisfaction}%</strong></div>
                <div className="fb-report-row"><span>Top category</span><strong>
                  {(() => {
                    const top = [...CATEGORIES].sort((a, b) => categoryCounts[b.id] - categoryCounts[a.id])[0];
                    return top ? `${top.label} (${categoryCounts[top.id]})` : '—';
                  })()}
                </strong></div>
                <div className="fb-report-row"><span>Sentiment balance</span><strong>
                  +{sentimentCounts.positive} / {sentimentCounts.neutral} / -{sentimentCounts.negative}
                </strong></div>
              </div>
              <div className="fb-split" style={{ marginTop: '0.75rem' }}>
                <BarChart title="Category breakdown" labels={CATEGORIES.slice(0, 5).map((c) => c.icon)} values={CATEGORIES.slice(0, 5).map((c) => categoryCounts[c.id])} />
                <BarChart title="Workflow funnel" labels={WORKFLOW_STAGES.map((s) => s[0])} values={WORKFLOW_STAGES.map((s) => workflowCounts[s])} />
              </div>
            </>
          )}
        </main>

        <MayaSidebar
          items={items}
          chatPrompt={mayaPrompt}
          setChatPrompt={setMayaPrompt}
          chatReply={mayaReply}
          chatLoading={mayaLoading}
          onAsk={askMaya}
        />
      </div>
    </div>
  );
}
