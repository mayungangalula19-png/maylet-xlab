import { useParams } from 'react-router-dom';
import { AdminPageShell } from '../../components/layout/AdminPageShell';
import { InnovationEntityEditPage } from '../../../innovation-editor/pages/InnovationEntityEditPage';

export default function AdminValidationEdit() {
  const { id } = useParams();
  return (
    <AdminPageShell>
      <InnovationEntityEditPage
        entityType="validation"
        entityIdParam={id}
        title="Edit validation"
        backTo={`/validation/${id}`}
        backLabel="Validation"
        isAdminContext
      />
    </AdminPageShell>
  );
}
