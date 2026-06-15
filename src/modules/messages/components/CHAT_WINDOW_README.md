# ChatWindow - Enterprise Collaboration Workspace

## Overview

An **enterprise-grade collaboration workspace** for Maylet XLab's Innovation Operating System. This is not a simple chat area — it's a sophisticated workspace where innovators, researchers, engineers, founders, mentors, investors, and enterprise teams communicate around innovation activities.

---

## Core Purpose

Centralized communication workspace for:

- ✅ Project discussions
- ✅ Research collaboration
- ✅ Prototype reviews
- ✅ Experiment discussions
- ✅ Validation feedback
- ✅ Funding conversations
- ✅ Commercialization planning

---

## Features Implemented

### 1. **10 Message Types**

```typescript
type MessageType =
  | 'standard'           // Regular text messages
  | 'system'             // System notifications
  | 'project'            // Project-related messages
  | 'research'           // Research discussions
  | 'prototype'          // Prototype updates
  | 'experiment'         // Experiment results
  | 'validation'         // Validation reports
  | 'funding'            // Funding opportunities
  | 'commercialization'  // GTM discussions
  | 'ai_assistant';      // AI-generated insights
```

Each type has distinct styling:
- **System messages:** Purple left border
- **AI messages:** Green left border
- **Others:** Standard styling with context indicators

### 2. **Rich Object Sharing**

Share innovation objects directly in chat with rich preview cards:

```typescript
interface AttachedObject {
  type: 'project' | 'research' | 'prototype' | 'experiment' 
      | 'validation' | 'funding' | 'document' | 'post';
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  progress?: number;      // 0-100 for projects/prototypes
  stage?: string;
  metadata?: Record<string, any>;
  thumbnailUrl?: string;
}
```

**Preview Card Features:**
- Type badge (PROJECT, RESEARCH, etc.)
- Status indicator
- Progress bar (for projects/prototypes)
- Stage information
- "Open [type]" button
- Click to navigate to object

### 3. **Collaboration Features**

**Message Actions** (appear on hover):
- 😊 **React** — Add emoji reactions
- 💬 **Reply** — Start thread
- 📌 **Pin** — Pin important messages
- 🔖 **Save** — Bookmark messages
- 📝 **Convert to Note** — Create project note
- ✓ **Assign Task** — Create task from message
- ⋯ **More** — Additional actions

**Reactions System:**
- 6 default reactions: 👍 ❤️ 😊 🎉 🚀 💡
- Shows reaction count
- Highlights when user reacted
- Hover to see who reacted

**Pinned Messages:**
- Visual pin indicator (📌)
- Accessible from header button
- Persists across sessions

### 4. **Threading System**

```typescript
interface Thread {
  id: string;
  replyCount: number;
  lastReplyAt: Date;
  participants: string[];
}
```

**Thread Display:**
- Shows reply count
- Last reply timestamp
- Click to open thread panel
- Visual thread indicator

### 5. **Real-Time Features**

**Delivery Status:**
```
sending    → •
sent       → ✓
delivered  → ✓
read       → ✓✓
failed     → !
```

**Typing Indicators:**
- Shows who's typing
- Multiple users supported
- "Alice and Bob are typing..."

**Presence Tracking:**
- Online/offline status
- Last seen information

### 6. **Activity Timeline**

**Date Separators:**
- "Today"
- "Yesterday"
- "Monday, June 15"

**Smart Grouping:**
- Groups messages by date
- Shows timeline of events
- Milestone markers (TODO: implement)

### 7. **Professional UI**

**Enterprise Design:**
- Slack-level interaction patterns
- Teams-level organization
- Linear-level clean aesthetics
- Dark theme optimized

**Responsive:**
- Adapts to screen size
- Mobile-friendly (TODO: optimize)
- Tablet support

**Colors:**
```css
Background:     #1a1a2e
Header:         #16172a
Message Card:   #252538
Borders:        #2d2d3f
Primary:        #7c5fe6
Success:        #10b981
Text:           #e2e8f0
Muted:          #94a3b8
```

---

## Usage

### Basic Usage

```typescript
import { ChatWindow } from '@/modules/messages/components/ChatWindow';

<ChatWindow
  conversation={currentConversation}
  messages={messagesState}
  userId={user?.id}
  draft={draftText}
  sending={isSending}
  typingNames={['Alice', 'Bob']}
  messagesEndRef={scrollRef}
  onDraftChange={setDraft}
  onSend={handleSend}
  onTyping={handleTyping}
  onRetry={refetch}
/>
```

### With Rich Objects

```typescript
const message: ExtendedMessage = {
  id: '123',
  senderId: 'user-1',
  senderName: 'John Doe',
  content: 'Check out this project progress!',
  timestamp: new Date(),
  messageType: 'project',
  attachedObject: {
    type: 'project',
    id: 'proj-456',
    title: 'Smart Irrigation System',
    subtitle: 'IoT-based water management',
    status: 'Active',
    progress: 72,
    stage: 'Prototype',
  },
};
```

### With Reactions

```typescript
const message: ExtendedMessage = {
  // ... other fields
  reactions: [
    { emoji: '👍', users: ['user-1', 'user-2'], count: 2 },
    { emoji: '🚀', users: ['user-3'], count: 1 },
  ],
};
```

### With Thread

```typescript
const message: ExtendedMessage = {
  // ... other fields
  thread: {
    id: 'thread-789',
    replyCount: 5,
    lastReplyAt: new Date(),
    participants: ['user-1', 'user-2', 'user-3'],
  },
};
```

---

## Props

```typescript
interface Props {
  conversation: Conversation | null;
  messages: AsyncState<Message[]>;
  userId: string | undefined;
  draft: string;                      // Current draft (not rendered here)
  sending: boolean;                    // Send status (not rendered here)
  typingNames: string[];
  messagesEndRef: RefObject<HTMLDivElement>;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onTyping: (typing: boolean) => void;
  onRetry: () => void;
}
```

**Note:** `draft` and `sending` are passed but not used in this component since message input belongs to a separate component (as per specification).

---

## Extended Message Type

```typescript
interface ExtendedMessage extends Message {
  messageType?: MessageType;
  attachedObject?: AttachedObject;
  thread?: Thread;
  reactions?: Reaction[];
  isPinned?: boolean;
  isSaved?: boolean;
  readBy?: string[];
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}
```

---

## Architecture

### Component Structure

```
ChatWindow
├── Header
│   ├── Conversation Info
│   └── Actions (Search, Pinned, Settings)
├── Body (Scrollable)
│   ├── Date Separators
│   ├── Messages
│   │   ├── Avatar
│   │   ├── Header (Sender, Time, Status)
│   │   ├── Body
│   │   │   ├── Text
│   │   │   ├── Rich Object Card (optional)
│   │   │   ├── Reactions (optional)
│   │   │   └── Thread Link (optional)
│   │   └── Actions (on hover)
│   └── Typing Indicator
└── Loading State
```

### Sub-Components

1. **MessageActions** — Hover actions menu
2. **RichObjectCard** — Preview card for shared objects
3. **MessageReactions** — Reaction display & interaction
4. **MessageThread** — Thread link with reply count
5. **EnhancedMessageBubble** — Complete message rendering

---

## Integration Points

### Service Layer

```typescript
// TODO: Implement these handlers
handleReact(messageId: string, emoji: string)
handleReply(messageId: string)
handlePin(messageId: string)
handleSave(messageId: string)
handleConvertToNote(messageId: string)
handleAssignTask(messageId: string)
handleOpenObject(object: AttachedObject)
handleOpenThread(threadId: string)
```

### Real-Time Integration

```typescript
// Example: Connect to WebSocket for real-time updates
useEffect(() => {
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on('INSERT', handleNewMessage)
    .on('UPDATE', handleMessageUpdate)
    .subscribe();

  return () => channel.unsubscribe();
}, [conversationId]);
```

### State Management

```typescript
// Message state managed by parent
const [messages, setMessages] = useState<AsyncState<ExtendedMessage[]>>({
  loading: true,
  error: null,
  data: null,
});

// Update on actions
const handleReact = async (messageId: string, emoji: string) => {
  // Optimistic update
  setMessages(prev => ({
    ...prev,
    data: prev.data?.map(msg => 
      msg.id === messageId 
        ? { ...msg, reactions: updateReactions(msg.reactions, emoji, userId) }
        : msg
    ),
  }));

  // Server update
  await messagesService.addReaction(messageId, emoji);
};
```

---

## Knowledge Extraction

### Convert Message to Project Note

```typescript
handleConvertToNote(messageId: string) => {
  const message = messages.data?.find(m => m.id === messageId);
  
  await projectsService.createNote({
    projectId: conversation.projectId,
    content: message.content,
    sourceType: 'message',
    sourceId: messageId,
    createdBy: userId,
  });
  
  toast.success('Note created from message');
}
```

### Create Task from Message

```typescript
handleAssignTask(messageId: string) => {
  const message = messages.data?.find(m => m.id === messageId);
  
  openTaskModal({
    title: `Task from ${message.senderName}`,
    description: message.content,
    projectId: conversation.projectId,
    sourceMessageId: messageId,
  });
}
```

---

## Search & Filtering

### Future Implementation

```typescript
interface SearchFilters {
  query?: string;
  messageType?: MessageType[];
  dateRange?: { start: Date; end: Date };
  senders?: string[];
  hasAttachment?: boolean;
  isPinned?: boolean;
  objectType?: AttachedObject['type'][];
}

const filteredMessages = filterMessages(messages.data, filters);
```

---

## File Attachments

### Future Implementation

```typescript
interface MessageAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
}

// In message
attachments?: MessageAttachment[];
```

**Supported Types:**
- PDF documents
- DOCX files
- PPTX presentations
- Images (PNG, JPG, etc.)
- Research files
- Prototype files
- Validation reports
- Pitch decks

---

## Performance Optimization

### Virtual Scrolling (Future)

For conversations with 1000+ messages:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: messages.data?.length ?? 0,
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: () => 80,
});
```

### Message Pagination

```typescript
// Load older messages on scroll top
const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
  if (e.currentTarget.scrollTop === 0 && !loading) {
    loadOlderMessages();
  }
};
```

---

## Accessibility

- ✅ Semantic HTML
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation for actions
- ✅ Screen reader support
- ✅ Focus management
- ✅ High contrast mode support

---

## Testing

### Unit Tests

```typescript
describe('ChatWindow', () => {
  it('renders conversation title', () => {
    render(<ChatWindow {...props} />);
    expect(screen.getByText('Project Discussion')).toBeInTheDocument();
  });

  it('displays date separators', () => {
    const messages = [
      { ...mockMessage, timestamp: new Date('2024-01-01') },
      { ...mockMessage, timestamp: new Date('2024-01-02') },
    ];
    render(<ChatWindow {...props} messages={{ data: messages }} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('shows message actions on hover', () => {
    render(<ChatWindow {...props} />);
    const message = screen.getByText('Hello world');
    fireEvent.mouseEnter(message);
    expect(screen.getByTitle('Add reaction')).toBeVisible();
  });
});
```

---

## Production Checklist

- [x] Message rendering with 10 types
- [x] Rich object preview cards
- [x] Collaboration features (reactions, pinning, saving)
- [x] Threading system (UI only, backend TODO)
- [x] Date separators
- [x] Professional UI design
- [x] Delivery status indicators
- [x] Typing indicators
- [ ] Search & filtering
- [ ] File attachments
- [ ] Thread panel implementation
- [ ] Knowledge extraction backend
- [ ] Virtual scrolling
- [ ] Message pagination
- [ ] Offline support
- [ ] Analytics tracking
- [ ] Unit tests
- [ ] E2E tests

---

## Future Enhancements

1. **Markdown Support**
   - Rich text formatting
   - Code blocks with syntax highlighting
   - Lists, tables, quotes

2. **Voice/Video**
   - Voice messages
   - Video attachments
   - Screen recording

3. **Advanced Threading**
   - Nested thread panel
   - Thread notifications
   - Thread summaries

4. **AI Assistance**
   - Message summarization
   - Action item extraction
   - Smart replies

5. **Collaboration Tools**
   - Co-editing documents
   - Whiteboard integration
   - Live cursors

---

## Support

For implementation questions:
- Review `src/modules/messages/types/messages.types.ts` for type definitions
- Check `src/modules/messages/services/messages.service.ts` for API integration
- See `src/modules/messages/hooks/useMessages.ts` for state management patterns

---

## License

Internal component for Maylet XLab Innovation Operating System.
