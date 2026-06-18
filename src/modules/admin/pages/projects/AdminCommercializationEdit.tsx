import { useParams } from 'react-router-dom';
import { AdminPageShell } from '../../components/layout/AdminPageShell';
import { InnovationEntityEditPage } from '../../../innovation-editor/pages/InnovationEntityEditPage';

export default function AdminCommercializationEdit() {
  const { projectId } = useParams();
  return (
    <AdminPageShell>
      <InnovationEntityEditPage
        entityType="commercialization"
        entityIdParam={projectId}
        projectId={projectId ?? null}
        title="Edit commercialization"
        backTo={`/admin/projects/${projectId}`}
        backLabel="Project"
        isAdminContext
      />
    </AdminPageShell>
  );
}
