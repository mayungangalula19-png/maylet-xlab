import type { MayaAgentRole, MayaModelId } from './types';

export const MAYA_APP_NAME = 'MAYA AI';
export const MAYA_TAGLINE = 'Maylet Artificial Intelligence Assistant — InnoOS Co-Pilot';

export const INNOVATION_STAGES = [
  { id: 'idea', label: 'Idea', icon: '💡' },
  { id: 'experiment', label: 'Experiment', icon: '🧪' },
  { id: 'prototype', label: 'Prototype', icon: '📦' },
  { id: 'project', label: 'Project', icon: '📁' },
  { id: 'funding', label: 'Funding', icon: '💰' },
  { id: 'business', label: 'Business', icon: '🏢' },
] as const;

export const MEMORY_LEVEL_LABELS: Record<string, string> = {
  session_summary: 'Session',
  user_dna: 'User DNA',
  project_summary: 'Project',
  experiment_result: 'Experiment',
  document_chunk: 'Document',
  team_context: 'Team',
  knowledge_base: 'Knowledge',
};

export const DEFAULT_AGENT: MayaAgentRole = 'chat';

export const MAYA_MODELS: {
  id: MayaModelId;
  name: string;
  envKey: string;
  apiUrl?: string;
  free: boolean;
}[] = [
  {
    id: 'groq',
    name: 'Groq (Llama 3)',
    envKey: 'VITE_GROQ_API_KEY',
    apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
    free: true,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    envKey: 'VITE_GEMINI_API_KEY',
    free: true,
  },
  {
    id: 'gpt',
    name: 'OpenAI GPT',
    envKey: 'VITE_OPENAI_API_KEY',
    free: false,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    envKey: 'VITE_DEEPSEEK_API_KEY',
    free: true,
  },
  {
    id: 'maylet',
    name: 'MAYA Core (Local)',
    envKey: '',
    free: true,
  },
];

export const AGENT_ROUTE_KEYWORDS: Record<MayaAgentRole, string[]> = {
  chat: [],
  project: ['roadmap', 'task', 'milestone', 'project', 'risk'],
  experiment: ['experiment', 'hypothesis', 'test', 'lab', 'results'],
  research: ['research', 'paper', 'literature', 'study', 'reference'],
  code: ['code', 'react', 'typescript', 'api', 'component', 'function'],
  document: ['document', 'proposal', 'deck', 'pitch', 'sop', 'plan'],
  funding: ['funding', 'investor', 'grant', 'raise', 'valuation'],
  team: ['team', 'member', 'backlog', 'assign', 'collaborate'],
};

export const MAX_CONTEXT_MEMORIES = 12;
export const MAX_RECENT_MESSAGES = 20;
