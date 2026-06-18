import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminPermissionDenied } from '../../components/AdminPermissionDenied';
import { AdminPageHeader } from '../../components/layout/AdminPageHeader';
import { AdminPageShell } from '../../components/layout/AdminPageShell';
import { AdminLoadingState } from '../../components/layout/AdminLoadingState';
import { AdminSearchInput } from '../../components/ui/AdminSearchInput';
import { AdminToolbar } from '../../components/ui/AdminToolbar';
import { adminBreadcrumbsFor } from '../../config/adminNav.config';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { ActivityFeed } from '../components/ActivityFeed';
import { MentorAnalytics } from '../components/MentorAnalytics';
import { MentorDashboard } from '../components/MentorDashboard';
import { MentorProfile } from '../components/MentorProfile';
import { PendingRequestsPanel } from '../components/PendingRequestsPanel';
import { MentorTable, type MentorRowAction } from '../components/MentorTable';
import { useMentors } from '../hooks/useMentors';
import type { Mentor, MentorAvailability, MentorStatus } from '../types/mentorOps.types';

const INDUSTRIES = ['All', 'Technology', 'HealthTech', 'FinTech', 'AgriTech', 'EdTech', 'General'];

export default function AdminMentorsPage() {
  const { can, roleLoading } = useAdminPermissions();
  const [searchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileTabHint, setProfileTabHint] = useState<'matching' | 'sessions' | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const mentorsOps = useMentors();

  useEffect(() => {
    const mentorId = searchParams.get('mentor');
    const tab = searchParams.get('tab');
    if (mentorId && !mentorsOps.loading) {
      mentorsOps.setSelectedId(mentorId);
      setDrawerOpen(true);
      if (tab === 'matching') setProfileTabHint('matching');
      if (tab === 'sessions') setProfileTabHint('sessions');
    }
  }, [searchParams, mentorsOps.loading, mentorsOps.setSelectedId]);

  const breadcrumbs = useMemo(() => adminBreadcrumbsFor('/admin/mentors'), []);

  const onlineCount = useMemo(
    () => mentorsOps.mentors.filter((m) => m.status === 'active' && m.availability === 'available').length,
    [mentorsOps.mentors]
  );

  const notify = useCallback((msg: string) => {
    setSuccess(msg);
    window.setTimeout(() => setSuccess(null), 3500);
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      mentorsOps.setSelectedId(id);
      setDrawerOpen(true);
      setProfileTabHint(null);
    },
    [mentorsOps]
  );

  const handleAction = useCallback(
    async (mentor: Mentor, action: MentorRowAction) => {
      setActionError(null);
      try {
        switch (action) {
          case 'view':
            handleSelect(mentor.id);
            break;
          case 'assign':
            handleSelect(mentor.id);
            setProfileTabHint('matching');
            break;
          case 'schedule':
            handleSelect(mentor.id);
            setProfileTabHint('sessions');
            break;
          case 'suspend':
            await mentorsOps.setStatus(mentor.id, 'suspended');
            notify(`${mentor.name} suspended.`);
            break;
          case 'activate':
            await mentorsOps.setStatus(mentor.id, 'active');
            notify(`${mentor.name} activated.`);
            break;
          default:
            break;
        }
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Action failed');
      }
    },
    [handleSelect, mentorsOps, notify]
  );

  if (roleLoading) {
    return (
      <AdminPageShell>
        <AdminLoadingState label="Checking permissions…" />
      </AdminPageShell>
    );
  }

  if (!can('manage_users')) {
    return <AdminPermissionDenied message="You need manage_users permission to access Mentor OS." />;
  }

  return (
    <AdminPageShell className="admin-mentor-ops">
      <AdminPageHeader
        title="Mentor Operations Center"
        subtitle="Mentor performance · innovator matching · sessions · engagement analytics"
        breadcrumbs={breadcrumbs}
        actions={[
          {
            label: mentorsOps.live ? '● Live' : '○ Connecting',
            onClick: () => {},
            variant: 'ghost',
            disabled: true,
          },
          {
            label: mentorsOps.refreshing ? 'Refreshing…' : 'Refresh',
            onClick: () => void mentorsOps.refresh(),
            variant: 'secondary',
            disabled: mentorsOps.refreshing,
          },
        ]}
      />

      <MentorDashboard stats={mentorsOps.stats} />

      <div className="admin-mentor-ops-filters">
        <AdminToolbar>
          <AdminSearchInput
            placeholder="Search mentors, expertise, organization…"
            value={mentorsOps.filters.search ?? ''}
            onChange={(v) => mentorsOps.setFilters((prev) => ({ ...prev, search: v }))}
          />
          <select
            value={mentorsOps.filters.industry ?? 'All'}
            onChange={(e) => mentorsOps.setFilters((prev) => ({ ...prev, industry: e.target.value }))}
          >
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
          <select
            value={mentorsOps.filters.availability ?? 'all'}
            onChange={(e) =>
              mentorsOps.setFilters((prev) => ({
                ...prev,
                availability: e.target.value as MentorAvailability | 'all',
              }))
            }
          >
            <option value="all">All availability</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="away">Away</option>
            <option value="offline">Offline</option>
          </select>
          <select
            value={mentorsOps.filters.status ?? 'all'}
            onChange={(e) =>
              mentorsOps.setFilters((prev) => ({
                ...prev,
                status: e.target.value as MentorStatus | 'all',
              }))
            }
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <select
            value={mentorsOps.filters.minRating ?? 0}
            onChange={(e) =>
              mentorsOps.setFilters((prev) => ({
                ...prev,
                minRating: Number(e.target.value),
              }))
            }
          >
            <option value={0}>Any rating</option>
            <option value={4}>4.0+</option>
            <option value={4.5}>4.5+</option>
          </select>
        </AdminToolbar>
      </div>

      {success ? <div className="admin-alert admin-alert--success">{success}</div> : null}
      {mentorsOps.error || actionError ? (
        <div className="admin-alert admin-alert--danger" role="alert">
          {mentorsOps.error || actionError}
          {mentorsOps.error?.includes('mentor_assignments') ? (
            <p className="admin-muted">Run <code>scripts/create-mentor-ops-tables.sql</code> in Supabase.</p>
          ) : null}
        </div>
      ) : null}

      {mentorsOps.loading ? (
        <AdminLoadingState label="Loading mentor operations…" />
      ) : (
        <>
          <div className="admin-mentor-ops-main-grid">
            <div className="admin-section-card admin-list-card">
              <MentorTable
                mentors={mentorsOps.mentors}
                selectedId={mentorsOps.selectedId}
                actionLoading={mentorsOps.actionLoading}
                onSelect={handleSelect}
                onAction={(m, a) => void handleAction(m, a)}
              />
            </div>
            <ActivityFeed
              events={mentorsOps.recentActivity}
              live={mentorsOps.live}
              onlineCount={onlineCount}
              onSelect={handleSelect}
            />
            <PendingRequestsPanel items={mentorsOps.pendingRequestItems} />
          </div>

          <MentorAnalytics data={mentorsOps.analytics} />
        </>
      )}

      <MentorProfile
        mentor={mentorsOps.selected}
        open={drawerOpen && Boolean(mentorsOps.selected)}
        detail={mentorsOps.detail}
        matches={mentorsOps.matches}
        saving={Boolean(mentorsOps.selectedId && mentorsOps.actionLoading === mentorsOps.selectedId)}
        onClose={() => setDrawerOpen(false)}
        onSuspend={() =>
          mentorsOps.setStatus(mentorsOps.selected!.id, 'suspended').then(() =>
            notify(`${mentorsOps.selected!.name} suspended.`)
          )
        }
        onActivate={() =>
          mentorsOps.setStatus(mentorsOps.selected!.id, 'active').then(() =>
            notify(`${mentorsOps.selected!.name} activated.`)
          )
        }
        onAssign={(innovatorId, score) =>
          mentorsOps.assignInnovator(mentorsOps.selected!.id, innovatorId, score).then(() =>
            notify('Innovator assigned to mentor.')
          )
        }
        onSchedule={(values) =>
          mentorsOps.scheduleSession(values).then(() => notify('Session scheduled.'))
        }
        onAvailabilityChange={(availability) =>
          mentorsOps.setAvailability(mentorsOps.selected!.id, availability).then(() =>
            notify('Availability updated.')
          )
        }
        initialTab={profileTabHint ?? undefined}
      />
    </AdminPageShell>
  );
}
