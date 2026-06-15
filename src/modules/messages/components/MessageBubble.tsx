import { memo } from 'react';
import { formatMessageTime, statusLabel } from '../lib/messageUtils';
import type { Message } from '../types/messages.types';

interface Props {
  message: Message;
  isOwn: boolean;
}

export const MessageBubble = memo(function MessageBubble({ message, isOwn }: Props) {
  return (
    <div className={`msg-bubble${isOwn ? ' msg-bubble--own' : ' msg-bubble--other'}`}>
      <p className="msg-bubble__content">{message.content}</p>
      <div className="msg-bubble__meta">
        <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
        {isOwn ? <span className="msg-bubble__status">{statusLabel(message.status)}</span> : null}
      </div>
    </div>
  );
});
