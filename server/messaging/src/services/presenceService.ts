import { adminSupabase } from '../auth/verifyToken.js';
import { logger } from '../utils/logger.js';

export type PresenceStatus = 'online' | 'offline' | 'away';

export class PresenceService {
  private readonly connections = new Map<string, Set<string>>();

  registerConnection(userId: string, socketId: string): void {
    if (!this.connections.has(userId)) this.connections.set(userId, new Set());
    this.connections.get(userId)!.add(socketId);
  }

  unregisterConnection(userId: string, socketId: string): boolean {
    const set = this.connections.get(userId);
    if (!set) return true;
    set.delete(socketId);
    if (set.size === 0) {
      this.connections.delete(userId);
      return true;
    }
    return false;
  }

  isOnline(userId: string): boolean {
    return (this.connections.get(userId)?.size ?? 0) > 0;
  }

  async setStatus(userId: string, status: PresenceStatus): Promise<void> {
    if (!adminSupabase) return;
    const { error } = await adminSupabase.from('user_presence').upsert({
      user_id: userId,
      status,
      last_seen_at: new Date().toISOString(),
    });
    if (error) logger.error('presence_upsert_failed', { userId, error: error.message });
  }

  touch(userId: string): void {
    void this.setStatus(userId, 'online');
  }
}
