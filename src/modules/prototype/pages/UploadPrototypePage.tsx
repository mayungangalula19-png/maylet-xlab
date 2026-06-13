import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { PrototypeUpload } from '../components/PrototypeUpload';
import { prototypeService } from '../services/prototypeService';
import type { PrototypeRecord } from '../types/prototype.types';
import '../prototype.css';

export default function UploadPrototype() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('prototypeId') ?? undefined;
  const [selectedId, setSelectedId] = useState(preselectedId ?? '');
  const [prototypes, setPrototypes] = useState<PrototypeRecord[]>([]);
  const [files, setFiles] = useState<Awaited<ReturnType<typeof prototypeService.listFiles>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (preselectedId) setSelectedId(preselectedId);
  }, [preselectedId]);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    prototypeService
      .list(user.id)
      .then((list) => {
        if (!cancelled) setPrototypes(list);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!selectedId) {
      setFiles([]);
      return;
    }
    let cancelled = false;
    prototypeService.listFiles(selectedId).then((list) => {
      if (!cancelled) setFiles(list);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const handleUploaded = async (file: Awaited<ReturnType<typeof prototypeService.listFiles>>[number]) => {
    setFiles((prev) => [file, ...prev.filter((f) => f.id !== file.id)]);
    const refreshed = await prototypeService.listFiles(selectedId);
    setFiles(refreshed);
  };

  if (authLoading || loading) {
    return <div className="proto-page"><p>Loading…</p></div>;
  }

  if (!user?.id) {
    return <div className="proto-page"><p>Sign in to upload prototype builds.</p></div>;
  }

  return (
    <div className="proto-page">
      <header className="proto-header">
        <div>
          <h1>Upload Prototype Build</h1>
          <p>Attach code bundles, documentation, and deliverables to an existing prototype.</p>
        </div>
        <Link to="/prototypes" className="proto-btn proto-btn--ghost">← Prototype Center</Link>
      </header>

      <div className="proto-panel" style={{ marginBottom: '1rem' }}>
        <label htmlFor="proto-select" className="proto-field">
          <span>Select prototype</span>
        </label>
        <select
          id="proto-select"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{ width: '100%', marginTop: '0.35rem' }}
        >
          <option value="">Choose a prototype…</option>
          {prototypes.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {!selectedId ? (
        <p className="proto-upload__empty">Select a prototype above to upload build files.</p>
      ) : (
        <PrototypeUpload
          prototypeId={selectedId}
          files={files}
          onUploaded={handleUploaded}
        />
      )}
    </div>
  );
}
