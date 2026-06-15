import { supabase } from '../../lib/supabase/client';

export type OAuthProvider = 'google' | 'github';

class AuthSessionService {
  async signInWithPassword(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
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
