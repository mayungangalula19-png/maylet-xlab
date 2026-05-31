-- Row Level Security for Maylet XLab

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prototypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.innovation_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_innovation_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dna_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maya_alerts ENABLE ROW LEVEL SECURITY;

-- Helper: admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Users (extended)
CREATE POLICY "users_own" ON public.users FOR ALL USING (auth.uid() = id);

-- Projects
CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "projects_insert" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_update" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "projects_delete" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Experiments
CREATE POLICY "experiments_own" ON public.experiments FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Prototypes
CREATE POLICY "prototypes_own" ON public.prototypes FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Teams: owner or member
CREATE POLICY "teams_select" ON public.teams FOR SELECT USING (
  auth.uid() = owner_id OR public.is_admin() OR EXISTS (
    SELECT 1 FROM public.team_members tm WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
  )
);
CREATE POLICY "teams_mutate_owner" ON public.teams FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND (t.owner_id = auth.uid() OR public.is_admin()))
  OR user_id = auth.uid()
);

-- Vault
CREATE POLICY "vault_entries_own" ON public.vault_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "vault_items_own" ON public.vault_items FOR ALL USING (auth.uid() = user_id);

-- Funding
CREATE POLICY "funding_own" ON public.funding_pitches FOR ALL USING (auth.uid() = user_id);

-- Documents & tasks (via project ownership)
CREATE POLICY "documents_project" ON public.documents FOR ALL USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
);

CREATE POLICY "tasks_project" ON public.tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
);

-- Notifications & support
CREATE POLICY "notifications_own" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "support_own" ON public.support_tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_own" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "payments_own" ON public.payments FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "security_own" ON public.security_events FOR ALL USING (auth.uid() = user_id);

-- MAYA / InnoOS
CREATE POLICY "innovation_nodes_own" ON public.innovation_nodes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "ai_memories_own" ON public.ai_memories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "ai_sessions_own" ON public.ai_chat_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "ai_messages_session" ON public.ai_chat_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.ai_chat_sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
);
CREATE POLICY "ai_vault_own" ON public.ai_innovation_vault FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "dna_own" ON public.dna_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "maya_alerts_own" ON public.maya_alerts FOR ALL USING (auth.uid() = user_id);

-- Marketplace: public read, seller write
CREATE POLICY "marketplace_read" ON public.marketplace_listings FOR SELECT USING (status = 'active' OR seller_id = auth.uid());
CREATE POLICY "marketplace_seller" ON public.marketplace_listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "marketplace_update_seller" ON public.marketplace_listings FOR UPDATE USING (auth.uid() = seller_id);

-- Admin read-all for key tables
CREATE POLICY "admin_projects" ON public.projects FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_profiles" ON public.profiles FOR SELECT USING (public.is_admin());
