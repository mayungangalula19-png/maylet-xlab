import { useParams } from 'react-router-dom';
import { InnovationEntityEditPage } from '../../innovation-editor/pages/InnovationEntityEditPage';

export default function TestingEditPage() {
  const { id } = useParams();
  return (
    <InnovationEntityEditPage
      entityType="testing"
      entityIdParam={id}
      title="Edit testing workspace"
      backTo={`/prototypes/${id}/testing`}
      backLabel="Testing"
    />
  );
}
