import type { CommunityComment, CommunityPost, CommunityUser, SuggestionsPayload } from '../types/community.types';

export const SEED_USERS: CommunityUser[] = [
  { id: 'u1', name: 'Amara Okafor', role: 'researcher', expertise: 'HealthTech validation' },
  { id: 'u2', name: 'James Mwangi', role: 'developer', expertise: 'Edge AI + IoT' },
  { id: 'u3', name: 'Lina Chen', role: 'innovator', expertise: 'Climate & AgriTech' },
  { id: 'u4', name: 'Samuel Adeyemi', role: 'student', expertise: 'Robotics prototypes' },
  { id: 'u5', name: 'Priya Nair', role: 'researcher', expertise: 'Materials science' },
  { id: 'u6', name: 'Daniel Kiprop', role: 'developer', expertise: 'Distributed systems' },
];

const POST_TEMPLATES: Omit<CommunityPost, 'id' | 'author' | 'createdAt'>[] = [
  {
    type: 'research',
    title: 'Validation gate metrics for rural telehealth pilots',
    content:
      'Published interim findings from 3-site validation. Nurse adoption rises 41% when MAYA prompts are embedded in workflow notes.',
    tags: ['#HealthTech', '#Validation', '#MAYA'],
    projectId: 'proj-health-01',
    engagement: { likes: 42, comments: 9, shares: 6 },
    trendingScore: 88,
  },
  {
    type: 'project',
    title: 'Firmware v0.4 — offline inference on ESP32-S3',
    content:
      'Shipped batch inference for soil moisture models. Looking for field testers in East Africa chapters.',
    tags: ['#AgriTech', '#EdgeAI', '#OpenCall'],
    projectId: 'proj-agri-edge',
    teamId: 'team-iot-lab',
    engagement: { likes: 31, comments: 5, shares: 11 },
    trendingScore: 76,
  },
  {
    type: 'announcement',
    title: 'Ecosystem demo day — Nairobi chapter',
    content:
      'Applications open for Q3 showcase. Top teams receive mentor circles and funding workspace access.',
    tags: ['#DemoDay', '#Funding', '#Ecosystem'],
    engagement: { likes: 58, comments: 14, shares: 22 },
    trendingScore: 92,
  },
  {
    type: 'update',
    title: 'Literature review complete for swarm routing paper',
    content:
      'Uploaded 18 sources to Research workspace. Requesting collaboration on experiment design.',
    tags: ['#Research', '#Robotics', '#Collaboration'],
    projectId: 'proj-swarm-nav',
    engagement: { likes: 19, comments: 3, shares: 4 },
    trendingScore: 54,
  },
  {
    type: 'research',
    title: 'Battery degradation model for microgrid pilots',
    content:
      'Cross-validated degradation curves across 6 deployment sites. Open-sourcing dataset under ecosystem license.',
    tags: ['#Energy', '#Climate', '#OpenData'],
    projectId: 'proj-microgrid',
    engagement: { likes: 27, comments: 7, shares: 8 },
    trendingScore: 71,
  },
  {
    type: 'project',
    title: 'MAYA orchestration hooks for experiment pipelines',
    content:
      'Released SDK v1.2 with typed experiment triggers. Integrates with validation gates and document vault.',
    tags: ['#MAYA', '#SDK', '#Experiments'],
    projectId: 'proj-maya-sdk',
    teamId: 'team-platform',
    engagement: { likes: 45, comments: 11, shares: 15 },
    trendingScore: 84,
  },
  {
    type: 'announcement',
    title: 'Enterprise vault beta — multi-tenant research isolation',
    content:
      'Inviting 12 enterprise partners for controlled beta. Includes audit trails and role-based collaboration.',
    tags: ['#Enterprise', '#Security', '#Vault'],
    engagement: { likes: 36, comments: 6, shares: 9 },
    trendingScore: 67,
  },
  {
    type: 'update',
    title: 'Hackathon winners onboarded to incubator track',
    content:
      'Four teams advanced to structured validation sprints with dedicated mentor operators.',
    tags: ['#Hackathon', '#Incubator', '#Teams'],
    teamId: 'team-incubator',
    engagement: { likes: 22, comments: 4, shares: 5 },
    trendingScore: 49,
  },
];

export function seedPosts(): CommunityPost[] {
  const now = Date.now();
  return POST_TEMPLATES.map((template, index) => ({
    ...template,
    id: `p${index + 1}`,
    author: SEED_USERS[index % SEED_USERS.length],
    createdAt: new Date(now - (index + 1) * 3600000 * 4).toISOString(),
  }));
}

export function seedComments(): CommunityComment[] {
  return [
    {
      id: 'c1',
      postId: 'p1',
      author: SEED_USERS[2],
      content: 'Can you share the MAYA prompt template you used for nurse onboarding?',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'c2',
      postId: 'p2',
      author: SEED_USERS[3],
      content: 'Interested in field testing — we have a campus plot in Dar es Salaam.',
      createdAt: new Date(Date.now() - 5400000).toISOString(),
    },
    {
      id: 'c3',
      postId: 'p6',
      author: SEED_USERS[5],
      content: 'Does the SDK support custom validation webhooks yet?',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];
}

export function seedSuggestions(): SuggestionsPayload {
  return {
    users: SEED_USERS.slice(0, 4).map((u, i) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      expertise: u.expertise,
      mutualProjects: 3 - i,
    })),
    projects: [
      { id: 'proj-health-01', name: 'Telehealth Validation Kit', sector: 'Health', contributors: 8 },
      { id: 'proj-agri-edge', name: 'Agri Edge Sensing', sector: 'AgriTech', contributors: 5 },
      { id: 'proj-swarm-nav', name: 'Swarm Routing Lab', sector: 'Robotics', contributors: 4 },
      { id: 'proj-maya-sdk', name: 'MAYA Orchestration SDK', sector: 'Platform', contributors: 12 },
    ],
  };
}
