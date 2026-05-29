import React, { useState } from 'react';
import { supabase } from '../lib/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  isLogin: boolean;
  onClose: () => void;
  onAuthSwitch: (isLogin: boolean) => void;
}

export function AuthModal({ isOpen, isLogin, onClose, onAuthSwitch }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Registration successful! Please check your email for confirmation.');
        onClose();
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{isLogin ? 'Sign In' : 'Create Account'}</h3>
        <form onSubmit={handleAuth}>
          <input 
            type="email" 
            placeholder="Email address" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            disabled={loading}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Register')}
          </button>
          {authError && <p className="error">{authError}</p>}
        </form>
        <p>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            className="link-btn" 
            onClick={() => onAuthSwitch(!isLogin)}
            type="button"
          >
            {isLogin ? 'Create one' : 'Sign In'}
          </button>
        </p>
        <button className="close-modal" onClick={onClose}>×</button>
      </div>

      <style>{`
        .modal-overlay { 
          position: fixed; 
          top: 0; 
          left: 0; 
          right: 0; 
          bottom: 0; 
          background: rgba(0,0,0,0.5); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          z-index: 1000; 
        }
        .modal-content { 
          background: white; 
          padding: 2rem; 
          border-radius: 24px; 
          width: 90%; 
          max-width: 400px; 
          position: relative; 
        }
        .modal-content h3 { 
          margin-bottom: 1.5rem; 
          color: #1e293b; 
        }
        .modal-content input { 
          width: 100%; 
          padding: 0.75rem; 
          margin: 0.5rem 0; 
          border: 1px solid #cbd5e1; 
          border-radius: 12px; 
          font-size: 1rem;
        }
        .modal-content input:disabled {
          background: #f1f5f9;
          cursor: not-allowed;
        }
        .modal-content button[type="submit"] { 
          width: 100%; 
          background: #3b82f6; 
          color: white; 
          padding: 0.75rem; 
          border: none; 
          border-radius: 12px; 
          cursor: pointer; 
          margin-top: 1rem;
          font-weight: 500;
        }
        .modal-content button[type="submit"]:hover:not(:disabled) { 
          background: #2563eb; 
        }
        .modal-content button[type="submit"]:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .close-modal { 
          position: absolute; 
          top: 1rem; 
          right: 1rem; 
          background: none; 
          border: none; 
          font-size: 1.5rem; 
          cursor: pointer; 
          padding: 0;
          color: #64748b;
        }
        .close-modal:hover {
          color: #1e293b;
        }
        .link-btn { 
          background: none; 
          border: none; 
          color: #3b82f6; 
          cursor: pointer;
          font-weight: 500;
          padding: 0;
        }
        .link-btn:hover {
          text-decoration: underline;
        }
        .error { 
          color: #ef4444; 
          margin-top: 0.5rem;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
