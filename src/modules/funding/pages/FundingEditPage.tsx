import { useParams } from 'react-router-dom';
import { InnovationEntityEditPage } from '../../innovation-editor/pages/InnovationEntityEditPage';

export default function FundingEditPage() {
  const { id } = useParams();
  return (
    <InnovationEntityEditPage
      entityType="funding"
      entityIdParam={id}
      title="Edit funding pitch"
      backTo={`/funding/${id}`}
      backLabel="Funding"
    />
  );
}
