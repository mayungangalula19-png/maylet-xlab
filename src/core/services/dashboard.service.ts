import { supabase } from '../../lib/supabase/client';
import { fetchOwnedTeamIds } from '../../lib/supabase/dbHelpers';

export interface DashboardProject {
  id: string;
  name: string;
  description: string;
  sector: string;
  progress: number;
  status: 'Idea' | 'Experiment' | 'Prototype' | 'Launched';
  created_at: string;
  user_id: string;
}

export interface DashboardActivity {
  id: string;
  type: 'experiment' | 'prototype' | 'team' | 'vault' | 'funding';
  title: string;
  project_name: string;
  created_at: string;
  user_name: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalExperiments: number;
  totalDocuments: number;
  totalTeamMembers: number;
  totalFundingPitches: number;
  totalVaultEntries: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentProjects: DashboardProject[];
  activities: DashboardActivity[];
}

class DashboardService {
  async getDashboardData(userId: string): Promise<DashboardData> {
    const [
      { count: projectsCount },
      { count: experimentsCount },
      { count: documentsCount },
      ownedTeamIds,
      { count: fundingCount },
      { count: vaultCount },
      { data: projects },
      { data: activitiesData },
    ] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('experiments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      fetchOwnedTeamIds(userId),
      supabase.from('funding_pitches').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('vault_entries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      supabase.from('activities').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
    ]);

    return {
      stats: {
        totalProjects: projectsCount || 0,
        totalExperiments: experimentsCount || 0,
        totalDocuments: documentsCount || 0,
        totalTeamMembers: ownedTeamIds.length,
        totalFundingPitches: fundingCount || 0,
        totalVaultEntries: vaultCount || 0,
      },
      recentProjects: (projects as DashboardProject[]) || [],
      activities: (activitiesData as DashboardActivity[]) || [],
    };
  }
}

export const dashboardService = new DashboardService();
