// C:\Users\user\maylet-xlab\src\app\Router.tsx
// FULL ROUTER CONFIGURATION - WITH COMPLETE ADMIN ROUTES INCLUDED
// FIXED: Changed Profile import from named to default export

import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import LandingPage from './routes/LandingPage';
import Login from './routes/Login';
import Register from './routes/Register';
import { DashboardLayout } from './layouts/DashboardLayout';

import Dashboard from './routes/Dashboard';
import Projects from './routes/Projects';
import ProjectDetail from './routes/ProjectDetail';
import CreateProject from './routes/CreateProject';
import EditProject from './routes/EditProject';
import Experiments from './routes/Experiments';
import ExperimentDetail from './routes/ExperimentDetail';
import CreateExperiment from './routes/CreateExperiment';
import Prototypes from './routes/Prototypes';
import Teams from './routes/Teams';
import TeamWorkspace from './routes/TeamWorkspace';
import FundingHub from './routes/FundingHub';
import CreatePitch from './routes/CreatePitch';
import InnovationVault from './routes/InnovationVault';
import Mentorship from './routes/Mentorship';
import Market from './routes/Market';
import Analytics from './routes/Analytics';
import Settings from './routes/Settings';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import NotFound from './routes/NotFound';
import { Features } from './routes/Features';
import Pricing from './routes/Pricing';
import Ecosystem from './routes/Ecosystem';
import Resources from './routes/Resources';
import About from './routes/About';
import Blog from './routes/Blog';
import BlogPost from './routes/BlogPost';
import FAQ from './routes/FAQ';
import Contact from './routes/Contact';
import Privacy from './routes/Privacy';
import Terms from './routes/Terms';
import SaveIdea from './routes/SaveIdea';
import Profile from './routes/Profile';                    // ✅ FIXED: default import
import Security from './routes/Security';
import Billing from './routes/Billing';
import Support from './routes/Support';
import VerifyEmail from './routes/VerifyEmail';
import ForgotPassword from './routes/ForgotPassword';
import ResetPassword from './routes/ResetPassword';
import MayaAssistantPage from './routes/MayaAssistantPage';
import Documents from './routes/Documents';
import Enterprise from './routes/Enterprise';
import EnterpriseVault from './routes/enterprise/EnterpriseVault';
import Hackathons from './routes/Hackathons';
import LearningHub from './routes/LearningHub';
import Marketplace from './routes/Marketplace';
import MarketplaceListing from './routes/marketplace/MarketplaceListing';
import Feedback from './routes/Feedback';
import Help from './routes/Help';
import Notifications from './routes/Notifications';
import Messages from './routes/Messages';
import AIDashboard from './routes/AIDashboard';
import AIAnalyze from './routes/AIAnalyze';
import CreateTeam from './routes/CreateTeam';
import FundingDetail from './routes/FundingDetail';
import VaultDetail from './routes/VaultDetail';
import VaultEntry from './routes/VaultEntry';
import UploadPrototype from './routes/UploadPrototype';
import PrototypePreview from './routes/PrototypePreview';
import CoFounderWizard from './routes/co-founder/CoFounderWizard';
import InnovationDNA from './routes/dna/InnovationDNA';
import InvestorConnect from './routes/investor/InvestorConnect';
import PatentAssistant from './routes/patent/PatentAssistant';
import InnovationTwin from './routes/predictive/InnovationTwin';
import FeatureDetail from './routes/FeatureDetail';
import { AdminLayout } from './layouts/AdminLayout';

// ============================================================
// ADMIN PAGES IMPORTS (COMPLETE)
// ============================================================
import AdminDashboard from './routes/AdminDashboard';
import AdminUsers from './routes/AdminUsers';
import AdminInnovators from './routes/admin/innovators/AdminInnovators';
import AdminMentors from './routes/admin/mentors/AdminMentors';
import AdminInvestors from './routes/admin/investors/AdminInvestors';
import AdminProjects from './routes/admin/projects/AdminProjects';
import AdminProjectDetail from './routes/admin/projects/AdminProjectDetail';
import AdminExperiments from './routes/admin/experiments/AdminExperiments';
import AdminPrototypes from './routes/admin/prototypes/AdminPrototypes';
import AdminVault from './routes/admin/vault/AdminVault';
import AdminSubscriptions from './routes/admin/subscriptions/AdminSubscriptions';
import AdminPayments from './routes/admin/payments/AdminPayments';
import AdminAnalytics from './routes/admin/analytics/AdminAnalytics';
import AdminReports from './routes/admin/reports/AdminReports';
import AdminAIMonitor from './routes/admin/ai-monitor/AdminAIMonitor';
import AdminModeration from './routes/admin/moderation/AdminModeration';
import AdminSystemMonitor from './routes/admin/system/AdminSystemMonitor';
import AdminLogs from './routes/admin/system/AdminLogs';
import AdminBackup from './routes/admin/system/AdminBackup';
import AdminSecurity from './routes/admin/system/AdminSecurity';
import AdminNotifications from './routes/admin/notifications/AdminNotifications';
import AdminSettings from './routes/admin/settings/AdminSettings';
import AdminRoles from './routes/admin/settings/AdminRoles';
import AdminAPIKeys from './routes/admin/settings/AdminAPIKeys';
import AdminProjectReview from './routes/admin/projects/AdminProjectReview';
import AdminProjectDelete from './routes/admin/projects/AdminProjectDelete';
import AdminUserDetail from './routes/admin/users/AdminUserDetail';
import AdminUserCreate from './routes/admin/users/AdminUserCreate';
import AdminUserEdit from './routes/admin/users/AdminUserEdit';
import AdminExperimentDetail from './routes/admin/experiments/AdminExperimentDetail';
import AdminInnovatorDetail from './routes/admin/innovators/AdminInnovatorDetail';
import AdminInvestorDetail from './routes/admin/investors/AdminInvestorDetail';
import AdminInvestorVerify from './routes/admin/investors/AdminInvestorVerify';
import AdminMentorDetail from './routes/admin/mentors/AdminMentorDetail';
import AdminMentorAssign from './routes/admin/mentors/AdminMentorAssign';
import AdminPrototypeDetail from './routes/admin/prototypes/AdminPrototypeDetail';
import AdminVaultDetail from './routes/admin/vault/AdminVaultDetail';
import AdminPaymentDetail from './routes/admin/payments/AdminPaymentDetail';
import AdminPaymentRefund from './routes/admin/payments/AdminPaymentRefund';
import AdminSubscriptionDetail from './routes/admin/subscriptions/AdminSubscriptionDetail';
import AdminAppeals from './routes/admin/moderation/AdminAppeals';
import AdminFlags from './routes/admin/moderation/AdminFlags';
import AdminBroadcast from './routes/admin/notifications/AdminBroadcast';
import AdminAIPredictions from './routes/admin/ai-monitor/AdminAIPredictions';
import AdminExport from './routes/admin/analytics/AdminExport';

// ============================================================
// ADMIN ROUTE GUARD COMPONENT
// ============================================================
const AdminRoute = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      setIsAdmin(profile?.role === 'admin' || profile?.role === 'super_admin');
      setLoading(false);
    };

    checkAdmin();
  }, []);

  if (loading) {
    return <div className="admin-loading">Loading Admin Panel...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export const Router = () => {
  return (
    <Routes>
      {/* ========== PUBLIC ROUTES – accessible without login ========== */}
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

      {/* ========== PROTECTED ROUTES – require authentication ========== */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Main Dashboard */}
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
          <Route path="/prototypes/upload" element={<UploadPrototype />} />
          <Route path="/prototypes/:id/preview" element={<PrototypePreview />} />
          
          {/* Teams */}
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/create" element={<CreateTeam />} />
          <Route path="/teams/:id" element={<TeamWorkspace />} />
          
          {/* Documents */}
          <Route path="/documents" element={<Documents />} />
          
          {/* Funding Hub */}
          <Route path="/funding" element={<FundingHub />} />
          <Route path="/funding/create" element={<CreatePitch />} />
          <Route path="/funding/:id" element={<FundingDetail />} />
          
          {/* Innovation Vault */}
          <Route path="/vault" element={<InnovationVault />} />
          <Route path="/vault/save" element={<SaveIdea />} />
          <Route path="/vault/:id" element={<VaultDetail />} />
          <Route path="/vault/entry/:id" element={<VaultEntry />} />
          
          {/* Mentorship & Learning */}
          <Route path="/mentorship" element={<Mentorship />} />
          <Route path="/learning" element={<LearningHub />} />
          <Route path="/hackathons" element={<Hackathons />} />
          
          {/* Market & Marketplace */}
          <Route path="/market" element={<Market />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:id" element={<MarketplaceListing />} />
          
          {/* Enterprise */}
          <Route path="/enterprise" element={<Enterprise />} />
          <Route path="/enterprise/vault" element={<EnterpriseVault />} />
          
          {/* Analytics & AI */}
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai-dashboard" element={<AIDashboard />} />
          <Route path="/ai-analyze" element={<AIAnalyze />} />
          
          {/* Ecosystem features */}
          <Route path="/co-founder" element={<CoFounderWizard />} />
          <Route path="/profile/dna" element={<InnovationDNA />} />
          <Route path="/investors" element={<InvestorConnect />} />
          <Route path="/patent" element={<PatentAssistant />} />
          <Route path="/projects/:id/twin" element={<InnovationTwin />} />
          
          {/* Comms */}
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/help" element={<Help />} />
          
          {/* Settings & Account */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings/security" element={<Security />} />
          <Route path="/settings/billing" element={<Billing />} />
          
          {/* Support */}
          <Route path="/support" element={<Support />} />
          
          {/* MAYA AI Assistant (InnoOS) */}
          <Route path="/ai-assistant" element={<MayaAssistantPage />} />
        </Route>
      </Route>

      {/* ========== ADMIN ROUTES – require admin role ========== */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
        {/* Main Admin Dashboard */}
        <Route path="/admin" element={<AdminDashboard />} />
        
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
        
        {/* Project Management */}
        <Route path="/admin/projects" element={<AdminProjects />} />
        <Route path="/admin/projects/:id" element={<AdminProjectDetail />} />
        <Route path="/admin/projects/:id/review" element={<AdminProjectReview />} />
        <Route path="/admin/projects/:id/delete" element={<AdminProjectDelete />} />
        
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
        <Route path="/admin/reports" element={<AdminReports />} />
        
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
        
        {/* Settings */}
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/roles" element={<AdminRoles />} />
        <Route path="/admin/api-keys" element={<AdminAPIKeys />} />
        </Route>
      </Route>

      {/* ========== 404 – catch any unmatched route ========== */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};