import { useParams } from 'react-router-dom';
import { InnovationEntityEditPage } from '../../innovation-editor/pages/InnovationEntityEditPage';

export default function CommercializationEditPage() {
  const { projectId } = useParams();
  return (
    <InnovationEntityEditPage
      entityType="commercialization"
      entityIdParam={projectId}
      projectId={projectId ?? null}
      title="Edit commercialization"
      backTo="/commercialization"
      backLabel="Commercialization"
    />
  );
}
