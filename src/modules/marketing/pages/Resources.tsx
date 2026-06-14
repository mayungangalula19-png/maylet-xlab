import { Link } from 'react-router-dom';
import { useState } from 'react';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'guide' | 'video' | 'template' | 'case_study' | 'webinar' | 'ebook' | 'tool';
  icon: string;
  duration?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  downloadUrl?: string;
  videoUrl?: string;
  thumbnail?: string;
  views: number;
  downloads?: number;
}

interface ResourceCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

const Resources = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const categories: ResourceCategory[] = [
    { id: 'all', name: 'All Resources', icon: '📚', count: 24 },
    { id: 'guide', name: 'Guides', icon: '📘', count: 8 },
    { id: 'video', name: 'Video Tutorials', icon: '🎥', count: 6 },
    { id: 'template', name: 'Templates', icon: '📋', count: 5 },
    { id: 'case_study', name: 'Case Studies', icon: '📊', count: 4 },
    { id: 'webinar', name: 'Webinars', icon: '🎤', count: 3 },
    { id: 'ebook', name: 'E-books', icon: '📖', count: 2 },
    { id: 'tool', name: 'Tools', icon: '🛠️', count: 2 },
  ];

  const resources: Resource[] = [
    // Guides
    {
      id: 'guide-1',
      title: 'The Complete Innovation Guide: From Idea to Launch',
      description: 'A step-by-step framework for taking your idea from concept to market, including validation, prototyping, and launch strategies.',
      type: 'guide',
      icon: '📘',
      level: 'beginner',
      tags: ['innovation', 'strategy', 'launch'],
      downloadUrl: '/resources/innovation-guide.pdf',
      views: 12450,
      downloads: 3420,
    },
    {
      id: 'guide-2',
      title: 'AI Validation Masterclass',
      description: 'Learn how to use AI to validate your startup ideas, analyze market fit, and predict success rates.',
      type: 'guide',
      icon: '📘',
      level: 'intermediate',
      tags: ['AI', 'validation', 'market analysis'],
      downloadUrl: '/resources/ai-validation-guide.pdf',
      views: 8750,
      downloads: 2100,
    },
    {
      id: 'guide-3',
      title: 'Raising Capital: A Founder\'s Guide',
      description: 'Everything you need to know about fundraising, from pitch decks to term sheets and investor meetings.',
      type: 'guide',
      icon: '📘',
      level: 'advanced',
      tags: ['fundraising', 'investors', 'pitch'],
      downloadUrl: '/resources/funding-guide.pdf',
      views: 15200,
      downloads: 4300,
    },

    // Video Tutorials
    {
      id: 'video-1',
      title: 'Getting Started with Maylet XLab',
      description: 'A complete walkthrough of the platform, from creating your first project to launching your MVP.',
      type: 'video',
      icon: '🎥',
      duration: '12:34',
      level: 'beginner',
      tags: ['tutorial', 'onboarding', 'basics'],
      videoUrl: 'https://youtube.com/watch?v=example1',
      views: 24500,
    },
    {
      id: 'video-2',
      title: 'How to Run an AI Experiment',
      description: 'Step-by-step tutorial on using the AI Experiment Engine to validate your ideas.',
      type: 'video',
      icon: '🎥',
      duration: '8:22',
      level: 'intermediate',
      tags: ['AI', 'experiment', 'validation'],
      videoUrl: 'https://youtube.com/watch?v=example2',
      views: 12300,
    },
    {
      id: 'video-3',
      title: 'Building Your First Prototype',
      description: 'Learn how to create and iterate prototypes using our built-in tools.',
      type: 'video',
      icon: '🎥',
      duration: '15:47',
      level: 'intermediate',
      tags: ['prototype', 'MVP', 'design'],
      videoUrl: 'https://youtube.com/watch?v=example3',
      views: 9800,
    },

    // Templates
    {
      id: 'template-1',
      title: 'Startup Pitch Deck Template',
      description: 'A proven pitch deck template that helped founders raise over $1M. Includes slides for problem, solution, market, and financials.',
      type: 'template',
      icon: '📋',
      level: 'beginner',
      tags: ['pitch deck', 'fundraising', 'presentation'],
      downloadUrl: '/resources/pitch-deck-template.pptx',
      views: 18700,
      downloads: 5600,
    },
    {
      id: 'template-2',
      title: 'Business Model Canvas',
      description: 'Interactive business model canvas template to map out your startup\'s value proposition, revenue streams, and cost structure.',
      type: 'template',
      icon: '📋',
      level: 'beginner',
      tags: ['business model', 'strategy', 'planning'],
      downloadUrl: '/resources/business-model-canvas.xlsx',
      views: 11200,
      downloads: 3400,
    },
    {
      id: 'template-3',
      title: 'Market Research Survey Template',
      description: 'Ready-to-use survey template for conducting customer discovery and market research.',
      type: 'template',
      icon: '📋',
      level: 'intermediate',
      tags: ['market research', 'survey', 'customer discovery'],
      downloadUrl: '/resources/market-research-template.docx',
      views: 7650,
      downloads: 2100,
    },

    // Case Studies
    {
      id: 'case-1',
      title: 'How AgriTech Startup Raised $250K Using XLab',
      description: 'Amina Kimaro used XLab to validate her smart irrigation idea, build a prototype, and secure funding from impact investors.',
      type: 'case_study',
      icon: '📊',
      level: 'intermediate',
      tags: ['agritech', 'fundraising', 'success story'],
      downloadUrl: '/resources/case-study-agritech.pdf',
      views: 8900,
      downloads: 1200,
    },
    {
      id: 'case-2',
      title: 'From Student to $10K Grant Winner',
      description: 'How James Mutua, a university student, discovered and won a student innovation grant through the Funding Hub.',
      type: 'case_study',
      icon: '📊',
      level: 'beginner',
      tags: ['student', 'grant', 'success story'],
      downloadUrl: '/resources/case-study-student.pdf',
      views: 6700,
      downloads: 950,
    },
    {
      id: 'case-3',
      title: 'HealthTech Breakthrough: WHO Partnership',
      description: 'Sarah Okonkwo protected her IP with Innovation Vault and secured a partnership with the World Health Organization.',
      type: 'case_study',
      icon: '📊',
      level: 'advanced',
      tags: ['healthtech', 'IP protection', 'partnership'],
      downloadUrl: '/resources/case-study-healthtech.pdf',
      views: 5400,
      downloads: 780,
    },

    // Webinars
    {
      id: 'webinar-1',
      title: 'The Future of Innovation in Africa',
      description: 'Join industry experts as they discuss the innovation landscape, funding opportunities, and success stories from African startups.',
      type: 'webinar',
      icon: '🎤',
      duration: '1:15:00',
      level: 'beginner',
      tags: ['innovation', 'Africa', 'trends'],
      videoUrl: 'https://youtube.com/watch?v=webinar1',
      views: 3400,
    },
    {
      id: 'webinar-2',
      title: 'AI for Social Impact',
      description: 'Learn how artificial intelligence is being used to solve real-world problems in healthcare, agriculture, and education.',
      type: 'webinar',
      icon: '🎤',
      duration: '52:30',
      level: 'intermediate',
      tags: ['AI', 'social impact', 'technology'],
      videoUrl: 'https://youtube.com/watch?v=webinar2',
      views: 2800,
    },

    // E-books
    {
      id: 'ebook-1',
      title: 'The Innovation Operating System Handbook',
      description: 'A comprehensive guide to building and scaling innovation within your organization using the Innovation OS framework.',
      type: 'ebook',
      icon: '📖',
      level: 'advanced',
      tags: ['innovation', 'strategy', 'management'],
      downloadUrl: '/resources/innovation-os-handbook.pdf',
      views: 4200,
      downloads: 890,
    },
    {
      id: 'ebook-2',
      title: 'Startup Legal Guide',
      description: 'Essential legal considerations for startups: incorporation, IP protection, contracts, and compliance.',
      type: 'ebook',
      icon: '📖',
      level: 'intermediate',
      tags: ['legal', 'startup', 'IP protection'],
      downloadUrl: '/resources/startup-legal-guide.pdf',
      views: 5600,
      downloads: 1200,
    },

    // Tools
    {
      id: 'tool-1',
      title: 'Idea Validation Score Calculator',
      description: 'Interactive tool to assess your startup idea\'s potential based on market size, competition, and feasibility.',
      type: 'tool',
      icon: '🛠️',
      level: 'beginner',
      tags: ['validation', 'score', 'assessment'],
      views: 8900,
    },
    {
      id: 'tool-2',
      title: 'Startup Financial Projection Template',
      description: 'Excel-based financial model for projecting revenue, expenses, and funding needs for your startup.',
      type: 'tool',
      icon: '🛠️',
      level: 'intermediate',
      tags: ['financial', 'projection', 'planning'],
      downloadUrl: '/resources/financial-projection.xlsx',
      views: 6700,
      downloads: 1800,
    },
  ];

  const filteredResources = resources.filter(resource => {
    const matchesCategory = activeCategory === 'all' || resource.type === activeCategory;
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return '#48bb78';
      case 'intermediate': return '#f6c90e';
      case 'advanced': return '#fc8181';
      default: return '#6b6b7a';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'guide': return 'Guide';
      case 'video': return 'Video';
      case 'template': return 'Template';
      case 'case_study': return 'Case Study';
      case 'webinar': return 'Webinar';
      case 'ebook': return 'E-book';
      case 'tool': return 'Tool';
      default: return 'Resource';
    }
  };

  return (
    <div className="resources-page">
      {/* Hero Section */}
      <div className="resources-hero">
        <h1>Resources to Help You Innovate</h1>
        <p>Free guides, templates, case studies, and tools to accelerate your innovation journey.</p>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search resources..."
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

      {/* Resources Grid */}
      <div className="resources-grid">
        {filteredResources.map((resource) => (
          <div key={resource.id} className="resource-card" onClick={() => setSelectedResource(resource)}>
            <div className="resource-icon">{resource.icon}</div>
            <div className="resource-type">{getTypeLabel(resource.type)}</div>
            <h3>{resource.title}</h3>
            <p>{resource.description.substring(0, 100)}...</p>
            <div className="resource-meta">
              <div className="resource-level" style={{ color: getLevelColor(resource.level) }}>
                {resource.level === 'beginner' && '🌱 Beginner'}
                {resource.level === 'intermediate' && '📈 Intermediate'}
                {resource.level === 'advanced' && '🚀 Advanced'}
              </div>
              <div className="resource-stats">
                <span>👁️ {resource.views.toLocaleString()}</span>
                {resource.downloads && <span>⬇️ {resource.downloads.toLocaleString()}</span>}
                {resource.duration && <span>⏱️ {resource.duration}</span>}
              </div>
            </div>
            <div className="resource-tags">
              {resource.tags.slice(0, 3).map(tag => (
                <span key={tag} className="tag">#{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredResources.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <h3>No resources found</h3>
          <p>Try a different search term or browse by category.</p>
          <button className="btn-primary" onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}>Clear Filters</button>
        </div>
      )}

      {/* Resource Modal */}
      {selectedResource && (
        <div className="modal-overlay" onClick={() => setSelectedResource(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedResource(null)}>×</button>
            <div className="modal-icon">{selectedResource.icon}</div>
            <div className="modal-type">{getTypeLabel(selectedResource.type)}</div>
            <h2>{selectedResource.title}</h2>
            <p className="modal-description">{selectedResource.description}</p>
            
            <div className="modal-details">
              <div className="detail-item">
                <strong>Level:</strong>
                <span style={{ color: getLevelColor(selectedResource.level) }}>
                  {selectedResource.level === 'beginner' && '🌱 Beginner'}
                  {selectedResource.level === 'intermediate' && '📈 Intermediate'}
                  {selectedResource.level === 'advanced' && '🚀 Advanced'}
                </span>
              </div>
              <div className="detail-item">
                <strong>Tags:</strong>
                <div className="modal-tags">
                  {selectedResource.tags.map(tag => <span key={tag}>#{tag}</span>)}
                </div>
              </div>
              {selectedResource.duration && (
                <div className="detail-item"><strong>Duration:</strong> {selectedResource.duration}</div>
              )}
              <div className="detail-item">
                <strong>Views:</strong> {selectedResource.views.toLocaleString()}
              </div>
              {selectedResource.downloads && (
                <div className="detail-item"><strong>Downloads:</strong> {selectedResource.downloads.toLocaleString()}</div>
              )}
            </div>

            <div className="modal-actions">
              {selectedResource.downloadUrl && (
                <a href={selectedResource.downloadUrl} download className="btn-primary">Download Resource →</a>
              )}
              {selectedResource.videoUrl && (
                <a href={selectedResource.videoUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">Watch Video →</a>
              )}
              {!selectedResource.downloadUrl && !selectedResource.videoUrl && (
                <Link to="/register" className="btn-primary">Access This Resource →</Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Newsletter Signup Section */}
      <div className="newsletter-section">
        <div className="newsletter-content">
          <span className="newsletter-icon">📧</span>
          <h3>Get Resources Delivered to Your Inbox</h3>
          <p>Subscribe to receive weekly innovation resources, templates, and case studies.</p>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Your email address" required />
            <button type="submit" className="btn-primary">Subscribe →</button>
          </form>
          <p className="newsletter-note">No spam. Unsubscribe anytime.</p>
        </div>
      </div>

      <style>{`
        .resources-page {
          max-width: 1280px;
          margin: 0 auto;
          padding: 2rem;
          font-family: 'Inter', sans-serif;
        }
        .resources-hero {
          text-align: center;
          padding: 3rem 2rem;
          background: linear-gradient(135deg, rgba(124,95,230,0.08), rgba(47,212,255,0.04));
          border-radius: 32px;
          margin-bottom: 2rem;
        }
        .resources-hero h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        .resources-hero p {
          color: rgba(255,255,255,0.7);
          margin-bottom: 1.5rem;
        }
        .search-bar {
          max-width: 400px;
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
          gap: 0.5rem;
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
        .resources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .resource-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s;
        }
        .resource-card:hover {
          transform: translateY(-4px);
          background: rgba(255,255,255,0.05);
          border-color: rgba(124,95,230,0.3);
        }
        .resource-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        .resource-type {
          display: inline-block;
          padding: 0.2rem 0.5rem;
          background: rgba(124,95,230,0.2);
          border-radius: 12px;
          font-size: 0.7rem;
          color: #9b7ff0;
          margin-bottom: 0.5rem;
        }
        .resource-card h3 {
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }
        .resource-card p {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.6);
          line-height: 1.5;
          margin-bottom: 1rem;
        }
        .resource-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          font-size: 0.7rem;
        }
        .resource-stats {
          display: flex;
          gap: 0.5rem;
          color: rgba(255,255,255,0.5);
        }
        .resource-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
        }
        .tag {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.5);
        }
        .empty-state {
          text-align: center;
          padding: 3rem;
          background: rgba(255,255,255,0.02);
          border-radius: 24px;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.9);
          backdrop-filter: blur(8px);
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
          max-width: 550px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
        }
        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
        }
        .modal-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }
        .modal-type {
          display: inline-block;
          padding: 0.2rem 0.5rem;
          background: rgba(124,95,230,0.2);
          border-radius: 12px;
          font-size: 0.7rem;
          color: #9b7ff0;
          margin-bottom: 1rem;
        }
        .modal-content h2 {
          margin-bottom: 0.5rem;
        }
        .modal-description {
          color: rgba(255,255,255,0.7);
          line-height: 1.6;
          margin-bottom: 1rem;
        }
        .modal-details {
          background: rgba(255,255,255,0.02);
          border-radius: 16px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }
        .detail-item {
          margin-bottom: 0.5rem;
          font-size: 0.85rem;
        }
        .detail-item strong {
          color: rgba(255,255,255,0.8);
          margin-right: 0.5rem;
        }
        .modal-tags {
          display: inline-flex;
          flex-wrap: wrap;
          gap: 0.3rem;
        }
        .modal-actions {
          display: flex;
          justify-content: center;
        }
        .btn-primary {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
          padding: 0.8rem 1.5rem;
          border-radius: 40px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }
        .newsletter-section {
          margin-top: 3rem;
          padding: 3rem;
          background: linear-gradient(135deg, rgba(124,95,230,0.08), rgba(47,212,255,0.04));
          border-radius: 32px;
          text-align: center;
        }
        .newsletter-icon {
          font-size: 2.5rem;
          display: block;
          margin-bottom: 1rem;
        }
        .newsletter-section h3 {
          font-size: 1.3rem;
          margin-bottom: 0.5rem;
        }
        .newsletter-section p {
          color: rgba(255,255,255,0.7);
          margin-bottom: 1rem;
        }
        .newsletter-form {
          display: flex;
          gap: 0.5rem;
          max-width: 400px;
          margin: 0 auto;
        }
        .newsletter-form input {
          flex: 1;
          padding: 0.6rem 1rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 40px;
          color: white;
        }
        .newsletter-note {
          font-size: 0.7rem;
          margin-top: 0.5rem;
        }
        @media (max-width: 768px) {
          .resources-grid {
            grid-template-columns: 1fr;
          }
          .newsletter-form {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default Resources;