// C:\Users\user\maylet-xlab\src\app\routes\MayaAssistantPage.tsx
// MAYA AI Assistant – Real AI integration with OpenRouter (free tier)
// Supports project context, conversation memory, and streaming responses.

import { useState, useEffect, useRef } from 'react'; // ✅ removed unused useCallback
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

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
  timestamp: Date;
}

interface Conversation {
  id: string;
  projectId: string | null;
  messages: Message[];
  createdAt: Date;
}

// ============================================================
// SIDEBAR (same as other dashboard pages)
// ============================================================
const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const mainMenu = [
    { icon: '📊', label: 'Dashboard', route: '/dashboard' },
    { icon: '📁', label: 'Projects', route: '/projects' },
    { icon: '🧪', label: 'Experiments', route: '/experiments' },
    { icon: '🤖', label: 'AI Assistant', route: '/ai-assistant', active: true },
    { icon: '📦', label: 'Prototypes', route: '/prototypes' },
    { icon: '👥', label: 'Teams', route: '/teams' },
    { icon: '📄', label: 'Documents', route: '/documents' },
    { icon: '🔐', label: 'Innovation Vault', route: '/vault' },
    { icon: '💰', label: 'Funding Hub', route: '/funding' },
    { icon: '🎓', label: 'Mentorship', route: '/mentorship' },
    { icon: '🏢', label: 'Enterprise', route: '/enterprise' },
    { icon: '🏆', label: 'Hackathons', route: '/hackathons' },
    { icon: '📚', label: 'Learning Hub', route: '/learning' },
    { icon: '📈', label: 'Analytics', route: '/analytics' },
    { icon: '🛒', label: 'Marketplace', route: '/marketplace' },
    { icon: '💬', label: 'Feedback', route: '/feedback' },
    { icon: '🛠️', label: 'Help & Support', route: '/help' },
  ];

  const userMenu = [
    { icon: '🔔', label: 'Notifications', route: '/notifications' },
    { icon: '⚙️', label: 'Settings', route: '/settings' },
    { icon: '👤', label: 'Profile', route: '/profile' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <button className="mobile-sidebar-toggle" onClick={() => setMobileOpen(!mobileOpen)}>☰</button>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">✦</div>
          {!collapsed && (
            <div className="logo-text">
              <div className="logo-title">MAYLET X LAB</div>
              <div className="logo-tagline">Innovate. Build. Scale.</div>
            </div>
          )}
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '▶' : '◀'}
          </button>
        </div>
        <nav className="sidebar-nav">
          {mainMenu.map((item) => (
            <Link key={item.label} to={item.route} className={`sidebar-link ${item.active ? 'active' : ''}`} title={collapsed ? item.label : undefined}>
              <span className="sidebar-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-divider"></div>
        <nav className="sidebar-nav user-nav">
          {userMenu.map((item) => (
            <Link key={item.label} to={item.route} className="sidebar-link" title={collapsed ? item.label : undefined}>
              <span className="sidebar-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
          <button onClick={handleLogout} className="sidebar-link logout-link">
            <span className="sidebar-icon">🚪</span>
            {!collapsed && <span className="sidebar-label">Sign Out</span>}
          </button>
        </nav>
      </aside>
      <style>{`
        .sidebar-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 98; display: none; }
        .mobile-sidebar-toggle { display: none; position: fixed; top: 1rem; left: 1rem; z-index: 100; background: #7c5fe6; border: none; color: white; font-size: 1.5rem; width: 48px; height: 48px; border-radius: 12px; cursor: pointer; }
        .sidebar { position: fixed; top: 0; left: 0; height: 100vh; background: #0a0d1a; color: rgba(255,255,255,0.7); display: flex; flex-direction: column; z-index: 99; transition: width 0.3s ease; overflow-y: auto; overflow-x: hidden; width: 280px; box-shadow: 2px 0 10px rgba(0,0,0,0.3); }
        .sidebar.collapsed { width: 80px; }
        .sidebar-logo { padding: 1.5rem 1rem; display: flex; align-items: center; gap: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); position: relative; }
        .logo-icon { font-size: 2rem; font-weight: bold; background: linear-gradient(135deg, #7c5fe6, #2fd4ff); -webkit-background-clip: text; background-clip: text; color: transparent; min-width: 40px; text-align: center; }
        .logo-title { font-weight: 700; font-size: 1rem; color: white; }
        .logo-tagline { font-size: 0.65rem; color: rgba(255,255,255,0.5); }
        .sidebar-toggle { position: absolute; right: 0.5rem; background: rgba(255,255,255,0.1); border: none; color: white; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; }
        .sidebar-nav { flex: 1; padding: 1rem 0; }
        .sidebar-link { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; color: rgba(255,255,255,0.7); text-decoration: none; transition: all 0.2s; margin: 0.25rem 0.5rem; border-radius: 12px; background: none; border: none; width: calc(100% - 1rem); cursor: pointer; font-size: 0.9rem; }
        .sidebar-link:hover { background: rgba(124,95,230,0.2); color: white; }
        .sidebar-link.active { background: #7c5fe6; color: white; }
        .sidebar-icon { font-size: 1.25rem; min-width: 24px; text-align: center; }
        .sidebar-label { font-size: 0.85rem; white-space: nowrap; }
        .sidebar.collapsed .sidebar-label { display: none; }
        .sidebar.collapsed .sidebar-link { justify-content: center; padding: 0.75rem; }
        .sidebar-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 0.5rem 1rem; }
        .user-nav { margin-bottom: 1rem; }
        .logout-link { color: #fc8181; }
        .logout-link:hover { background: rgba(252,129,129,0.2); color: #fc8181; }
        @media (max-width: 768px) { .mobile-sidebar-toggle { display: block; } .sidebar { transform: translateX(-100%); width: 280px; } .sidebar.mobile-open { transform: translateX(0); } .sidebar-overlay { display: block; } }
      `}</style>
    </>
  );
};

// ============================================================
// HELPERS
// ============================================================
const getOpenRouterKey = (): string => {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!key) {
    throw new Error('Missing VITE_OPENROUTER_API_KEY in environment variables');
  }
  return key;
};

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

  // Load conversations from localStorage (or could be from Supabase)
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
      createdAt: new Date(),
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
      timestamp: new Date(),
    };

    // Update conversation with user message
    let currentConv = activeConversation;
    if (!currentConv) {
      // Create a new conversation if none active
      const newId = Date.now().toString();
      currentConv = {
        id: newId,
        projectId: selectedProjectId,
        messages: [],
        createdAt: new Date(),
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
      const apiKey = getOpenRouterKey();

      // Build messages array for API
      const systemPrompt = buildSystemPrompt(projectContext);
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...updatedMessages.map(m => ({ role: m.role, content: m.content })),
      ];

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1:free', // free tier model
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantContent = data.choices[0].message.content;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      setConversations(prev =>
        prev.map(c =>
          c.id === currentConv!.id
            ? { ...c, messages: [...c.messages, assistantMessage] }
            : c
        )
      );
    } catch (err) {
      console.error('AI request failed:', err);
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
      <Sidebar />
      <main className="maya-main">
        <div className="maya-header">
          <h1>🤖 MAYA AI Assistant</h1>
          <p>Your innovation co-pilot – ask anything about your projects, experiments, or startup journey</p>
        </div>

        <div className="maya-workspace">
          {/* Sidebar for conversations and project selector */}
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

          {/* Chat area */}
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
                    <div className="message-time">{msg.timestamp.toLocaleTimeString()}</div>
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
                  ⚠️ {error}. Please check your API key or try again later.
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
        .maya-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        .maya-main {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 768px) {
          .maya-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        .maya-header {
          margin-bottom: 2rem;
        }
        .maya-header h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .maya-header p {
          color: rgba(255,255,255,0.6);
          margin-top: 0.25rem;
        }
        .maya-workspace {
          display: flex;
          gap: 1.5rem;
          height: calc(100vh - 160px);
          min-height: 500px;
        }
        .maya-sidebar {
          width: 280px;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .project-selector label {
          font-size: 0.7rem;
          text-transform: uppercase;
          color: #7c5fe6;
          letter-spacing: 1px;
          display: block;
          margin-bottom: 0.25rem;
        }
        .project-selector select {
          width: 100%;
          padding: 0.5rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: white;
        }
        .context-hint {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
          margin-top: 0.5rem;
        }
        .conversations-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.5rem;
        }
        .new-chat-btn {
          background: #7c5fe6;
          border: none;
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          font-size: 0.7rem;
          cursor: pointer;
        }
        .conversations-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          overflow-y: auto;
        }
        .conv-item {
          background: rgba(255,255,255,0.05);
          border: none;
          border-radius: 12px;
          padding: 0.6rem;
          text-align: left;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
        }
        .conv-item.active {
          background: #7c5fe6;
        }
        .conv-title {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .empty-conv {
          color: rgba(255,255,255,0.4);
          text-align: center;
          font-size: 0.8rem;
          padding: 1rem;
        }
        .chat-area {
          flex: 1;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .messages-container {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .message {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }
        .message.user .message-avatar {
          background: #7c5fe6;
        }
        .message.assistant .message-avatar {
          background: #2fd4ff;
        }
        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.2);
        }
        .message-content {
          flex: 1;
          background: rgba(255,255,255,0.05);
          padding: 0.75rem;
          border-radius: 16px;
        }
        .message.user .message-content {
          background: rgba(124,95,230,0.2);
        }
        .message-text {
          white-space: pre-wrap;
          line-height: 1.5;
          font-size: 0.9rem;
        }
        .message-time {
          font-size: 0.6rem;
          color: rgba(255,255,255,0.4);
          margin-top: 0.25rem;
        }
        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 0.25rem 0;
        }
        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: bounce 1.4s infinite;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        .welcome-message {
          text-align: center;
          padding: 2rem;
        }
        .welcome-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .suggestions {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 1rem;
        }
        .suggestions button {
          background: rgba(255,255,255,0.1);
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 30px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        .suggestions button:hover {
          background: #7c5fe6;
        }
        .input-area {
          padding: 1rem;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: flex;
          gap: 1rem;
        }
        .input-area textarea {
          flex: 1;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 20px;
          padding: 0.75rem;
          color: white;
          resize: none;
        }
        .input-area button {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          padding: 0 1.5rem;
          border-radius: 40px;
          font-weight: 600;
          cursor: pointer;
          color: #0a0d1a;
        }
        .input-area button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .error-message {
          background: rgba(252,129,129,0.2);
          border: 1px solid #fc8181;
          border-radius: 12px;
          padding: 0.75rem;
          color: #fc8181;
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  );
};

export default MayaAssistantPage;