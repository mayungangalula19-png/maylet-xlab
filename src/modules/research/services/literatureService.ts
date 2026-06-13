import {
  createLiteratureItem,
  deleteLiteratureItem,
  fetchLiteratureItems,
  updateLiteratureItem,
} from '../../../lib/supabase/research.queries';
import type { LiteratureItem, LiteratureType } from '../types/research.types';

export const literatureService = {
  async list(projectId: string): Promise<LiteratureItem[]> {
    return fetchLiteratureItems(projectId);
  },

  async create(
    projectId: string,
    userId: string,
    payload: {
      title: string;
      item_type?: LiteratureType;
      source?: string | null;
      authors?: string | null;
      publication_date?: string | null;
      citation_count?: number | null;
      relevance_score?: number | null;
      url?: string | null;
      notes?: string | null;
    }
  ) {
    return createLiteratureItem(projectId, userId, payload);
  },

  async update(id: string, payload: Partial<LiteratureItem>) {
    return updateLiteratureItem(id, payload);
  },

  async remove(id: string) {
    return deleteLiteratureItem(id);
  },
};
