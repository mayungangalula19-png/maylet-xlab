import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_verified'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const [countdown, setCountdown] = useState(5);

  const startCountdown = useCallback(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [navigate]);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      // If no token, check if user is already verified
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email_confirmed_at) {
        setStatus('already_verified');
        setMessage('Your email is already verified!');
        startCountdown();
        return;
      }

      if (!token) {
        // No token and user not verified - send new verification email
        if (user?.email) {
          const { error } = await supabase.auth.resend({
            type: 'signup',
            email: user.email,
          });
          if (error) {
            setStatus('error');
            setMessage(error.message || 'Failed to send verification email');
          } else {
            setStatus('loading');
            setMessage('Verification email sent! Please check your inbox.');
          }
        } else {
          setStatus('error');
          setMessage('No verification token found. Please sign in to request a new verification email.');
        }
        return;
      }

      // Verify the token
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type === 'signup' ? 'signup' : 'email',
      });

      if (error) {
        setStatus('error');
        setMessage(error.message || 'Verification failed. The link may have expired.');
      } else {
        setStatus('success');
        setMessage('Email verified successfully! Redirecting to dashboard...');
        startCountdown();
      }
    };

    verifyEmail();
  }, [searchParams]);

  const resendVerificationEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setStatus('loading');
      setMessage('Sending verification email...');
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });
      if (error) {
        setStatus('error');
        setMessage(error.message || 'Failed to send verification email');
      } else {
        setStatus('loading');
        setMessage('Verification email sent! Please check your inbox.');
      }
    }
  };

  return (
    <div className="verify-email-page">
      <div className="verify-email-container">
        {/* Logo */}
        <div className="logo-section">
          <div className="logo-icon">✉️</div>
          <h1>Email Verification</h1>
        </div>

        {/* Status Icon */}
        <div className={`status-icon ${status}`}>
          {status === 'loading' && <div className="spinner"></div>}
          {status === 'success' && <span>✅</span>}
          {status === 'error' && <span>❌</span>}
          {status === 'already_verified' && <span>✓</span>}
        </div>

        {/* Message */}
        <p className="message">{message}</p>

        {/* Action Buttons */}
        {status === 'error' && (
          <button onClick={resendVerificationEmail} className="resend-btn">
            Resend Verification Email
          </button>
        )}

        {(status === 'success' || status === 'already_verified') && (
          <div className="redirect-info">
            <p>Redirecting to dashboard in {countdown} seconds...</p>
            <Link to="/dashboard" className="dashboard-link">
              Go to Dashboard Now →
            </Link>
          </div>
        )}

        {status === 'loading' && (
          <p className="check-email">Please check your email and click the verification link.</p>
        )}

        {/* Additional Links */}
        <div className="additional-links">
          <Link to="/login" className="link">Back to Sign In</Link>
          <span className="separator">•</span>
          <Link to="/contact" className="link">Need help? Contact Support</Link>
        </div>
      </div>

      <style>{`
        .verify-email-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
          font-family: 'Inter', sans-serif;
          padding: 1rem;
        }
        .verify-email-container {
          max-width: 450px;
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 32px;
          padding: 2.5rem;
          text-align: center;
          backdrop-filter: blur(10px);
        }
        .logo-section {
          margin-bottom: 2rem;
        }
        .logo-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }
        .verify-email-container h1 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: #fff;
        }
        .status-icon {
          margin: 1.5rem 0;
        }
        .status-icon .spinner {
          width: 60px;
          height: 60px;
          margin: 0 auto;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: #7c5fe6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .status-icon span {
          font-size: 3rem;
        }
        .message {
          color: rgba(255,255,255,0.8);
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }
        .resend-btn {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 40px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }
        .resend-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(124,95,230,0.3);
        }
        .redirect-info {
          margin-top: 1rem;
        }
        .redirect-info p {
          color: rgba(255,255,255,0.6);
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }
        .dashboard-link {
          display: inline-block;
          background: rgba(124,95,230,0.2);
          color: #9b7ff0;
          padding: 0.6rem 1.2rem;
          border-radius: 40px;
          text-decoration: none;
          font-size: 0.85rem;
          transition: all 0.2s;
        }
        .dashboard-link:hover {
          background: rgba(124,95,230,0.3);
        }
        .check-email {
          color: rgba(255,255,255,0.5);
          font-size: 0.85rem;
          margin-top: 1rem;
        }
        .additional-links {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.8rem;
        }
        .link {
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          transition: color 0.2s;
        }
        .link:hover {
          color: #9b7ff0;
        }
        .separator {
          color: rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  );
};

export default VerifyEmail;