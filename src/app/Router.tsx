// src/app/Router.tsx
// FULL ROUTER CONFIGURATION
// - Route-level code splitting: every page is lazy-loaded (React.lazy + Suspense)
// - Single-sidebar layout system: the ONLY sidebars in the app live in
//   DashboardLayout (AppSidebar) and AdminLayout (AdminSidebar).
//   Pages never render their own sidebar.

import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase/client';
import { useAuthContext } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { PageLoader } from '../components/common/PageLoader';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AdminLayout } from './layouts/AdminLayout';

// ============================================================
// PUBLIC PAGES (lazy)
// ============================================================
const LandingPage = lazy(() => import('./routes/LandingPage'));
const Login = lazy(() => import('./routes/Login'));
const Register = lazy(() => import('./routes/Register'));
const ForgotPassword = lazy(() => import('./routes/ForgotPassword'));
const ResetPassword = lazy(() => import('./routes/ResetPassword'));
const VerifyEmail = lazy(() => import('./routes/VerifyEmail'));
const Features = lazy(() => import('./routes/Features').then((m) => ({ default: m.Features })));
const FeatureDetail = lazy(() => import('./routes/FeatureDetail'));
const Pricing = lazy(() => import('./routes/Pricing'));
const Ecosystem = lazy(() => import('./routes/Ecosystem'));
const Resources = lazy(() => import('./routes/Resources'));
const About = lazy(() => import('./routes/About'));
const Blog = lazy(() => import('./routes/Blog'));
const BlogPost = lazy(() => import('./routes/BlogPost'));
const FAQ = lazy(() => import('./routes/FAQ'));
const Contact = lazy(() => import('./routes/Contact'));
const Privacy = lazy(() => import('./routes/Privacy'));
const Terms = lazy(() => import('./routes/Terms'));
const NotFound = lazy(() => import('./routes/NotFound'));
const Demo = lazy(() => import('./routes/Demo'));
const Careers = lazy(() => import('./routes/Careers'));
const Press = lazy(() => import('./routes/Press'));
const Cookies = lazy(() => import('./routes/Cookies'));
const SystemStatus = lazy(() => import('./routes/SystemStatus'));
const Community = lazy(() => import('./routes/Community'));
const SecurityOverview = lazy(() => import('./routes/SecurityOverview'));
const Help = lazy(() => import('./routes/Help'));
const EcosystemIncubator = lazy(() => import('./routes/ecosystem/Incubator'));
const EcosystemAcademy = lazy(() => import('./routes/ecosystem/Academy'));
const EcosystemCommunity = lazy(() => import('./routes/ecosystem/Community'));
const ResourceGuide = lazy(() => import('./routes/resources/Guide'));
const ResourceVideos = lazy(() => import('./routes/resources/Videos'));
const ResourceCaseStudies = lazy(() => import('./routes/resources/CaseStudies'));
const ResourcePrompts = lazy(() => import('./routes/resources/Prompts'));
const ResourceWebinars = lazy(() => import('./routes/resources/Webinars'));
const ResourceNewsletter = lazy(() => import('./routes/resources/Newsletter'));

// ============================================================
// PROTECTED PAGES (rendered inside DashboardLayout)
// ============================================================
const Dashboard = lazy(() => import('./routes/Dashboard'));
const Projects = lazy(() => import('./routes/Projects'));
const ProjectDetail = lazy(() => import('./routes/ProjectDetail'));
const CreateProject = lazy(() => import('./routes/CreateProject'));
const EditProject = lazy(() => import('./routes/EditProject'));
const Experiments = lazy(() => import('./routes/Experiments'));
const ExperimentDetail = lazy(() => import('./routes/ExperimentDetail'));
const CreateExperiment = lazy(() => import('./routes/CreateExperiment'));
const Prototypes = lazy(() => import('./routes/Prototypes'));
const NewPrototype = lazy(() => import('./routes/NewPrototype'));
const PrototypeWorkspace = lazy(() => import('./routes/PrototypeWorkspace'));
const PrototypeBuilder = lazy(() => import('./routes/PrototypeBuilder'));
const PrototypeTesting = lazy(() => import('./routes/PrototypeTesting'));
const PrototypePreview = lazy(() => import('./routes/PrototypePreview'));
const Teams = lazy(() => import('./routes/Teams'));
const CreateTeam = lazy(() => import('./routes/CreateTeam'));
const TeamWorkspace = lazy(() => import('./routes/TeamWorkspace'));
const FundingHub = lazy(() => import('./routes/FundingHub'));
const CreatePitch = lazy(() => import('./routes/CreatePitch'));
const FundingDetail = lazy(() => import('./routes/FundingDetail'));
const InnovationVault = lazy(() => import('./routes/InnovationVault'));
const VaultDetail = lazy(() => import('./routes/VaultDetail'));
const VaultEntry = lazy(() => import('./routes/VaultEntry'));
const Mentorship = lazy(() => import('./routes/Mentorship'));
const LearningHub = lazy(() => import('./routes/LearningHub'));
const Hackathons = lazy(() => import('./routes/Hackathons'));
const Market = lazy(() => import('./routes/Market'));
const Marketplace = lazy(() => import('./routes/Marketplace'));
const Enterprise = lazy(() => import('./routes/Enterprise'));
const Analytics = lazy(() => import('./routes/Analytics'));
const AIAnalyze = lazy(() => import('./routes/AIAnalyze'));
const Notifications = lazy(() => import('./routes/Notifications'));
const Messages = lazy(() => import('./routes/Messages'));
const Profile = lazy(() => import('./routes/Profile'));
const MayaAssistantPage = lazy(() => import('./routes/MayaAssistantPage'));

const ResearchCenter = lazy(() => import('./routes/ResearchCenter'));
const ResearchWorkspace = lazy(() => import('./routes/ResearchWorkspace'));
const LiteratureReview = lazy(() => import('./routes/LiteratureReview'));
const ResearchDocuments = lazy(() => import('./routes/ResearchDocuments'));
const ResearchPlaybook = lazy(() => import('./routes/ResearchPlaybook'));
const Documents = lazy(() => import('./routes/Documents'));
const EnterpriseVault = lazy(() => import('./routes/enterprise/EnterpriseVault'));
const MarketplaceListing = lazy(() => import('./routes/marketplace/MarketplaceListing'));
const Feedback = lazy(() => import('./routes/Feedback'));
const CoFounderWizard = lazy(() => import('./routes/co-founder/CoFounderWizard'));
const InnovationDNA = lazy(() => import('./routes/dna/InnovationDNA'));
const InvestorConnect = lazy(() => import('./routes/investor/InvestorConnect'));
const PatentAssistant = lazy(() => import('./routes/patent/PatentAssistant'));
const InnovationTwin = lazy(() => import('./routes/predictive/InnovationTwin'));
const Settings = lazy(() => import('./routes/Settings'));
const Security = lazy(() => import('./routes/Security'));
const Billing = lazy(() => import('./routes/Billing'));
const Support = lazy(() => import('./routes/Support'));
const SaveIdea = lazy(() => import('./routes/SaveIdea'));
const UploadPrototype = lazy(() => import('./routes/UploadPrototype'));
const AIDashboard = lazy(() => import('./routes/AIDashboard'));
const Validation = lazy(() => import('./routes/Validation'));
const CreateValidation = lazy(() => import('./routes/CreateValidation'));
const ValidationDetail = lazy(() => import('./routes/ValidationDetail'));
const Commercialization = lazy(() => import('./routes/Commercialization'));

// ============================================================
// ADMIN PAGES (rendered inside AdminLayout)
// ============================================================
const AdminDashboard = lazy(() => import('./routes/admin/AdminDashboard'));
const AdminProjects = lazy(() => import('./routes/admin/projects/AdminProjects'));
const AdminProjectDetail = lazy(() => import('./routes/admin/projects/AdminProjectDetail'));
const AdminProjectReview = lazy(() => import('./routes/admin/projects/AdminProjectReview'));
const AdminProjectDelete = lazy(() => import('./routes/admin/projects/AdminProjectDelete'));
const AdminReports = lazy(() => import('./routes/admin/reports/AdminReports'));
const AdminSettings = lazy(() => import('./routes/admin/settings/AdminSettings'));
const AdminRoles = lazy(() => import('./routes/admin/settings/AdminRoles'));
const AdminAPIKeys = lazy(() => import('./routes/admin/settings/AdminAPIKeys'));

const AdminUsers = lazy(() => import('./routes/admin/users/AdminUsers'));
const AdminUserDetail = lazy(() => import('./routes/admin/users/AdminUserDetail'));
const AdminUserCreate = lazy(() => import('./routes/admin/users/AdminUserCreate'));
const AdminUserEdit = lazy(() => import('./routes/admin/users/AdminUserEdit'));
const AdminInnovators = lazy(() => import('./routes/admin/innovators/AdminInnovators'));
const AdminInnovatorDetail = lazy(() => import('./routes/admin/innovators/AdminInnovatorDetail'));
const AdminMentors = lazy(() => import('./routes/admin/mentors/AdminMentors'));
const AdminMentorDetail = lazy(() => import('./routes/admin/mentors/AdminMentorDetail'));
const AdminMentorAssign = lazy(() => import('./routes/admin/mentors/AdminMentorAssign'));
const AdminInvestors = lazy(() => import('./routes/admin/investors/AdminInvestors'));
const AdminInvestorDetail = lazy(() => import('./routes/admin/investors/AdminInvestorDetail'));
const AdminInvestorVerify = lazy(() => import('./routes/admin/investors/AdminInvestorVerify'));
const AdminExperiments = lazy(() => import('./routes/admin/experiments/AdminExperiments'));
const AdminExperimentDetail = lazy(() => import('./routes/admin/experiments/AdminExperimentDetail'));
const AdminPrototypes = lazy(() => import('./routes/admin/prototypes/AdminPrototypes'));
const AdminPrototypeDetail = lazy(() => import('./routes/admin/prototypes/AdminPrototypeDetail'));
const AdminVault = lazy(() => import('./routes/admin/vault/AdminVault'));
const AdminVaultDetail = lazy(() => import('./routes/admin/vault/AdminVaultDetail'));
const AdminSubscriptions = lazy(() => import('./routes/admin/subscriptions/AdminSubscriptions'));
const AdminSubscriptionDetail = lazy(() => import('./routes/admin/subscriptions/AdminSubscriptionDetail'));
const AdminPayments = lazy(() => import('./routes/admin/payments/AdminPayments'));
const AdminPaymentDetail = lazy(() => import('./routes/admin/payments/AdminPaymentDetail'));
const AdminPaymentRefund = lazy(() => import('./routes/admin/payments/AdminPaymentRefund'));
const AdminAnalytics = lazy(() => import('./routes/admin/analytics/AdminAnalytics'));
const AdminExport = lazy(() => import('./routes/admin/analytics/AdminExport'));
const AdminAIMonitor = lazy(() => import('./routes/admin/ai-monitor/AdminAIMonitor'));
const AdminAIPredictions = lazy(() => import('./routes/admin/ai-monitor/AdminAIPredictions'));
const AdminModeration = lazy(() => import('./routes/admin/moderation/AdminModeration'));
const AdminAppeals = lazy(() => import('./routes/admin/moderation/AdminAppeals'));
const AdminFlags = lazy(() => import('./routes/admin/moderation/AdminFlags'));
const AdminSystemMonitor = lazy(() => import('./routes/admin/system/AdminSystemMonitor'));
const AdminLogs = lazy(() => import('./routes/admin/system/AdminLogs'));
const AdminBackup = lazy(() => import('./routes/admin/system/AdminBackup'));
const AdminSecurity = lazy(() => import('./routes/admin/system/AdminSecurity'));
const AdminNotifications = lazy(() => import('./routes/admin/notifications/AdminNotifications'));
const AdminBroadcast = lazy(() => import('./routes/admin/notifications/AdminBroadcast'));
const AdminCareers = lazy(() => import('./routes/admin/careers/AdminCareers'));
const AdminCareerDetail = lazy(() => import('./routes/admin/careers/AdminCareerDetail'));

// ============================================================
// ADMIN ROUTE GUARD COMPONENT
// ============================================================
const AdminRoute = () => {
  // Session comes from the app-wide AuthContext (no duplicate getSession call);
  // only the role lookup hits the database, once per admin-area entry.
  const { user, loading: authLoading } = useAuthContext();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data: profile }) => {
        if (cancelled) return;
        setIsAdmin(profile?.role === 'admin' || profile?.role === 'super_admin');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  if (loading) {
    return <div className="admin-loading">Loading Admin Panel...</div>;
  }

  if (!isAdmin) {
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
          <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Projects */}
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/create" element={<CreateProject />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/:id/edit" element={<EditProject />} />

          {/* Experiments */}
          <Route path="/experiments" element={<Experiments />} />
          <Route path="/experiments/create" element={<CreateExperiment />} />
          <Route path="/experiments/:id" element={<ExperimentDetail />} />

          {/* Prototypes */}
          <Route path="/prototypes" element={<Prototypes />} />
          <Route path="/prototypes/new" element={<NewPrototype />} />
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
          <Route path="/funding/:id" element={<FundingDetail />} />

          {/* Validation & Commercialization */}
          <Route path="/validation" element={<Validation />} />
          <Route path="/validation/new" element={<CreateValidation />} />
          <Route path="/validation/:id" element={<ValidationDetail />} />
          <Route path="/commercialization" element={<Commercialization />} />

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

          {/* Analytics & AI */}
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai-analyze" element={<AIAnalyze />} />

          {/* Comms */}
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/messages" element={<Messages />} />

          {/* Account */}
          <Route path="/profile" element={<Profile />} />

          {/* Research Center */}
          <Route path="/research" element={<ResearchCenter />} />
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
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Project Management */}
            <Route path="/admin/projects" element={<AdminProjects />} />
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
            <Route path="/admin/experiments/:id" element={<AdminExperimentDetail />} />
            <Route path="/admin/prototypes" element={<AdminPrototypes />} />
            <Route path="/admin/prototypes/:id" element={<AdminPrototypeDetail />} />
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
            <Route path="/admin/careers/:id" element={<AdminCareerDetail />} />
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
