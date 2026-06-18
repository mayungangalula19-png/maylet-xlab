import { useParams } from 'react-router-dom';
import { AdminPageShell } from '../../components/layout/AdminPageShell';
import { InnovationEntityEditPage } from '../../../innovation-editor/pages/InnovationEntityEditPage';

export default function AdminPrototypeEdit() {
  const { id } = useParams();
  return (
    <AdminPageShell>
      <InnovationEntityEditPage
        entityType="prototype"
        entityIdParam={id}
        title="Edit prototype"
        backTo={`/admin/prototypes/${id}`}
        backLabel="Prototype"
        isAdminContext
      />
    </AdminPageShell>
  );
}
