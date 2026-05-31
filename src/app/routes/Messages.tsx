// C:\Users\user\maylet-xlab\src\app\routes\Messages.tsx
// PROFESSIONAL DIRECT MESSAGING – Conversations, real-time, unread counts

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface Conversation {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

// ============================================================
// SIDEBAR (consistent with other pages)
// ============================================================
const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const mainMenu = [
    { icon: '📊', label: 'Dashboard', route: '/dashboard' },
    { icon: '📁', label: 'Projects', route: '/projects' },
    { icon: '🧪', label: 'Experiments', route: '/experiments' },
    { icon: '🤖', label: 'AI Assistant', route: '/ai-assistant' },
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
// HELPER: fetch or create conversation between two users
// ============================================================
const getOrCreateConversation = async (userId: string, otherUserId: string): Promise<string | null> => {
  // Check if conversation already exists
  const { data: existing, error: queryError } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(user1_id.eq.${userId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${userId})`)
    .single();

  if (!queryError && existing) return existing.id;

  // Create new conversation
  const { data: newConv, error: createError } = await supabase
    .from('conversations')
    .insert({ user1_id: userId, user2_id: otherUserId })
    .select()
    .single();

  if (createError) return null;
  return newConv.id;
};

// ============================================================
// NEW CONVERSATION MODAL (search users)
// ============================================================
const NewConversationModal = ({ onClose, onConversationCreated }: { onClose: () => void; onConversationCreated: (conversationId: string, otherUserId: string) => void }) => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  const searchUsers = async () => {
    if (!search.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .ilike('full_name', `%${search}%`)
      .limit(10);
    if (!error && data) setUsers(data.filter(u => u.id !== currentUserId));
    setLoading(false);
  };

  const startConversation = async (otherUser: Profile) => {
    if (!currentUserId) return;
    const convId = await getOrCreateConversation(currentUserId, otherUser.id);
    if (convId) {
      onConversationCreated(convId, otherUser.id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>New Message</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <div className="modal-body">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            />
            <button onClick={searchUsers}>Search</button>
          </div>
          {loading && <p>Searching...</p>}
          <div className="user-list">
            {users.map(user => (
              <div key={user.id} className="user-item" onClick={() => startConversation(user)}>
                <div className="user-avatar">
                  {user.avatar_url ? <img src={user.avatar_url} alt="" /> : <span>{user.full_name?.[0] || '?'}</span>}
                </div>
                <div className="user-name">{user.full_name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN MESSAGES COMPONENT
// ============================================================
const Messages = () => {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate('/login');
      else setCurrentUserId(data.user.id);
    });
  }, [navigate]);

  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return;
    // Get all conversations where current user is participant
    const { data: convData, error } = await supabase
      .from('conversations')
      .select('id, user1_id, user2_id')
      .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);
    if (error) return;

    const convList: Conversation[] = await Promise.all(convData.map(async (conv) => {
      const otherUserId = conv.user1_id === currentUserId ? conv.user2_id : conv.user1_id;
      // Get other user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', otherUserId)
        .single();
      // Get last message
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      // Count unread messages (sent to current user, not read)
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('conversation_id', conv.id)
        .eq('receiver_id', currentUserId)
        .eq('read', false);
      return {
        id: conv.id,
        other_user_id: otherUserId,
        other_user_name: profile?.full_name || 'Unknown',
        other_user_avatar: profile?.avatar_url || null,
        last_message: lastMsg?.content || 'No messages yet',
        last_message_at: lastMsg?.created_at || conv.created_at,
        unread_count: count || 0,
      };
    }));
    convList.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
    setConversations(convList);
  }, [currentUserId]);

  const fetchMessages = useCallback(async () => {
    if (!activeConversationId) return;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', activeConversationId)
      .order('created_at', { ascending: true });
    if (error) return;
    setMessages(data || []);
    // Mark received messages as read
    const unreadIds = data?.filter(m => m.receiver_id === currentUserId && !m.read).map(m => m.id) || [];
    if (unreadIds.length) {
      await supabase.from('messages').update({ read: true }).in('id', unreadIds);
      fetchConversations(); // update unread counts
    }
  }, [activeConversationId, currentUserId, fetchConversations]);

  // Real-time subscriptions
  useEffect(() => {
    if (!activeConversationId) return;
    const channel = supabase
      .channel(`messages_${activeConversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConversationId}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages(prev => [...prev, newMsg]);
        if (newMsg.receiver_id === currentUserId && !newMsg.read) {
          // mark as read immediately
          supabase.from('messages').update({ read: true }).eq('id', newMsg.id);
          fetchConversations();
        }
        scrollToBottom();
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [activeConversationId, currentUserId, fetchConversations]);

  useEffect(() => {
    if (currentUserId) fetchConversations();
  }, [currentUserId, fetchConversations]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversationId || !currentUserId) return;
    setSending(true);
    const conversation = conversations.find(c => c.id === activeConversationId);
    if (!conversation) return;
    const receiverId = conversation.other_user_id;
    const { error } = await supabase.from('messages').insert({
      conversation_id: activeConversationId,
      sender_id: currentUserId,
      receiver_id: receiverId,
      content: newMessage.trim(),
      read: false,
      created_at: new Date().toISOString(),
    });
    if (!error) {
      setNewMessage('');
      fetchConversations();
      scrollToBottom();
    }
    setSending(false);
  };

  const handleConversationClick = (convId: string) => {
    setActiveConversationId(convId);
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  if (loading && conversations.length === 0) {
    return (
      <div className="messages-container">
        <Sidebar />
        <main className="messages-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  return (
    <div className="messages-container">
      <Sidebar />
      <main className="messages-main">
        <div className="messages-header">
          <h1>💬 Messages</h1>
          <button onClick={() => setShowNewModal(true)} className="new-conversation-btn">+ New Message</button>
        </div>

        <div className="messages-layout">
          {/* Conversations List */}
          <div className="conversations-panel">
            {conversations.length === 0 ? (
              <div className="empty-conversations">
                <p>No conversations yet.</p>
                <button onClick={() => setShowNewModal(true)}>Start a conversation</button>
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`conversation-item ${activeConversationId === conv.id ? 'active' : ''}`}
                  onClick={() => handleConversationClick(conv.id)}
                >
                  <div className="conv-avatar">
                    {conv.other_user_avatar ? <img src={conv.other_user_avatar} alt="" /> : <span>{conv.other_user_name?.[0] || '?'}</span>}
                  </div>
                  <div className="conv-details">
                    <div className="conv-name">{conv.other_user_name}</div>
                    <div className="conv-last-message">{conv.last_message.substring(0, 40)}...</div>
                    <div className="conv-time">{new Date(conv.last_message_at).toLocaleDateString()}</div>
                  </div>
                  {conv.unread_count > 0 && <div className="conv-unread">{conv.unread_count}</div>}
                </div>
              ))
            )}
          </div>

          {/* Chat Area */}
          <div className="chat-panel">
            {activeConversation ? (
              <>
                <div className="chat-header">
                  <div className="chat-avatar">
                    {activeConversation.other_user_avatar ? <img src={activeConversation.other_user_avatar} alt="" /> : <span>{activeConversation.other_user_name?.[0] || '?'}</span>}
                  </div>
                  <div className="chat-user-info">
                    <strong>{activeConversation.other_user_name}</strong>
                  </div>
                </div>
                <div className="chat-messages">
                  {messages.map(msg => (
                    <div key={msg.id} className={`message-bubble ${msg.sender_id === currentUserId ? 'sent' : 'received'}`}>
                      <div className="message-content">{msg.content}</div>
                      <div className="message-time">{new Date(msg.created_at).toLocaleTimeString()}</div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="chat-input-area">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type a message..."
                    rows={2}
                  />
                  <button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </>
            ) : (
              <div className="no-chat-selected">
                <p>Select a conversation or start a new one.</p>
                <button onClick={() => setShowNewModal(true)}>+ New Message</button>
              </div>
            )}
          </div>
        </div>

        {showNewModal && (
          <NewConversationModal
            onClose={() => setShowNewModal(false)}
            onConversationCreated={(convId, otherUserId) => {
              fetchConversations();
              setActiveConversationId(convId);
            }}
          />
        )}
      </main>

      <style>{`
        .messages-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        .messages-main {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 768px) {
          .messages-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        .messages-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .messages-header h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .new-conversation-btn {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 30px;
          cursor: pointer;
          font-weight: 600;
        }
        .messages-layout {
          display: flex;
          gap: 1.5rem;
          height: calc(100vh - 160px);
          min-height: 500px;
        }
        .conversations-panel {
          width: 320px;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          overflow-y: auto;
          padding: 1rem;
        }
        .conversation-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 16px;
          cursor: pointer;
          transition: background 0.2s;
          position: relative;
        }
        .conversation-item:hover {
          background: rgba(255,255,255,0.05);
        }
        .conversation-item.active {
          background: rgba(124,95,230,0.2);
          border-left: 3px solid #7c5fe6;
        }
        .conv-avatar {
          width: 48px;
          height: 48px;
          background: #7c5fe6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        .conv-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        .conv-details {
          flex: 1;
          overflow: hidden;
        }
        .conv-name {
          font-weight: 600;
        }
        .conv-last-message {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.6);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .conv-time {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.4);
        }
        .conv-unread {
          background: #2fd4ff;
          color: #0a0d1a;
          border-radius: 20px;
          padding: 0.2rem 0.5rem;
          font-size: 0.7rem;
          font-weight: bold;
        }
        .chat-panel {
          flex: 1;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .chat-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .chat-avatar {
          width: 40px;
          height: 40px;
          background: #7c5fe6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .message-bubble {
          max-width: 70%;
          padding: 0.5rem 0.8rem;
          border-radius: 20px;
          position: relative;
        }
        .message-bubble.sent {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          align-self: flex-end;
          color: #0a0d1a;
        }
        .message-bubble.received {
          background: rgba(255,255,255,0.1);
          align-self: flex-start;
        }
        .message-time {
          font-size: 0.6rem;
          margin-top: 0.2rem;
          opacity: 0.6;
          text-align: right;
        }
        .chat-input-area {
          padding: 1rem;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: flex;
          gap: 0.75rem;
        }
        .chat-input-area textarea {
          flex: 1;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 20px;
          padding: 0.6rem;
          color: white;
          resize: none;
        }
        .chat-input-area button {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          padding: 0 1rem;
          border-radius: 30px;
          cursor: pointer;
          font-weight: 600;
        }
        .no-chat-selected {
          text-align: center;
          padding: 2rem;
        }
        .empty-conversations {
          text-align: center;
          padding: 2rem;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: #1a1a2e;
          border-radius: 20px;
          width: 90%;
          max-width: 500px;
          padding: 1rem;
        }
        .search-box {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .user-list {
          max-height: 300px;
          overflow-y: auto;
        }
        .user-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          cursor: pointer;
          border-radius: 12px;
        }
        .user-item:hover {
          background: rgba(124,95,230,0.2);
        }
        .loading-spinner {
          width: 50px; height: 50px; border: 3px solid rgba(124,95,230,0.3); border-top-color: #7c5fe6;
          border-radius: 50%; animation: spin 1s linear infinite; margin: 20% auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .messages-layout {
            flex-direction: column;
          }
          .conversations-panel {
            width: 100%;
            max-height: 300px;
          }
          .message-bubble {
            max-width: 85%;
          }
        }
      `}</style>
    </div>
  );
};

export default Messages;