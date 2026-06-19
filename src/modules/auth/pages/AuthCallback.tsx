import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

type CallbackStatus = 'loading' | 'success' | 'error';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const didHandleRef = useRef(false);

  useEffect(() => {
    if (didHandleRef.current) return;
    didHandleRef.current = true;

    const run = async () => {
      setStatus('loading');
      setErrorMessage('');

      const { data, error } = await supabase.auth.exchangeCodeForSession(
        window.location.search
      );

      if (error) {
        setStatus('error');
        setErrorMessage(error.message || 'Authentication failed');
        navigate('/login', { replace: true });
        return;
      }

      if (!data?.session) {
        setStatus('error');
        setErrorMessage('No session returned');
        navigate('/login', { replace: true });
        return;
      }

      setStatus('success');
      navigate('/dashboard', { replace: true });
    };

    void run();
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
        color: 'rgba(255,255,255,0.85)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {status === 'loading' && <div>Signing you in…</div>}
      {status === 'success' && <div>Redirecting…</div>}
      {status === 'error' && (
        <div>
          Redirecting to login…
          {errorMessage ? <div style={{ marginTop: 8, color: 'rgba(255,80,80,0.9)' }}>{errorMessage}</div> : null}
        </div>
      )}
    </div>
  );
};

export default AuthCallback;

