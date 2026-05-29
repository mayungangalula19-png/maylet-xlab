import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface FAQCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const categories: FAQCategory[] = [
    { id: 'all', name: 'All Questions', icon: '📚', count: 24 },
    { id: 'getting-started', name: 'Getting Started', icon: '🚀', count: 6 },
    { id: 'account', name: 'Account & Profile', icon: '👤', count: 5 },
    { id: 'projects', name: 'Projects & Tasks', icon: '📁', count: 4 },
    { id: 'ai', name: 'AI & Experiments', icon: '🤖', count: 3 },
    { id: 'funding', name: 'Funding Hub', icon: '💰', count: 3 },
    { id: 'vault', name: 'Innovation Vault', icon: '🔐', count: 3 },
    { id: 'billing', name: 'Billing & Subscription', icon: '💳', count: 4 },
    { id: 'security', name: 'Security & Privacy', icon: '🛡️', count: 3 },
    { id: 'collaboration', name: 'Teams & Collaboration', icon: '👥', count: 3 },
  ];

  const faqs: FAQItem[] = [
    // Getting Started
    {
      id: 'gs1',
      question: 'What is Maylet XLab?',
      answer: 'Maylet XLab is an all-in-one innovation platform that helps you validate ideas, build prototypes, collaborate with teams, protect your IP, and raise funding — all in one workspace. It combines AI validation, project management, team collaboration, IP protection, and funding opportunities into a single ecosystem.',
      category: 'getting-started',
    },
    {
      id: 'gs2',
      question: 'How do I get started with Maylet XLab?',
      answer: 'Getting started is easy! 1. Click "Get Started" to create your free account. 2. Complete your profile. 3. Create your first project or experiment. 4. Invite team members (optional). 5. Start validating your ideas with AI. You can also watch our video tutorials and read the documentation for detailed guidance.',
      category: 'getting-started',
    },
    {
      id: 'gs3',
      question: 'Is there a free plan available?',
      answer: 'Yes! Maylet XLab offers a Free plan that includes 3 active projects, basic AI validation (5 credits/month), 5 team members, community access, and Innovation Vault (3 entries). This is perfect for getting started with innovation.',
      category: 'getting-started',
    },
    {
      id: 'gs4',
      question: 'Do I need technical skills to use Maylet XLab?',
      answer: 'Not at all! Maylet XLab is designed for innovators of all skill levels. Whether you\'re a student, researcher, entrepreneur, or developer, the platform provides intuitive tools and guided workflows to help you turn your ideas into reality.',
      category: 'getting-started',
    },
    // Account & Profile
    {
      id: 'acc1',
      question: 'How do I reset my password?',
      answer: 'To reset your password: 1. Go to the login page. 2. Click "Forgot Password". 3. Enter your email address. 4. Check your inbox for a password reset link. 5. Follow the link to create a new password. If you don\'t receive the email, check your spam folder or contact support.',
      category: 'account',
    },
    {
      id: 'acc2',
      question: 'How do I update my profile information?',
      answer: 'To update your profile: 1. Log in to your account. 2. Click on your avatar in the top right corner. 3. Select "Settings" from the dropdown menu. 4. Click on "Profile" tab. 5. Update your information (name, bio, location, social links, etc.). 6. Click "Save Changes".',
      category: 'account',
    },
    {
      id: 'acc3',
      question: 'Can I delete my account?',
      answer: 'Yes, you can delete your account at any time. Go to Settings → Account → Delete Account. Please note that this action is permanent and will remove all your projects, data, and vault entries. Make sure to export any important data before deleting.',
      category: 'account',
    },
    // Projects & Tasks
    {
      id: 'proj1',
      question: 'How do I create a new project?',
      answer: 'To create a new project: 1. Go to the Projects page from the sidebar. 2. Click the "New Project" button. 3. Enter a project name and description. 4. Set your project status (Idea, Experiment, Prototype, Launched). 5. Click "Create". You can then add tasks, milestones, and invite team members.',
      category: 'projects',
    },
    {
      id: 'proj2',
      question: 'Can I track project progress?',
      answer: 'Yes! Maylet XLab includes comprehensive progress tracking. Each project has a progress score (0-100%) that updates as you complete tasks and milestones. You can set milestones, assign tasks with deadlines, and monitor your team\'s progress through the dashboard and analytics.',
      category: 'projects',
    },
    // AI & Experiments
    {
      id: 'ai1',
      question: 'How does AI validation work?',
      answer: 'Our AI analyzes your idea against millions of data points, market trends, competitor landscapes, and success patterns. It provides: 1. Feasibility score (0-100%), 2. Market potential analysis, 3. Risk assessment, 4. Actionable recommendations, and 5. Target audience insights. Simply describe your idea and let our AI do the analysis.',
      category: 'ai',
    },
    {
      id: 'ai2',
      question: 'What types of ideas can I validate?',
      answer: 'You can validate any type of idea! Whether it\'s a tech startup, mobile app, social enterprise, research project, or business concept, our AI is trained on diverse datasets to provide valuable insights across industries including AgriTech, HealthTech, FinTech, EdTech, CleanEnergy, and more.',
      category: 'ai',
    },
    // Funding Hub
    {
      id: 'fund1',
      question: 'How do I find investors on Maylet XLab?',
      answer: 'The Funding Hub connects you with verified investors actively looking for innovative startups. You can: 1. Create a compelling pitch with details about your project. 2. Submit your pitch to the platform. 3. Our matching algorithm connects you with relevant investors. 4. Track interest, schedule calls, and close deals directly on the platform.',
      category: 'funding',
    },
    {
      id: 'fund2',
      question: 'Is there a commission on funds raised?',
      answer: 'Yes, Maylet XLab charges a success fee of 2-5% on funds successfully raised through the Funding Hub. This fee is only charged when you receive funding. There are no upfront costs to list your pitch or connect with investors.',
      category: 'funding',
    },
    // Innovation Vault
    {
      id: 'vault1',
      question: 'What is the Innovation Vault?',
      answer: 'The Innovation Vault is a secure digital safe where you can store and protect your ideas with blockchain-grade security. Each entry is cryptographically timestamped, encrypted with AES-256, and hashed using SHA-256 to provide legally defensible proof of ownership. This helps protect your intellectual property before sharing with others.',
      category: 'vault',
    },
    {
      id: 'vault2',
      question: 'Is the Innovation Vault legally binding?',
      answer: 'The timestamp and hash generated by the Innovation Vault provide strong evidence of when an idea existed. This can be used as proof of prior art or ownership in legal disputes. However, for full patent protection, we recommend consulting with a qualified intellectual property attorney. The Vault is a tool to support your IP strategy, not a replacement for formal registration.',
      category: 'vault',
    },
    // Billing & Subscription
    {
      id: 'bill1',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and mobile money services including M-Pesa, Tigo Pesa, and Airtel Money for African users. All payments are processed securely through our payment partners.',
      category: 'billing',
    },
    {
      id: 'bill2',
      question: 'Can I upgrade or downgrade my plan?',
      answer: 'Yes, you can change your plan at any time through Settings → Billing. Upgrades take effect immediately, and you\'ll be charged the prorated difference. Downgrades take effect at the end of your current billing period.',
      category: 'billing',
    },
    // Security & Privacy
    {
      id: 'sec1',
      question: 'Is my data secure?',
      answer: 'Absolutely. We use industry-standard security measures including AES-256 encryption for sensitive data, TLS 1.3 for data transmission, regular security audits, and strict access controls. Your Innovation Vault entries are encrypted and only accessible by you.',
      category: 'security',
    },
    {
      id: 'sec2',
      question: 'Does Maylet XLab sell my data?',
      answer: 'No, we never sell your personal data. Your ideas, projects, and personal information are yours. We only use data to improve our services and provide you with a better experience. See our Privacy Policy for complete details.',
      category: 'security',
    },
    // Teams & Collaboration
    {
      id: 'team1',
      question: 'How do I invite team members?',
      answer: 'To invite team members: 1. Go to the Teams page. 2. Create a new team or select an existing one. 3. Click "Invite Member". 4. Enter their email address. 5. Assign a role (Owner, Developer, Designer, Marketer). 6. They\'ll receive an invitation email to join your team.',
      category: 'collaboration',
    },
    {
      id: 'team2',
      question: 'What roles can I assign to team members?',
      answer: 'We offer four roles: Owner (full control, can manage team and projects), Developer (can build and edit projects), Designer (focuses on prototypes and UI/UX), and Marketer (manages funding pitches and market analysis). Each role has appropriate permissions for collaboration.',
      category: 'collaboration',
    },
  ];

  const filteredFaqs = useMemo(() => {
    let filtered = faqs;

    if (activeCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(faq =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [activeCategory, searchQuery, faqs]);

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className="faq-page">
      {/* Hero Section */}
      <div className="faq-hero">
        <div className="hero-icon">❓</div>
        <h1>Frequently Asked Questions</h1>
        <p>Find answers to common questions about Maylet XLab</p>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search for answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="categories-section">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
            <span className="category-count">{category.count}</span>
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="results-count">
        Found {filteredFaqs.length} {filteredFaqs.length === 1 ? 'question' : 'questions'}
      </div>

      {/* FAQ List */}
      <div className="faq-list">
        {filteredFaqs.map((faq) => (
          <div key={faq.id} className="faq-item">
            <button
              className="faq-question"
              onClick={() => toggleItem(faq.id)}
              aria-expanded={openItems.has(faq.id)}
            >
              <span className="question-icon">{openItems.has(faq.id) ? '📖' : '❓'}</span>
              <span className="question-text">{faq.question}</span>
              <span className="question-arrow">{openItems.has(faq.id) ? '▲' : '▼'}</span>
            </button>
            <div className={`faq-answer ${openItems.has(faq.id) ? 'open' : ''}`}>
              <p>{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredFaqs.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <h3>No results found</h3>
          <p>Try a different search term or browse by category.</p>
          <button className="btn-primary" onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}>
            Clear Filters
          </button>
        </div>
      )}

      {/* Still Have Questions */}
      <div className="contact-section">
        <div className="contact-card">
          <span className="contact-icon">💬</span>
          <h3>Still have questions?</h3>
          <p>Can't find what you're looking for? Our support team is here to help.</p>
          <div className="contact-buttons">
            <Link to="/contact" className="btn-primary">Contact Support</Link>
            <Link to="/support" className="btn-outline">Open a Ticket</Link>
          </div>
          <p className="contact-note">
            Average response time: 24 hours (Pro) | 4 hours (Enterprise)
          </p>
        </div>
      </div>

      <style>{`
        .faq-page {
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem;
          font-family: 'Inter', sans-serif;
        }
        .faq-hero {
          text-align: center;
          padding: 2rem 1rem;
          background: linear-gradient(135deg, rgba(124,95,230,0.08), rgba(47,212,255,0.04));
          border-radius: 32px;
          margin-bottom: 2rem;
        }
        .hero-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }
        .faq-hero h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        .faq-hero p {
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
        .categories-section {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          justify-content: center;
          margin-bottom: 2rem;
        }
        .category-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 40px;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          transition: all 0.2s;
        }
        .category-btn.active, .category-btn:hover {
          background: #7c5fe6;
          border-color: #7c5fe6;
          color: white;
        }
        .category-count {
          background: rgba(255,255,255,0.1);
          padding: 0.1rem 0.4rem;
          border-radius: 20px;
          font-size: 0.7rem;
        }
        .results-count {
          text-align: center;
          color: rgba(255,255,255,0.5);
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
        }
        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 3rem;
        }
        .faq-item {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
        }
        .faq-question {
          width: 100%;
          padding: 1.2rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          background: none;
          border: none;
          color: white;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          transition: background 0.2s;
        }
        .faq-question:hover {
          background: rgba(255,255,255,0.02);
        }
        .question-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        .question-text {
          flex: 1;
        }
        .question-arrow {
          color: #9b7ff0;
          font-size: 0.8rem;
          flex-shrink: 0;
        }
        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
          padding: 0 1.5rem;
        }
        .faq-answer.open {
          max-height: 500px;
          padding: 0 1.5rem 1.2rem 1.5rem;
        }
        .faq-answer p {
          color: rgba(255,255,255,0.8);
          line-height: 1.7;
          margin: 0;
        }
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: rgba(255,255,255,0.02);
          border-radius: 24px;
          margin-bottom: 2rem;
        }
        .empty-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 1rem;
        }
        .empty-state h3 {
          margin-bottom: 0.5rem;
        }
        .empty-state p {
          color: rgba(255,255,255,0.6);
          margin-bottom: 1rem;
        }
        .contact-section {
          margin-top: 2rem;
        }
        .contact-card {
          text-align: center;
          padding: 2.5rem;
          background: linear-gradient(135deg, rgba(124,95,230,0.08), rgba(47,212,255,0.04));
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 32px;
        }
        .contact-icon {
          font-size: 2.5rem;
          display: block;
          margin-bottom: 0.5rem;
        }
        .contact-card h3 {
          font-size: 1.2rem;
          margin-bottom: 0.5rem;
        }
        .contact-card p {
          color: rgba(255,255,255,0.7);
          margin-bottom: 1.5rem;
        }
        .contact-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        .btn-primary {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }
        .btn-outline {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          text-decoration: none;
          display: inline-block;
        }
        .contact-note {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.4) !important;
          margin-top: 0.5rem;
        }
        @media (max-width: 768px) {
          .faq-page {
            padding: 1rem;
          }
          .faq-question {
            padding: 1rem;
            gap: 0.5rem;
          }
          .question-text {
            font-size: 0.9rem;
          }
          .categories-section {
            gap: 0.5rem;
          }
          .category-btn {
            padding: 0.4rem 0.8rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default FAQ;