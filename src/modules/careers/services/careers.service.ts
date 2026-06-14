import { supabase } from '../../../lib/supabase/client';

export const CAREER_RESUME_MAX_BYTES = 5 * 1024 * 1024;
export const CAREER_RESUME_BUCKET = 'career-resumes';

const ALLOWED_RESUME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export type CareerApplicationStatus =
  | 'pending'
  | 'reviewing'
  | 'shortlisted'
  | 'rejected'
  | 'accepted';

export interface CareerApplicationInput {
  fullName: string;
  email: string;
  roleInterest: string;
  skills: string;
  portfolio: string;
  userId?: string | null;
  mayaMatchSnapshot?: MayaMatchSnapshot | null;
  resumeFile?: File | null;
  applicationId?: string;
}

export interface MayaMatchSnapshot {
  skills: string[];
  matches: { role: string; score: number }[];
  generatedAt: string;
}

export interface CareerApplicationRow {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  role_interest: string;
  skills: string;
  portfolio: string;
  status: CareerApplicationStatus;
  maya_match_snapshot: MayaMatchSnapshot | null;
  resume_path: string | null;
  resume_file_name: string | null;
  reviewer_notes: string | null;
  created_at: string;
  updated_at: string;
}

const ROLE_KEYWORDS: Record<string, string[]> = {
  'AI Engineers (MAYA)': ['ai', 'llm', 'prompt', 'maya', 'openai', 'machine learning', 'nlp'],
  Developers: ['typescript', 'react', 'javascript', 'node', 'frontend', 'backend', 'fullstack', 'python'],
  Researchers: ['research', 'literature', 'analysis', 'academic', 'science'],
  Designers: ['design', 'ux', 'ui', 'figma', 'prototype'],
  'Data Engineers': ['data', 'sql', 'pipeline', 'etl', 'analytics', 'postgres'],
  'Innovation Fellows': ['community', 'mentor', 'ecosystem', 'program'],
  'Research Contributors': ['research', 'documents', 'findings', 'literature'],
  'Prototype Builders': ['prototype', 'mvp', 'build', 'product'],
  'Experiment Analysts': ['experiment', 'hypothesis', 'testing', 'metrics'],
  'Validation Reviewers': ['validation', 'review', 'evidence', 'scoring'],
  'Funding Analysts': ['funding', 'pitch', 'investor', 'capital', 'finance'],
};

export function validateResumeFile(file: File): string | null {
  if (!ALLOWED_RESUME_TYPES.has(file.type)) {
    return 'Resume must be PDF or Word document (.pdf, .doc, .docx).';
  }
  if (file.size > CAREER_RESUME_MAX_BYTES) {
    return 'Resume must be 5 MB or smaller.';
  }
  return null;
}

function safeResumeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

export async function uploadCareerResume(applicationId: string, file: File): Promise<string> {
  const validationError = validateResumeFile(file);
  if (validationError) throw new Error(validationError);

  const path = `${applicationId}/${Date.now()}-${safeResumeName(file.name)}`;
  const { error } = await supabase.storage.from(CAREER_RESUME_BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function removeCareerResume(path: string): Promise<void> {
  await supabase.storage.from(CAREER_RESUME_BUCKET).remove([path]);
}

export function buildMayaMatchSnapshot(skillsInput: string): MayaMatchSnapshot {
  const normalized = skillsInput
    .toLowerCase()
    .split(/[,;|/]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const matches = Object.entries(ROLE_KEYWORDS)
    .map(([role, keywords]) => {
      let hits = 0;
      for (const skill of normalized) {
        if (keywords.some((kw) => skill.includes(kw) || kw.includes(skill))) hits += 1;
      }
      const base = role === 'Developers' ? 35 : 25;
      const score = Math.min(98, base + hits * 14 + (normalized.length > 0 ? 8 : 0));
      return { role, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    skills: normalized,
    matches,
    generatedAt: new Date().toISOString(),
  };
}

async function invokeCareerEmailNotify(payload: Record<string, unknown>): Promise<void> {
  try {
    await supabase.functions.invoke('career-notify', { body: payload });
  } catch {
    // Email is optional when edge function or Resend is not configured
  }
}

export function formatCareerSubmitError(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes('career_applications') &&
    (lower.includes('does not exist') ||
      lower.includes('could not find the table') ||
      lower.includes('schema cache') ||
      lower.includes('relation') && lower.includes('not exist'))
  ) {
    return 'Database table missing. Open Supabase → SQL Editor, run scripts/create-career-applications-table.sql, then try again.';
  }

  if (lower.includes('resume_path') || lower.includes('resume_file_name')) {
    return 'Database needs an update. Run scripts/create-career-applications-table.sql in Supabase SQL Editor (it adds resume columns), then try again.';
  }

  if (lower.includes('bucket') && lower.includes('career-resumes')) {
    return 'Resume storage is not set up. Run scripts/create-career-applications-table.sql in Supabase SQL Editor, then try again.';
  }

  if (lower.includes('check constraint') && lower.includes('portfolio')) {
    return 'Please add a portfolio link (at least 2 characters) or leave the field blank.';
  }

  if (lower.includes('row-level security') || lower.includes('permission denied')) {
    if (lower.includes('storage') || lower.includes('objects') || lower.includes('bucket')) {
      return 'Resume upload was blocked. Re-run scripts/create-career-applications-table.sql in Supabase SQL Editor (storage section), then try again.';
    }
    return 'Application was blocked by database permissions. Re-run scripts/create-career-applications-table.sql in Supabase SQL Editor, then try again.';
  }

  return message;
}

export async function submitCareerApplication(
  input: CareerApplicationInput
): Promise<{ data: CareerApplicationRow | null; error: string | null }> {
  const applicationId = input.applicationId ?? crypto.randomUUID();
  let resumePath: string | null = null;
  let resumeFileName: string | null = null;

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  // Only link user_id when a live session exists — avoids RLS mismatch from stale client state
  const userId = authUser?.id ?? null;

  try {
    if (input.resumeFile) {
      resumePath = await uploadCareerResume(applicationId, input.resumeFile);
      resumeFileName = input.resumeFile.name;
    }
  } catch (uploadError) {
    const msg = uploadError instanceof Error ? uploadError.message : 'Resume upload failed';
    return {
      data: null,
      error: formatCareerSubmitError(msg),
    };
  }

  const now = new Date().toISOString();
  const payload = {
    id: applicationId,
    user_id: userId,
    full_name: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    role_interest: input.roleInterest.trim(),
    skills: input.skills.trim(),
    portfolio: input.portfolio.trim() || 'N/A',
    resume_path: resumePath,
    resume_file_name: resumeFileName,
    maya_match_snapshot: input.mayaMatchSnapshot ?? null,
    status: 'pending' as const,
    updated_at: now,
  };

  // No .select() — anon applicants have no SELECT policy; returning the row would fail RLS
  const { error } = await supabase.from('career_applications').insert(payload);

  if (error) {
    if (resumePath) await removeCareerResume(resumePath);
    return { data: null, error: formatCareerSubmitError(error.message) };
  }

  const row: CareerApplicationRow = {
    ...payload,
    reviewer_notes: null,
    created_at: now,
  };

  void invokeCareerEmailNotify({
    type: 'new_application',
    applicantEmail: row.email,
    applicantName: row.full_name,
    roleInterest: row.role_interest,
    applicationId: row.id,
  });

  return { data: row, error: null };
}

export async function listCareerApplications(options?: {
  status?: CareerApplicationStatus | 'all';
  page?: number;
  pageSize?: number;
}): Promise<{ data: CareerApplicationRow[]; total: number; error: string | null }> {
  const page = options?.page ?? 0;
  const pageSize = options?.pageSize ?? 25;
  const from = page * pageSize;

  let query = supabase
    .from('career_applications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  const { data, count, error } = await query;

  if (error) return { data: [], total: 0, error: error.message };
  return { data: (data ?? []) as CareerApplicationRow[], total: count ?? 0, error: null };
}

export async function getCareerApplication(
  id: string
): Promise<{ data: CareerApplicationRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('career_applications')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: data as CareerApplicationRow | null, error: null };
}

export async function updateCareerApplicationReview(
  id: string,
  updates: {
    status: CareerApplicationStatus;
    reviewerNotes?: string;
  }
): Promise<{ data: CareerApplicationRow | null; error: string | null }> {
  const { data: existing, error: fetchError } = await getCareerApplication(id);
  if (fetchError || !existing) {
    return { data: null, error: fetchError ?? 'Application not found' };
  }

  const { data, error } = await supabase
    .from('career_applications')
    .update({
      status: updates.status,
      reviewer_notes: updates.reviewerNotes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  const row = data as CareerApplicationRow;

  if (existing.user_id) {
    await supabase.from('notifications').insert({
      user_id: existing.user_id,
      title: 'Career application update',
      body: `Your application for ${existing.role_interest} is now ${updates.status}.`,
      type: 'career_application',
      link: '/careers',
    });
  }

  void invokeCareerEmailNotify({
    type: 'status_update',
    applicantEmail: existing.email,
    applicantName: existing.full_name,
    roleInterest: existing.role_interest,
    status: updates.status,
    applicationId: id,
  });

  return { data: row, error: null };
}

export async function getCareerResumeSignedUrl(
  resumePath: string
): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabase.storage
    .from(CAREER_RESUME_BUCKET)
    .createSignedUrl(resumePath, 120);

  if (error) return { url: null, error: error.message };
  return { url: data.signedUrl, error: null };
}
