import { useParams } from 'react-router-dom';
import { InnovationEntityEditPage } from '../../innovation-editor/pages/InnovationEntityEditPage';

export default function ValidationEditPage() {
  const { id } = useParams();
  return (
    <InnovationEntityEditPage
      entityType="validation"
      entityIdParam={id}
      title="Edit validation"
      backTo={`/validation/${id}`}
      backLabel="Validation"
    />
  );
}
