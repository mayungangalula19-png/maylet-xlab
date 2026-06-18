import { useParams } from 'react-router-dom';
import { InnovationEntityEditPage } from '../../innovation-editor/pages/InnovationEntityEditPage';

export default function ExperimentEditPage() {
  const { id } = useParams();
  return (
    <InnovationEntityEditPage
      entityType="experiment"
      entityIdParam={id}
      title="Edit experiment"
      backTo={`/experiments/${id}`}
      backLabel="Experiment"
    />
  );
}
