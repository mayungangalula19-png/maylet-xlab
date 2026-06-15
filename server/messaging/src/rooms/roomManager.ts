import type WebSocket from 'ws';
import { logger } from '../utils/logger.js';

export interface SocketRecord {
  socket: WebSocket;
  socketId: string;
  userId: string;
}

export class RoomManager {
  private readonly rooms = new Map<string, Set<WebSocket>>();
  private readonly socketRooms = new Map<WebSocket, Set<string>>();
  private readonly socketMeta = new Map<WebSocket, SocketRecord>();

  register(socket: WebSocket, userId: string): string {
    const socketId = crypto.randomUUID();
    this.socketMeta.set(socket, { socket, socketId, userId });
    this.join(socket, this.userRoom(userId));
    return socketId;
  }

  getRecord(socket: WebSocket): SocketRecord | undefined {
    return this.socketMeta.get(socket);
  }

  join(socket: WebSocket, room: string): void {
    if (!this.rooms.has(room)) this.rooms.set(room, new Set());
    this.rooms.get(room)!.add(socket);
    if (!this.socketRooms.has(socket)) this.socketRooms.set(socket, new Set());
    this.socketRooms.get(socket)!.add(room);
  }

  leave(socket: WebSocket, room: string): void {
    this.rooms.get(room)?.delete(socket);
    this.socketRooms.get(socket)?.delete(room);
    if (this.rooms.get(room)?.size === 0) this.rooms.delete(room);
  }

  leaveAll(socket: WebSocket): string[] {
    const rooms = [...(this.socketRooms.get(socket) ?? [])];
    for (const room of rooms) this.leave(socket, room);
    this.socketRooms.delete(socket);
    this.socketMeta.delete(socket);
    return rooms;
  }

  broadcastToRoom(room: string, data: string, except?: WebSocket): number {
    let sent = 0;
    for (const socket of this.rooms.get(room) ?? []) {
      if (socket !== except && socket.readyState === WebSocket.OPEN) {
        socket.send(data);
        sent += 1;
      }
    }
    return sent;
  }

  broadcast(room: string, data: string, except?: WebSocket): void {
    const sent = this.broadcastToRoom(room, data, except);
    logger.debug('room_broadcast', { room, sent });
  }

  userRoom(userId: string): string {
    return `user:${userId}`;
  }

  conversationRoom(conversationId: string): string {
    return `conversation:${conversationId}`;
  }

  workspaceRoom(workspaceId: string): string {
    return `workspace:${workspaceId}`;
  }

  projectRoom(projectId: string): string {
    return `project:${projectId}`;
  }

  teamRoom(teamId: string): string {
    return `team:${teamId}`;
  }
}
