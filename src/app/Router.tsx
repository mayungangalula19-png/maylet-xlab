// src/app/Router.tsx
// FULL ROUTER CONFIGURATION
// - Route-level code splitting: every page is lazy-loaded (React.lazy + Suspense)
// - Single-sidebar layout system: the ONLY sidebars in the app live in
//   DashboardLayout (AppSidebar) and AdminLayout (AdminSidebar).
//   Pages never render their own sidebar.

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { ProtectedRoute } from '../modules/shared/components/common/ProtectedRoute';
import { PageLoader } from '../modules/shared/components/common/PageLoader';

const DashboardLayout = lazy(() =>
  import('../modules/shared/layouts/DashboardLayout').then((m) => ({ default: m.DashboardLayout }))
);
const AdminLayout = lazy(() =>
  import('../modules/shared/layouts/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);

// ============================================================
// PUBLIC PAGES (lazy) — canonical implementations in modules/
// ============================================================
const LandingPage = lazy(() => import('../modules/marketing/pages/landing/LandingPage'));
const Login = lazy(() => import('../modules/auth/pages/Login'));
const Register = lazy(() => import('../modules/auth/pages/Register'));
const ForgotPassword = lazy(() => import('../modules/auth/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('../modules/auth/pages/ResetPassword'));
const VerifyEmail = lazy(() => import('../modules/auth/pages/VerifyEmail'));
const AuthCallback = lazy(() => import('../modules/auth/pages/AuthCallback'));


const Features = lazy(() =>
  import('../modules/marketing/pages/Features').then((m) => ({ default: m.Features }))
);
const FeatureDetail = lazy(() => import('../modules/marketing/pages/FeatureDetail'));
const Pricing = lazy(() => import('../modules/marketing/pages/Pricing'));
const Ecosystem = lazy(() => import('../modules/ecosystem/pages/EcosystemPage'));
const Resources = lazy(() => import('../modules/marketing/pages/Resources'));
const About = lazy(() => import('../modules/marketing/pages/About'));
const Blog = lazy(() => import('../modules/marketing/pages/Blog'));
const BlogPost = lazy(() => import('../modules/marketing/pages/BlogPost'));
const FAQ = lazy(() => import('../modules/marketing/pages/FAQ'));
const Contact = lazy(() => import('../modules/marketing/pages/Contact'));
const Privacy = lazy(() => import('../modules/marketing/pages/Privacy'));
const Terms = lazy(() => import('../modules/marketing/pages/Terms'));
const NotFound = lazy(() => import('../modules/marketing/pages/NotFound'));
const Demo = lazy(() => import('../modules/marketing/pages/Demo'));
const Careers = lazy(() => import('../modules/careers/pages/CareersPage'));
const Press = lazy(() => import('../modules/marketing/pages/Press'));
const Cookies = lazy(() => import('../modules/marketing/pages/Cookies'));
const SystemStatus = lazy(() => import('../modules/marketing/pages/SystemStatus'));
const Community = lazy(() => import('../modules/marketing/pages/Community'));
const SecurityOverview = lazy(() => import('../modules/marketing/pages/SecurityOverview'));
const Help = lazy(() => import('../modules/marketing/pages/Help'));
const EcosystemIncubator = lazy(() => import('../modules/ecosystem/pages/IncubatorPage'));
const EcosystemAcademy = lazy(() => import('../modules/ecosystem/pages/AcademyPage'));
const EcosystemCommunity = lazy(() => import('../modules/ecosystem/pages/EcosystemCommunityPage'));
const ResourceGuide = lazy(() => import('../modules/marketing/pages/resources/Guide'));
const ResourceVideos = lazy(() => import('../modules/marketing/pages/resources/Videos'));
const ResourceCaseStudies = lazy(() => import('../modules/marketing/pages/resources/CaseStudies'));
const ResourcePrompts = lazy(() => import('../modules/marketing/pages/resources/Prompts'));
const ResourceWebinars = lazy(() => import('../modules/marketing/pages/resources/Webinars'));
const ResourceNewsletter = lazy(() => import('../modules/marketing/pages/resources/Newsletter'));

// ============================================================
// PROTECTED PAGES (rendered inside DashboardLayout)
// ============================================================
const Dashboard = lazy(() => import('../modules/dashboard/pages/DashboardPage'));
const Projects = lazy(() => import('../modules/projects/pages/ProjectsPage'));
const ProjectDetail = lazy(() => import('../modules/projects/pages/ProjectDetailPage'));
const CreateProject = lazy(() => import('../modules/projects/pages/CreateProjectPage'));
const EditProject = lazy(() => import('../modules/projects/pages/EditProjectPage'));
const Experiments = lazy(() => import('../modules/experiment/pages/ExperimentsPage'));
const ExperimentDetail = lazy(() => import('../modules/experiment/pages/ExperimentDetailPage'));
const CreateExperiment = lazy(() => import('../modules/experiment/pages/CreateExperimentPage'));
const ExperimentEdit = lazy(() => import('../modules/experiment/pages/ExperimentEditPage'));
const PrototypeEdit = lazy(() => import('../modules/prototype/pages/PrototypeEditPage'));
const TestingEdit = lazy(() => import('../modules/prototype/pages/TestingEditPage'));
const ResearchEdit = lazy(() => import('../modules/research/pages/ResearchEditPage'));
const ValidationEdit = lazy(() => import('../modules/validation/pages/ValidationEditPage'));
const FundingEdit = lazy(() => import('../modules/funding/pages/FundingEditPage'));
const CommercializationEdit = lazy(() => import('../modules/commercialization/pages/CommercializationEditPage'));
const Prototypes = lazy(() => import('../modules/prototype/pages/PrototypesDashboard'));
const NewPrototype = lazy(() => import('../modules/prototype/pages/NewPrototype'));
const PrototypeWorkspace = lazy(() => import('../modules/prototype/pages/PrototypeWorkspace'));
const PrototypeBuilder = lazy(() => import('../modules/prototype/pages/PrototypeBuilder'));
const PrototypeTesting = lazy(() => import('../modules/prototype/pages/PrototypeTesting'));
const PrototypePreview = lazy(() => import('../modules/prototype/pages/PrototypePreviewPage'));
const Teams = lazy(() => import('../modules/teams/pages/Teams'));
const CreateTeam = lazy(() => import('../modules/teams/pages/CreateTeam'));
const TeamWorkspace = lazy(() => import('../modules/teams/pages/TeamWorkspace'));
const FundingHub = lazy(() => import('../modules/funding/pages/FundingHubPage'));
const CreatePitch = lazy(() => import('../modules/funding/pages/CreatePitchPage'));
const FundingDetail = lazy(() => import('../modules/funding/pages/FundingDetailPage'));
const InnovationVault = lazy(() => import('../modules/vault/pages/InnovationVault'));
const VaultDetail = lazy(() => import('../modules/vault/pages/VaultDetail'));
const VaultEntry = lazy(() => import('../modules/vault/pages/VaultEntry'));
const Mentorship = lazy(() => import('../modules/ecosystem/pages/Mentorship'));
const LearningHub = lazy(() => import('../modules/ecosystem/pages/LearningHub'));
const Hackathons = lazy(() => import('../modules/ecosystem/pages/Hackathons'));
const Market = lazy(() => import('../modules/marketplace/pages/Market'));
const Marketplace = lazy(() => import('../modules/marketplace/pages/Marketplace'));
const Enterprise = lazy(() => import('../modules/enterprise/pages/EnterprisePage'));
const Analytics = lazy(() => import('../modules/dashboard/pages/AnalyticsPage'));
const AIAnalyze = lazy(() => import('../modules/dashboard/pages/AIAnalyzePage'));
const Notifications = lazy(() => import('../modules/account/pages/Notifications'));
const Messages = lazy(() => import('../modules/account/pages/Messages'));
const Profile = lazy(() => import('../modules/account/pages/Profile'));
const MayaAssistantPage = lazy(() => import('../modules/maya/pages/MayaAssistantPage'));

const ResearchCenter = lazy(() => import('../modules/research/pages/ResearchDashboard'));
const ResearchWorkspace = lazy(() => import('../modules/research/pages/ResearchWorkspace'));
const LiteratureReview = lazy(() => import('../modules/research/pages/LiteratureReview'));
const ResearchDocuments = lazy(() => import('../modules/research/pages/ResearchDocuments'));
const ResearchPlaybook = lazy(() => import('../modules/research/pages/ResearchPlaybook'));
const Documents = lazy(() => import('../modules/documents/pages/DocumentsPage'));
const EnterpriseVault = lazy(() => import('../modules/enterprise/pages/EnterpriseVaultPage'));
const MarketplaceListing = lazy(() => import('../modules/marketplace/pages/marketplace/MarketplaceListing'));
const Feedback = lazy(() => import('../modules/feedback/pages/FeedbackPage'));
const CoFounderWizard = lazy(() => import('../modules/tools/pages/co-founder/CoFounderWizard'));
const InnovationDNA = lazy(() => import('../modules/tools/pages/dna/InnovationDNA'));
const InvestorConnect = lazy(() => import('../modules/tools/pages/investor/InvestorConnect'));
const PatentAssistant = lazy(() => import('../modules/tools/pages/patent/PatentAssistant'));
const InnovationTwin = lazy(() => import('../modules/tools/pages/predictive/InnovationTwin'));
const Settings = lazy(() => import('../modules/account/pages/Settings'));
const Security = lazy(() => import('../modules/account/pages/Security'));
const Billing = lazy(() => import('../modules/billing/pages/BillingDashboard'));
const Support = lazy(() => import('../modules/ecosystem/pages/Support'));
const SaveIdea = lazy(() => import('../modules/projects/pages/SaveIdea'));
const UploadPrototype = lazy(() => import('../modules/prototype/pages/UploadPrototypePage'));
const AIDashboard = lazy(() => import('../modules/dashboard/pages/AIDashboardPage'));
const Validation = lazy(() => import('../modules/validation/pages/ValidationPage'));
const CreateValidation = lazy(() => import('../modules/validation/pages/CreateValidation'));
const ValidationDetail = lazy(() => import('../modules/validation/pages/ValidationDetail'));
const Commercialization = lazy(() => import('../modules/commercialization/pages/CommercializationPage'));

// ============================================================
// ADMIN PAGES (rendered inside AdminLayout)
// ============================================================
const AdminDashboard = lazy(() => import('../modules/admin/pages/AdminDashboard'));
const AdminProjects = lazy(() => import('../modules/admin/pages/projects/AdminProjects'));
const AdminProjectDetail = lazy(() => import('../modules/admin/pages/projects/AdminProjectDetail'));
const AdminProjectReview = lazy(() => import('../modules/admin/pages/projects/AdminProjectReview'));
const AdminProjectDelete = lazy(() => import('../modules/admin/pages/projects/AdminProjectDelete'));
const AdminResearchEdit = lazy(() => import('../modules/admin/pages/projects/AdminResearchEdit'));
const AdminCommercializationEdit = lazy(() => import('../modules/admin/pages/projects/AdminCommercializationEdit'));
const AdminReports = lazy(() => import('../modules/admin/pages/reports/AdminReports'));
const AdminSettings = lazy(() => import('../modules/admin/pages/settings/AdminSettings'));
const AdminRoles = lazy(() => import('../modules/admin/pages/settings/AdminRoles'));
const AdminAPIKeys = lazy(() => import('../modules/admin/pages/settings/AdminAPIKeys'));

const AdminUsers = lazy(() => import('../modules/admin/pages/users/AdminUsers'));
const AdminUserDetail = lazy(() => import('../modules/admin/pages/users/AdminUserDetail'));
const AdminUserCreate = lazy(() => import('../modules/admin/pages/users/AdminUserCreate'));
const AdminUserEdit = lazy(() => import('../modules/admin/pages/users/AdminUserEdit'));
const AdminInnovators = lazy(() => import('../modules/admin/pages/innovators/AdminInnovators'));
const AdminInnovatorDetail = lazy(() => import('../modules/admin/pages/innovators/AdminInnovatorDetail'));
const AdminMentors = lazy(() => import('../modules/admin/pages/mentors/AdminMentors'));
const AdminMentorDetail = lazy(() => import('../modules/admin/pages/mentors/AdminMentorDetail'));
const AdminMentorAssign = lazy(() => import('../modules/admin/pages/mentors/AdminMentorAssign'));
const AdminInvestors = lazy(() => import('../modules/admin/pages/investors/AdminInvestors'));
const AdminInvestorDetail = lazy(() => import('../modules/admin/pages/investors/AdminInvestorDetail'));
const AdminInvestorVerify = lazy(() => import('../modules/admin/pages/investors/AdminInvestorVerify'));
const AdminExperiments = lazy(() => import('../modules/admin/pages/experiments/AdminExperiments'));
const AdminExperimentDetail = lazy(() => import('../modules/admin/pages/experiments/AdminExperimentDetail'));
const AdminExperimentEdit = lazy(() => import('../modules/admin/pages/experiments/AdminExperimentEdit'));
const AdminPrototypes = lazy(() => import('../modules/admin/pages/prototypes/AdminPrototypes'));
const AdminPrototypeDetail = lazy(() => import('../modules/admin/pages/prototypes/AdminPrototypeDetail'));
const AdminPrototypeEdit = lazy(() => import('../modules/admin/pages/prototypes/AdminPrototypeEdit'));
const AdminTestingEdit = lazy(() => import('../modules/admin/pages/prototypes/AdminTestingEdit'));
const AdminValidationEdit = lazy(() => import('../modules/admin/pages/validation/AdminValidationEdit'));
const AdminFunding = lazy(() => import('../modules/admin/pages/funding/AdminFunding'));
const AdminFundingEdit = lazy(() => import('../modules/admin/pages/funding/AdminFundingEdit'));
const AdminVault = lazy(() => import('../modules/admin/pages/vault/AdminVault'));
const AdminVaultDetail = lazy(() => import('../modules/admin/pages/vault/AdminVaultDetail'));
const AdminSubscriptions = lazy(() => import('../modules/admin/pages/subscriptions/AdminSubscriptions'));
const AdminSubscriptionDetail = lazy(() => import('../modules/admin/pages/subscriptions/AdminSubscriptionDetail'));
const AdminPayments = lazy(() => import('../modules/admin/pages/payments/AdminPayments'));
const AdminPaymentDetail = lazy(() => import('../modules/admin/pages/payments/AdminPaymentDetail'));
const AdminPaymentRefund = lazy(() => import('../modules/admin/pages/payments/AdminPaymentRefund'));
const AdminAnalytics = lazy(() => import('../modules/admin/pages/analytics/AdminAnalytics'));
const AdminExport = lazy(() => import('../modules/admin/pages/analytics/AdminExport'));
const AdminAIMonitor = lazy(() => import('../modules/admin/pages/ai-monitor/AdminAIMonitor'));
const AdminAIPredictions = lazy(() => import('../modules/admin/pages/ai-monitor/AdminAIPredictions'));
const AdminModeration = lazy(() => import('../modules/admin/pages/moderation/AdminModeration'));
const AdminAppeals = lazy(() => import('../modules/admin/pages/moderation/AdminAppeals'));
const AdminFlags = lazy(() => import('../modules/admin/pages/moderation/AdminFlags'));
const AdminSystemMonitor = lazy(() => import('../modules/admin/pages/system/AdminSystemMonitor'));
const AdminLogs = lazy(() => import('../modules/admin/pages/system/AdminLogs'));
const AdminBackup = lazy(() => import('../modules/admin/pages/system/AdminBackup'));
const AdminSecurity = lazy(() => import('../modules/admin/pages/system/AdminSecurity'));
const AdminNotifications = lazy(() => import('../modules/admin/pages/notifications/AdminNotifications'));
const AdminBroadcast = lazy(() => import('../modules/admin/pages/notifications/AdminBroadcast'));
const AdminCareers = lazy(() => import('../modules/admin/pages/careers/AdminCareers'));
const AdminCareerApplications = lazy(() => import('../modules/admin/pages/careers/AdminCareerApplications'));
const AdminCareerDetail = lazy(() => import('../modules/admin/pages/careers/AdminCareerDetail'));

// ============================================================
// ADMIN ROUTE GUARD COMPONENT
// ============================================================
const AdminRoute = () => {
  const { user, loading: authLoading, isAdmin, roleLoading } = useAuthContext();

  if (authLoading || (user && roleLoading)) {
    return <div className="admin-loading">Loading Admin Panel...</div>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

/** Suspense only for public lazy routes — dashboard/admin layouts have their own inner boundary. */
const PublicSuspenseLayout = () => (
  <Suspense fallback={<PageLoader />}>
    <Outlet />
  </Suspense>
);

const DashboardShell = () => (
  <Suspense fallback={<PageLoader />}>
    <DashboardLayout />
  </Suspense>
);

const AdminShell = () => (
  <Suspense fallback={<PageLoader />}>
    <AdminLayout />
  </Suspense>
);

export const Router = () => {
  return (
    <Routes>
        {/* ========== PUBLIC ROUTES – accessible without login ========== */}
        <Route element={<PublicSuspenseLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />


        {/* ========== PUBLIC MARKETING PAGES ========== */}
        <Route path="/features" element={<Features />} />
        <Route path="/features/:featureId" element={<FeatureDetail />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/ecosystem" element={<Ecosystem />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/press" element={<Press />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/status" element={<SystemStatus />} />
        <Route path="/community" element={<Community />} />
        <Route path="/security" element={<SecurityOverview />} />
        <Route path="/help" element={<Help />} />
        <Route path="/ecosystem/incubator" element={<EcosystemIncubator />} />
        <Route path="/ecosystem/academy" element={<EcosystemAcademy />} />
        <Route path="/ecosystem/community" element={<EcosystemCommunity />} />
        <Route path="/resources/guide" element={<ResourceGuide />} />
        <Route path="/resources/videos" element={<ResourceVideos />} />
        <Route path="/resources/case-studies" element={<ResourceCaseStudies />} />
        <Route path="/resources/prompts" element={<ResourcePrompts />} />
        <Route path="/resources/webinars" element={<ResourceWebinars />} />
        <Route path="/resources/newsletter" element={<ResourceNewsletter />} />
        </Route>

        {/* ========== PROTECTED ROUTES – require authentication ========== */}
        {/* All pages render inside DashboardLayout (single AppSidebar) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardShell />}>
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Projects */}
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/create" element={<CreateProject />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/:id/edit" element={<EditProject />} />

          {/* Experiments */}
          <Route path="/experiments" element={<Experiments />} />
          <Route path="/experiments/create" element={<CreateExperiment />} />
          <Route path="/experiments/:id/edit" element={<ExperimentEdit />} />
          <Route path="/experiments/:id" element={<ExperimentDetail />} />

          {/* Prototypes */}
          <Route path="/prototypes" element={<Prototypes />} />
          <Route path="/prototypes/new" element={<NewPrototype />} />
          <Route path="/prototypes/:id/edit" element={<PrototypeEdit />} />
          <Route path="/prototypes/:id/testing/edit" element={<TestingEdit />} />
          <Route path="/prototypes/:id/testing" element={<PrototypeTesting />} />
          <Route path="/prototypes/:id" element={<PrototypeWorkspace />} />
          <Route path="/prototypes/:id/workspace" element={<PrototypeWorkspace />} />
          <Route path="/prototypes/:id/build" element={<PrototypeBuilder />} />
          <Route path="/prototypes/:id/test" element={<PrototypeTesting />} />
          <Route path="/prototypes/:id/preview" element={<PrototypePreview />} />

          {/* Teams */}
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/create" element={<CreateTeam />} />
          <Route path="/teams/:id" element={<TeamWorkspace />} />

          {/* Funding Hub */}
          <Route path="/funding" element={<FundingHub />} />
          <Route path="/funding/create" element={<CreatePitch />} />
          <Route path="/funding/:id/edit" element={<FundingEdit />} />
          <Route path="/funding/:id" element={<FundingDetail />} />

          {/* Validation & Commercialization */}
          <Route path="/validation" element={<Validation />} />
          <Route path="/validation/new" element={<CreateValidation />} />
          <Route path="/validation/:id/edit" element={<ValidationEdit />} />
          <Route path="/validation/:id" element={<ValidationDetail />} />
          <Route path="/commercialization" element={<Commercialization />} />
          <Route path="/commercialization/:projectId/edit" element={<CommercializationEdit />} />

          {/* Innovation Vault */}
          <Route path="/vault" element={<InnovationVault />} />
          <Route path="/vault/:id" element={<VaultDetail />} />
          <Route path="/vault/entry/:id" element={<VaultEntry />} />

          {/* Mentorship & Learning */}
          <Route path="/mentorship" element={<Mentorship />} />
          <Route path="/learning" element={<LearningHub />} />
          <Route path="/hackathons" element={<Hackathons />} />

          {/* Market & Marketplace */}
          <Route path="/market" element={<Market />} />
          <Route path="/marketplace" element={<Marketplace />} />

          {/* Enterprise */}
          <Route path="/enterprise" element={<Enterprise />} />
          <Route path="/billing" element={<Billing />} />

          {/* Analytics & AI */}
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai-analyze" element={<AIAnalyze />} />
          <Route path="/ai-assistant/analyze" element={<AIAnalyze />} />

          {/* Comms */}
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/messages" element={<Messages />} />

          {/* Account */}
          <Route path="/profile" element={<Profile />} />

          {/* Research Center */}
          <Route path="/research" element={<ResearchCenter />} />
          <Route path="/research/:projectId/edit" element={<ResearchEdit />} />
          <Route path="/research/:projectId" element={<ResearchWorkspace />} />
          <Route path="/research/:projectId/literature" element={<LiteratureReview />} />
          <Route path="/research/:projectId/documents" element={<ResearchDocuments />} />
          <Route path="/research/:projectId/playbook" element={<ResearchPlaybook />} />

          {/* MAYA AI Assistant (InnoOS) */}
          <Route path="/ai-assistant" element={<MayaAssistantPage />} />

            <Route path="/documents" element={<Documents />} />
            <Route path="/enterprise/vault" element={<EnterpriseVault />} />
            <Route path="/marketplace/:id" element={<MarketplaceListing />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/co-founder" element={<CoFounderWizard />} />
            <Route path="/profile/dna" element={<InnovationDNA />} />
            <Route path="/investors" element={<InvestorConnect />} />
            <Route path="/patent" element={<PatentAssistant />} />
            <Route path="/projects/:id/twin" element={<InnovationTwin />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/security" element={<Security />} />
            <Route path="/settings/billing" element={<Billing />} />
            <Route path="/support" element={<Support />} />
            <Route path="/vault/save" element={<SaveIdea />} />
            <Route path="/prototypes/upload" element={<UploadPrototype />} />
            <Route path="/ai-dashboard" element={<AIDashboard />} />
          </Route>
        </Route>

        {/* ========== ADMIN ROUTES – require admin role ========== */}
        {/* All pages render inside AdminLayout (single AdminSidebar) */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminShell />}>
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Project Management */}
            <Route path="/admin/projects" element={<AdminProjects />} />
            <Route path="/admin/projects/:projectId/research/edit" element={<AdminResearchEdit />} />
            <Route path="/admin/projects/:projectId/commercialization/edit" element={<AdminCommercializationEdit />} />
            <Route path="/admin/projects/:id" element={<AdminProjectDetail />} />
            <Route path="/admin/projects/:id/review" element={<AdminProjectReview />} />
            <Route path="/admin/projects/:id/delete" element={<AdminProjectDelete />} />

            {/* Reports & Settings */}
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/roles" element={<AdminRoles />} />
            <Route path="/admin/api-keys" element={<AdminAPIKeys />} />

            {/* User Management */}
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/users/create" element={<AdminUserCreate />} />
            <Route path="/admin/users/:id" element={<AdminUserDetail />} />
            <Route path="/admin/users/:id/edit" element={<AdminUserEdit />} />
            <Route path="/admin/innovators" element={<AdminInnovators />} />
            <Route path="/admin/innovators/:id" element={<AdminInnovatorDetail />} />
            <Route path="/admin/mentors" element={<AdminMentors />} />
            <Route path="/admin/mentors/:id" element={<AdminMentorDetail />} />
            <Route path="/admin/mentors/:id/assign" element={<AdminMentorAssign />} />
            <Route path="/admin/investors" element={<AdminInvestors />} />
            <Route path="/admin/investors/:id" element={<AdminInvestorDetail />} />
            <Route path="/admin/investors/:id/verify" element={<AdminInvestorVerify />} />

            {/* Innovation Management */}
            <Route path="/admin/experiments" element={<AdminExperiments />} />
            <Route path="/admin/experiments/:id/edit" element={<AdminExperimentEdit />} />
            <Route path="/admin/experiments/:id" element={<AdminExperimentDetail />} />
            <Route path="/admin/prototypes" element={<AdminPrototypes />} />
            <Route path="/admin/prototypes/:id/testing/edit" element={<AdminTestingEdit />} />
            <Route path="/admin/prototypes/:id/edit" element={<AdminPrototypeEdit />} />
            <Route path="/admin/prototypes/:id" element={<AdminPrototypeDetail />} />
            <Route path="/admin/validation/:id/edit" element={<AdminValidationEdit />} />
            <Route path="/admin/funding" element={<AdminFunding />} />
            <Route path="/admin/funding/:id/edit" element={<AdminFundingEdit />} />
            <Route path="/admin/vault" element={<AdminVault />} />
            <Route path="/admin/vault/:id" element={<AdminVaultDetail />} />

            {/* Financial Management */}
            <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
            <Route path="/admin/subscriptions/:id" element={<AdminSubscriptionDetail />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/payments/:id" element={<AdminPaymentDetail />} />
            <Route path="/admin/payments/:id/refund" element={<AdminPaymentRefund />} />

            {/* Analytics & Reports */}
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/analytics/export" element={<AdminExport />} />

            {/* AI Monitor */}
            <Route path="/admin/ai-monitor" element={<AdminAIMonitor />} />
            <Route path="/admin/ai-monitor/predictions" element={<AdminAIPredictions />} />

            {/* Moderation */}
            <Route path="/admin/moderation" element={<AdminModeration />} />
            <Route path="/admin/moderation/appeals" element={<AdminAppeals />} />
            <Route path="/admin/moderation/flags" element={<AdminFlags />} />

            {/* System Management */}
            <Route path="/admin/system-monitor" element={<AdminSystemMonitor />} />
            <Route path="/admin/logs" element={<AdminLogs />} />
            <Route path="/admin/backup" element={<AdminBackup />} />
            <Route path="/admin/security" element={<AdminSecurity />} />

            {/* Notifications */}
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/admin/notifications/broadcast" element={<AdminBroadcast />} />

            <Route path="/admin/careers" element={<AdminCareers />} />
            <Route path="/admin/careers/applications" element={<AdminCareerApplications />} />
            <Route path="/admin/careers/applications/:id" element={<AdminCareerDetail />} />
          </Route>
        </Route>

        {/* 404 — outside public/protected groups so it never steals app routes */}
        <Route
          path="*"
          element={
            <Suspense fallback={<PageLoader />}>
              <NotFound />
            </Suspense>
          }
        />
      </Routes>
  );
};
