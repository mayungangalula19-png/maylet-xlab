import { useState, useEffect } from 'react';

type User = { id: string; email?: string | null };

import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  created_at: string;
  updated_at: string;
  attachments?: string[];
}

interface FAQCategory {
  id: string;
  name: string;
  icon: string;
  questions: FAQItem[];
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category_id: string;
}

interface KnowledgeBaseArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  views: number;
  helpful: number;
  created_at: string;
}

const Support = () => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'faq' | 'knowledge' | 'contact'>('tickets');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', category: 'technical', priority: 'medium' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [liveChatOpen, setLiveChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: string; message: string; time: string }[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');

  // FAQ Data
  const faqCategories: FAQCategory[] = [
    {
      id: 'account',
      name: 'Account & Profile',
      icon: '👤',
      questions: [
        { id: '1', question: 'How do I create an account?', answer: 'Click "Get Started" on the homepage, fill in your email and password, then verify your email address.', category_id: 'account' },
        { id: '2', question: 'How do I reset my password?', answer: 'Go to login page, click "Forgot Password", enter your email, and follow the instructions sent to your inbox.', category_id: 'account' },
        { id: '3', question: 'Can I delete my account?', answer: 'Yes, go to Settings → Account → Delete Account. This action is permanent.', category_id: 'account' },
      ],
    },
    {
      id: 'billing',
      name: 'Billing & Subscription',
      icon: '💰',
      questions: [
        { id: '4', question: 'What payment methods do you accept?', answer: 'We accept credit cards (Visa, Mastercard), PayPal, and mobile money (M-Pesa, Tigo Pesa, Airtel Money).', category_id: 'billing' },
        { id: '5', question: 'Can I upgrade or downgrade my plan?', answer: 'Yes, you can change your plan anytime in Settings → Billing. Changes take effect immediately.', category_id: 'billing' },
        { id: '6', question: 'Is there a free trial?', answer: 'Pro plan comes with a 14-day free trial. No credit card required.', category_id: 'billing' },
      ],
    },
    {
      id: 'technical',
      name: 'Technical Support',
      icon: '🔧',
      questions: [
        { id: '7', question: 'How does AI validation work?', answer: 'Our AI analyzes your idea against market data, competitor landscapes, and success patterns to give you a feasibility score.', category_id: 'technical' },
        { id: '8', question: 'Is my data secure?', answer: 'Yes, we use AES-256 encryption and follow industry best practices for data security.', category_id: 'technical' },
        { id: '9', question: 'How do I invite team members?', answer: 'Go to Teams → Invite Member, enter their email, and they will receive an invitation.', category_id: 'technical' },
      ],
    },
    {
      id: 'features',
      name: 'Features & Usage',
      icon: '⚡',
      questions: [
        { id: '10', question: 'What is the Innovation Vault?', answer: 'A secure place to store and timestamp your ideas with blockchain-grade encryption for IP protection.', category_id: 'features' },
        { id: '11', question: 'How does the Funding Hub work?', answer: 'Create a pitch, submit it to our network of investors, and track interest directly on the platform.', category_id: 'features' },
        { id: '12', question: 'Can I export my data?', answer: 'Yes, Pro and Enterprise plans allow data export in CSV and JSON formats.', category_id: 'features' },
      ],
    },
  ];

  // Knowledge Base Articles
  const knowledgeArticles: KnowledgeBaseArticle[] = [
    { id: '1', title: 'Getting Started with Maylet XLab', excerpt: 'Learn the basics of navigating the platform and creating your first project.', content: '', category: 'Getting Started', views: 1245, helpful: 98, created_at: '2025-01-15' },
    { id: '2', title: 'How to Run an AI Experiment', excerpt: 'Step-by-step guide to validating your idea with our AI engine.', content: '', category: 'AI Features', views: 892, helpful: 95, created_at: '2025-01-20' },
    { id: '3', title: 'Managing Your Team', excerpt: 'Invite members, assign roles, and collaborate effectively.', content: '', category: 'Collaboration', views: 567, helpful: 92, created_at: '2025-02-01' },
    { id: '4', title: 'Understanding Pricing Plans', excerpt: 'Compare Free, Pro, and Enterprise features to choose the right plan.', content: '', category: 'Billing', views: 2341, helpful: 97, created_at: '2025-02-10' },
    { id: '5', title: 'Protecting Your IP with Innovation Vault', excerpt: 'How to timestamp and secure your ideas legally.', content: '', category: 'Security', views: 678, helpful: 94, created_at: '2025-02-15' },
    { id: '6', title: 'Raising Funds Through Funding Hub', excerpt: 'Tips for creating winning pitches and attracting investors.', content: '', category: 'Funding', views: 1034, helpful: 96, created_at: '2025-03-01' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Fetch user tickets from Supabase
      const { data: ticketsData } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (ticketsData) {
        setTickets(ticketsData);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const createTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) return;

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user?.id,
        subject: newTicket.subject,
        message: newTicket.message,
        category: newTicket.category,
        priority: newTicket.priority,
        status: 'open',
      })
      .select()
      .single();

    if (!error && data) {
      setTickets([data, ...tickets]);
      setShowNewTicketForm(false);
      setNewTicket({ subject: '', message: '', category: 'technical', priority: 'medium' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#fc8181';
      case 'high': return '#f6c90e';
      case 'medium': return '#4fd1c5';
      default: return '#48bb78';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#fc8181';
      case 'in_progress': return '#f6c90e';
      case 'resolved': return '#48bb78';
      default: return '#6b6b7a';
    }
  };

  const filteredArticles = knowledgeArticles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFAQ = faqCategories
    .filter(cat => selectedCategory === 'all' || cat.id === selectedCategory)
    .flatMap(cat => cat.questions);

  const sendChatMessage = () => {
    if (!newChatMessage.trim()) return;
    setChatMessages([...chatMessages, { sender: 'user', message: newChatMessage, time: new Date().toLocaleTimeString() }]);
    setNewChatMessage('');
    // Simulate support response
    setTimeout(() => {
      setChatMessages(prev => [...prev, { sender: 'support', message: 'Thank you for your message. A support agent will respond shortly.', time: new Date().toLocaleTimeString() }]);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading support center...</p>
      </div>
    );
  }

  return (
    <div className="support-page">
      {/* Hero Section */}
      <div className="support-hero">
        <h1>How can we help you?</h1>
        <p>Get answers to your questions, submit support tickets, or browse our knowledge base.</p>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search for help articles, FAQs, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className={`quick-btn ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}>
          <span className="btn-icon">🎫</span> My Tickets
        </button>
        <button className={`quick-btn ${activeTab === 'faq' ? 'active' : ''}`} onClick={() => setActiveTab('faq')}>
          <span className="btn-icon">❓</span> FAQ
        </button>
        <button className={`quick-btn ${activeTab === 'knowledge' ? 'active' : ''}`} onClick={() => setActiveTab('knowledge')}>
          <span className="btn-icon">📚</span> Knowledge Base
        </button>
        <button className={`quick-btn ${activeTab === 'contact' ? 'active' : ''}`} onClick={() => setActiveTab('contact')}>
          <span className="btn-icon">📧</span> Contact Us
        </button>
      </div>

      {/* TICKETS TAB */}
      {activeTab === 'tickets' && (
        <div className="tickets-section">
          <div className="tickets-header">
            <h2>Support Tickets</h2>
            <button className="btn-primary" onClick={() => setShowNewTicketForm(true)}>+ New Ticket</button>
          </div>

          {tickets.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎫</span>
              <h3>No tickets yet</h3>
              <p>Submit a support ticket and we'll get back to you within 24 hours.</p>
              <button className="btn-primary" onClick={() => setShowNewTicketForm(true)}>Create New Ticket</button>
            </div>
          ) : (
            <div className="tickets-list">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="ticket-card">
                  <div className="ticket-status">
                    <span className="status-dot" style={{ background: getStatusColor(ticket.status) }}></span>
                  </div>
                  <div className="ticket-info">
                    <div className="ticket-subject">{ticket.subject}</div>
                    <div className="ticket-meta">
                      <span className="ticket-category">{ticket.category}</span>
                      <span className="ticket-date">{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="ticket-priority">
                    <span className="priority-badge" style={{ background: getPriorityColor(ticket.priority) }}>{ticket.priority}</span>
                  </div>
                  <div className="ticket-status-text">{ticket.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FAQ TAB */}
      {activeTab === 'faq' && (
        <div className="faq-section">
          <div className="faq-categories">
            <button className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>All</button>
            {faqCategories.map((cat) => (
              <button key={cat.id} className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`} onClick={() => setSelectedCategory(cat.id)}>
                <span>{cat.icon}</span> {cat.name}
              </button>
            ))}
          </div>
          <div className="faq-list">
            {filteredFAQ.map((faq) => (
              <details key={faq.id} className="faq-item">
                <summary className="faq-question">{faq.question}</summary>
                <div className="faq-answer">{faq.answer}</div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* KNOWLEDGE BASE TAB */}
      {activeTab === 'knowledge' && (
        <div className="knowledge-section">
          <div className="knowledge-stats">
            <div className="stat"><span>{knowledgeArticles.length}</span> Articles</div>
            <div className="stat"><span>{knowledgeArticles.reduce((sum, a) => sum + a.views, 0)}</span> Total Views</div>
            <div className="stat"><span>{Math.round(knowledgeArticles.reduce((sum, a) => sum + a.helpful, 0) / knowledgeArticles.length)}%</span> Helpful Rate</div>
          </div>
          <div className="knowledge-grid">
            {filteredArticles.map((article) => (
              <Link to={`/support/article/${article.id}`} key={article.id} className="knowledge-card">
                <div className="article-category">{article.category}</div>
                <h3>{article.title}</h3>
                <p>{article.excerpt}</p>
                <div className="article-meta">
                  <span>👁️ {article.views} views</span>
                  <span>👍 {article.helpful}% helpful</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CONTACT TAB */}
      {activeTab === 'contact' && (
        <div className="contact-section">
          <div className="contact-grid">
            <div className="contact-form-card">
              <h3>Send us a message</h3>
              <form>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="John Innovator" />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" placeholder="john@example.com" defaultValue={user?.email || ''} />
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <input type="text" placeholder="What is your question about?" />
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea rows={5} placeholder="Describe your issue in detail..."></textarea>
                </div>
                <button type="submit" className="btn-primary">Send Message →</button>
              </form>
            </div>
            <div className="contact-info-card">
              <h3>Other ways to reach us</h3>
              <div className="contact-method">
                <span className="method-icon">📧</span>
                <div>
                  <strong>Email Support</strong>
                  <p>support@mayletxlab.com</p>
                  <small>Response within 24 hours</small>
                </div>
              </div>
              <div className="contact-method">
                <span className="method-icon">💬</span>
                <div>
                  <strong>Live Chat</strong>
                  <p>Available Mon-Fri, 9 AM - 6 PM EAT</p>
                  <button className="chat-btn" onClick={() => setLiveChatOpen(true)}>Start Chat →</button>
                </div>
              </div>
              <div className="contact-method">
                <span className="method-icon">📞</span>
                <div>
                  <strong>Phone Support</strong>
                  <p>+255 123 456 789</p>
                  <small>Enterprise plan only</small>
                </div>
              </div>
              <div className="contact-method">
                <span className="method-icon">🌐</span>
                <div>
                  <strong>Community Forum</strong>
                  <p>Connect with other innovators</p>
                  <Link to="/community" className="forum-link">Visit Community →</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewTicketForm && (
        <div className="modal-overlay" onClick={() => setShowNewTicketForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create Support Ticket</h3>
            <div className="form-group">
              <label>Subject</label>
              <input type="text" placeholder="Brief summary of your issue" value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={newTicket.category} onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}>
                <option value="technical">Technical Issue</option>
                <option value="billing">Billing Question</option>
                <option value="account">Account Issue</option>
                <option value="feature">Feature Request</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={newTicket.priority} onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea rows={5} placeholder="Please provide detailed information about your issue..." value={newTicket.message} onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setShowNewTicketForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={createTicket}>Submit Ticket</button>
            </div>
          </div>
        </div>
      )}

      {/* Live Chat Modal */}
      {liveChatOpen && (
        <div className="chat-modal">
          <div className="chat-header">
            <h3>💬 Support Chat</h3>
            <button className="close-chat" onClick={() => setLiveChatOpen(false)}>×</button>
          </div>
          <div className="chat-messages">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.sender}`}>
                <div className="message-content">{msg.message}</div>
                <div className="message-time">{msg.time}</div>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input type="text" placeholder="Type your message..." value={newChatMessage} onChange={(e) => setNewChatMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()} />
            <button onClick={sendChatMessage}>Send</button>
          </div>
        </div>
      )}

      <style>{`
        .support-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem;
          font-family: 'Inter', sans-serif;
        }
        .support-hero {
          text-align: center;
          padding: 3rem 2rem;
          background: linear-gradient(135deg, rgba(124,95,230,0.08), rgba(47,212,255,0.04));
          border-radius: 32px;
          margin-bottom: 2rem;
        }
        .support-hero h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        .support-hero p {
          color: rgba(255,255,255,0.7);
          margin-bottom: 1.5rem;
        }
        .search-bar {
          max-width: 500px;
          margin: 0 auto;
          position: relative;
        }
        .search-bar input {
          width: 100%;
          padding: 0.8rem 1rem 0.8rem 2.5rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 50px;
          color: white;
          font-size: 0.9rem;
        }
        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.5);
        }
        .quick-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }
        .quick-btn {
          padding: 0.6rem 1.2rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 40px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .quick-btn.active, .quick-btn:hover {
          background: #7c5fe6;
          border-color: #7c5fe6;
        }
        .tickets-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .tickets-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .ticket-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ticket-card:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(124,95,230,0.3);
        }
        .ticket-info {
          flex: 1;
        }
        .ticket-subject {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .ticket-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .priority-badge {
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
          font-size: 0.7rem;
          color: #0a0d1a;
        }
        .empty-state {
          text-align: center;
          padding: 3rem;
          background: rgba(255,255,255,0.02);
          border-radius: 24px;
        }
        .faq-categories {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }
        .category-btn {
          padding: 0.4rem 1rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 30px;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        .category-btn.active {
          background: #7c5fe6;
          color: white;
        }
        .faq-item {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          margin-bottom: 0.5rem;
        }
        .faq-question {
          padding: 1rem;
          cursor: pointer;
          font-weight: 600;
        }
        .faq-answer {
          padding: 0 1rem 1rem 1rem;
          color: rgba(255,255,255,0.7);
          line-height: 1.6;
        }
        .knowledge-stats {
          display: flex;
          justify-content: space-around;
          gap: 1rem;
          margin-bottom: 2rem;
          text-align: center;
        }
        .knowledge-stats .stat span {
          display: block;
          font-size: 1.8rem;
          font-weight: 800;
          color: #7c5fe6;
        }
        .knowledge-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }
        .knowledge-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1rem;
          text-decoration: none;
          color: white;
          transition: all 0.2s;
        }
        .knowledge-card:hover {
          transform: translateY(-4px);
          background: rgba(255,255,255,0.05);
        }
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .contact-form-card, .contact-info-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px;
          padding: 1.5rem;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .form-group label {
          display: block;
          margin-bottom: 0.3rem;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.7);
        }
        .form-group input, .form-group select, .form-group textarea {
          width: 100%;
          padding: 0.6rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
        }
        .contact-method {
          display: flex;
          gap: 1rem;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .method-icon {
          font-size: 1.5rem;
        }
        .chat-btn, .forum-link {
          background: none;
          border: none;
          color: #9b7ff0;
          cursor: pointer;
          padding: 0;
          margin-top: 0.3rem;
        }
        .chat-modal {
          position: fixed;
          bottom: 1rem;
          right: 1rem;
          width: 350px;
          height: 450px;
          background: #1a1a2e;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          z-index: 1000;
        }
        .chat-header {
          padding: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem;
        }
        .chat-message {
          margin-bottom: 0.5rem;
          display: flex;
          flex-direction: column;
        }
        .chat-message.user .message-content {
          background: #7c5fe6;
          color: white;
          align-self: flex-end;
          padding: 0.5rem 0.8rem;
          border-radius: 12px;
        }
        .chat-message.support .message-content {
          background: rgba(255,255,255,0.1);
          align-self: flex-start;
          padding: 0.5rem 0.8rem;
          border-radius: 12px;
        }
        .chat-input {
          padding: 0.5rem;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: flex;
          gap: 0.5rem;
        }
        .chat-input input {
          flex: 1;
          padding: 0.5rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: #1a1a2e;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 2rem;
          max-width: 500px;
          width: 90%;
        }
        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }
        .btn-primary {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
          padding: 0.6rem 1.2rem;
          border-radius: 40px;
          border: none;
          cursor: pointer;
        }
        .btn-outline {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 0.6rem 1.2rem;
          border-radius: 40px;
          cursor: pointer;
        }
        .loading-container {
          text-align: center;
          padding: 3rem;
        }
        .spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: #7c5fe6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .contact-grid {
            grid-template-columns: 1fr;
          }
          .knowledge-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Support;