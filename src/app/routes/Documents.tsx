import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/common/PageShell';
import { useAuth } from '../../hooks/useAuth';
import { listProjectsByUser } from '../../services/projects.service';
import { listDocumentsByProject } from '../../services/documents.service';

export default function Documents() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const projectId = params.get('project') ?? '';
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [docs, setDocs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    listProjectsByUser(user.id).then((p) => {
      setProjects(p.map((x) => ({ id: x.id, name: x.name })));
      const pid = projectId || p[0]?.id;
      if (pid) {
        listDocumentsByProject(pid).then(setDocs).finally(() => setLoading(false));
      } else setLoading(false);
    });
  }, [user?.id, projectId]);

  return (
    <PageShell title="Documents" subtitle="Enterprise document management — feeds MAYA Document Memory (RAG).">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {projects.map((p) => (
          <Link
            key={p.id}
            to={`/documents?project=${p.id}`}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 8,
              background: projectId === p.id ? 'rgba(124,95,230,0.2)' : 'rgba(255,255,255,0.05)',
              color: '#9b7ff0',
              textDecoration: 'none',
            }}
          >
            {p.name}
          </Link>
        ))}
      </div>
      {loading ? (
        <p>Loading…</p>
      ) : docs.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No documents yet. Upload from Project Detail or connect Supabase Storage.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {docs.map((d) => (
            <li
              key={String(d.id)}
              style={{
                padding: '1rem',
                marginBottom: '0.5rem',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 10,
              }}
            >
              <strong>{String(d.name)}</strong>
              {d.file_url ? (
                <a href={String(d.file_url)} target="_blank" rel="noreferrer" style={{ marginLeft: 12, color: '#2fd4ff' }}>
                  Open
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
