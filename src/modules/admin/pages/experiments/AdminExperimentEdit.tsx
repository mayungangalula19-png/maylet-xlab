import { useParams } from 'react-router-dom';
import { AdminPageShell } from '../../components/layout/AdminPageShell';
import { InnovationEntityEditPage } from '../../../innovation-editor/pages/InnovationEntityEditPage';

export default function AdminExperimentEdit() {
  const { id } = useParams();
  return (
    <AdminPageShell>
      <InnovationEntityEditPage
        entityType="experiment"
        entityIdParam={id}
        title="Edit experiment"
        backTo={`/admin/experiments/${id}`}
        backLabel="Experiment"
        isAdminContext
      />
    </AdminPageShell>
  );
}
