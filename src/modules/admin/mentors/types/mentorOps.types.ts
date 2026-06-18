import type { AdminServiceResult } from '../../types/projectAdmin.types';

export type MentorAvailability = 'available' | 'busy' | 'away' | 'offline';
export type MentorStatus = 'active' | 'suspended';
export type SessionStatus =
  | 'scheduled'
  | 'completed'
  | 'missed'
  | 'rescheduled'
  | 'cancelled';
export type MatchTier = 'strong' | 'medium' | 'weak';

export interface MentorOpsStats {
  totalMentors: number;
  activeMentors: number;
  totalSessions: number;
  pendingMatchRequests: number;
  averageRating: number;
  monthlyEngagementRate: number;
}

export interface Mentor {
  id: string;
  userId: string | null;
  name: string;
  photoUrl: string | null;
  email: string | null;
  phone: string | null;
  organization: string | null;
  position: string;
  expertise: string[];
  industry: string | null;
  experienceYears: number;
  country: string | null;
  availability: MentorAvailability;
  rating: number;
  status: MentorStatus;
  activeMentees: number;
  lastSessionDate: string | null;
  totalSessions: number;
  bio: string;
  createdAt: string;
}

export interface MentorAssignment {
  id: string;
  mentorId: string;
  innovatorId: string;
  innovatorName: string;
  ideaTitle: string;
  matchScore: number;
  progressStatus: string;
  assignedAt: string;
}

export interface MentorSession {
  id: string;
  mentorId: string;
  innovatorId: string;
  innovatorName: string;
  sessionDate: string;
  durationMinutes: number;
  status: SessionStatus;
  notes: string;
  outcome: string;
  rating: number | null;
}

export interface MentorFeedbackItem {
  id: string;
  mentorId: string;
  innovatorId: string | null;
  innovatorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface MentorActivityItem {
  id: string;
  mentorId: string | null;
  mentorName: string;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface MatchCandidate {
  innovatorId: string;
  innovatorName: string;
  ideaTitle: string;
  category: string;
  stage: string;
  industry: string | null;
  matchScore: number;
  tier: MatchTier;
}

export interface MentorAnalyticsData {
  sessionsPerMonth: { month: string; count: number }[];
  topMentors: { name: string; sessions: number; rating: number }[];
  expertiseCoverage: { expertise: string; count: number }[];
  utilizationRate: number;
  activityTrend: { month: string; sessions: number; assignments: number }[];
}

export interface MentorFilters {
  search?: string;
  industry?: string;
  availability?: MentorAvailability | 'all';
  status?: MentorStatus | 'all';
  minRating?: number;
}

export interface SessionFormValues {
  mentorId: string;
  innovatorId: string;
  sessionDate: string;
  durationMinutes: number;
  notes: string;
  status: SessionStatus;
}

export function matchTier(score: number): MatchTier {
  if (score >= 75) return 'strong';
  if (score >= 50) return 'medium';
  return 'weak';
}

export function matchTierLabel(tier: MatchTier): string {
  switch (tier) {
    case 'strong':
      return 'Strong Match';
    case 'medium':
      return 'Medium Match';
    default:
      return 'Weak Match';
  }
}

export function sessionStatusLabel(status: SessionStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export type { AdminServiceResult };
