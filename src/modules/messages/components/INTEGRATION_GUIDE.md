# ChatWindow Integration Guide

## What Was Built

An **enterprise-grade conversation workspace** component for Maylet XLab's Innovation Operating System with the following features:

### ✅ Implemented Features

1. **10 Message Types** with distinct styling
2. **Rich Object Preview Cards** for projects, research, prototypes, etc.
3. **Collaboration Features** (reactions, pinning, saving, task creation)
4. **Threading System** (UI ready, backend TODO)
5. **Real-Time Indicators** (typing, delivery status)
6. **Professional UI** (Slack/Teams/Linear-inspired design)
7. **Date Separators** and activity timeline
8. **Hover Actions Menu** for each message
9. **Responsive Layout** with dark theme

---

## Integration with MessagesPage

### Current Usage (From Messages Page)

The `ChatWindow` component is already integrated in `MessagesPage.tsx`:

```typescript
<ChatWindow
  conversation={activeConversation}
  messages={messages}
  userId={userId}
  draft={draft}
  sending={sending}
  typingNames={typingNames}
  messagesEndRef={messagesEndRef}
  onDraftChange={setDraft}
  onSend={handleSend}
  onTyping={handleTyping}
  onRetry={retry}
/>
```

**No changes needed to MessagesPage** — the props interface remains the same!

---

## Extending Messages with Rich Features

### Option 1: Extend Message Type in Database

Add columns to your `messages` table:

```sql
ALTER TABLE messages ADD COLUMN message_type TEXT DEFAULT 'standard';
ALTER TABLE messages ADD COLUMN attached_object JSONB;
ALTER TABLE messages ADD COLUMN thread_id TEXT REFERENCES message_threads(id);
ALTER TABLE messages ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN is_saved BOOLEAN DEFAULT FALSE;
```

### Option 2: Transform Messages in Service Layer

In `src/modules/messages/services/messages.service.ts`:

```typescript
export function enrichMessage(message: Message): ExtendedMessage {
  return {
    ...message,
    messageType: detectMessageType(message.content),
    attachedObject: extractAttachedObject(message.metadata),
    thread: message.threadId ? fetchThreadInfo(message.threadId) : undefined,
    reactions: fetchReactions(message.id),
    isPinned: message.metadata?.isPinned || false,
    isSaved: message.metadata?.isSaved || false,
    deliveryStatus: message.status,
  };
}
```

---

## Backend Implementation Tasks

### 1. Message Actions Service

Create `src/modules/messages/services/messageActions.service.ts`:

```typescript
export const messageActionsService = {
  async addReaction(messageId: string, emoji: string, userId: string) {
    const { data, error } = await supabase
      .from('message_reactions')
      .insert({ message_id: messageId, emoji, user_id: userId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async pinMessage(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ is_pinned: true })
      .eq('id', messageId);
    
    if (error) throw error;
  },

  async saveMessage(messageId: string, userId: string) {
    const { error } = await supabase
      .from('saved_messages')
      .insert({ message_id: messageId, user_id: userId });
    
    if (error) throw error;
  },

  async convertToNote(messageId: string, projectId: string) {
    const message = await messagesService.getMessage(messageId);
    
    return await projectsService.createNote({
      project_id: projectId,
      content: message.content,
      source_type: 'message',
      source_id: messageId,
    });
  },

  async createTaskFromMessage(messageId: string, projectId: string) {
    const message = await messagesService.getMessage(messageId);
    
    return await tasksService.createTask({
      project_id: projectId,
      title: `Task from ${message.senderName}`,
      description: message.content,
      source_message_id: messageId,
    });
  },
};
```

### 2. Rich Object Sharing

Create `src/modules/messages/services/richObjects.service.ts`:

```typescript
export const richObjectsService = {
  async shareProject(conversationId: string, projectId: string) {
    const project = await projectsService.getProject(projectId);
    
    const attachedObject: AttachedObject = {
      type: 'project',
      id: project.id,
      title: project.title,
      subtitle: project.description,
      status: project.status,
      progress: project.progress_percentage,
      stage: project.stage,
    };

    return await messagesService.sendMessage(conversationId, {
      content: `Shared project: ${project.title}`,
      messageType: 'project',
      attachedObject,
    });
  },

  async shareResearch(conversationId: string, researchId: string) {
    const research = await researchService.getResearch(researchId);
    
    const attachedObject: AttachedObject = {
      type: 'research',
      id: research.id,
      title: research.title,
      subtitle: research.abstract,
      status: research.status,
    };

    return await messagesService.sendMessage(conversationId, {
      content: `Shared research: ${research.title}`,
      messageType: 'research',
      attachedObject,
    });
  },

  // Similar methods for prototype, experiment, validation, funding, etc.
};
```

### 3. Threading System

Create `src/modules/messages/services/threads.service.ts`:

```typescript
export const threadsService = {
  async createThread(parentMessageId: string, content: string, userId: string) {
    const { data: thread, error: threadError } = await supabase
      .from('message_threads')
      .insert({ parent_message_id: parentMessageId })
      .select()
      .single();
    
    if (threadError) throw threadError;

    const { data: reply, error: replyError } = await supabase
      .from('thread_replies')
      .insert({
        thread_id: thread.id,
        content,
        user_id: userId,
      })
      .select()
      .single();
    
    if (replyError) throw replyError;
    
    return { thread, reply };
  },

  async getReplies(threadId: string) {
    const { data, error } = await supabase
      .from('thread_replies')
      .select('*, sender:profiles(*)')
      .eq('thread_id', threadId)
      .order('created_at');
    
    if (error) throw error;
    return data;
  },
};
```

---

## Database Schema Extensions

### Message Reactions Table

```sql
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_message_reactions_message ON message_reactions(message_id);
```

### Saved Messages Table

```sql
CREATE TABLE saved_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_saved_messages_user ON saved_messages(user_id);
```

### Threading Tables

```sql
CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE thread_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_thread_replies_thread ON thread_replies(thread_id);
```

---

## Real-Time Updates

### Subscribe to Message Changes

In `useMessages` hook:

```typescript
useEffect(() => {
  if (!activeConversationId) return;

  const channel = supabase
    .channel(`conversation:${activeConversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConversationId}`,
      },
      handleNewMessage
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConversationId}`,
      },
      handleMessageUpdate
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'message_reactions',
      },
      handleNewReaction
    )
    .subscribe();

  return () => channel.unsubscribe();
}, [activeConversationId]);
```

---

## Component Customization

### Override Styles

The component uses inline styles with CSS-in-JS. To customize:

```css
/* In your global CSS or module CSS */
.chat-window {
  --chat-bg: #1a1a2e;
  --chat-header-bg: #16172a;
  --chat-message-bg: #252538;
  --chat-border: #2d2d3f;
  --chat-primary: #7c5fe6;
}

/* Override specific elements */
.chat-msg__body {
  border-radius: 16px !important;
  padding: 1rem 1.25rem !important;
}
```

### Add Custom Message Types

Extend the `MessageType` union:

```typescript
export type MessageType =
  | 'standard'
  | 'system'
  // ... existing types
  | 'milestone'
  | 'announcement'
  | 'alert';
```

Add styling in the component:

```css
.chat-msg--milestone .chat-msg__body {
  background: rgba(245, 158, 11, 0.1);
  border-left: 3px solid #f59e0b;
}
```

---

## Testing Recommendations

### Unit Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatWindow } from './ChatWindow';

describe('ChatWindow', () => {
  const mockProps = {
    conversation: mockConversation,
    messages: { loading: false, error: null, data: mockMessages },
    userId: 'user-1',
    draft: '',
    sending: false,
    typingNames: [],
    messagesEndRef: createRef(),
    onDraftChange: jest.fn(),
    onSend: jest.fn(),
    onTyping: jest.fn(),
    onRetry: jest.fn(),
  };

  it('renders rich object cards', () => {
    const messageWithObject = {
      ...mockMessage,
      attachedObject: {
        type: 'project',
        title: 'Test Project',
        progress: 75,
      },
    };

    render(<ChatWindow {...mockProps} messages={{ data: [messageWithObject] }} />);
    
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('shows message actions on hover', async () => {
    render(<ChatWindow {...mockProps} />);
    
    const message = screen.getByText('Hello');
    fireEvent.mouseEnter(message);
    
    expect(screen.getByTitle('Add reaction')).toBeVisible();
    expect(screen.getByTitle('Reply in thread')).toBeVisible();
  });
});
```

---

## Performance Tips

1. **Virtual Scrolling** for 1000+ messages
2. **Memoize** expensive computations
3. **Lazy Load** attachments and rich objects
4. **Debounce** typing indicators
5. **Batch** real-time updates

---

## Next Steps

1. ✅ ChatWindow component complete
2. 🔄 Implement backend services
3. 🔄 Create database migrations
4. 🔄 Add real-time subscriptions
5. 🔄 Implement threading panel
6. 🔄 Add search & filtering
7. 🔄 File attachments system
8. 🔄 Analytics tracking

---

## Support

For questions or issues:
- Review `CHAT_WINDOW_README.md` for full documentation
- Check type definitions in `src/modules/messages/types/messages.types.ts`
- See example integration in `src/modules/messages/pages/MessagesPage.tsx`
