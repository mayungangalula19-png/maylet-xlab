import { useParams } from 'react-router-dom';
import { InnovationEntityEditPage } from '../../innovation-editor/pages/InnovationEntityEditPage';

export default function PrototypeEditPage() {
  const { id } = useParams();
  return (
    <InnovationEntityEditPage
      entityType="prototype"
      entityIdParam={id}
      title="Edit prototype"
      backTo={`/prototypes/${id}`}
      backLabel="Prototype"
    />
  );
}
