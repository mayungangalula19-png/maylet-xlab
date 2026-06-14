import { useParams, Link } from 'react-router-dom';

interface Props {
  title: string;
  backTo: string;
}

export function AdminDetailShell({ title, backTo }: Props) {
  const params = useParams();
  return (
    <div style={{ padding: '2rem', color: '#e8e8f0' }}>
      <Link to={backTo} style={{ color: '#9b7ff0', fontSize: '0.85rem' }}>
        ← Back
      </Link>
      <h1 style={{ marginTop: '1rem' }}>{title}</h1>
      <p style={{ opacity: 0.7 }}>Admin module — extend with full CRUD. Params: {JSON.stringify(params)}</p>
    </div>
  );
}
