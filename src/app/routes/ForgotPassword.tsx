import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';
import { BrandLogo } from '../../components/common/BrandLogo';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password reset link sent to your email!' });
    }
    setLoading(false);
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="logo-icon">
          <BrandLogo to="/" size="lg" />
        </div>
        <h1>Forgot Password?</h1>
        <p>Enter your email address and we'll send you a link to reset your password.</p>
        
        {message && <div className={`alert ${message.type}`}>{message.text}</div>}
        
        <form onSubmit={handleReset}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        
        <div className="links">
          <Link to="/login">← Back to Sign In</Link>
        </div>
      </div>

      <style>{`
        .forgot-password-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
          padding: 1rem;
        }
        .forgot-password-container {
          max-width: 420px;
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px;
          padding: 2rem;
          text-align: center;
        }
        .logo-icon {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
        }
        h1 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }
        p {
          color: rgba(255,255,255,0.7);
          margin-bottom: 1.5rem;
        }
        .form-group {
          margin-bottom: 1rem;
          text-align: left;
        }
        .form-group label {
          display: block;
          margin-bottom: 0.3rem;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.7);
        }
        .form-group input {
          width: 100%;
          padding: 0.6rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
        }
        .btn-primary {
          width: 100%;
          padding: 0.8rem;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .alert {
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        .alert.success {
          background: rgba(72,187,120,0.1);
          border: 1px solid #48bb78;
          color: #48bb78;
        }
        .alert.error {
          background: rgba(252,129,129,0.1);
          border: 1px solid #fc8181;
          color: #fc8181;
        }
        .links {
          margin-top: 1.5rem;
        }
        .links a {
          color: #9b7ff0;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;