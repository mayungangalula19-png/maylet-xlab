import { AdminSectionPage } from '../../components/layout/AdminSectionPage';

export default function AdminModeration() {
  return (
    <AdminSectionPage
      title="Content Moderation"
      route="/admin/moderation"
      description="Review flagged content, appeals, and policy actions."
      links={[
        { label: 'Appeals', to: '/admin/moderation/appeals', icon: '⚖️' },
        { label: 'Flags', to: '/admin/moderation/flags', icon: '🚩' },
      ]}
    />
  );
}
