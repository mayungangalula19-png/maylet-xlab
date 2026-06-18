import { useParams } from 'react-router-dom';
import { AdminPageShell } from '../../components/layout/AdminPageShell';
import { InnovationEntityEditPage } from '../../../innovation-editor/pages/InnovationEntityEditPage';

export default function AdminFundingEdit() {
  const { id } = useParams();
  return (
    <AdminPageShell>
      <InnovationEntityEditPage
        entityType="funding"
        entityIdParam={id}
        title="Edit funding pitch"
        backTo={`/funding/${id}`}
        backLabel="Funding pitch"
        isAdminContext
      />
    </AdminPageShell>
  );
}
