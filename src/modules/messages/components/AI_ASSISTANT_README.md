# AI Assistant Panel - Production Implementation

## Overview

A **production-ready AI Assistant Panel** for Maylet XLab's messaging workspace. This is an **assistant only** — not a copilot, not autonomous, not a system controller.

## Purpose

Provides users with an AI assistant that can:

- ✅ Answer questions about the platform
- ✅ Explain features and workflows
- ✅ Help navigate the system
- ✅ Generate ideas and suggestions
- ✅ Summarize discussions
- ✅ Assist with research
- ✅ Help draft content

## Features

### 1. **Chat Interface**
- User messages with timestamps
- AI responses with thinking indicator
- Conversation history
- Auto-scroll to latest message
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)

### 2. **Quick Actions** (6 buttons)
- 💡 Explain this page
- 📝 Summarize conversation
- ✨ Generate ideas
- 🔍 Research assistance
- ✍️ Draft content
- ❓ Ask a question

### 3. **Context-Aware Suggested Questions**
Based on page context (messages, projects, research, community)

### 4. **Online Status Indicator**
Shows whether the AI service is available

### 5. **Empty State**
Welcoming UI when no conversation exists

## Usage

### Basic Usage

```tsx
import { AiAssistantPanel } from '@/modules/messages/components/AiAssistantPanel';

function MessagesPage() {
  return (
    <div className="messages-layout">
      <ConversationList />
      <ChatWindow />
      <AiAssistantPanel />
    </div>
  );
}
```

### With Context

```tsx
<AiAssistantPanel
  context={{
    conversationId: 'uuid-123',
    projectId: 'uuid-456',
    userId: 'uuid-789',
    pageContext: 'messages', // 'messages' | 'projects' | 'research' | 'community'
  }}
  onClose={() => console.log('Panel closed')}
/>
```

## Props

```typescript
interface Props {
  context?: AssistantContext;
  onClose?: () => void;
}

interface AssistantContext {
  conversationId?: string;  // Current conversation ID
  projectId?: string;        // Associated project
  userId?: string;           // Current user
  pageContext?: 'messages' | 'projects' | 'research' | 'community';
}
```

## Integration with AI Service

### Replace Mock Function

The component includes a `mockAiResponse()` function for demo purposes. Replace it with your actual AI service:

```typescript
// Replace this function:
async function mockAiResponse(userMessage: string, context?: AssistantContext): Promise<string> {
  // Mock implementation
}

// With your AI service:
import { mayaAiService } from '@/lib/maya/mayaChat.service';

async function getAiResponse(userMessage: string, context?: AssistantContext): Promise<string> {
  const response = await mayaAiService.chat({
    message: userMessage,
    context: {
      conversationId: context?.conversationId,
      projectId: context?.projectId,
      pageContext: context?.pageContext,
    },
  });
  
  return response.content;
}
```

### Example AI Service Integration

```typescript
// src/modules/messages/services/assistantAI.service.ts
import { supabase } from '@/lib/supabase/client';

export const assistantAiService = {
  async chat(message: string, context?: AssistantContext): Promise<string> {
    // Option 1: Use Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('ai-assistant', {
      body: {
        message,
        context,
      },
    });

    if (error) throw error;
    return data.response;

    // Option 2: Direct API call
    // const response = await fetch('/api/ai/assistant', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ message, context }),
    // });
    // 
    // const data = await response.json();
    // return data.response;
  },
};
```

## Styling

The component uses scoped styles (CSS-in-JS via `<style jsx>`). All styles are prefixed with `.ai-assistant-*` to avoid conflicts.

### Key CSS Classes

- `.ai-assistant-panel` - Container
- `.ai-assistant-header` - Top header with status
- `.ai-assistant-quick-actions` - Quick action buttons grid
- `.ai-assistant-messages` - Scrollable message list
- `.ai-assistant-message--user` - User messages (right-aligned, purple)
- `.ai-assistant-message--assistant` - AI messages (left-aligned, gray)
- `.ai-assistant-suggestions` - Suggested questions
- `.ai-assistant-footer` - Input area

### Color Palette

```css
Background: #1a1a2e
Header: #16172a
Cards: #252538
Borders: #2d2d3f
Primary: #7c5fe6
Text: #e2e8f0
Muted: #94a3b8
Online: #10b981
```

## Keyboard Shortcuts

- `Enter` - Send message
- `Shift + Enter` - New line in input

## Accessibility

- ✅ Semantic HTML (`header`, `footer`, `form`)
- ✅ ARIA labels on buttons
- ✅ Keyboard navigation
- ✅ Focus management (auto-focus input on mount)
- ✅ Disabled states for loading/offline

## State Management

### Internal State

```typescript
const [messages, setMessages] = useState<AiMessage[]>([]);     // Chat history
const [input, setInput] = useState('');                         // Current input
const [isLoading, setIsLoading] = useState(false);             // AI thinking
const [isOnline, setIsOnline] = useState(true);                // Service status
```

### Message Structure

```typescript
interface AiMessage {
  id: string;                    // Unique ID
  role: 'user' | 'assistant';    // Message sender
  content: string;               // Message text
  timestamp: Date;               // Sent time
}
```

## Context-Aware Behavior

The component shows different suggested questions based on `context.pageContext`:

### Messages Context
- "How do I start a new conversation?"
- "Can you summarize this discussion?"
- "What are the action items from this chat?"

### Projects Context
- "How do I create a new project?"
- "What makes a good project description?"
- "How do I track project progress?"

### Research Context
- "How does the research center work?"
- "Can you help me find relevant papers?"
- "How do I document findings?"

### Community Context
- "How do I connect with mentors?"
- "What are the best practices for community posts?"
- "How do I join a hackathon?"

### Default (no context)
- "What can you help me with?"
- "How does Maylet XLab work?"
- "Show me quick start tips"

## Production Checklist

- [ ] Replace `mockAiResponse()` with actual AI service
- [ ] Add error tracking (Sentry integration)
- [ ] Implement conversation persistence (save to DB)
- [ ] Add rate limiting on AI calls
- [ ] Add conversation history loading
- [ ] Implement "clear conversation" button
- [ ] Add export conversation feature
- [ ] Add feedback buttons (👍 👎) on AI responses
- [ ] Monitor AI service uptime → update `isOnline` state
- [ ] Add analytics tracking (user interactions)

## Testing

### Manual Testing

1. **Empty State**
   - Load panel → Should show welcome message and quick actions

2. **Quick Actions**
   - Click each button → Should send predefined prompt

3. **User Message**
   - Type message → Press Enter → Should show user message and AI response

4. **Suggested Questions**
   - Click suggestion → Should send that question

5. **Keyboard Shortcuts**
   - Press Enter → Send
   - Press Shift+Enter → New line

6. **Loading State**
   - Send message → Should show "Thinking..." loader

7. **Scroll Behavior**
   - Send multiple messages → Should auto-scroll to bottom

### Unit Tests (Future)

```typescript
// AiAssistantPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AiAssistantPanel } from './AiAssistantPanel';

test('renders empty state', () => {
  render(<AiAssistantPanel />);
  expect(screen.getByText('How can I help you today?')).toBeInTheDocument();
});

test('sends message on Enter key', () => {
  render(<AiAssistantPanel />);
  const input = screen.getByPlaceholderText('Ask me anything...');
  
  fireEvent.change(input, { target: { value: 'Hello' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

## Performance

- ✅ Auto-scroll uses `smooth` behavior (UX optimized)
- ✅ Textarea auto-grows up to 120px max-height
- ✅ No unnecessary re-renders (proper React key usage)
- ✅ Lazy imports for heavy dependencies (if added)

## Security

- ✅ No XSS vulnerabilities (React escapes by default)
- ✅ Input sanitization on server-side (AI service responsibility)
- ✅ Rate limiting should be implemented on API level
- ✅ Context data is typed and validated

## Future Enhancements

1. **Conversation Persistence**
   - Save messages to database
   - Load previous conversations
   - Conversation list sidebar

2. **Rich Formatting**
   - Markdown support in AI responses
   - Code syntax highlighting
   - Link previews

3. **Voice Input**
   - Speech-to-text for input
   - Text-to-speech for responses

4. **File Attachments**
   - Upload context documents
   - Share screenshots

5. **Collaboration**
   - Share conversation with team
   - Multi-user chat with AI

6. **Advanced Features**
   - Conversation branching
   - Save favorite prompts
   - Custom quick actions per user

## Support

For issues or questions:
- Check `src/modules/messages/types/messages.types.ts` for type definitions
- Review `src/modules/messages/services/` for service integrations
- See `src/lib/maya/` for MAYA AI system documentation

## License

Internal component for Maylet XLab. Not for external distribution.
