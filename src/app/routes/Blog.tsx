import { Link } from 'react-router-dom';
import { useState } from 'react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  category: string;
  tags: string[];
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  published_date: string;
  read_time: number;
  views: number;
  likes: number;
  is_featured: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
  icon: string;
}

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showModal, setShowModal] = useState(false);

  const categories: Category[] = [
    { id: 'all', name: 'All Posts', slug: 'all', count: 12, icon: '📚' },
    { id: 'innovation', name: 'Innovation', slug: 'innovation', count: 4, icon: '💡' },
    { id: 'ai', name: 'Artificial Intelligence', slug: 'ai', count: 3, icon: '🤖' },
    { id: 'startup', name: 'Startup Tips', slug: 'startup', count: 3, icon: '🚀' },
    { id: 'funding', name: 'Funding & Investment', slug: 'funding', count: 2, icon: '💰' },
    { id: 'success', name: 'Success Stories', slug: 'success', count: 3, icon: '🏆' },
    { id: 'technology', name: 'Technology', slug: 'technology', count: 2, icon: '⚡' },
  ];

  const blogPosts: BlogPost[] = [
    {
      id: '1',
      title: 'How to Validate Your Startup Idea in 48 Hours',
      slug: 'validate-startup-idea-48-hours',
      excerpt: 'Learn the exact framework used by successful founders to test market demand and validate their startup ideas before building anything.',
      content: '',
      featured_image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
      category: 'startup',
      tags: ['validation', 'startup', 'market-research'],
      author: {
        name: 'Engineer Mayunga',
        avatar: 'EM',
        role: 'Founder & Lead Developer',
      },
      published_date: '2025-05-15',
      read_time: 8,
      views: 1245,
      likes: 89,
      is_featured: true,
    },
    {
      id: '2',
      title: 'The Complete Guide to Raising Your First $100K',
      slug: 'complete-guide-raising-first-100k',
      excerpt: 'From pitch deck to term sheet – everything you need to know about early-stage fundraising, including investor outreach strategies.',
      content: '',
      featured_image: 'https://images.unsplash.com/photo-1553729459-9a2c9f6b2b6b',
      category: 'funding',
      tags: ['fundraising', 'investors', 'pitch-deck'],
      author: {
        name: 'Amina Kimaro',
        avatar: 'AK',
        role: 'Head of Innovation',
      },
      published_date: '2025-05-10',
      read_time: 12,
      views: 892,
      likes: 67,
      is_featured: true,
    },
    {
      id: '3',
      title: 'AI-Powered Innovation: Trends for 2025',
      slug: 'ai-powered-innovation-trends-2025',
      excerpt: 'Discover how top innovators are leveraging AI to accelerate product development, reduce costs, and enter markets faster.',
      content: '',
      featured_image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995',
      category: 'ai',
      tags: ['AI', 'trends', 'innovation'],
      author: {
        name: 'David Mwangi',
        avatar: 'DM',
        role: 'Technical Lead',
      },
      published_date: '2025-05-05',
      read_time: 6,
      views: 2341,
      likes: 156,
      is_featured: true,
    },
    {
      id: '4',
      title: 'From Student to Startup Founder: James\' Story',
      slug: 'student-to-startup-founder-james-story',
      excerpt: 'How a university student discovered a $10K grant through Maylet XLab and built his fintech startup from scratch.',
      content: '',
      featured_image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c',
      category: 'success',
      tags: ['student', 'grant', 'success-story'],
      author: {
        name: 'James Mutua',
        avatar: 'JM',
        role: 'Guest Author',
      },
      published_date: '2025-04-28',
      read_time: 7,
      views: 567,
      likes: 45,
      is_featured: false,
    },
    {
      id: '5',
      title: 'The Future of African Innovation Ecosystems',
      slug: 'future-african-innovation-ecosystems',
      excerpt: 'Exploring the rapid growth of innovation hubs, startup funding, and tech talent across the African continent.',
      content: '',
      featured_image: 'https://images.unsplash.com/photo-1487088678257-3a541e6e3923',
      category: 'innovation',
      tags: ['africa', 'ecosystem', 'growth'],
      author: {
        name: 'Sarah Okonkwo',
        avatar: 'SO',
        role: 'Product Manager',
      },
      published_date: '2025-04-20',
      read_time: 10,
      views: 432,
      likes: 34,
      is_featured: false,
    },
    {
      id: '6',
      title: 'Protecting Your IP: A Guide for Startups',
      slug: 'protecting-ip-guide-startups',
      excerpt: 'Essential strategies for protecting your intellectual property, including patents, trademarks, and trade secrets.',
      content: '',
      featured_image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3',
      category: 'innovation',
      tags: ['IP', 'legal', 'protection'],
      author: {
        name: 'Nadia Khalil',
        avatar: 'NK',
        role: 'Legal Advisor',
      },
      published_date: '2025-04-15',
      read_time: 9,
      views: 678,
      likes: 52,
      is_featured: false,
    },
    {
      id: '7',
      title: 'Mastering Remote Team Collaboration',
      slug: 'mastering-remote-team-collaboration',
      excerpt: 'Best practices for building and managing high-performing remote teams across different time zones.',
      content: '',
      featured_image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c',
      category: 'technology',
      tags: ['remote-work', 'collaboration', 'teams'],
      author: {
        name: 'David Mwangi',
        avatar: 'DM',
        role: 'Technical Lead',
      },
      published_date: '2025-04-10',
      read_time: 8,
      views: 345,
      likes: 28,
      is_featured: false,
    },
    {
      id: '8',
      title: 'How AI is Transforming Healthcare in Africa',
      slug: 'ai-transforming-healthcare-africa',
      excerpt: 'Innovative AI solutions addressing healthcare challenges across the continent, from diagnostics to telemedicine.',
      content: '',
      featured_image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef',
      category: 'ai',
      tags: ['healthcare', 'AI', 'africa'],
      author: {
        name: 'Sarah Okonkwo',
        avatar: 'SO',
        role: 'Product Manager',
      },
      published_date: '2025-04-05',
      read_time: 11,
      views: 789,
      likes: 63,
      is_featured: false,
    },
  ];

  const featuredPosts = blogPosts.filter(post => post.is_featured);


  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="blog-page">
      {/* Hero Section */}
      <div className="blog-hero">
        <div className="hero-icon">📝</div>
        <h1>Innovation Blog</h1>
        <p>Insights, stories, and resources from the Maylet XLab team</p>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search articles..."
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
            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
            <span className="category-count">{category.count}</span>
          </button>
        ))}
      </div>

      {/* View Toggle */}
      <div className="view-toggle">
        <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
          ▦ Grid
        </button>
        <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
          ☰ List
        </button>
      </div>

      {/* Featured Posts Section */}
      {selectedCategory === 'all' && searchQuery === '' && (
        <div className="featured-section">
          <h2>Featured Articles</h2>
          <div className="featured-grid">
            {featuredPosts.map((post) => (
              <div key={post.id} className="featured-card" onClick={() => { setSelectedPost(post); setShowModal(true); }}>
                <div className="featured-image" data-image={post.featured_image}>
                  <div className="featured-category">{post.category}</div>
                </div>
                <div className="featured-content">
                  <h3>{post.title}</h3>
                  <p>{post.excerpt.substring(0, 120)}...</p>
                  <div className="post-meta">
                    <span className="post-date">{formatDate(post.published_date)}</span>
                    <span className="post-read-time">📖 {post.read_time} min read</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Posts Section */}
      <div className="all-posts-section">
        <h2>{selectedCategory !== 'all' ? categories.find(c => c.id === selectedCategory)?.name : 'All Articles'}</h2>
        <p className="results-count">Showing {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'}</p>
        
        {filteredPosts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <h3>No articles found</h3>
            <p>Try a different search term or browse by category.</p>
            <button className="btn-primary" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
              Clear Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="posts-grid">
            {filteredPosts.map((post) => (
              <div key={post.id} className="post-card" onClick={() => { setSelectedPost(post); setShowModal(true); }}>
                <div className="post-image" data-image={post.featured_image} />
                <div className="post-content">
                  <div className="post-category">{post.category}</div>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt.substring(0, 100)}...</p>
                  <div className="post-meta">
                    <div className="post-author">
                      <span className="author-avatar">{post.author.avatar}</span>
                      <span>{post.author.name}</span>
                    </div>
                    <span className="post-date">{formatDate(post.published_date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="posts-list">
            {filteredPosts.map((post) => (
              <div key={post.id} className="post-list-item" onClick={() => { setSelectedPost(post); setShowModal(true); }}>
                <div className="list-image" data-image={post.featured_image} />
                <div className="list-content">
                  <div className="post-category">{post.category}</div>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt.substring(0, 150)}...</p>
                  <div className="post-meta">
                    <div className="post-author">
                      <span className="author-avatar">{post.author.avatar}</span>
                      <span>{post.author.name}</span>
                    </div>
                    <span className="post-date">{formatDate(post.published_date)}</span>
                    <span className="post-read-time">📖 {post.read_time} min read</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Newsletter Section */}
      <div className="newsletter-section">
        <div className="newsletter-content">
          <span className="newsletter-icon">📧</span>
          <h3>Subscribe to Our Newsletter</h3>
          <p>Get the latest innovation insights delivered to your inbox weekly.</p>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Your email address" required />
            <button type="submit" className="btn-primary">Subscribe →</button>
          </form>
          <p className="newsletter-note">No spam. Unsubscribe anytime.</p>
        </div>
      </div>

      {/* Post Modal */}
      {showModal && selectedPost && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            <div className="modal-image" data-image={selectedPost.featured_image}>
              <div className="modal-category">{selectedPost.category}</div>
            </div>
            <div className="modal-body">
              <h2>{selectedPost.title}</h2>
              <div className="modal-meta">
                <div className="post-author">
                  <span className="author-avatar">{selectedPost.author.avatar}</span>
                  <div>
                    <strong>{selectedPost.author.name}</strong>
                    <span>{selectedPost.author.role}</span>
                  </div>
                </div>
                <div className="modal-stats">
                  <span>📅 {formatDate(selectedPost.published_date)}</span>
                  <span>📖 {selectedPost.read_time} min read</span>
                  <span>👁️ {selectedPost.views.toLocaleString()} views</span>
                  <span>❤️ {selectedPost.likes} likes</span>
                </div>
              </div>
              <div className="modal-tags">
                {selectedPost.tags.map(tag => <span key={tag} className="modal-tag">#{tag}</span>)}
              </div>
              <div className="modal-excerpt">
                <p>{selectedPost.excerpt}</p>
              </div>
              <div className="modal-actions">
                <Link to={`/blog/${selectedPost.slug}`} className="btn-primary">Read Full Article →</Link>
                <button className="btn-outline">Share Article</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .blog-page {
          max-width: 1280px;
          margin: 0 auto;
          padding: 2rem;
          font-family: 'Inter', sans-serif;
        }
        .blog-hero {
          text-align: center;
          padding: 3rem 2rem;
          background: linear-gradient(135deg, rgba(124,95,230,0.08), rgba(47,212,255,0.04));
          border-radius: 32px;
          margin-bottom: 2rem;
        }
        .hero-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }
        .blog-hero h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        .blog-hero p {
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
        .view-toggle {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
        .view-btn {
          padding: 0.3rem 0.8rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 6px;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
        }
        .view-btn.active {
          background: #7c5fe6;
          color: white;
        }
        .featured-section {
          margin-bottom: 3rem;
        }
        .featured-section h2 {
          font-size: 1.3rem;
          margin-bottom: 1rem;
        }
        .featured-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .featured-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s;
        }
        .featured-card:hover {
          transform: translateY(-4px);
          background: rgba(255,255,255,0.05);
        }
        .featured-image {
          height: 180px;
          background-size: cover;
          background-position: center;
          position: relative;
        }
        .featured-category {
          position: absolute;
          top: 1rem;
          left: 1rem;
          padding: 0.2rem 0.6rem;
          background: #7c5fe6;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .featured-content {
          padding: 1rem;
        }
        .featured-content h3 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }
        .featured-content p {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.5rem;
        }
        .all-posts-section {
          margin-bottom: 3rem;
        }
        .all-posts-section h2 {
          font-size: 1.3rem;
          margin-bottom: 0.25rem;
        }
        .results-count {
          color: rgba(255,255,255,0.5);
          font-size: 0.8rem;
          margin-bottom: 1.5rem;
        }
        .posts-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .post-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s;
        }
        .post-card:hover {
          transform: translateY(-4px);
          background: rgba(255,255,255,0.05);
        }
        .post-image {
          height: 160px;
          background-size: cover;
          background-position: center;
        }
        .post-content {
          padding: 1rem;
        }
        .post-category {
          display: inline-block;
          padding: 0.2rem 0.5rem;
          background: rgba(124,95,230,0.2);
          border-radius: 12px;
          font-size: 0.7rem;
          color: #9b7ff0;
          margin-bottom: 0.5rem;
        }
        .post-content h3 {
          font-size: 0.95rem;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }
        .post-content p {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.75rem;
        }
        .post-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
        .post-author {
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        .author-avatar {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6rem;
          font-weight: 700;
        }
        .posts-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .post-list-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .post-list-item:hover {
          background: rgba(255,255,255,0.05);
        }
        .list-image {
          width: 180px;
          height: 120px;
          background-size: cover;
          background-position: center;
          border-radius: 12px;
          flex-shrink: 0;
        }
        .list-content {
          flex: 1;
        }
        .list-content .post-category {
          margin-bottom: 0.3rem;
        }
        .list-content h3 {
          font-size: 1rem;
          margin-bottom: 0.3rem;
        }
        .list-content p {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.5rem;
        }
        .empty-state {
          text-align: center;
          padding: 3rem;
          background: rgba(255,255,255,0.02);
          border-radius: 24px;
        }
        .empty-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 0.5rem;
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
          margin-bottom: 0.5rem;
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
          cursor: pointer;
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
          max-width: 700px;
          width: 90%;
          max-height: 85vh;
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
          z-index: 10;
        }
        .modal-image {
          height: 200px;
          background-size: cover;
          background-position: center;
          position: relative;
        }
        .modal-category {
          position: absolute;
          bottom: 1rem;
          left: 1rem;
          padding: 0.3rem 0.8rem;
          background: #7c5fe6;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .modal-body {
          padding: 1.5rem;
        }
        .modal-body h2 {
          margin-bottom: 1rem;
        }
        .modal-meta {
          margin-bottom: 1rem;
        }
        .modal-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.5);
        }
        .modal-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .modal-tag {
          padding: 0.2rem 0.6rem;
          background: rgba(124,95,230,0.2);
          border-radius: 20px;
          font-size: 0.7rem;
          color: #9b7ff0;
        }
        .modal-excerpt {
          margin-bottom: 1.5rem;
        }
        .modal-excerpt p {
          color: rgba(255,255,255,0.8);
          line-height: 1.6;
        }
        .modal-actions {
          display: flex;
          gap: 1rem;
        }
        @media (max-width: 1024px) {
          .featured-grid, .posts-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .blog-page {
            padding: 1rem;
          }
          .featured-grid, .posts-grid {
            grid-template-columns: 1fr;
          }
          .post-list-item {
            flex-direction: column;
          }
          .list-image {
            width: 100%;
            height: 150px;
          }
          .newsletter-form {
            flex-direction: column;
          }
          .modal-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default Blog;