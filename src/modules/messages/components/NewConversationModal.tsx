import { useState, useCallback, useEffect, useRef } from 'react';
import type { MessageUser } from '../types/messages.types';
import type {
  AttachedAsset,
  KnowledgeSettings,
  WorkspaceCreationPayload,
  WorkspaceParticipant,
  WorkspacePriority,
  WorkspaceType,
  WorkspaceVisibility,
} from '../types/workspaceCreation.types';

export type {
  AttachedAsset,
  KnowledgeSettings,
  WorkspaceCreationPayload,
  WorkspaceParticipant,
  WorkspaceType,
  WorkspaceVisibility,
} from '../types/workspaceCreation.types';

export type Priority = WorkspacePriority;
export type Visibility = WorkspaceVisibility;

interface WorkspaceConfig {
  workspaceType: WorkspaceType | null;
  title: string;
  purpose: string;
  objectives: string;
  expectedOutcomes: string;
  successMetrics: string;
  priority: Priority;
  timeline: string;
  attachedAssets: AttachedAsset[];
  participants: WorkspaceParticipant[];
  visibility: Visibility;
  moderationEnabled: boolean;
  approvalRequired: boolean;
  knowledgeSettings: KnowledgeSettings;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectUser: (user: MessageUser) => void;
  searchUsers: (query: string) => Promise<MessageUser[]>;
  onCreateWorkspace?: (payload: WorkspaceCreationPayload) => Promise<void>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

interface WorkspaceTypeMeta {
  type: WorkspaceType;
  icon: string;
  label: string;
  description: string;
  color: string;
}

const WORKSPACE_TYPES: WorkspaceTypeMeta[] = [
  {
    type: 'direct',
    icon: '💬',
    label: 'Direct Collaboration',
    description: 'One-to-one focused discussion',
    color: '#7c5fe6',
  },
  {
    type: 'team',
    icon: '👥',
    label: 'Team Workspace',
    description: 'Internal team collaboration',
    color: '#3b82f6',
  },
  {
    type: 'project',
    icon: '📁',
    label: 'Project Workspace',
    description: 'Project-specific collaboration',
    color: '#10b981',
  },
  {
    type: 'research',
    icon: '🔬',
    label: 'Research Workspace',
    description: 'Research team collaboration',
    color: '#8b5cf6',
  },
  {
    type: 'prototype',
    icon: '🛠️',
    label: 'Prototype Review',
    description: 'Technical review environment',
    color: '#f59e0b',
  },
  {
    type: 'experiment',
    icon: '🧪',
    label: 'Experiment Workspace',
    description: 'Hypothesis and experiment discussions',
    color: '#ec4899',
  },
  {
    type: 'validation',
    icon: '✅',
    label: 'Validation Workspace',
    description: 'Validation review environment',
    color: '#06b6d4',
  },
  {
    type: 'funding',
    icon: '💰',
    label: 'Funding Workspace',
    description: 'Investor and grant collaboration',
    color: '#84cc16',
  },
  {
    type: 'commercialization',
    icon: '🚀',
    label: 'Commercialization',
    description: 'Market readiness and launch planning',
    color: '#f97316',
  },
  {
    type: 'enterprise',
    icon: '🏢',
    label: 'Enterprise Program',
    description: 'Organization-wide innovation programs',
    color: '#6366f1',
  },
  {
    type: 'community',
    icon: '🌐',
    label: 'Community Workspace',
    description: 'Public innovation communities',
    color: '#14b8a6',
  },
  {
    type: 'partnership',
    icon: '🤝',
    label: 'Strategic Partnership',
    description: 'Cross-organization collaboration',
    color: '#d946ef',
  },
];

const PARTICIPANT_ROLES: WorkspaceParticipant['role'][] = [
  'owner',
  'admin',
  'member',
  'researcher',
  'engineer',
  'mentor',
  'investor',
  'reviewer',
  'observer',
];

const WIZARD_STAGES = [
  { id: 1, label: 'Type' },
  { id: 2, label: 'Context' },
  { id: 3, label: 'Assets' },
  { id: 4, label: 'Participants' },
  { id: 5, label: 'Governance' },
  { id: 6, label: 'Knowledge' },
  { id: 7, label: 'Review' },
];

const MOCK_ASSETS: AttachedAsset[] = [
  {
    id: 'p-1',
    type: 'project',
    title: 'Smart Irrigation System',
    subtitle: 'IoT water management',
    status: 'Active',
  },
  {
    id: 'r-1',
    type: 'research',
    title: 'AI in Agriculture',
    subtitle: 'Nature, 2024',
    status: 'Published',
  },
  {
    id: 'pr-1',
    type: 'prototype',
    title: 'SensorBoard v2',
    subtitle: 'Hardware prototype',
    status: 'Testing',
  },
  {
    id: 'e-1',
    type: 'experiment',
    title: 'Water Sensor Accuracy',
    subtitle: 'Field trial',
    status: 'Running',
  },
  {
    id: 'v-1',
    type: 'validation',
    title: 'Market Validation Report',
    subtitle: 'Q2 2024',
    status: 'Approved',
  },
  {
    id: 'f-1',
    type: 'funding',
    title: 'AgriTech Innovation Grant',
    subtitle: '$250,000',
    status: 'Open',
  },
];

const DEFAULT_CONFIG: WorkspaceConfig = {
  workspaceType: null,
  title: '',
  purpose: '',
  objectives: '',
  expectedOutcomes: '',
  successMetrics: '',
  priority: 'medium',
  timeline: '',
  attachedAssets: [],
  participants: [],
  visibility: 'private',
  moderationEnabled: false,
  approvalRequired: false,
  knowledgeSettings: {
    knowledgeCapture: true,
    discussionSummaries: true,
    decisionTracking: true,
    actionTracking: true,
    meetingRecords: false,
    insightExtraction: false,
  },
};

// ============================================================================
// STAGE COMPONENTS
// ============================================================================

function WizardProgress({
  currentStage,
  onNavigate,
  maxReached,
}: {
  currentStage: number;
  onNavigate: (stage: number) => void;
  maxReached: number;
}) {
  return (
    <div className="wcm-progress">
      {WIZARD_STAGES.map((stage, idx) => {
        const isComplete = stage.id < currentStage;
        const isActive = stage.id === currentStage;
        const isReachable = stage.id <= maxReached;

        return (
          <button
            key={stage.id}
            type="button"
            className={`wcm-progress__step ${isActive ? 'wcm-progress__step--active' : ''} ${isComplete ? 'wcm-progress__step--complete' : ''}`}
            onClick={() => isReachable && onNavigate(stage.id)}
            disabled={!isReachable}
          >
            <span className="wcm-progress__num">
              {isComplete ? '✓' : stage.id}
            </span>
            <span className="wcm-progress__label">{stage.label}</span>
            {idx < WIZARD_STAGES.length - 1 && (
              <span
                className={`wcm-progress__line ${isComplete ? 'wcm-progress__line--complete' : ''}`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function Stage1TypeSelection({
  selected,
  onSelect,
}: {
  selected: WorkspaceType | null;
  onSelect: (type: WorkspaceType) => void;
}) {
  return (
    <div className="wcm-stage">
      <div className="wcm-stage__header">
        <h3 className="wcm-stage__title">What kind of workspace are you creating?</h3>
        <p className="wcm-stage__subtitle">
          Every workspace is a structured collaboration environment. Choose the type that best
          matches your innovation objective.
        </p>
      </div>

      <div className="wcm-type-grid">
        {WORKSPACE_TYPES.map((wt) => (
          <button
            key={wt.type}
            type="button"
            className={`wcm-type-card ${selected === wt.type ? 'wcm-type-card--selected' : ''}`}
            style={
              selected === wt.type
                ? { borderColor: wt.color, background: `${wt.color}15` }
                : undefined
            }
            onClick={() => onSelect(wt.type)}
          >
            <span className="wcm-type-card__icon">{wt.icon}</span>
            <span className="wcm-type-card__label">{wt.label}</span>
            <span className="wcm-type-card__desc">{wt.description}</span>
            {selected === wt.type && (
              <span className="wcm-type-card__check" style={{ color: wt.color }}>
                ✓
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stage2BusinessContext({
  config,
  onChange,
}: {
  config: WorkspaceConfig;
  onChange: (patch: Partial<WorkspaceConfig>) => void;
}) {
  const meta = WORKSPACE_TYPES.find((w) => w.type === config.workspaceType);

  return (
    <div className="wcm-stage">
      <div className="wcm-stage__header">
        <div className="wcm-stage__type-badge">
          {meta?.icon} {meta?.label}
        </div>
        <h3 className="wcm-stage__title">Define the business context</h3>
        <p className="wcm-stage__subtitle">
          Every workspace must have a clear purpose and measurable outcomes. This drives alignment
          across all participants.
        </p>
      </div>

      <div className="wcm-form">
        <div className="wcm-field wcm-field--full">
          <label className="wcm-label">
            Workspace Name <span className="wcm-required">*</span>
          </label>
          <input
            className="wcm-input"
            type="text"
            placeholder={`e.g. ${meta?.label} — Q3 Sprint`}
            value={config.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </div>

        <div className="wcm-field wcm-field--full">
          <label className="wcm-label">
            Purpose <span className="wcm-required">*</span>
          </label>
          <textarea
            className="wcm-textarea"
            rows={2}
            placeholder="Why does this workspace exist? What problem is it solving?"
            value={config.purpose}
            onChange={(e) => onChange({ purpose: e.target.value })}
          />
        </div>

        <div className="wcm-field wcm-field--full">
          <label className="wcm-label">Objectives</label>
          <textarea
            className="wcm-textarea"
            rows={2}
            placeholder="What specific objectives should this workspace accomplish?"
            value={config.objectives}
            onChange={(e) => onChange({ objectives: e.target.value })}
          />
        </div>

        <div className="wcm-field wcm-field--full">
          <label className="wcm-label">Expected Outcomes</label>
          <textarea
            className="wcm-textarea"
            rows={2}
            placeholder="What tangible outcomes do you expect from this collaboration?"
            value={config.expectedOutcomes}
            onChange={(e) => onChange({ expectedOutcomes: e.target.value })}
          />
        </div>

        <div className="wcm-field">
          <label className="wcm-label">Success Metrics</label>
          <input
            className="wcm-input"
            type="text"
            placeholder="e.g. 3 validated hypotheses, 1 funded project"
            value={config.successMetrics}
            onChange={(e) => onChange({ successMetrics: e.target.value })}
          />
        </div>

        <div className="wcm-field">
          <label className="wcm-label">Timeline</label>
          <input
            className="wcm-input"
            type="text"
            placeholder="e.g. Q3 2024, 6 weeks, Ongoing"
            value={config.timeline}
            onChange={(e) => onChange({ timeline: e.target.value })}
          />
        </div>

        <div className="wcm-field">
          <label className="wcm-label">Priority</label>
          <select
            className="wcm-select"
            value={config.priority}
            onChange={(e) => onChange({ priority: e.target.value as Priority })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function Stage3Assets({
  config,
  onChange,
}: {
  config: WorkspaceConfig;
  onChange: (patch: Partial<WorkspaceConfig>) => void;
}) {
  const [search, setSearch] = useState('');

  const assetTypeIcon: Record<AttachedAsset['type'], string> = {
    project: '📁',
    research: '🔬',
    prototype: '🛠️',
    experiment: '🧪',
    validation: '✅',
    funding: '💰',
    document: '📄',
    post: '📢',
  };

  const filtered = MOCK_ASSETS.filter(
    (a) =>
      !config.attachedAssets.some((att) => att.id === a.id) &&
      (search === '' || a.title.toLowerCase().includes(search.toLowerCase()))
  );

  const attach = (asset: AttachedAsset) => {
    onChange({ attachedAssets: [...config.attachedAssets, asset] });
  };

  const detach = (id: string) => {
    onChange({ attachedAssets: config.attachedAssets.filter((a) => a.id !== id) });
  };

  return (
    <div className="wcm-stage">
      <div className="wcm-stage__header">
        <h3 className="wcm-stage__title">Attach innovation assets</h3>
        <p className="wcm-stage__subtitle">
          Connect this workspace to existing projects, research, prototypes, and other innovation
          assets. This ensures all discussions are context-aware and traceable.
        </p>
      </div>

      {config.attachedAssets.length > 0 && (
        <div className="wcm-attached">
          <p className="wcm-attached__label">Attached Assets ({config.attachedAssets.length})</p>
          <div className="wcm-attached__list">
            {config.attachedAssets.map((asset) => (
              <div key={asset.id} className="wcm-asset-chip">
                <span>{assetTypeIcon[asset.type]}</span>
                <span className="wcm-asset-chip__title">{asset.title}</span>
                <button
                  type="button"
                  className="wcm-asset-chip__remove"
                  onClick={() => detach(asset.id)}
                  aria-label={`Remove ${asset.title}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="wcm-search">
        <input
          className="wcm-input"
          type="text"
          placeholder="Search projects, research, prototypes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="wcm-asset-list">
        {filtered.length === 0 && (
          <p className="wcm-empty">
            {search ? 'No assets match your search' : 'No more assets to attach'}
          </p>
        )}
        {filtered.map((asset) => (
          <button
            key={asset.id}
            type="button"
            className="wcm-asset-row"
            onClick={() => attach(asset)}
          >
            <span className="wcm-asset-row__icon">{assetTypeIcon[asset.type]}</span>
            <div className="wcm-asset-row__info">
              <span className="wcm-asset-row__title">{asset.title}</span>
              {asset.subtitle && (
                <span className="wcm-asset-row__sub">{asset.subtitle}</span>
              )}
            </div>
            <span className="wcm-asset-row__type">{asset.type.toUpperCase()}</span>
            {asset.status && <span className="wcm-asset-row__status">{asset.status}</span>}
            <span className="wcm-asset-row__add">+ Add</span>
          </button>
        ))}
      </div>

      <p className="wcm-note">
        💡 Tip: You can skip this step and attach assets later from within the workspace.
      </p>
    </div>
  );
}

function Stage4Participants({
  config,
  onChange,
  searchUsers,
}: {
  config: WorkspaceConfig;
  onChange: (patch: Partial<WorkspaceConfig>) => void;
  searchUsers: (query: string) => Promise<MessageUser[]>;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MessageUser[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const found = await searchUsers(q);
        setResults(found.filter((u) => !config.participants.some((p) => p.id === u.id)));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [searchUsers, config.participants]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  const addParticipant = (user: MessageUser) => {
    const participant: WorkspaceParticipant = { ...user, role: 'member' };
    onChange({ participants: [...config.participants, participant] });
    setResults((prev) => prev.filter((u) => u.id !== user.id));
  };

  const removeParticipant = (id: string) => {
    onChange({ participants: config.participants.filter((p) => p.id !== id) });
  };

  const updateRole = (id: string, role: WorkspaceParticipant['role']) => {
    onChange({
      participants: config.participants.map((p) => (p.id === id ? { ...p, role } : p)),
    });
  };

  return (
    <div className="wcm-stage">
      <div className="wcm-stage__header">
        <h3 className="wcm-stage__title">Build your participant architecture</h3>
        <p className="wcm-stage__subtitle">
          Add the right people with the right roles. Workspace effectiveness depends on having
          the right participants engaged at the right level.
        </p>
      </div>

      <div className="wcm-search">
        <input
          className="wcm-input"
          type="text"
          placeholder="Search researchers, engineers, founders, mentors…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {searching && <span className="wcm-search__spinner">⟳</span>}
      </div>

      {results.length > 0 && (
        <div className="wcm-user-results">
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              className="wcm-user-row"
              onClick={() => addParticipant(user)}
            >
              <div className="wcm-user-row__avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <span>{user.name[0]}</span>
                )}
              </div>
              <span className="wcm-user-row__name">{user.name}</span>
              <span className="wcm-user-row__add">+ Add</span>
            </button>
          ))}
        </div>
      )}

      {config.participants.length > 0 ? (
        <div className="wcm-participant-list">
          <p className="wcm-participant-list__label">
            Participants ({config.participants.length})
          </p>
          {config.participants.map((p) => (
            <div key={p.id} className="wcm-participant-row">
              <div className="wcm-user-row__avatar">
                {p.avatar ? <img src={p.avatar} alt={p.name} /> : <span>{p.name[0]}</span>}
              </div>
              <span className="wcm-participant-row__name">{p.name}</span>
              <select
                className="wcm-select wcm-select--sm"
                value={p.role}
                onChange={(e) => updateRole(p.id, e.target.value as WorkspaceParticipant['role'])}
              >
                {PARTICIPANT_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="wcm-participant-row__remove"
                onClick={() => removeParticipant(p.id)}
                aria-label={`Remove ${p.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="wcm-empty">
          Search for participants above, or skip to create a solo workspace.
        </p>
      )}
    </div>
  );
}

function Stage5Governance({
  config,
  onChange,
}: {
  config: WorkspaceConfig;
  onChange: (patch: Partial<WorkspaceConfig>) => void;
}) {
  return (
    <div className="wcm-stage">
      <div className="wcm-stage__header">
        <h3 className="wcm-stage__title">Configure governance</h3>
        <p className="wcm-stage__subtitle">
          Define who can access this workspace, how it's moderated, and what approval flows
          are required. Good governance ensures productive, safe collaboration.
        </p>
      </div>

      <div className="wcm-form">
        <div className="wcm-field wcm-field--full">
          <label className="wcm-label">Visibility</label>
          <div className="wcm-visibility-grid">
            {(
              [
                {
                  value: 'private',
                  icon: '🔒',
                  label: 'Private',
                  desc: 'Only invited participants',
                },
                {
                  value: 'team',
                  icon: '👥',
                  label: 'Team',
                  desc: 'Visible to your team',
                },
                {
                  value: 'organization',
                  icon: '🏢',
                  label: 'Organization',
                  desc: 'Visible organization-wide',
                },
                {
                  value: 'public',
                  icon: '🌐',
                  label: 'Public',
                  desc: 'Open to the community',
                },
              ] as { value: Visibility; icon: string; label: string; desc: string }[]
            ).map((v) => (
              <button
                key={v.value}
                type="button"
                className={`wcm-visibility-card ${config.visibility === v.value ? 'wcm-visibility-card--active' : ''}`}
                onClick={() => onChange({ visibility: v.value })}
              >
                <span className="wcm-visibility-card__icon">{v.icon}</span>
                <span className="wcm-visibility-card__label">{v.label}</span>
                <span className="wcm-visibility-card__desc">{v.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="wcm-field wcm-field--full">
          <label className="wcm-label">Governance Settings</label>
          <div className="wcm-toggle-list">
            <label className="wcm-toggle">
              <div>
                <span className="wcm-toggle__label">Enable Moderation</span>
                <span className="wcm-toggle__desc">
                  Designate moderators to manage discussion quality
                </span>
              </div>
              <input
                type="checkbox"
                className="wcm-toggle__input"
                checked={config.moderationEnabled}
                onChange={(e) => onChange({ moderationEnabled: e.target.checked })}
              />
              <span className="wcm-toggle__track" />
            </label>

            <label className="wcm-toggle">
              <div>
                <span className="wcm-toggle__label">Require Approval to Join</span>
                <span className="wcm-toggle__desc">
                  New participants must be approved before accessing
                </span>
              </div>
              <input
                type="checkbox"
                className="wcm-toggle__input"
                checked={config.approvalRequired}
                onChange={(e) => onChange({ approvalRequired: e.target.checked })}
              />
              <span className="wcm-toggle__track" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stage6Knowledge({
  config,
  onChange,
}: {
  config: WorkspaceConfig;
  onChange: (patch: Partial<WorkspaceConfig>) => void;
}) {
  const settings: {
    key: keyof KnowledgeSettings;
    icon: string;
    label: string;
    desc: string;
  }[] = [
    {
      key: 'knowledgeCapture',
      icon: '🧠',
      label: 'Knowledge Capture',
      desc: 'Save important messages as reusable knowledge assets',
    },
    {
      key: 'discussionSummaries',
      icon: '📋',
      label: 'Discussion Summaries',
      desc: 'Auto-generate summaries of long discussions',
    },
    {
      key: 'decisionTracking',
      icon: '⚖️',
      label: 'Decision Tracking',
      desc: 'Track and log decisions made in this workspace',
    },
    {
      key: 'actionTracking',
      icon: '✓',
      label: 'Action Item Tracking',
      desc: 'Capture and assign action items from conversations',
    },
    {
      key: 'meetingRecords',
      icon: '📅',
      label: 'Meeting Records',
      desc: 'Maintain structured records of meetings held here',
    },
    {
      key: 'insightExtraction',
      icon: '💡',
      label: 'Insight Extraction',
      desc: 'AI-powered extraction of research and innovation insights',
    },
  ];

  const update = (key: keyof KnowledgeSettings, value: boolean) => {
    onChange({ knowledgeSettings: { ...config.knowledgeSettings, [key]: value } });
  };

  return (
    <div className="wcm-stage">
      <div className="wcm-stage__header">
        <h3 className="wcm-stage__title">Knowledge management settings</h3>
        <p className="wcm-stage__subtitle">
          Configure how knowledge is captured, organized, and preserved in this workspace. These
          settings turn conversations into institutional knowledge.
        </p>
      </div>

      <div className="wcm-toggle-list">
        {settings.map((s) => (
          <label key={s.key} className="wcm-toggle">
            <span className="wcm-toggle__icon">{s.icon}</span>
            <div>
              <span className="wcm-toggle__label">{s.label}</span>
              <span className="wcm-toggle__desc">{s.desc}</span>
            </div>
            <input
              type="checkbox"
              className="wcm-toggle__input"
              checked={config.knowledgeSettings[s.key]}
              onChange={(e) => update(s.key, e.target.checked)}
            />
            <span className="wcm-toggle__track" />
          </label>
        ))}
      </div>
    </div>
  );
}

function Stage7Review({
  config,
  onSubmit,
  submitting,
}: {
  config: WorkspaceConfig;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const meta = WORKSPACE_TYPES.find((w) => w.type === config.workspaceType);

  const validationErrors: string[] = [];
  if (!config.workspaceType) validationErrors.push('Workspace type is required');
  if (!config.title.trim()) validationErrors.push('Workspace name is required');
  if (!config.purpose.trim()) validationErrors.push('Purpose is required');

  const activeKnowledge = Object.entries(config.knowledgeSettings)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const priorityColor = {
    low: '#94a3b8',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
  }[config.priority];

  return (
    <div className="wcm-stage">
      <div className="wcm-stage__header">
        <h3 className="wcm-stage__title">Workspace Blueprint</h3>
        <p className="wcm-stage__subtitle">
          Review your workspace configuration before creation. This is the collaboration
          infrastructure you're building.
        </p>
      </div>

      {validationErrors.length > 0 && (
        <div className="wcm-validation-errors">
          {validationErrors.map((e) => (
            <p key={e} className="wcm-validation-error">
              ⚠ {e}
            </p>
          ))}
        </div>
      )}

      <div className="wcm-blueprint">
        <div className="wcm-blueprint__header">
          <span className="wcm-blueprint__icon">{meta?.icon}</span>
          <div>
            <h4 className="wcm-blueprint__name">{config.title || 'Untitled Workspace'}</h4>
            <span className="wcm-blueprint__type">{meta?.label}</span>
          </div>
          <span className="wcm-blueprint__priority" style={{ color: priorityColor }}>
            {config.priority.toUpperCase()}
          </span>
        </div>

        {config.purpose && (
          <div className="wcm-blueprint__section">
            <span className="wcm-blueprint__section-label">Purpose</span>
            <p className="wcm-blueprint__section-value">{config.purpose}</p>
          </div>
        )}

        {config.objectives && (
          <div className="wcm-blueprint__section">
            <span className="wcm-blueprint__section-label">Objectives</span>
            <p className="wcm-blueprint__section-value">{config.objectives}</p>
          </div>
        )}

        {config.expectedOutcomes && (
          <div className="wcm-blueprint__section">
            <span className="wcm-blueprint__section-label">Expected Outcomes</span>
            <p className="wcm-blueprint__section-value">{config.expectedOutcomes}</p>
          </div>
        )}

        <div className="wcm-blueprint__row">
          {config.timeline && (
            <div className="wcm-blueprint__stat">
              <span className="wcm-blueprint__stat-label">Timeline</span>
              <span className="wcm-blueprint__stat-value">{config.timeline}</span>
            </div>
          )}
          <div className="wcm-blueprint__stat">
            <span className="wcm-blueprint__stat-label">Visibility</span>
            <span className="wcm-blueprint__stat-value">{config.visibility}</span>
          </div>
          <div className="wcm-blueprint__stat">
            <span className="wcm-blueprint__stat-label">Participants</span>
            <span className="wcm-blueprint__stat-value">{config.participants.length}</span>
          </div>
          <div className="wcm-blueprint__stat">
            <span className="wcm-blueprint__stat-label">Assets</span>
            <span className="wcm-blueprint__stat-value">{config.attachedAssets.length}</span>
          </div>
        </div>

        {config.participants.length > 0 && (
          <div className="wcm-blueprint__section">
            <span className="wcm-blueprint__section-label">Participants</span>
            <div className="wcm-blueprint__participants">
              {config.participants.map((p) => (
                <div key={p.id} className="wcm-blueprint__participant">
                  <span className="wcm-blueprint__participant-avatar">{p.name[0]}</span>
                  <span className="wcm-blueprint__participant-name">{p.name}</span>
                  <span className="wcm-blueprint__participant-role">{p.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {config.attachedAssets.length > 0 && (
          <div className="wcm-blueprint__section">
            <span className="wcm-blueprint__section-label">Attached Assets</span>
            <div className="wcm-blueprint__assets">
              {config.attachedAssets.map((a) => (
                <span key={a.id} className="wcm-blueprint__asset-tag">
                  {a.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {activeKnowledge.length > 0 && (
          <div className="wcm-blueprint__section">
            <span className="wcm-blueprint__section-label">
              Knowledge Features ({activeKnowledge.length} active)
            </span>
            <div className="wcm-blueprint__assets">
              {activeKnowledge.map((k) => (
                <span key={k} className="wcm-blueprint__asset-tag wcm-blueprint__asset-tag--green">
                  {k.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        className="wcm-create-btn"
        onClick={onSubmit}
        disabled={validationErrors.length > 0 || submitting}
      >
        {submitting ? (
          <>⟳ Creating workspace…</>
        ) : (
          <>✦ Create Workspace</>
        )}
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function NewConversationModal({
  open,
  onClose,
  onSelectUser,
  searchUsers,
  onCreateWorkspace,
}: Props) {
  const [stage, setStage] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [config, setConfig] = useState<WorkspaceConfig>(DEFAULT_CONFIG);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setStage(1);
      setMaxReached(1);
      setConfig(DEFAULT_CONFIG);
      setSubmitting(false);
    }
  }, [open]);

  const patch = useCallback((partial: Partial<WorkspaceConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const goTo = useCallback(
    (next: number) => {
      setStage(next);
      setMaxReached((prev) => Math.max(prev, next));
    },
    []
  );

  const canAdvance = useCallback((): boolean => {
    if (stage === 1) return config.workspaceType !== null;
    if (stage === 2) return config.title.trim().length > 0 && config.purpose.trim().length > 0;
    return true;
  }, [stage, config.workspaceType, config.title, config.purpose]);

  const handleNext = () => {
    if (!canAdvance()) return;
    goTo(Math.min(stage + 1, 7));
  };

  const handleBack = () => {
    setStage((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    if (!config.workspaceType) return;

    setSubmitting(true);
    try {
      const payload: WorkspaceCreationPayload = {
        workspaceType: config.workspaceType,
        title: config.title,
        purpose: config.purpose,
        objectives: config.objectives,
        expectedOutcomes: config.expectedOutcomes,
        successMetrics: config.successMetrics,
        priority: config.priority,
        timeline: config.timeline,
        attachedAssets: config.attachedAssets,
        participants: config.participants,
        visibility: config.visibility,
        moderationEnabled: config.moderationEnabled,
        approvalRequired: config.approvalRequired,
        knowledgeSettings: config.knowledgeSettings,
      };

      if (onCreateWorkspace) {
        await onCreateWorkspace(payload);
      } else if (config.workspaceType === 'direct' && config.participants.length > 0) {
        // Backward-compatible DM creation
        onSelectUser(config.participants[0]);
      } else {
        // Fallback: create DM with first participant or close
        if (config.participants.length > 0) {
          onSelectUser(config.participants[0]);
        } else {
          onClose();
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const currentMeta = WORKSPACE_TYPES.find((w) => w.type === config.workspaceType);

  return (
    <>
      <div className="wcm-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="wcm-container" role="dialog" aria-modal="true" aria-label="Create workspace">
        {/* HEADER */}
        <div className="wcm-header">
          <div className="wcm-header__info">
            <div className="wcm-header__eyebrow">Maylet XLab · Collaboration Engine</div>
            <h2 className="wcm-header__title">
              {currentMeta ? (
                <>
                  {currentMeta.icon} {currentMeta.label}
                </>
              ) : (
                'New Collaboration Workspace'
              )}
            </h2>
          </div>
          <button
            type="button"
            className="wcm-header__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* PROGRESS */}
        <WizardProgress
          currentStage={stage}
          onNavigate={goTo}
          maxReached={maxReached}
        />

        {/* BODY */}
        <div className="wcm-body">
          {stage === 1 && (
            <Stage1TypeSelection
              selected={config.workspaceType}
              onSelect={(t) => patch({ workspaceType: t })}
            />
          )}
          {stage === 2 && (
            <Stage2BusinessContext config={config} onChange={patch} />
          )}
          {stage === 3 && (
            <Stage3Assets config={config} onChange={patch} />
          )}
          {stage === 4 && (
            <Stage4Participants
              config={config}
              onChange={patch}
              searchUsers={searchUsers}
            />
          )}
          {stage === 5 && (
            <Stage5Governance config={config} onChange={patch} />
          )}
          {stage === 6 && (
            <Stage6Knowledge config={config} onChange={patch} />
          )}
          {stage === 7 && (
            <Stage7Review
              config={config}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          )}
        </div>

        {/* FOOTER NAV */}
        {stage < 7 && (
          <div className="wcm-footer">
            <button
              type="button"
              className="wcm-footer__back"
              onClick={handleBack}
              disabled={stage === 1}
            >
              ← Back
            </button>
            <div className="wcm-footer__center">
              <span className="wcm-footer__stage">
                Step {stage} of {WIZARD_STAGES.length}
              </span>
            </div>
            <button
              type="button"
              className={`wcm-footer__next ${!canAdvance() ? 'wcm-footer__next--disabled' : ''}`}
              onClick={handleNext}
              disabled={!canAdvance()}
            >
              {stage === 1 ? 'Start Building →' : 'Continue →'}
            </button>
          </div>
        )}
        {stage === 7 && (
          <div className="wcm-footer">
            <button
              type="button"
              className="wcm-footer__back"
              onClick={handleBack}
            >
              ← Back
            </button>
            <div className="wcm-footer__center">
              <span className="wcm-footer__stage">Final Review</span>
            </div>
            <div />
          </div>
        )}
      </div>

      <style>{`
        /* BACKDROP */
        .wcm-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          z-index: 1000;
        }

        /* CONTAINER */
        .wcm-container {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(900px, 95vw);
          max-height: 90vh;
          background: #13131f;
          border: 1px solid #2d2d3f;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          z-index: 1001;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
          overflow: hidden;
        }

        /* HEADER */
        .wcm-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1.5rem 1.75rem 1rem;
          border-bottom: 1px solid #2d2d3f;
          flex-shrink: 0;
        }

        .wcm-header__eyebrow {
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #7c5fe6;
          margin-bottom: 0.375rem;
        }

        .wcm-header__title {
          margin: 0;
          font-size: 1.375rem;
          font-weight: 700;
          color: #fff;
        }

        .wcm-header__close {
          background: none;
          border: none;
          color: #64748b;
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          transition: all 0.15s;
        }
        .wcm-header__close:hover { background: #252538; color: #fff; }

        /* PROGRESS */
        .wcm-progress {
          display: flex;
          align-items: center;
          padding: 0.875rem 1.75rem;
          background: #0f0f1a;
          border-bottom: 1px solid #2d2d3f;
          gap: 0;
          overflow-x: auto;
          flex-shrink: 0;
        }

        .wcm-progress__step {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          position: relative;
          flex-shrink: 0;
        }
        .wcm-progress__step:disabled { cursor: default; }

        .wcm-progress__num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #252538;
          border: 2px solid #2d2d3f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .wcm-progress__step--active .wcm-progress__num {
          background: #7c5fe6;
          border-color: #7c5fe6;
          color: #fff;
        }
        .wcm-progress__step--complete .wcm-progress__num {
          background: #10b981;
          border-color: #10b981;
          color: #fff;
        }

        .wcm-progress__label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #475569;
          white-space: nowrap;
        }
        .wcm-progress__step--active .wcm-progress__label { color: #e2e8f0; }
        .wcm-progress__step--complete .wcm-progress__label { color: #10b981; }

        .wcm-progress__line {
          display: block;
          width: 32px;
          height: 2px;
          background: #2d2d3f;
          margin: 0 0.5rem;
          flex-shrink: 0;
        }
        .wcm-progress__line--complete { background: #10b981; }

        /* BODY */
        .wcm-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem 1.75rem;
          min-height: 0;
        }

        /* STAGE */
        .wcm-stage__header { margin-bottom: 1.5rem; }
        .wcm-stage__type-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.75rem;
          background: rgba(124, 95, 230, 0.15);
          border: 1px solid rgba(124, 95, 230, 0.3);
          border-radius: 20px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #a78bfa;
          margin-bottom: 0.75rem;
        }
        .wcm-stage__title {
          margin: 0 0 0.5rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #fff;
        }
        .wcm-stage__subtitle {
          margin: 0;
          font-size: 0.875rem;
          color: #64748b;
          line-height: 1.5;
        }

        /* TYPE GRID */
        .wcm-type-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
        }
        @media (max-width: 640px) { .wcm-type-grid { grid-template-columns: repeat(2, 1fr); } }

        .wcm-type-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 1rem;
          background: #1a1a2e;
          border: 2px solid #2d2d3f;
          border-radius: 10px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
          position: relative;
          gap: 0.25rem;
        }
        .wcm-type-card:hover { border-color: #7c5fe6; background: rgba(124, 95, 230, 0.08); }
        .wcm-type-card__icon { font-size: 1.5rem; margin-bottom: 0.25rem; }
        .wcm-type-card__label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #e2e8f0;
        }
        .wcm-type-card__desc {
          font-size: 0.6875rem;
          color: #64748b;
          line-height: 1.4;
        }
        .wcm-type-card__check {
          position: absolute;
          top: 0.5rem;
          right: 0.625rem;
          font-weight: 700;
          font-size: 0.875rem;
        }

        /* FORM */
        .wcm-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .wcm-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .wcm-field--full { grid-column: 1 / -1; }

        .wcm-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #94a3b8;
        }
        .wcm-required { color: #ef4444; }

        .wcm-input, .wcm-select, .wcm-textarea {
          background: #1a1a2e;
          border: 1px solid #2d2d3f;
          border-radius: 8px;
          padding: 0.625rem 0.875rem;
          color: #e2e8f0;
          font-size: 0.875rem;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.15s;
          font-family: inherit;
        }
        .wcm-input:focus, .wcm-select:focus, .wcm-textarea:focus {
          outline: none;
          border-color: #7c5fe6;
        }
        .wcm-input::placeholder, .wcm-textarea::placeholder { color: #475569; }
        .wcm-textarea { resize: vertical; }
        .wcm-select { appearance: none; cursor: pointer; }
        .wcm-select--sm { padding: 0.25rem 0.5rem; font-size: 0.8125rem; width: auto; }

        /* ASSETS */
        .wcm-attached { margin-bottom: 1rem; }
        .wcm-attached__label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #94a3b8;
          margin-bottom: 0.5rem;
        }
        .wcm-attached__list { display: flex; flex-wrap: wrap; gap: 0.5rem; }

        .wcm-asset-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.625rem;
          background: rgba(124, 95, 230, 0.15);
          border: 1px solid rgba(124, 95, 230, 0.3);
          border-radius: 20px;
          font-size: 0.8125rem;
          color: #a78bfa;
        }
        .wcm-asset-chip__title { font-weight: 500; }
        .wcm-asset-chip__remove {
          background: none;
          border: none;
          color: #a78bfa;
          cursor: pointer;
          font-size: 1rem;
          line-height: 1;
          padding: 0;
          margin-left: 0.25rem;
        }

        .wcm-search { position: relative; margin-bottom: 0.75rem; }
        .wcm-search__spinner {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #7c5fe6;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }

        .wcm-asset-list { display: flex; flex-direction: column; gap: 0.375rem; }

        .wcm-asset-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: #1a1a2e;
          border: 1px solid #2d2d3f;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
          width: 100%;
        }
        .wcm-asset-row:hover { border-color: #7c5fe6; background: rgba(124, 95, 230, 0.08); }
        .wcm-asset-row__icon { font-size: 1.25rem; flex-shrink: 0; }
        .wcm-asset-row__info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .wcm-asset-row__title { font-size: 0.875rem; font-weight: 600; color: #e2e8f0; }
        .wcm-asset-row__sub { font-size: 0.75rem; color: #64748b; }
        .wcm-asset-row__type {
          font-size: 0.6875rem;
          font-weight: 600;
          color: #7c5fe6;
          letter-spacing: 0.05em;
        }
        .wcm-asset-row__status {
          padding: 0.125rem 0.5rem;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 12px;
          font-size: 0.6875rem;
          color: #10b981;
          font-weight: 500;
        }
        .wcm-asset-row__add {
          font-size: 0.8125rem;
          color: #7c5fe6;
          font-weight: 500;
        }

        /* PARTICIPANTS */
        .wcm-user-results {
          background: #1a1a2e;
          border: 1px solid #2d2d3f;
          border-radius: 8px;
          margin-bottom: 0.75rem;
          overflow: hidden;
        }

        .wcm-user-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          border-bottom: 1px solid #2d2d3f;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: background 0.15s;
        }
        .wcm-user-row:last-child { border-bottom: none; }
        .wcm-user-row:hover { background: rgba(124, 95, 230, 0.08); }

        .wcm-user-row__avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #7c5fe6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 600;
          color: #fff;
          flex-shrink: 0;
          overflow: hidden;
        }
        .wcm-user-row__avatar img { width: 100%; height: 100%; object-fit: cover; }
        .wcm-user-row__name { flex: 1; font-size: 0.875rem; font-weight: 500; color: #e2e8f0; }
        .wcm-user-row__add { font-size: 0.8125rem; color: #7c5fe6; font-weight: 500; }

        .wcm-participant-list { margin-top: 1rem; }
        .wcm-participant-list__label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #94a3b8;
          margin-bottom: 0.5rem;
        }

        .wcm-participant-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0;
          border-bottom: 1px solid #2d2d3f;
        }
        .wcm-participant-row:last-child { border-bottom: none; }
        .wcm-participant-row__name { flex: 1; font-size: 0.875rem; color: #e2e8f0; font-weight: 500; }
        .wcm-participant-row__remove {
          background: none;
          border: none;
          color: #475569;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s;
        }
        .wcm-participant-row__remove:hover { color: #ef4444; }

        /* VISIBILITY */
        .wcm-visibility-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
          margin-top: 0.375rem;
        }
        @media (max-width: 600px) {
          .wcm-visibility-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .wcm-visibility-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem 0.75rem;
          background: #1a1a2e;
          border: 2px solid #2d2d3f;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s;
          gap: 0.375rem;
          text-align: center;
        }
        .wcm-visibility-card:hover { border-color: #7c5fe6; }
        .wcm-visibility-card--active { border-color: #7c5fe6; background: rgba(124, 95, 230, 0.1); }
        .wcm-visibility-card__icon { font-size: 1.5rem; }
        .wcm-visibility-card__label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #e2e8f0;
        }
        .wcm-visibility-card__desc {
          font-size: 0.6875rem;
          color: #64748b;
          line-height: 1.4;
        }

        /* TOGGLES */
        .wcm-toggle-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          border: 1px solid #2d2d3f;
          border-radius: 10px;
          overflow: hidden;
        }

        .wcm-toggle {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid #2d2d3f;
          cursor: pointer;
          transition: background 0.15s;
        }
        .wcm-toggle:last-child { border-bottom: none; }
        .wcm-toggle:hover { background: rgba(124, 95, 230, 0.05); }

        .wcm-toggle__icon { font-size: 1.25rem; flex-shrink: 0; }
        .wcm-toggle > div { flex: 1; min-width: 0; }
        .wcm-toggle__label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #e2e8f0;
        }
        .wcm-toggle__desc {
          display: block;
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.125rem;
        }

        .wcm-toggle__input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }
        .wcm-toggle__track {
          position: relative;
          display: block;
          width: 40px;
          height: 22px;
          border-radius: 11px;
          background: #252538;
          border: 2px solid #3d3d50;
          flex-shrink: 0;
          transition: all 0.2s;
          cursor: pointer;
        }
        .wcm-toggle__track::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #475569;
          transition: all 0.2s;
        }
        .wcm-toggle__input:checked + .wcm-toggle__track {
          background: #7c5fe6;
          border-color: #7c5fe6;
        }
        .wcm-toggle__input:checked + .wcm-toggle__track::after {
          left: 20px;
          background: #fff;
        }

        /* BLUEPRINT */
        .wcm-validation-errors {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          margin-bottom: 1rem;
        }
        .wcm-validation-error {
          margin: 0 0 0.25rem 0;
          font-size: 0.875rem;
          color: #f87171;
        }
        .wcm-validation-error:last-child { margin-bottom: 0; }

        .wcm-blueprint {
          background: #1a1a2e;
          border: 1px solid #2d2d3f;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .wcm-blueprint__header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.25rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid #2d2d3f;
        }
        .wcm-blueprint__icon { font-size: 2rem; }
        .wcm-blueprint__name {
          margin: 0 0 0.25rem 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: #fff;
        }
        .wcm-blueprint__type {
          font-size: 0.75rem;
          color: #7c5fe6;
          font-weight: 500;
        }
        .wcm-blueprint__priority {
          margin-left: auto;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .wcm-blueprint__section { margin-bottom: 1rem; }
        .wcm-blueprint__section-label {
          display: block;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #475569;
          margin-bottom: 0.375rem;
        }
        .wcm-blueprint__section-value {
          margin: 0;
          font-size: 0.875rem;
          color: #94a3b8;
          line-height: 1.5;
        }

        .wcm-blueprint__row {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
          padding: 0.875rem 0;
          border-top: 1px solid #2d2d3f;
          border-bottom: 1px solid #2d2d3f;
        }
        .wcm-blueprint__stat { display: flex; flex-direction: column; gap: 0.25rem; }
        .wcm-blueprint__stat-label {
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #475569;
        }
        .wcm-blueprint__stat-value {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #e2e8f0;
          text-transform: capitalize;
        }

        .wcm-blueprint__participants {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .wcm-blueprint__participant {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .wcm-blueprint__participant-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #7c5fe6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: #fff;
          flex-shrink: 0;
        }
        .wcm-blueprint__participant-name {
          flex: 1;
          font-size: 0.875rem;
          color: #e2e8f0;
        }
        .wcm-blueprint__participant-role {
          font-size: 0.75rem;
          color: #7c5fe6;
          font-weight: 500;
          text-transform: capitalize;
        }

        .wcm-blueprint__assets {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .wcm-blueprint__asset-tag {
          padding: 0.25rem 0.625rem;
          background: rgba(124, 95, 230, 0.12);
          border: 1px solid rgba(124, 95, 230, 0.25);
          border-radius: 12px;
          font-size: 0.75rem;
          color: #a78bfa;
        }
        .wcm-blueprint__asset-tag--green {
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(16, 185, 129, 0.25);
          color: #34d399;
          text-transform: capitalize;
        }

        /* CREATE BUTTON */
        .wcm-create-btn {
          width: 100%;
          padding: 0.875rem;
          background: linear-gradient(135deg, #7c5fe6, #6b4fd6);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.025em;
        }
        .wcm-create-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #8b6df5, #7c5fe6);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(124, 95, 230, 0.4);
        }
        .wcm-create-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* FOOTER */
        .wcm-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.75rem;
          border-top: 1px solid #2d2d3f;
          background: #0f0f1a;
          flex-shrink: 0;
        }

        .wcm-footer__back {
          background: none;
          border: 1px solid #2d2d3f;
          border-radius: 8px;
          padding: 0.625rem 1rem;
          color: #94a3b8;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .wcm-footer__back:hover:not(:disabled) { border-color: #7c5fe6; color: #e2e8f0; }
        .wcm-footer__back:disabled { opacity: 0.3; cursor: default; }

        .wcm-footer__center {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .wcm-footer__stage {
          font-size: 0.8125rem;
          color: #475569;
        }

        .wcm-footer__next {
          background: #7c5fe6;
          border: none;
          border-radius: 8px;
          padding: 0.625rem 1.25rem;
          color: #fff;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .wcm-footer__next:hover:not(.wcm-footer__next--disabled) { background: #8b6df5; }
        .wcm-footer__next--disabled {
          background: #252538;
          color: #475569;
          cursor: not-allowed;
        }

        /* UTILITIES */
        .wcm-empty {
          text-align: center;
          color: #475569;
          font-size: 0.875rem;
          padding: 1.5rem;
        }
        .wcm-note {
          font-size: 0.8125rem;
          color: #475569;
          margin-top: 1rem;
          padding: 0.75rem 1rem;
          background: rgba(124, 95, 230, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(124, 95, 230, 0.1);
        }
      `}</style>
    </>
  );
}
