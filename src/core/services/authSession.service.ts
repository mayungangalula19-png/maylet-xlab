import { supabase } from '../../lib/supabase/client';

export type OAuthProvider = 'google' | 'github';

export function formatAuthError(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object') return fallback;

  const message = 'message' in err ? String(err.message) : '';
  const code = 'code' in err ? String(err.code) : '';

  if (code === 'email_not_confirmed' || /email not confirmed/i.test(message)) {
    return 'Confirm your email first. Open the verification link Supabase sent you, then sign in again.';
  }
  if (/invalid login credentials/i.test(message)) {
    return 'Invalid email or password. If you just registered, confirm your email before signing in.';
  }
  if (/user already registered/i.test(message)) {
    return 'This email is already registered. Sign in or use forgot password.';
  }

  return message || fallback;
}

export function isEmailNotConfirmedError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const message = 'message' in err ? String(err.message) : '';
  const code = 'code' in err ? String(err.code) : '';
  return code === 'email_not_confirmed' || /email not confirmed/i.test(message);
}

class AuthSessionService {
  async signInWithPassword(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
  }

  async resendSignupConfirmation(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });
    if (error) throw error;
  }

  async signInWithOAuth(provider: OAuthProvider, redirectTo: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) throw error;
  }

  async resetPassword(email: string, redirectTo: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error) throw error;
  }
}

export const authSessionService = new AuthSessionService();

export function getRememberedEmail(): string | null {
  return localStorage.getItem('rememberedEmail');
}

export function setRememberedEmail(email: string | null): void {
  if (email) localStorage.setItem('rememberedEmail', email);
  else localStorage.removeItem('rememberedEmail');
}
