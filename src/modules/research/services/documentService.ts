import {
  deleteResearchDocument,
  fetchResearchDocuments,
  uploadResearchDocument,
} from '../../../lib/supabase/research.queries';
import type { ResearchDocument } from '../types/research.types';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

const ALLOWED_EXT = /\.(pdf|docx|pptx|txt)$/i;

export const documentService = {
  async list(projectId: string): Promise<ResearchDocument[]> {
    return fetchResearchDocuments(projectId);
  },

  validateFile(file: File): string | null {
    if (ALLOWED_TYPES.includes(file.type) || ALLOWED_EXT.test(file.name)) return null;
    return 'Supported formats: PDF, DOCX, PPTX, TXT';
  },

  async upload(
    projectId: string,
    userId: string,
    file: File,
    meta?: { category?: string; tags?: string[]; description?: string }
  ): Promise<ResearchDocument> {
    const err = documentService.validateFile(file);
    if (err) throw new Error(err);
    return uploadResearchDocument(projectId, userId, file, meta);
  },

  async remove(id: string) {
    return deleteResearchDocument(id);
  },
};
