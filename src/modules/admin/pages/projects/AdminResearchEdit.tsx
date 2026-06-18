import { useParams } from 'react-router-dom';
import { AdminPageShell } from '../../components/layout/AdminPageShell';
import { InnovationEntityEditPage } from '../../../innovation-editor/pages/InnovationEntityEditPage';

export default function AdminResearchEdit() {
  const { projectId } = useParams();
  return (
    <AdminPageShell>
      <InnovationEntityEditPage
        entityType="research"
        entityIdParam={projectId}
        projectId={projectId ?? null}
        title="Edit research profile"
        backTo={`/admin/projects/${projectId}`}
        backLabel="Project"
        isAdminContext
      />
    </AdminPageShell>
  );
}
