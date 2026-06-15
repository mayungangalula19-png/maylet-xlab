import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormState } from '../../../core/hooks/useAsyncState';
import {
  authSessionService,
  getRememberedEmail,
  setRememberedEmail,
  type OAuthProvider,
} from '../../../core/services/authSession.service';

interface UseLoginAuthOptions {
  redirectTo?: string;
  onSuccess?: () => void;
}

export function useLoginAuth({ redirectTo = '/dashboard', onSuccess }: UseLoginAuthOptions = {}) {
  const navigate = useNavigate();
  const form = useFormState();
  const [email, setEmail] = useState(() => getRememberedEmail() ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => Boolean(getRememberedEmail()));

  const completeLogin = () => {
    if (onSuccess) onSuccess();
    else navigate(redirectTo);
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    form.start();
    try {
      await authSessionService.signInWithPassword(email, password);
      setRememberedEmail(rememberMe ? email.trim() : null);
      form.succeed();
      completeLogin();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid email or password. Please try again.';
      form.fail(message);
    }
  };

  const handleSocialLogin = async (provider: OAuthProvider) => {
    form.start();
    try {
      await authSessionService.signInWithOAuth(provider, `${window.location.origin}/dashboard`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Social login failed';
      form.fail(message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      form.fail('Please enter your email address to reset your password.');
      return;
    }
    form.start();
    try {
      await authSessionService.resetPassword(email, `${window.location.origin}/reset-password`);
      form.succeed();
      alert('Password reset link sent to your email. Please check your inbox.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password reset failed';
      form.fail(message);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    rememberMe,
    setRememberMe,
    loading: form.loading,
    error: form.error,
    handleEmailLogin,
    handleSocialLogin,
    handleForgotPassword,
  };
}
