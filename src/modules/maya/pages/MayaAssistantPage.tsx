// src/modules/maya/pages/MayaAssistantPage.tsx
// MAYA AI Assistant – Real AI integration with GROQ
// Supports project context, conversation memory.
// Fully responsive: works on mobile, tablet, and desktop.

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';
import { invokeMayaChat } from '../../../lib/maya/mayaChat.service';
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
  timestamp: string; // ISO string
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

const formatTime = (isoString: string) => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
      } catch (e) { /* ignore parse errors */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('maya_conversations', JSON.stringify(conversations));
  }, [conversations]);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, scrollToBottom]);

  // Auto-grow textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  // Close mobile sidebar on outside click
  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      projectId: selectedProjectId,
      messages: [],
      createdAt: new Date().toISOString(),
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setMobileSidebarOpen(false);
  };

  const selectConversation = (id: string) => {
    setActiveConversationId(id);
    setMobileSidebarOpen(false); // close drawer after selection on mobile
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

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

      const assistantContent = await invokeMayaChat(apiMessages, 'groq');

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
      console.error('MAYA AI request failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response from AI');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="maya-container">
      {/* ── Header ── */}
      <div className="maya-header">
        <button
          className="maya-sidebar-toggle"
          onClick={() => setMobileSidebarOpen(o => !o)}
          aria-label="Toggle conversations"
        >
          💬
        </button>
        <div className="maya-header-text">
          <h1>🤖 MAYA AI Assistant</h1>
          <p>Your innovation co-pilot – ask anything about your projects</p>
        </div>
      </div>

      {/* ── Mobile overlay ── */}
      <div
        className={`maya-sidebar-overlay ${mobileSidebarOpen ? 'is-open' : ''}`}
        onClick={closeMobileSidebar}
        aria-hidden="true"
      />

      {/* ── Workspace ── */}
      <div className="maya-workspace">

        {/* ── Sidebar ── */}
        <aside className={`maya-sidebar ${mobileSidebarOpen ? 'is-open' : ''}`}>
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
              {selectedProject ? `Context: ${selectedProject.name}` : 'General innovation advice'}
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
                onClick={() => selectConversation(conv.id)}
              >
                <span>💬</span>
                <span className="conv-title">
                  {conv.messages[0]?.content.slice(0, 28) || 'New conversation'}
                </span>
              </button>
            ))}
            {conversations.length === 0 && (
              <div className="empty-conv">No conversations yet. Start one!</div>
            )}
          </div>
        </aside>

        {/* ── Chat Area ── */}
        <div className="chat-area">
          <div className="messages-container">
            {/* Welcome state */}
            {(!activeConversation || activeConversation.messages.length === 0) && (
              <div className="welcome-message">
                <div className="welcome-icon">✨</div>
                <h3>How can MAYA help you today?</h3>
                <p>Try asking about:</p>
                <div className="suggestions">
                  <button onClick={() => setInput('How do I validate my startup idea?')}>
                    💡 Validate an idea
                  </button>
                  <button onClick={() => setInput('What experiments should I run for my project?')}>
                    🧪 Experiments
                  </button>
                  <button onClick={() => setInput('How can I improve my pitch deck?')}>
                    📈 Fundraising tips
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            {activeConversation?.messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">
                  <div className="message-text">{msg.content}</div>
                  <div className="message-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="message assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="error-message">
                ⚠️ {error}. Please try again later.
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Input ── */}
          <div className="input-area">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask MAYA anything about your innovation journey..."
              rows={1}
              disabled={loading}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}>
              {loading ? '...' : 'Send →'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MayaAssistantPage;