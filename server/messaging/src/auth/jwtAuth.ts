import { verifyAccessToken } from './verifyToken.js';
import { logger } from '../utils/logger.js';

export interface AuthResult {
  userId: string;
}

export async function authenticateHandshake(token: string): Promise<AuthResult | null> {
  if (!token) {
    logger.warn('ws_auth_failed', { reason: 'missing_token' });
    return null;
  }
  const userId = await verifyAccessToken(token);
  if (!userId) {
    logger.warn('ws_auth_failed', { reason: 'invalid_token' });
    return null;
  }
  return { userId };
}
