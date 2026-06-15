import type { MessageStatus } from '../types/messages.types';

export function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function truncatePreview(text: string, max = 48): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function statusLabel(status: MessageStatus): string {
  switch (status) {
    case 'sending':
      return 'Sending…';
    case 'sent':
      return 'Sent';
    case 'delivered':
      return 'Delivered';
    case 'read':
      return 'Read';
    default:
      return '';
  }
}

export function conversationTypeIcon(type: 'dm' | 'group' | 'channel'): string {
  switch (type) {
    case 'dm':
      return '💬';
    case 'group':
      return '👥';
    case 'channel':
      return '#';
    default:
      return '💬';
  }
}

export function makeClientId(): string {
  return `client-${crypto.randomUUID()}`;
}
