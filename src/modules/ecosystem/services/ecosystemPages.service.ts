import {
  ecosystemService,
  hackathonsService,
  learningHubService,
  mentorshipService,
} from '../../../core';

export {
  ecosystemService,
  learningHubService,
  hackathonsService,
  mentorshipService,
};

export type {
  EcosystemLiveMetrics,
  EcosystemContextData,
  HackathonRecord,
  HackathonRegistration,
  HackathonStatus,
  HackathonMode,
  LearningResourceRecord,
  UserLearningProgressRecord,
  ResourceType,
  SkillLevel,
  MentorRecord,
  MentorshipRequestRecord,
  MentorshipSessionRecord,
  MentorshipPageData,
} from '../../../core';

export const fetchEcosystemContext = (
  userId: string | undefined,
  defaultMetrics: () => import('../../../core').EcosystemLiveMetrics
) => ecosystemService.getContext(userId, defaultMetrics);

export const fetchHackathonsList = (statusFilter: string, modeFilter: string) =>
  hackathonsService.getHackathons(statusFilter, modeFilter);

export const fetchHackathonRegistrations = (userId: string) =>
  hackathonsService.getRegistrations(userId);

export const registerForHackathon = (hackathonId: string, userId: string) =>
  hackathonsService.joinHackathon(hackathonId, userId);

export const fetchLearningHubData = (userId: string) => learningHubService.getData(userId);

export const fetchMentorshipPageData = (userId: string) => mentorshipService.getPageData(userId);

export const getCurrentUserId = () => ecosystemService.getCurrentUserId();
