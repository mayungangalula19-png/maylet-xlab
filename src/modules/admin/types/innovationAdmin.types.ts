import type { ExperimentRecord } from '../../../lib/experiment/experimentOps';

export interface AdminInnovationOwner {
  id: string;
  name: string;
  email: string;
}

export interface AdminExperimentDetailBundle {
  experiment: ExperimentRecord;
  owner: AdminInnovationOwner;
}

export interface AdminPrototypeDetail {
  id: string;
  name: string;
  description: string | null;
  status: string;
  version: string;
  file_url: string | null;
  thumbnail_url: string | null;
  views: number;
  downloads: number;
  project_id: string | null;
  project_name: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AdminPrototypeDetailBundle {
  prototype: AdminPrototypeDetail;
  owner: AdminInnovationOwner;
  fileCount: number;
}

export interface AdminVaultDetail {
  id: string;
  title: string;
  content: string | null;
  user_id: string;
  created_at: string;
}

export interface AdminVaultDetailBundle {
  item: AdminVaultDetail;
  owner: AdminInnovationOwner;
}
