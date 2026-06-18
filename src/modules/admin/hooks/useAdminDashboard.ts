import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';
import { enrichActivitiesForAdmin } from '../../../lib/supabase/dbHelpers';
import { getAdminSession } from '../services/adminAuth.service';
import { fetchAdminDashboardStats } from '../services/adminAnalytics.service';
import type {  DashboardStats,
  RecentProject,
  RecentUser,
  SystemActivity,
} from '../types/adminDashboard.types';

const EMPTY_STATS: DashboardStats = {
  totalUsers: 0,
  totalProjects: 0,
  totalExperiments: 0,
  totalPrototypes: 0,
  totalVaultItems: 0,
  totalFundingPitches: 0,
  totalRevenue: 0,
  monthlyRevenue: 0,
  activeUsers: 0,
  newUsersThisMonth: 0,
  projectsThisMonth: 0,
  fundingPitchesThisMonth: 0,
  avgProjectProgress: 0,
  totalMentors: 0,
  totalInvestors: 0,
  totalInnovators: 0,
};

export function useAdminDashboard() {
  const navigate = useNavigate();
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminName, setAdminName] = useState('Admin');
  const [adminRole, setAdminRole] = useState('');
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [activities, setActivities] = useState<SystemActivity[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchDashboardData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setInitialLoading(true);
      }

      try {
        const session = await getAdminSession();
        if (!session) {
          navigate('/login');
          return;
        }

        setAdminName(session.fullName);
        setAdminRole(session.role);

        const statsResult = await fetchAdminDashboardStats();
        if (statsResult.data) {
          setStats(statsResult.data);
        } else if (statsResult.error) {
          console.error('Dashboard stats error:', statsResult.error.message);
        }

        const [{ data: usersData }, { data: projectsData }, { data: activitiesData }] =
          await Promise.all([
            supabase
              .from('profiles')
              .select('id, full_name, email, plan, role, created_at, last_active, status')
              .order('created_at', { ascending: false })
              .limit(10),
            supabase
              .from('projects')
              .select('id, name, description, sector, progress, status, user_id, created_at')
              .order('created_at', { ascending: false })
              .limit(10),
            supabase
              .from('activities')
              .select('id, user_id, project_id, type, title, metadata, created_at')
              .order('created_at', { ascending: false })
              .limit(15),
          ]);

        if (usersData) {
          const userIds = usersData.map((u) => u.id);
          const { data: userProjects } = await supabase
            .from('projects')
            .select('user_id')
            .in('user_id', userIds);
          const countMap = new Map<string, number>();
          (userProjects || []).forEach((p) => {
            countMap.set(p.user_id, (countMap.get(p.user_id) || 0) + 1);
          });

          setRecentUsers(
            usersData.map((user) => ({
              id: user.id,
              full_name: user.full_name || user.email?.split('@')[0] || 'Unknown',
              email: user.email || '',
              plan: user.plan || 'free',
              role: user.role || 'user',
              created_at: user.created_at,
              last_active: user.last_active,
              status: user.status || 'pending',
              projects_count: countMap.get(user.id) || 0,
            }))
          );
        }

        if (projectsData) {
          const ownerIds = [...new Set(projectsData.map((p) => p.user_id).filter(Boolean))];
          const { data: owners } = ownerIds.length
            ? await supabase.from('profiles').select('id, email, full_name').in('id', ownerIds)
            : { data: [] };
          const ownerMap = new Map((owners || []).map((o) => [o.id, o]));

          setRecentProjects(
            projectsData.map((project) => {
              const userData = ownerMap.get(project.user_id);
              return {
                id: project.id,
                name: project.name,
                description: project.description,
                sector: project.sector,
                progress: project.progress,
                status: project.status,
                user_email: userData?.email || 'Unknown',
                user_name: userData?.full_name || userData?.email?.split('@')[0] || 'Unknown',
                created_at: project.created_at,
              };
            })
          );
        }

        setActivities(
          await enrichActivitiesForAdmin((activitiesData ?? []) as Record<string, unknown>[])
        );
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    fetchDashboardData();

    let refetchTimer: ReturnType<typeof setTimeout> | undefined;
    const debouncedRefetch = () => {
      clearTimeout(refetchTimer);
      refetchTimer = setTimeout(() => fetchDashboardData(true), 800);
    };

    const channels = [
      supabase
        .channel('admin_projects')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, debouncedRefetch),
      supabase
        .channel('admin_users')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, debouncedRefetch),
      supabase
        .channel('admin_payments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, debouncedRefetch),
      supabase
        .channel('admin_activities')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, debouncedRefetch),
    ];

    channels.forEach((channel) => channel.subscribe());

    return () => {
      clearTimeout(refetchTimer);
      channels.forEach((channel) => channel.unsubscribe());
    };
  }, [fetchDashboardData]);

  return {
    initialLoading,
    refreshing,
    adminName,
    adminRole,
    stats,
    recentUsers,
    recentProjects,
    activities,
    lastUpdated,
    refresh: () => fetchDashboardData(true),
  };
}

export function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} days ago`;
  return new Date(date).toLocaleDateString();
}

const SECTOR_ICONS: Record<string, string> = {
  Agriculture: '🌾',
  Health: '🏥',
  Education: '📚',
  Blockchain: '🔗',
  Environment: '🌍',
};

export function sectorIcon(sector: string) {
  return SECTOR_ICONS[sector] ?? '💡';
}
