import {
  createResearchFinding,
  createResearchNote,
  deleteResearchFinding,
  deleteResearchNote,
  fetchProjectResearchSnapshot,
  fetchResearchActivity,
  fetchResearchDashboard,
  fetchResearchFindings,
  fetchResearchNotes,
  fetchResearchProfile,
  updateResearchFinding,
  updateResearchNote,
  upsertResearchProfile,
} from '../../../lib/supabase/research.queries';
import { computeProjectCompletion } from '../../../lib/research/utils';
import type {
  FindingType,
  ProjectResearchSnapshot,
  ResearchDashboardStats,
  ResearchFinding,
  ResearchNote,
  ResearchProfile,
  ResearchProjectSummary,
  ResearchActivityPoint,
} from '../types/research.types';

export const researchService = {
  async getDashboard(userId: string): Promise<{
    stats: ResearchDashboardStats;
    projects: ResearchProjectSummary[];
  }> {
    return fetchResearchDashboard(userId);
  },

  async getSnapshot(projectId: string, userId: string): Promise<ProjectResearchSnapshot> {
    return fetchProjectResearchSnapshot(projectId, userId);
  },

  async getActivity(userId: string, days = 14): Promise<ResearchActivityPoint[]> {
    return fetchResearchActivity(userId, days);
  },

  async getProfile(projectId: string, userId: string): Promise<ResearchProfile | null> {
    return fetchResearchProfile(projectId, userId);
  },

  async saveProfile(
    projectId: string,
    userId: string,
    fields: Partial<Omit<ResearchProfile, 'id' | 'project_id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) {
    return upsertResearchProfile(projectId, userId, fields);
  },

  async listNotes(projectId: string): Promise<ResearchNote[]> {
    return fetchResearchNotes(projectId);
  },

  async createNote(
    projectId: string,
    userId: string,
    payload: { title: string; content?: string; category?: string; tags?: string[] }
  ) {
    return createResearchNote(projectId, userId, payload);
  },

  async updateNote(id: string, payload: Partial<Pick<ResearchNote, 'title' | 'content' | 'category' | 'tags'>>) {
    return updateResearchNote(id, payload);
  },

  async deleteNote(id: string) {
    return deleteResearchNote(id);
  },

  async listFindings(projectId: string): Promise<ResearchFinding[]> {
    return fetchResearchFindings(projectId);
  },

  async createFinding(
    projectId: string,
    userId: string,
    payload: { title: string; content?: string; finding_type?: FindingType }
  ) {
    return createResearchFinding(projectId, userId, payload);
  },

  async updateFinding(
    id: string,
    payload: Partial<Pick<ResearchFinding, 'title' | 'content' | 'finding_type'>>
  ) {
    return updateResearchFinding(id, payload);
  },

  async deleteFinding(id: string) {
    return deleteResearchFinding(id);
  },

  computeCompletion(snapshot: Omit<ProjectResearchSnapshot, 'completionRate'>): number {
    return computeProjectCompletion(snapshot);
  },
};
