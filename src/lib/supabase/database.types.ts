/**
 * Supabase database types for Maylet XLab.
 * Regenerate with: npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          role: string;
          user_type: string | null;
          organization_name: string | null;
          plan: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          sector: string | null;
          progress: number | null;
          progress_score: number | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['projects']['Row']> & {
          user_id: string;
          name: string;
        };
        Update: Partial<Database['public']['Tables']['projects']['Row']>;
      };
      innovation_nodes: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          title: string;
          description: string | null;
          current_stage: string;
          innovation_score: number;
          market_potential: number;
          technical_feasibility: number;
          funding_readiness: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['innovation_nodes']['Row']> & {
          user_id: string;
          title: string;
        };
        Update: Partial<Database['public']['Tables']['innovation_nodes']['Row']>;
      };
      ai_memories: {
        Row: {
          id: string;
          user_id: string;
          node_id: string | null;
          project_id: string | null;
          memory_type: string;
          title: string | null;
          content: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          user_id: string;
          memory_type: string;
          content: string;
          title?: string | null;
          node_id?: string | null;
          project_id?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database['public']['Tables']['ai_memories']['Row']>;
      };
      ai_chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          node_id: string | null;
          title: string;
          agent_role: string;
          model_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          title?: string;
          project_id?: string | null;
          agent_role?: string;
          model_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['ai_chat_sessions']['Row']>;
      };
      ai_chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: string;
          content: string;
          tokens_used: number;
          created_at: string;
        };
        Insert: {
          session_id: string;
          role: string;
          content: string;
          tokens_used?: number;
        };
        Update: Partial<Database['public']['Tables']['ai_chat_messages']['Row']>;
      };
    };
  };
}
