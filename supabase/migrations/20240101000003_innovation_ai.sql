-- MAYA AI / InnoOS tables

CREATE TYPE public.memory_type AS ENUM (
  'session_summary',
  'user_dna',
  'project_summary',
  'experiment_result',
  'document_chunk',
  'team_context',
  'knowledge_base'
);

CREATE TYPE public.ai_agent_role AS ENUM (
  'chat', 'project', 'experiment', 'research', 'code', 'document', 'funding', 'team'
);

-- Central innovation lifecycle node
CREATE TABLE public.innovation_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  current_stage public.innovation_stage NOT NULL DEFAULT 'idea',
  innovation_score INTEGER DEFAULT 0 CHECK (innovation_score >= 0 AND innovation_score <= 100),
  market_potential INTEGER DEFAULT 0 CHECK (market_potential >= 0 AND market_potential <= 100),
  technical_feasibility INTEGER DEFAULT 0 CHECK (technical_feasibility >= 0 AND technical_feasibility <= 100),
  funding_readiness INTEGER DEFAULT 0 CHECK (funding_readiness >= 0 AND funding_readiness <= 100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_innovation_nodes_user ON public.innovation_nodes(user_id);
CREATE INDEX idx_innovation_nodes_project ON public.innovation_nodes(project_id);

-- AI memory layers (RAG-ready: embedding column optional until pgvector enabled)
CREATE TABLE public.ai_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id UUID REFERENCES public.innovation_nodes(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  memory_type public.memory_type NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  -- embedding VECTOR(1536),  -- uncomment when pgvector is enabled
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_memories_user ON public.ai_memories(user_id);
CREATE INDEX idx_ai_memories_node ON public.ai_memories(node_id);
CREATE INDEX idx_ai_memories_type ON public.ai_memories(memory_type);

-- Chat sessions
CREATE TABLE public.ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id UUID REFERENCES public.innovation_nodes(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT DEFAULT 'New conversation',
  agent_role public.ai_agent_role DEFAULT 'chat',
  model_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_chat_messages_session ON public.ai_chat_messages(session_id);

-- IP / Innovation Vault (cryptographic record)
CREATE TABLE public.ai_innovation_vault (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id UUID REFERENCES public.innovation_nodes(id) ON DELETE CASCADE,
  vault_entry_id UUID REFERENCES public.vault_entries(id) ON DELETE CASCADE,
  version_hash TEXT NOT NULL,
  ownership_signature TEXT NOT NULL,
  version_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Innovation DNA profile
CREATE TABLE public.dna_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  strengths JSONB DEFAULT '[]',
  weaknesses JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  scores JSONB DEFAULT '{}',
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marketplace (ecosystem)
CREATE TABLE public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  listing_type TEXT NOT NULL,
  price NUMERIC(14,2),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MAYA proactive alerts
CREATE TABLE public.maya_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER innovation_nodes_updated_at BEFORE UPDATE ON public.innovation_nodes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER ai_chat_sessions_updated_at BEFORE UPDATE ON public.ai_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
