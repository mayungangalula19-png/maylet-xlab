import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = 'src/app/routes';

function walk(dir, prefix = '') {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...walk(path.join(dir, entry.name), rel));
    else if (entry.name.endsWith('.tsx')) files.push(rel.replace(/\\/g, '/'));
  }
  return files;
}

const lifecycleProtected = new Set([
  'Dashboard.tsx',
  'Projects.tsx',
  'ProjectDetail.tsx',
  'CreateProject.tsx',
  'EditProject.tsx',
  'SaveIdea.tsx',
  'ResearchCenter.tsx',
  'ResearchWorkspace.tsx',
  'LiteratureReview.tsx',
  'ResearchDocuments.tsx',
  'ResearchPlaybook.tsx',
  'Prototypes.tsx',
  'NewPrototype.tsx',
  'PrototypeWorkspace.tsx',
  'PrototypeBuilder.tsx',
  'PrototypeTesting.tsx',
  'PrototypePreview.tsx',
  'UploadPrototype.tsx',
  'Experiments.tsx',
  'CreateExperiment.tsx',
  'ExperimentDetail.tsx',
  'Validation.tsx',
  'CreateValidation.tsx',
  'ValidationDetail.tsx',
  'FundingHub.tsx',
  'CreatePitch.tsx',
  'FundingDetail.tsx',
  'investor/InvestorConnect.tsx',
  'Commercialization.tsx',
  'Marketplace.tsx',
  'marketplace/MarketplaceListing.tsx',
  'Market.tsx',
  'Documents.tsx',
  'Community.tsx',
  'ecosystem/Community.tsx',
  'Feedback.tsx',
  'Ecosystem.tsx',
  'ecosystem/Incubator.tsx',
  'ecosystem/Academy.tsx',
  'Mentorship.tsx',
  'LearningHub.tsx',
  'Hackathons.tsx',
  'Support.tsx',
  'Teams.tsx',
  'CreateTeam.tsx',
  'TeamWorkspace.tsx',
  'Enterprise.tsx',
  'enterprise/EnterpriseVault.tsx',
  'InnovationVault.tsx',
  'VaultDetail.tsx',
  'VaultEntry.tsx',
  'MayaAssistantPage.tsx',
  'Analytics.tsx',
  'AIAnalyze.tsx',
  'AIDashboard.tsx',
  'predictive/InnovationTwin.tsx',
  'dna/InnovationDNA.tsx',
  'co-founder/CoFounderWizard.tsx',
  'patent/PatentAssistant.tsx',
]);

const sidebarRoutes = new Set([
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

const routeByFile = {
  'LandingPage.tsx': '/',
  'landing/LandingPage.tsx': '/',
  Login: '/login',
  Register: '/register',
  ForgotPassword: '/forgot-password',
  ResetPassword: '/reset-password',
  VerifyEmail: '/verify-email',
  Features: '/features',
  FeatureDetail: '/features/:featureId',
  Pricing: '/pricing',
  Ecosystem: '/ecosystem',
  Resources: '/resources',
  About: '/about',
  Blog: '/blog',
  BlogPost: '/blog/:slug',
  FAQ: '/faq',
  Contact: '/contact',
  Privacy: '/privacy',
  Terms: '/terms',
  NotFound: '*',
  Demo: '/demo',
  Careers: '/careers',
  Press: '/press',
  Cookies: '/cookies',
  SystemStatus: '/status',
  Community: '/community',
  SecurityOverview: '/security',
  Help: '/help',
  'ecosystem/Incubator': '/ecosystem/incubator',
  'ecosystem/Academy': '/ecosystem/academy',
  'ecosystem/Community': '/ecosystem/community',
  'resources/Guide': '/resources/guide',
  'resources/Videos': '/resources/videos',
  'resources/CaseStudies': '/resources/case-studies',
  'resources/Prompts': '/resources/prompts',
  'resources/Webinars': '/resources/webinars',
  'resources/Newsletter': '/resources/newsletter',
  Dashboard: '/dashboard',
  Projects: '/projects',
  CreateProject: '/projects/create',
  ProjectDetail: '/projects/:id',
  EditProject: '/projects/:id/edit',
  Experiments: '/experiments',
  CreateExperiment: '/experiments/create',
  ExperimentDetail: '/experiments/:id',
  Prototypes: '/prototypes',
  NewPrototype: '/prototypes/new',
  PrototypeTesting: '/prototypes/:id/test',
  PrototypeWorkspace: '/prototypes/:id',
  PrototypeBuilder: '/prototypes/:id/build',
  PrototypePreview: '/prototypes/:id/preview',
  Teams: '/teams',
  CreateTeam: '/teams/create',
  TeamWorkspace: '/teams/:id',
  FundingHub: '/funding',
  CreatePitch: '/funding/create',
  FundingDetail: '/funding/:id',
  Validation: '/validation',
  CreateValidation: '/validation/new',
  ValidationDetail: '/validation/:id',
  Commercialization: '/commercialization',
  InnovationVault: '/vault',
  VaultDetail: '/vault/:id',
  VaultEntry: '/vault/entry/:id',
  Mentorship: '/mentorship',
  LearningHub: '/learning',
  Hackathons: '/hackathons',
  Market: '/market',
  Marketplace: '/marketplace',
  Enterprise: '/enterprise',
  Analytics: '/analytics',
  AIAnalyze: '/ai-analyze',
  Notifications: '/notifications',
  Messages: '/messages',
  Profile: '/profile',
  ResearchCenter: '/research',
  ResearchWorkspace: '/research/:projectId',
  LiteratureReview: '/research/:projectId/literature',
  ResearchDocuments: '/research/:projectId/documents',
  ResearchPlaybook: '/research/:projectId/playbook',
  MayaAssistantPage: '/ai-assistant',
  Documents: '/documents',
  'enterprise/EnterpriseVault': '/enterprise/vault',
  'marketplace/MarketplaceListing': '/marketplace/:id',
  Feedback: '/feedback',
  'co-founder/CoFounderWizard': '/co-founder',
  'dna/InnovationDNA': '/profile/dna',
  'investor/InvestorConnect': '/investors',
  'patent/PatentAssistant': '/patent',
  'predictive/InnovationTwin': '/projects/:id/twin',
  Settings: '/settings',
  Security: '/settings/security',
  Billing: '/settings/billing',
  Support: '/support',
  SaveIdea: '/vault/save',
  UploadPrototype: '/prototypes/upload',
  AIDashboard: '/ai-dashboard',
};

function fileRoute(file) {
  const noExt = file.replace(/\.tsx$/, '');
  return routeByFile[noExt] ?? routeByFile[file] ?? null;
}

const router = fs.readFileSync('src/app/Router.tsx', 'utf8');

function inRouter(file) {
  if (file.startsWith('landing/components/') || file.startsWith('marketing/')) return false;
  if (file.startsWith('admin/')) {
    const base = path.basename(file, '.tsx');
    return router.includes(base);
  }
  const route = fileRoute(file);
  if (!route) return false;
  if (route === '*') return true;
  return router.includes(`path="${route}"`);
}

function findImports(file) {
  const base = path.basename(file);
  const noExt = file.replace(/\.tsx$/, '');
  const patterns = [file, noExt, base, base.replace(/\.tsx$/, '')];
  const hits = new Set();
  for (const pat of patterns) {
    try {
      const out = execSync(`rg -l ${JSON.stringify(pat)} src --glob "!src/app/routes/**"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      for (const line of out.trim().split('\n').filter(Boolean)) {
        if (!line.includes('audit-route-deps') && !line.includes('generate-route-inventory')) {
          hits.add(line);
        }
      }
    } catch {
      // no matches
    }
  }
  return [...hits];
}

const deleteCandidatePatterns = new Set([
  'landing/LandingPage.tsx',
  'admin/analytics/AdminReports.tsx',
  'marketing/AdvancedMarketingPage.tsx',
  'marketing/MarketingStubPage.tsx',
]);

const files = walk(ROOT).sort();
const results = [];

for (const file of files) {
  const imports = findImports(file);
  const route = fileRoute(file);
  const inNav = route ? sidebarRoutes.has(route) : false;
  const lifecycle = lifecycleProtected.has(file);
  const routerRef = inRouter(file);
  const isComponentShim = file.includes('landing/components/') || file.startsWith('marketing/');
  const isDuplicateOrComponent =
    isComponentShim || deleteCandidatePatterns.has(file);

  let bucket;
  const reasons = [];

  if (lifecycle) {
    bucket = 'KEEP';
    reasons.push('Innovation lifecycle route (user-protected from deletion)');
  } else if (imports.length > 0) {
    bucket = 'KEEP';
    reasons.push(`Imported by: ${imports.join(', ')}`);
  } else if (routerRef && !isDuplicateOrComponent) {
    bucket = 'KEEP';
    reasons.push(`Active route in Router.tsx (${route ?? 'admin'})`);
  } else if (inNav) {
    bucket = 'KEEP';
    reasons.push(`Linked from AppSidebar (${route})`);
  } else if (isDuplicateOrComponent && imports.length === 0 && !routerRef) {
    bucket = 'DELETE CANDIDATE';
    reasons.push('Zero imports; not in Router; duplicate or component-only shim');
  } else if (!routerRef && imports.length === 0 && !lifecycle) {
    bucket = 'ARCHIVE';
    reasons.push('Legacy shim with zero imports; canonical module still active in Router');
  } else {
    bucket = 'KEEP';
    reasons.push('Default keep');
  }

  results.push({
    file,
    bucket,
    route: route ?? '(none)',
    inRouter: routerRef,
    inNav,
    lifecycle,
    imports,
    reasons: reasons.join('; '),
  });
}

const summary = {
  total: results.length,
  KEEP: results.filter((r) => r.bucket === 'KEEP').length,
  ARCHIVE: results.filter((r) => r.bucket === 'ARCHIVE').length,
  DELETE_CANDIDATE: results.filter((r) => r.bucket === 'DELETE CANDIDATE').length,
};

fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/route-dependency-audit.json', JSON.stringify({ summary, results }, null, 2));

console.log(JSON.stringify(summary, null, 2));
console.log('\nDELETE CANDIDATES:');
for (const r of results.filter((x) => x.bucket === 'DELETE CANDIDATE')) {
  console.log(`- ${r.file} | deps: ${r.imports.length}`);
}
