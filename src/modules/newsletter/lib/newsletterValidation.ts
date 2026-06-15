const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const MAX_EMAIL_LEN = 254;

export function sanitizeEmail(raw: string): string {
  return raw.trim().toLowerCase().slice(0, MAX_EMAIL_LEN);
}

export function isValidEmail(email: string): boolean {
  if (!email || email.length > MAX_EMAIL_LEN) return false;
  return EMAIL_RE.test(email);
}

export function validateNewsletterEmail(raw: string): { email: string; error: string | null } {
  const email = sanitizeEmail(raw);
  if (!email) return { email, error: 'Email is required.' };
  if (!isValidEmail(email)) return { email, error: 'Enter a valid email address.' };
  return { email, error: null };
}
