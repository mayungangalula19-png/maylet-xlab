import { useParams } from 'react-router-dom';
import { AdminPageShell } from '../../components/layout/AdminPageShell';
import { InnovationEntityEditPage } from '../../../innovation-editor/pages/InnovationEntityEditPage';

export default function AdminTestingEdit() {
  const { id } = useParams();
  return (
    <AdminPageShell>
      <InnovationEntityEditPage
        entityType="testing"
        entityIdParam={id}
        title="Edit testing workspace"
        backTo={`/admin/prototypes/${id}`}
        backLabel="Prototype"
        isAdminContext
      />
    </AdminPageShell>
  );
}
