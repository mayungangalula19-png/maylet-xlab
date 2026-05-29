import { useParams } from 'react-router-dom';

const VaultDetail = () => {
  const { id } = useParams();
  
  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Vault Entry Detail</h1>
      <p>Entry ID: {id}</p>
      <p>Page under construction.</p>
    </div>
  );
};

export default VaultDetail;
