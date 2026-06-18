import { useParams } from 'react-router-dom';
import { InnovationEntityEditPage } from '../../innovation-editor/pages/InnovationEntityEditPage';

export default function ResearchEditPage() {
  const { projectId } = useParams();
  return (
    <InnovationEntityEditPage
      entityType="research"
      entityIdParam={projectId}
      projectId={projectId ?? null}
      title="Edit research"
      backTo={`/research/${projectId}`}
      backLabel="Research"
    />
  );
}
