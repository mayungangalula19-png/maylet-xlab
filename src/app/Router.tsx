// C:\Users\user\maylet-xlab\src\app\Router.tsx
// FULL ROUTER CONFIGURATION - WITH COMPLETE ADMIN ROUTES INCLUDED

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
import Experiments from './routes/Experiments';
import Prototypes from './routes/Prototypes';
import Teams from './routes/Teams';
import FundingHub from './routes/FundingHub';
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
import { Profile } from './routes/Profile';
import Security from './routes/Security';
import Billing from './routes/Billing';
import Support from './routes/Support';
import VerifyEmail from './routes/VerifyEmail';
import ForgotPassword from './routes/ForgotPassword';
import ResetPassword from './routes/ResetPassword';

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
          <Route path="/projects/:id" element={<ProjectDetail />} />
          
          {/* Experiments */}
          <Route path="/experiments" element={<Experiments />} />
          
          {/* Prototypes */}
          <Route path="/prototypes" element={<Prototypes />} />
          
          {/* Teams */}
          <Route path="/teams" element={<Teams />} />
          
          {/* Funding Hub */}
          <Route path="/funding" element={<FundingHub />} />
          
          {/* Innovation Vault */}
          <Route path="/vault" element={<InnovationVault />} />
          <Route path="/vault/save" element={<SaveIdea />} />
          
          {/* Mentorship */}
          <Route path="/mentorship" element={<Mentorship />} />
          
          {/* Market */}
          <Route path="/market" element={<Market />} />
          
          {/* Analytics */}
          <Route path="/analytics" element={<Analytics />} />
          
          {/* Settings & Account */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings/security" element={<Security />} />
          <Route path="/settings/billing" element={<Billing />} />
          
          {/* Support */}
          <Route path="/support" element={<Support />} />
        </Route>
      </Route>

      {/* ========== ADMIN ROUTES – require admin role ========== */}
      <Route element={<AdminRoute />}>
        {/* Main Admin Dashboard */}
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* User Management */}
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/innovators" element={<AdminInnovators />} />
        <Route path="/admin/mentors" element={<AdminMentors />} />
        <Route path="/admin/investors" element={<AdminInvestors />} />
        
        {/* Project Management */}
        <Route path="/admin/projects" element={<AdminProjects />} />
        <Route path="/admin/projects/:id" element={<AdminProjectDetail />} />
        
        {/* Innovation Management */}
        <Route path="/admin/experiments" element={<AdminExperiments />} />
        <Route path="/admin/prototypes" element={<AdminPrototypes />} />
        <Route path="/admin/vault" element={<AdminVault />} />
        
        {/* Financial Management */}
        <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        
        {/* Analytics & Reports */}
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        
        {/* AI Monitor */}
        <Route path="/admin/ai-monitor" element={<AdminAIMonitor />} />
        
        {/* Moderation */}
        <Route path="/admin/moderation" element={<AdminModeration />} />
        
        {/* System Management */}
        <Route path="/admin/system-monitor" element={<AdminSystemMonitor />} />
        <Route path="/admin/logs" element={<AdminLogs />} />
        <Route path="/admin/backup" element={<AdminBackup />} />
        <Route path="/admin/security" element={<AdminSecurity />} />
        
        {/* Notifications */}
        <Route path="/admin/notifications" element={<AdminNotifications />} />
        
        {/* Settings */}
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/roles" element={<AdminRoles />} />
        <Route path="/admin/api-keys" element={<AdminAPIKeys />} />
      </Route>

      {/* ========== 404 – catch any unmatched route ========== */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};