// C:\Users\user\maylet-xlab\src\app\routes\MayaAssistantPage.tsx
// MAYA AI Assistant – Real AI integration with GROQ
// Supports project context, conversation memory.
// Fixed: timestamp stored as ISO string, converted to Date on load.

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';
import '../../../styles/maya.css';

// ============================================================
// TYPES
// ============================================================
interface Project {
  id: string;
  name: string;
  description: string;
  sector: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // Store as ISO string for serialization
}

interface Conversation {
  id: string;
  projectId: string | null;
  messages: Message[];
  createdAt: string; // ISO string
}

// ============================================================
// HELPERS
// ============================================================
const buildSystemPrompt = (projectContext: string | null): string => {
  if (projectContext) {
    return `You are MAYA, the AI innovation co-pilot for Maylet XLab. 
The user is currently working on the following project context:
"""${projectContext}"""
Answer as a helpful, concise, and expert innovation advisor. Focus on practical advice, next steps, and actionable insights. Keep responses clear and professional.`;
  }
  return `You are MAYA, the AI innovation co-pilot for Maylet XLab. 
You help innovators validate ideas, run experiments, build prototypes, and secure funding. 
Answer clearly and concisely, always suggesting next steps.`;
};

// Helper to format timestamp for display
const formatTime = (isoString: string) => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString();
  } catch {
    return '';
  }
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const MayaAssistantPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch user's projects
  useEffect(() => {
    const fetchProjects = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, sector')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setProjects(data as Project[]);
      }
    };
    fetchProjects();
  }, [navigate]);

  // Get selected project context string
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const projectContext = selectedProject
    ? `Project: ${selectedProject.name}\nSector: ${selectedProject.sector}\nDescription: ${selectedProject.description}`
    : null;

  // Load conversations from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('maya_conversations');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Conversation[];
        setConversations(parsed);
        if (parsed.length > 0) setActiveConversationId(parsed[0].id);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('maya_conversations', JSON.stringify(conversations));
  }, [conversations]);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      projectId: selectedProjectId,
      messages: [],
      createdAt: new Date().toISOString(),
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    // Update conversation with user message
    let currentConv = activeConversation;
    if (!currentConv) {
      const newId = Date.now().toString();
      currentConv = {
        id: newId,
        projectId: selectedProjectId,
        messages: [],
        createdAt: new Date().toISOString(),
      };
      setConversations(prev => [currentConv!, ...prev]);
      setActiveConversationId(newId);
    }

    const updatedMessages = [...(currentConv?.messages || []), userMessage];
    setConversations(prev =>
      prev.map(c =>
        c.id === currentConv!.id ? { ...c, messages: updatedMessages, projectId: selectedProjectId } : c
      )
    );
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const systemPrompt = buildSystemPrompt(projectContext);
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...updatedMessages.map(m => ({ role: m.role, content: m.content })),
      ];

      // AI calls are proxied through the maya-chat Edge Function so that
      // provider API keys never reach the browser.
      const { data, error: fnError } = await supabase.functions.invoke('maya-chat', {
        body: { messages: apiMessages, model: 'groq' },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const assistantContent = data?.choices?.[0]?.message?.content;
      if (!assistantContent) throw new Error('AI service returned no content');

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString(),
      };

      setConversations(prev =>
        prev.map(c =>
          c.id === currentConv!.id
            ? { ...c, messages: [...c.messages, assistantMessage] }
            : c
        )
      );
    } catch (err) {
      console.error('Groq API request failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response from AI');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="maya-container">
      <main className="maya-main">
        <div className="maya-header">
          <h1>🤖 MAYA AI Assistant</h1>
          <p>Your innovation co-pilot – ask anything about your projects, experiments, or startup journey</p>
        </div>

        <div className="maya-workspace">
          <aside className="maya-sidebar">
            <div className="project-selector">
              <label>📁 Project Context</label>
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value || null)}
              >
                <option value="">General (no project context)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sector})</option>
                ))}
              </select>
              <p className="context-hint">
                {selectedProject ? `Using context: ${selectedProject.name}` : 'General innovation advice'}
              </p>
            </div>

            <div className="conversations-header">
              <span>📋 Conversations</span>
              <button onClick={createNewConversation} className="new-chat-btn">+ New</button>
            </div>
            <div className="conversations-list">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  className={`conv-item ${activeConversationId === conv.id ? 'active' : ''}`}
                  onClick={() => setActiveConversationId(conv.id)}
                >
                  <span>💬</span>
                  <span className="conv-title">
                    {conv.messages[0]?.content.slice(0, 30) || 'New conversation'}
                  </span>
                </button>
              ))}
              {conversations.length === 0 && (
                <div className="empty-conv">No conversations yet. Start a new one!</div>
              )}
            </div>
          </aside>

          <div className="chat-area">
            <div className="messages-container">
              {activeConversation?.messages.length === 0 && (
                <div className="welcome-message">
                  <div className="welcome-icon">✨</div>
                  <h3>How can MAYA help you today?</h3>
                  <p>Try asking about:</p>
                  <div className="suggestions">
                    <button onClick={() => setInput('How do I validate my startup idea?')}>💡 Validate an idea</button>
                    <button onClick={() => setInput('What experiments should I run for my project?')}>🧪 Experiments</button>
                    <button onClick={() => setInput('How can I improve my pitch deck?')}>📈 Fundraising tips</button>
                  </div>
                </div>
              )}
              {activeConversation?.messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.role}`}>
                  <div className="message-avatar">{msg.role === 'user' ? '👤' : '🤖'}</div>
                  <div className="message-content">
                    <div className="message-text">{msg.content}</div>
                    <div className="message-time">{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message assistant">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="error-message">
                  ⚠️ {error}. Please try again later.
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask MAYA anything about your innovation journey..."
                rows={3}
                disabled={loading}
              />
              <button onClick={sendMessage} disabled={loading || !input.trim()}>
                {loading ? 'Thinking...' : 'Send →'}
              </button>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        /* (same styles as before – omitted for brevity, but keep all existing CSS) */
        .maya-container { display: flex; min-height: 100vh; background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%); }
        .maya-main { flex: 1; margin-left: 0; padding: 2rem; transition: margin-left 0.3s ease; }
        @media (max-width: 768px) { .maya-main { margin-left: 0; padding: 1rem; padding-top: 5rem; } }
        .maya-header { margin-bottom: 2rem; }
        .maya-header h1 { font-size: 1.8rem; background: linear-gradient(135deg, #fff, #9b7ff0); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .maya-header p { color: rgba(255,255,255,0.6); margin-top: 0.25rem; }
        .maya-workspace { display: flex; gap: 1.5rem; height: calc(100vh - 160px); min-height: 500px; }
        .maya-sidebar { width: 280px; background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); border-radius: 20px; padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
        .project-selector label { font-size: 0.7rem; text-transform: uppercase; color: #7c5fe6; letter-spacing: 1px; display: block; margin-bottom: 0.25rem; }
        .project-selector select { width: 100%; padding: 0.5rem; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white; }
        .context-hint { font-size: 0.7rem; color: rgba(255,255,255,0.5); margin-top: 0.5rem; }
        .conversations-header { display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; }
        .new-chat-btn { background: #7c5fe6; border: none; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.7rem; cursor: pointer; }
        .conversations-list { display: flex; flex-direction: column; gap: 0.5rem; overflow-y: auto; }
        .conv-item { background: rgba(255,255,255,0.05); border: none; border-radius: 12px; padding: 0.6rem; text-align: left; color: white; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; }
        .conv-item.active { background: #7c5fe6; }
        .conv-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .empty-conv { color: rgba(255,255,255,0.4); text-align: center; font-size: 0.8rem; padding: 1rem; }
        .chat-area { flex: 1; background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); border-radius: 20px; display: flex; flex-direction: column; overflow: hidden; }
        .messages-container { flex: 1; padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; }
        .message { display: flex; gap: 0.75rem; align-items: flex-start; }
        .message.user .message-avatar { background: #7c5fe6; }
        .message.assistant .message-avatar { background: #2fd4ff; }
        .message-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.2); }
        .message-content { flex: 1; background: rgba(255,255,255,0.05); padding: 0.75rem; border-radius: 16px; }
        .message.user .message-content { background: rgba(124,95,230,0.2); }
        .message-text { white-space: pre-wrap; line-height: 1.5; font-size: 0.9rem; }
        .message-time { font-size: 0.6rem; color: rgba(255,255,255,0.4); margin-top: 0.25rem; }
        .typing-indicator { display: flex; gap: 4px; padding: 0.25rem 0; }
        .typing-indicator span { width: 8px; height: 8px; background: white; border-radius: 50%; animation: bounce 1.4s infinite; }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
        .welcome-message { text-align: center; padding: 2rem; }
        .welcome-icon { font-size: 3rem; margin-bottom: 1rem; }
        .suggestions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; margin-top: 1rem; }
        .suggestions button { background: rgba(255,255,255,0.1); border: none; padding: 0.5rem 1rem; border-radius: 30px; color: white; cursor: pointer; transition: all 0.2s; }
        .suggestions button:hover { background: #7c5fe6; }
        .input-area { padding: 1rem; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 1rem; }
        .input-area textarea { flex: 1; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; padding: 0.75rem; color: white; resize: none; }
        .input-area button { background: linear-gradient(135deg, #7c5fe6, #2fd4ff); border: none; padding: 0 1.5rem; border-radius: 40px; font-weight: 600; cursor: pointer; color: #0a0d1a; }
        .input-area button:disabled { opacity: 0.5; cursor: not-allowed; }
        .error-message { background: rgba(252,129,129,0.2); border: 1px solid #fc8181; border-radius: 12px; padding: 0.75rem; color: #fc8181; margin: 0.5rem 0; }
      `}</style>
    </div>
  );
};

export default MayaAssistantPage;