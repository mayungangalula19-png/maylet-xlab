import fs from 'fs';
import path from 'path';

const rows = [];
const cat = (f) => {
  if (f.includes('admin/')) return 'Enterprise';
  if (['Login', 'Register', 'ForgotPassword', 'ResetPassword', 'VerifyEmail'].some((x) => f.includes(x))) return 'Marketing';
  if (['Privacy', 'Terms', 'Cookies'].some((x) => f.includes(x))) return 'Legal';
  if (['Dashboard', 'Analytics', 'AIAnalyze', 'AIDashboard', 'Notifications', 'Messages', 'Profile', 'Settings', 'Security', 'Billing', 'MayaAssistantPage'].some((x) => f.endsWith(`${x}.tsx`))) return 'Dashboard';
  if (['Project', 'SaveIdea', 'InnovationVault', 'Vault', 'InnovationTwin', 'InnovationDNA'].some((x) => f.includes(x))) return 'Projects';
  if (f.includes('Research')) return 'Research';
  if (f.includes('Prototype')) return 'Prototype';
  if (f.includes('Experiment')) return 'Experiment';
  if (f.includes('Validation')) return 'Validation';
  if (['Funding', 'CreatePitch', 'Investor'].some((x) => f.includes(x))) return 'Funding';
  if (['Commercialization', 'Marketplace', 'Market'].some((x) => f.includes(x))) return 'Commercialization';
  if (f.includes('Documents')) return 'Documents';
  if (['Community', 'Teams', 'Team', 'Mentorship', 'Learning', 'Hackathons', 'Support', 'CoFounder'].some((x) => f.includes(x))) return 'Ecosystem';
  if (f.includes('Enterprise')) return 'Enterprise';
  if (f.includes('Feedback')) return 'Feedback';
  if (f.includes('Patent')) return 'Documents';
  if (f.includes('marketing/') || f.includes('landing/components')) return 'Legacy';
  return 'Marketing';
};

const routeMap = {
  'About.tsx': '/about',
  'admin/AdminDashboard.tsx': '/admin',
  'admin/ai-monitor/AdminAIMonitor.tsx': '/admin/ai-monitor',
  'admin/ai-monitor/AdminAIPredictions.tsx': '/admin/ai-monitor/predictions',
  'admin/analytics/AdminAnalytics.tsx': '/admin/analytics',
  'admin/analytics/AdminExport.tsx': '/admin/analytics/export',
  'admin/analytics/AdminReports.tsx': '(no route — duplicate shim)',
  'admin/careers/AdminCareerDetail.tsx': '/admin/careers/:id',
  'admin/careers/AdminCareers.tsx': '/admin/careers',
  'admin/experiments/AdminExperimentDetail.tsx': '/admin/experiments/:id',
  'admin/experiments/AdminExperiments.tsx': '/admin/experiments',
  'admin/innovators/AdminInnovatorDetail.tsx': '/admin/innovators/:id',
  'admin/innovators/AdminInnovators.tsx': '/admin/innovators',
  'admin/investors/AdminInvestorDetail.tsx': '/admin/investors/:id',
  'admin/investors/AdminInvestors.tsx': '/admin/investors',
  'admin/investors/AdminInvestorVerify.tsx': '/admin/investors/:id/verify',
  'admin/mentors/AdminMentorAssign.tsx': '/admin/mentors/:id/assign',
  'admin/mentors/AdminMentorDetail.tsx': '/admin/mentors/:id',
  'admin/mentors/AdminMentors.tsx': '/admin/mentors',
  'admin/moderation/AdminAppeals.tsx': '/admin/moderation/appeals',
  'admin/moderation/AdminFlags.tsx': '/admin/moderation/flags',
  'admin/moderation/AdminModeration.tsx': '/admin/moderation',
  'admin/notifications/AdminBroadcast.tsx': '/admin/notifications/broadcast',
  'admin/notifications/AdminNotifications.tsx': '/admin/notifications',
  'admin/payments/AdminPaymentDetail.tsx': '/admin/payments/:id',
  'admin/payments/AdminPaymentRefund.tsx': '/admin/payments/:id/refund',
  'admin/payments/AdminPayments.tsx': '/admin/payments',
  'admin/projects/AdminProjectDelete.tsx': '/admin/projects/:id/delete',
  'admin/projects/AdminProjectDetail.tsx': '/admin/projects/:id',
  'admin/projects/AdminProjectReview.tsx': '/admin/projects/:id/review',
  'admin/projects/AdminProjects.tsx': '/admin/projects',
  'admin/prototypes/AdminPrototypeDetail.tsx': '/admin/prototypes/:id',
  'admin/prototypes/AdminPrototypes.tsx': '/admin/prototypes',
  'admin/reports/AdminReports.tsx': '/admin/reports',
  'admin/settings/AdminAPIKeys.tsx': '/admin/api-keys',
  'admin/settings/AdminRoles.tsx': '/admin/roles',
  'admin/settings/AdminSettings.tsx': '/admin/settings',
  'admin/subscriptions/AdminSubscriptionDetail.tsx': '/admin/subscriptions/:id',
  'admin/subscriptions/AdminSubscriptions.tsx': '/admin/subscriptions',
  'admin/system/AdminBackup.tsx': '/admin/backup',
  'admin/system/AdminLogs.tsx': '/admin/logs',
  'admin/system/AdminSecurity.tsx': '/admin/security',
  'admin/system/AdminSystemMonitor.tsx': '/admin/system-monitor',
  'admin/users/AdminUserCreate.tsx': '/admin/users/create',
  'admin/users/AdminUserDetail.tsx': '/admin/users/:id',
  'admin/users/AdminUserEdit.tsx': '/admin/users/:id/edit',
  'admin/users/AdminUsers.tsx': '/admin/users',
  'admin/vault/AdminVault.tsx': '/admin/vault',
  'admin/vault/AdminVaultDetail.tsx': '/admin/vault/:id',
  'AIAnalyze.tsx': '/ai-analyze',
  'AIDashboard.tsx': '/ai-dashboard',
  'Analytics.tsx': '/analytics',
  'Billing.tsx': '/settings/billing',
  'Blog.tsx': '/blog',
  'BlogPost.tsx': '/blog/:slug',
  'Careers.tsx': '/careers',
  'co-founder/CoFounderWizard.tsx': '/co-founder',
  'Commercialization.tsx': '/commercialization',
  'Community.tsx': '/community',
  'Contact.tsx': '/contact',
  'Cookies.tsx': '/cookies',
  'CreateExperiment.tsx': '/experiments/create',
  'CreatePitch.tsx': '/funding/create',
  'CreateProject.tsx': '/projects/create',
  'CreateTeam.tsx': '/teams/create',
  'CreateValidation.tsx': '/validation/new',
  'Dashboard.tsx': '/dashboard',
  'Demo.tsx': '/demo',
  'dna/InnovationDNA.tsx': '/profile/dna',
  'Documents.tsx': '/documents',
  'Ecosystem.tsx': '/ecosystem',
  'ecosystem/Academy.tsx': '/ecosystem/academy',
  'ecosystem/Community.tsx': '/ecosystem/community',
  'ecosystem/Incubator.tsx': '/ecosystem/incubator',
  'EditProject.tsx': '/projects/:id/edit',
  'Enterprise.tsx': '/enterprise',
  'enterprise/EnterpriseVault.tsx': '/enterprise/vault',
  'ExperimentDetail.tsx': '/experiments/:id',
  'Experiments.tsx': '/experiments',
  'FAQ.tsx': '/faq',
  'FeatureDetail.tsx': '/features/:featureId',
  'Features.tsx': '/features',
  'Feedback.tsx': '/feedback',
  'ForgotPassword.tsx': '/forgot-password',
  'FundingDetail.tsx': '/funding/:id',
  'FundingHub.tsx': '/funding',
  'Hackathons.tsx': '/hackathons',
  'Help.tsx': '/help',
  'InnovationVault.tsx': '/vault',
  'investor/InvestorConnect.tsx': '/investors',
  'landing/LandingPage.tsx': '/ (duplicate shim)',
  'LandingPage.tsx': '/',
  'LearningHub.tsx': '/learning',
  'LiteratureReview.tsx': '/research/:projectId/literature',
  'Login.tsx': '/login',
  'Market.tsx': '/market',
  'marketing/AdvancedMarketingPage.tsx': '(component — no route)',
  'marketing/MarketingStubPage.tsx': '(component — no route)',
  'Marketplace.tsx': '/marketplace',
  'marketplace/MarketplaceListing.tsx': '/marketplace/:id',
  'MayaAssistantPage.tsx': '/ai-assistant',
  'Mentorship.tsx': '/mentorship',
  'Messages.tsx': '/messages',
  'NewPrototype.tsx': '/prototypes/new',
  'NotFound.tsx': '*',
  'Notifications.tsx': '/notifications',
  'patent/PatentAssistant.tsx': '/patent',
  'predictive/InnovationTwin.tsx': '/projects/:id/twin',
  'Press.tsx': '/press',
  'Pricing.tsx': '/pricing',
  'Privacy.tsx': '/privacy',
  'Profile.tsx': '/profile',
  'ProjectDetail.tsx': '/projects/:id',
  'Projects.tsx': '/projects',
  'PrototypeBuilder.tsx': '/prototypes/:id/build',
  'PrototypePreview.tsx': '/prototypes/:id/preview',
  'Prototypes.tsx': '/prototypes',
  'PrototypeTesting.tsx': '/prototypes/:id/test',
  'PrototypeWorkspace.tsx': '/prototypes/:id',
  'Register.tsx': '/register',
  'ResearchCenter.tsx': '/research',
  'ResearchDocuments.tsx': '/research/:projectId/documents',
  'ResearchPlaybook.tsx': '/research/:projectId/playbook',
  'ResearchWorkspace.tsx': '/research/:projectId',
  'ResetPassword.tsx': '/reset-password',
  'Resources.tsx': '/resources',
  'resources/CaseStudies.tsx': '/resources/case-studies',
  'resources/Guide.tsx': '/resources/guide',
  'resources/Newsletter.tsx': '/resources/newsletter',
  'resources/Prompts.tsx': '/resources/prompts',
  'resources/Videos.tsx': '/resources/videos',
  'resources/Webinars.tsx': '/resources/webinars',
  'SaveIdea.tsx': '/vault/save',
  'Security.tsx': '/settings/security',
  'SecurityOverview.tsx': '/security',
  'Settings.tsx': '/settings',
  'Support.tsx': '/support',
  'SystemStatus.tsx': '/status',
  'Teams.tsx': '/teams',
  'TeamWorkspace.tsx': '/teams/:id',
  'Terms.tsx': '/terms',
  'UploadPrototype.tsx': '/prototypes/upload',
  'Validation.tsx': '/validation',
  'ValidationDetail.tsx': '/validation/:id',
  'VaultDetail.tsx': '/vault/:id',
  'VaultEntry.tsx': '/vault/entry/:id',
  'VerifyEmail.tsx': '/verify-email',
};

const landingComponents = [
  'landing/components/AnimatedCounter.tsx',
  'landing/components/LandingBlogResources.tsx',
  'landing/components/LandingEcosystem.tsx',
  'landing/components/LandingFeatures.tsx',
  'landing/components/LandingFinalCta.tsx',
  'landing/components/LandingFooter.tsx',
  'landing/components/LandingHeader.tsx',
  'landing/components/LandingHero.tsx',
  'landing/components/LandingPricing.tsx',
  'landing/components/LandingStats.tsx',
  'landing/components/LandingTestimonials.tsx',
  'landing/components/LandingWorkflow.tsx',
  'landing/components/SectionHeading.tsx',
];

const sidebar = new Set([
  '/',
  '/dashboard',
  '/projects',
  '/experiments',
  '/validation',
  '/ai-assistant',
  '/prototypes',
  '/teams',
  '/research',
  '/vault',
  '/funding',
  '/commercialization',
  '/mentorship',
  '/enterprise',
  '/hackathons',
  '/learning',
  '/analytics',
  '/marketplace',
  '/feedback',
  '/help',
  '/notifications',
  '/messages',
  '/settings',
  '/profile',
]);

const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;

for (const [file, route] of Object.entries(routeMap)) {
  const content = fs.readFileSync(path.join('src/app/routes', file), 'utf8');
  const m = content.match(/from ['"]([^'"]+)['"]/);
  const target = m ? m[1] : '';
  const inRouter = route.startsWith('(') ? 'No' : route === '*' ? 'Yes' : 'Yes';
  const baseRoute = route.replace(/ \(duplicate shim\)/, '').split(' ')[0];
  const inSidebar = sidebar.has(baseRoute) ? 'Yes' : baseRoute.includes(':') ? 'Sub-route' : 'No';
  const status = route.includes('no route') || route.includes('component')
    ? 'Component/duplicate shim'
    : route.includes('duplicate')
      ? 'Duplicate shim'
      : 'Active shim';
  const rec = status.includes('Component')
    ? 'Safe to remove when confirmed zero imports'
    : status.includes('Duplicate')
      ? 'Consolidate to one path'
      : 'Keep; edit canonical module';
  rows.push([file, route, 'See route inventory report', cat(file), status, target, inRouter, inSidebar, rec]);
}

for (const file of landingComponents) {
  const content = fs.readFileSync(path.join('src/app/routes', file), 'utf8');
  const m = content.match(/from ['"]([^'"]+)['"]/);
  rows.push([
    file,
    '(component — no route)',
    'Landing section re-export',
    'Marketing',
    'Component shim',
    m ? m[1] : '',
    'No',
    'No',
    'Safe to remove when confirmed zero imports',
  ]);
}

const header = [
  'File',
  'Route',
  'Purpose',
  'Module Category',
  'Status',
  'Canonical Module Path',
  'In Router',
  'In AppSidebar',
  'Recommendation',
];
const csv = [header.map(esc).join(',')].concat(rows.map((r) => r.map(esc).join(','))).join('\n');
fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/route-inventory.csv', csv);
console.log(`Wrote ${rows.length} rows to docs/route-inventory.csv`);
