import { AdminEntityListPage } from '../../components/templates/AdminResourceListPage';
import { AdminPlanBadge } from '../../components/ui/AdminBadge';
import { formatAdminDate } from '../../utils/adminPage.utils';

interface SubscriptionRow {
  id: string;
  user_id?: string | null;
  plan?: string | null;
  status?: string | null;
  created_at?: string | null;
}

export default function AdminSubscriptions() {
  return (
    <AdminEntityListPage<SubscriptionRow>
      title="Subscriptions"
      listRoute="/admin/subscriptions"
      table="subscriptions"
      select="id, user_id, plan, status, created_at"
      detailRoute={(id) => `/admin/subscriptions/${id}`}
      columns={[
        { header: 'Plan', render: (row) => <AdminPlanBadge plan={row.plan} /> },
        { header: 'Status', render: (row) => row.status || '—' },
        { header: 'Created', render: (row) => formatAdminDate(row.created_at) },
      ]}
    />
  );
}
