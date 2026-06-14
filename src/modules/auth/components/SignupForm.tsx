import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';
import { BrandLogo } from '../../../modules/shared/components/common/BrandLogo';

interface SignupFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export const SignupForm = ({ onSuccess, redirectTo = '/dashboard' }: SignupFormProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [userType, setUserType] = useState('student');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizePhone = (value: string) => value.replace(/[\s\-()]/g, '').trim();

  const handleEmailSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const phoneNormalized = normalizePhone(phone);
    if (!phoneNormalized) {
      setError('Phone number is required');
      return;
    }
    if (!/^\+?\d{8,15}$/.test(phoneNormalized)) {
      setError('Enter a valid phone number (8–15 digits, optional + prefix)');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!acceptTerms) {
      setError('You must accept the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType,
            organization_name: organizationName,
            phone: phoneNormalized,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: email.trim(),
            full_name: fullName,
            organization_name: organizationName,
            user_type: userType,
            phone: phoneNormalized,
            is_student: userType === 'student',
            created_at: new Date().toISOString(),
          });
        if (profileError) {
          console.warn('Profile insert warning:', profileError);
        }

        await supabase
          .from('profiles')
          .update({ phone: phoneNormalized, updated_at: new Date().toISOString() })
          .eq('id', authData.user.id)
          .then(({ error: phoneErr }) => {
            if (phoneErr) console.warn('Phone profile update:', phoneErr.message);
          });
      }

      alert('Registration successful! Please check your email for confirmation.');
      
      if (onSuccess) onSuccess();
      else navigate(redirectTo);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignup = async (provider: 'google' | 'github') => {
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="signup-form-container">
      <form onSubmit={handleEmailSignup} className="signup-form">
        <div className="form-brand">
          <BrandLogo to="/" size="lg" />
        </div>
        <h2 className="form-title">Create account</h2>
        <p className="form-subtitle">Join Maylet XLab's innovation ecosystem</p>

        {error && <div className="error-message">{error}</div>}

        <div className="input-group">
          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="John Innovator"
          />
        </div>

        <div className="input-group">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div className="input-group">
          <label htmlFor="phone">Phone number</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="+255 712 345 678"
            autoComplete="tel"
          />
          <p className="hint">Include country code if outside Tanzania (e.g. +255...)</p>
        </div>

        <div className="input-group">
          <label htmlFor="organizationName">Organization / University (optional)</label>
          <input
            id="organizationName"
            type="text"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="e.g., University of Dar es Salaam, Bongo Tech"
          />
        </div>

        <div className="input-group">
          <label htmlFor="userType">I am a...</label>
          <select
            id="userType"
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            className="select-input"
          >
            <option value="student">Student / Researcher</option>
            <option value="developer">Developer / Engineer</option>
            <option value="founder">Entrepreneur / Founder</option>
            <option value="investor">Investor</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <div className="password-input-wrapper">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="hint">At least 6 characters</p>
        </div>

        <div className="input-group">
          <label htmlFor="confirmPassword">Confirm password</label>
          <div className="password-input-wrapper">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            <span>
              I agree to the <a href="/terms" target="_blank">Terms of Service</a> and{' '}
              <a href="/privacy" target="_blank">Privacy Policy</a>
            </span>
          </label>
        </div>

        <button type="submit" disabled={loading} className="signup-button">
          {loading ? 'Creating account...' : 'Create Free Account'}
        </button>

        <div className="divider">
          <span>or sign up with</span>
        </div>

        <div className="social-buttons">
          <button
            type="button"
            onClick={() => handleSocialSignup('google')}
            disabled={loading}
            className="social-btn google"
          >
            <svg className="social-icon" viewBox="0 0 24 24" width="18" height="18">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => handleSocialSignup('github')}
            disabled={loading}
            className="social-btn github"
          >
            <svg className="social-icon" viewBox="0 0 24 24" width="18" height="18">
              <path
                fill="currentColor"
                d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.21.68-.48 0-.24-.01-.88-.01-1.73-2.78.6-3.37-1.2-3.37-1.2-.45-1.15-1.1-1.46-1.1-1.46-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.9-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48C19.13 20.17 22 16.42 22 12c0-5.52-4.48-10-10-10z"
              />
            </svg>
            GitHub
          </button>
        </div>

        <p className="login-prompt">
          Already have an account?{' '}
          <Link to="/login" className="login-link">
            Sign in
          </Link>
        </p>
      </form>

      <style>{`
        .signup-form-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f, #1a1a2e);
          padding: 1rem;
        }
        .signup-form {
          background: #1e1e2f;
          padding: 2rem;
          border-radius: 1rem;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          color: #ffffff;
        }
        .form-brand {
          display: flex;
          justify-content: center;
          margin-bottom: 1.25rem;
        }
        .form-title {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          text-align: center;
        }
        .form-subtitle {
          text-align: center;
          color: #a0a0b0;
          margin-bottom: 1.5rem;
        }
        .error-message {
          background: rgba(255,80,80,0.1);
          border-left: 3px solid #ff5555;
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          color: #ff8888;
          font-size: 0.875rem;
        }
        .input-group {
          margin-bottom: 1rem;
        }
        .input-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .input-group input,
        .select-input {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #2d2d3f;
          background: #2a2a3a;
          color: #fff;
          font-size: 1rem;
          transition: border 0.2s;
        }
        .input-group input:focus,
        .select-input:focus {
          outline: none;
          border-color: #7c5fe6;
        }
        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .password-input-wrapper input {
          padding-right: 4.5rem;
        }
        .password-toggle {
          position: absolute;
          right: 0.5rem;
          background: none;
          border: none;
          color: #9b7ff0;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0.35rem 0.5rem;
          border-radius: 0.35rem;
        }
        .password-toggle:hover {
          background: rgba(124, 95, 230, 0.15);
        }
        .hint {
          font-size: 0.7rem;
          color: #6b6b7a;
          margin-top: 0.25rem;
        }
        .checkbox-group {
          margin-bottom: 1.5rem;
        }
        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.85rem;
          color: #c0c0d0;
        }
        .checkbox-label a {
          color: #9b7ff0;
          text-decoration: none;
        }
        .checkbox-label a:hover {
          text-decoration: underline;
        }
        .signup-button {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          background: linear-gradient(135deg, #7c5fe6, #5240c4);
          border: none;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .signup-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          color: #6b6b7a;
          font-size: 0.875rem;
          margin: 1.5rem 0;
        }
        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #2d2d3f;
        }
        .divider span {
          margin: 0 0.5rem;
        }
        .social-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .social-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.6rem;
          border-radius: 0.5rem;
          border: 1px solid #2d2d3f;
          background: #2a2a3a;
          color: #fff;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .social-btn:hover {
          background: #3a3a4a;
        }
        .social-icon {
          width: 18px;
          height: 18px;
        }
        .login-prompt {
          text-align: center;
          font-size: 0.875rem;
          margin-top: 1rem;
          color: #a0a0b0;
        }
        .login-link {
          color: #9b7ff0;
          text-decoration: none;
        }
        .login-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};