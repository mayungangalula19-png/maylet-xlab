import { useState, useEffect, useMemo } from 'react';

import { useParams, Link, useNavigate } from 'react-router-dom';

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
    bio: string;
    twitter?: string;
    linkedin?: string;
  };
  published_date: string;
  updated_date?: string;
  read_time: number;
  views: number;
  likes: number;
  is_featured: boolean;
}

interface Comment {
  id: string;
  author_name: string;
  author_email: string;
  author_avatar: string;
  content: string;
  created_at: string;
  likes: number;
  is_approved: boolean;
  replies?: Comment[];
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author_name: 'John Innovator',
      author_email: 'john@example.com',
      author_avatar: 'JI',
      content: 'This is incredibly helpful! Thank you for sharing this framework.',
      created_at: '2025-05-16T10:30:00Z',
      likes: 12,
      is_approved: true,
    },
    {
      id: '2',
      author_name: 'Sarah Tech',
      author_email: 'sarah@example.com',
      author_avatar: 'ST',
      content: 'I applied the customer interview method and discovered my initial assumptions were completely wrong. Saved me months of work!',
      created_at: '2025-05-16T14:20:00Z',
      likes: 8,
      is_approved: true,
    },
  ]);
  const [newComment, setNewComment] = useState({ name: '', email: '', content: '' });
  const [liked, setLiked] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
const [loading] = useState(false);


  // Mock blog post data - in production, fetch from Supabase
  const blogPosts: Record<string, BlogPost> = {
    'validate-startup-idea-48-hours': {
      id: '1',
      title: 'How to Validate Your Startup Idea in 48 Hours',
      slug: 'validate-startup-idea-48-hours',
      excerpt: 'Learn the exact framework used by successful founders to test market demand and validate their startup ideas before building anything.',
      content: `
        <p>Validating your startup idea is the most critical step before investing time and money into building a product. Yet, most founders skip this step and end up building something nobody wants.</p>
        
        <h2>Why Validation Matters</h2>
        <p>Studies show that 42% of startups fail because there's no market need for their product. This is completely avoidable with proper validation. In this guide, we'll walk you through a proven framework to validate your idea in just 48 hours.</p>
        
        <h2>Step 1: Define Your Hypothesis (2 hours)</h2>
        <p>Start by clearly defining what problem you're solving and for whom. Write down:</p>
        <ul>
          <li>Who is your target customer?</li>
          <li>What problem are they facing?</li>
          <li>What is your proposed solution?</li>
          <li>What would make them pay for it?</li>
        </ul>
        
        <h2>Step 2: Conduct Customer Interviews (6 hours)</h2>
        <p>Talk to 20-30 potential customers. Don't pitch your solution – listen to their problems. Ask open-ended questions about how they currently solve the problem and what frustrates them about existing solutions.</p>
        
        <h2>Step 3: Create a Landing Page (4 hours)</h2>
        <p>Build a simple landing page describing your solution and its benefits. Add a waitlist signup form to measure interest. Use tools like Carrd or even a simple HTML page.</p>
        
        <h2>Step 4: Run Targeted Ads (12 hours)</h2>
        <p>Spend $100-200 on Facebook or Google ads targeting your ideal customer. Measure click-through rates and signup conversions. A 5-10% conversion rate indicates strong demand.</p>
        
        <h2>Step 5: Analyze Results (4 hours)</h2>
        <p>Look at your data: How many people signed up? What did they say in interviews? What feedback did you receive? If you have 50+ waitlist signups and positive interview feedback, you have validation to proceed.</p>
        
        <h2>Step 6: Build an MVP (20 hours)</h2>
        <p>Now that you have validation, build the smallest possible version of your product that delivers value. Focus on the core feature that solves the main problem.</p>
        
        <h2>Tools to Help You Validate</h2>
        <p>Maylet XLab's AI Experiment Engine can help you analyze market potential, competitor landscapes, and feasibility before you start building. Run an experiment today to validate your idea in minutes instead of days.</p>
      `,
      featured_image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
      category: 'startup',
      tags: ['validation', 'startup', 'market-research', 'mvp'],
      author: {
        name: 'Engineer Mayunga',
        avatar: 'EM',
        role: 'Founder & Lead Developer',
        bio: 'Full-stack engineer and innovation enthusiast. Building tools to help African innovators succeed.',
        twitter: '@engineer_mayunga',
        linkedin: 'in/engineer-mayunga',
      },
      published_date: '2025-05-15',
      read_time: 8,
      views: 1245,
      likes: 89,
      is_featured: true,
    },
    'complete-guide-raising-first-100k': {
      id: '2',
      title: 'The Complete Guide to Raising Your First $100K',
      slug: 'complete-guide-raising-first-100k',
      excerpt: 'From pitch deck to term sheet – everything you need to know about early-stage fundraising, including investor outreach strategies.',
      content: `
        <p>Raising your first $100K is a milestone every founder remembers. It's the validation that someone believes in your vision enough to invest their money. This guide walks you through the entire process.</p>
        
        <h2>Before You Start Raising</h2>
        <p>Make sure you have validation: customer interviews, a working prototype, and ideally some early revenue or letters of intent. Investors want to see traction, not just an idea.</p>
        
        <h2>Building Your Pitch Deck</h2>
        <p>Your pitch deck should tell a compelling story. Include these 10 slides:</p>
        <ol>
          <li><strong>Problem:</strong> What pain point are you solving?</li>
          <li><strong>Solution:</strong> How does your product solve it?</li>
          <li><strong>Market Size:</strong> How big is the opportunity?</li>
          <li><strong>Product:</strong> Demo or screenshots of your product</li>
          <li><strong>Traction:</strong> Users, revenue, partnerships</li>
          <li><strong>Business Model:</strong> How you make money</li>
          <li><strong>Competition:</strong> Who else is in the space</li>
          <li><strong>Team:</strong> Why you're the right people to build this</li>
          <li><strong>Financials:</strong> Projections and use of funds</li>
          <li><strong>Ask:</strong> How much you're raising and what for</li>
        </ol>
        
        <h2>Finding Investors</h2>
        <p>Use multiple channels to find investors:</p>
        <ul>
          <li>AngelList and Crunchbase</li>
          <li>LinkedIn outreach</li>
          <li>Startup events and pitch competitions</li>
          <li>Referrals from other founders</li>
          <li>Maylet XLab Funding Hub</li>
        </ul>
        
        <h2>The Outreach Process</h2>
        <p>When reaching out to investors:</p>
        <ul>
          <li>Personalize each email</li>
          <li>Lead with traction, not just the idea</li>
          <li>Keep it concise (3-4 sentences)</li>
          <li>Include a link to your deck</li>
          <li>Follow up after 5-7 days</li>
        </ul>
        
        <h2>Negotiating Terms</h2>
        <p>Key terms to understand: valuation, SAFE vs priced round, pro-rata rights, board seats, and liquidation preferences. Always have a lawyer review any term sheet.</p>
        
        <h2>Closing the Round</h2>
        <p>Once you have a lead investor, the rest follow. Use tools like Clerky or Stripe Atlas for legal documents. Wire the money and start building!</p>
      `,
      featured_image: 'https://images.unsplash.com/photo-1553729459-9a2c9f6b2b6b',
      category: 'funding',
      tags: ['fundraising', 'investors', 'pitch-deck', 'startup'],
      author: {
        name: 'Amina Kimaro',
        avatar: 'AK',
        role: 'Head of Innovation',
        bio: 'AgriTech specialist helping founders navigate the fundraising landscape.',
        twitter: '@amina_kimaro',
        linkedin: 'in/amina-kimaro',
      },
      published_date: '2025-05-10',
      read_time: 12,
      views: 892,
      likes: 67,
      is_featured: true,
    },
    'ai-powered-innovation-trends-2025': {
      id: '3',
      title: 'AI-Powered Innovation: Trends for 2025',
      slug: 'ai-powered-innovation-trends-2025',
      excerpt: 'Discover how top innovators are leveraging AI to accelerate product development, reduce costs, and enter markets faster.',
      content: `
        <p>Artificial intelligence is no longer a futuristic concept – it's here, and it's transforming how innovators build products. Here are the key AI trends shaping innovation in 2025.</p>
        
        <h2>1. Generative AI for Product Development</h2>
        <p>Tools like ChatGPT, Claude, and Gemini are helping founders write code, create marketing copy, and even design prototypes. This reduces development time by up to 70%.</p>
        
        <h2>2. AI-Powered Market Research</h2>
        <p>AI can analyze millions of data points to identify market trends, competitor strategies, and customer preferences in minutes instead of months.</p>
        
        <h2>3. Automated Customer Support</h2>
        <p>AI chatbots now handle 80% of customer inquiries, freeing up founders to focus on product development and growth.</p>
        
        <h2>4. Predictive Analytics</h2>
        <p>Machine learning models can predict customer churn, identify upsell opportunities, and forecast revenue with increasing accuracy.</p>
        
        <h2>5. AI-Assisted Fundraising</h2>
        <p>Platforms now use AI to match founders with relevant investors, analyze pitch deck effectiveness, and optimize outreach timing.</p>
        
        <h2>How Maylet XLab Uses AI</h2>
        <p>Our AI Experiment Engine analyzes your idea against millions of data points to provide feasibility scores, market insights, and risk assessments. Try it today to validate your next big idea.</p>
      `,
      featured_image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995',
      category: 'ai',
      tags: ['AI', 'trends', 'innovation', 'technology'],
      author: {
        name: 'David Mwangi',
        avatar: 'DM',
        role: 'Technical Lead',
        bio: 'Full-stack developer passionate about AI and its applications in African innovation.',
        twitter: '@david_mwangi',
        linkedin: 'in/david-mwangi',
      },
      published_date: '2025-05-05',
      read_time: 6,
      views: 2341,
      likes: 156,
      is_featured: true,
    },
  };

  // Mock related posts
  const allPosts = Object.values(blogPosts);
  const post = useMemo(() => {
    if (!slug) return null;
    return blogPosts[slug] || null;
  }, [slug]);

  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return allPosts.filter(p => p.slug !== post.slug && p.category === post.category).slice(0, 3);
  }, [post, allPosts]);

  useEffect(() => {
    if (!slug || !blogPosts[slug]) {
      navigate('/blog');
    }
  }, [slug, navigate]);

  const handleLike = () => {
    if (!liked && post) {
      setLiked(true);
    }
  };



  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.name && newComment.email && newComment.content) {
      const comment: Comment = {
        id: Date.now().toString(),
        author_name: newComment.name,
        author_email: newComment.email,
        author_avatar: newComment.name.charAt(0).toUpperCase(),
        content: newComment.content,
        created_at: new Date().toISOString(),
        likes: 0,
        is_approved: true,
      };
      setComments([comment, ...comments]);
      setNewComment({ name: '', email: '', content: '' });
    }
  };

  const shareOnSocial = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || '';
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`;
        break;
    }
    
    if (shareUrl) window.open(shareUrl, '_blank');
    setShowShareModal(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
    setShowShareModal(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading article...</p>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="blog-post-page">
      {/* Hero Section */}
      <div className="post-hero" data-image={post.featured_image}>
        <div className="post-hero-content">
          <div className="post-category">{post.category}</div>
          <h1>{post.title}</h1>
          <div className="post-meta-large">
            <div className="post-author-large">
              <span className="author-avatar-large">{post.author.avatar}</span>
              <div>
                <strong>{post.author.name}</strong>
                <span>{post.author.role}</span>
              </div>
            </div>
            <div className="post-stats">
              <span>📅 {new Date(post.published_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>📖 {post.read_time} min read</span>
              <span>👁️ {post.views.toLocaleString()} views</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="post-container">
        <div className="post-sidebar">
          <div className="author-card">
            <div className="author-avatar-large">{post.author.avatar}</div>
            <h3>{post.author.name}</h3>
            <p>{post.author.role}</p>
            <div className="author-bio">{post.author.bio}</div>
            <div className="author-social">
              {post.author.twitter && <a href={`https://twitter.com/${post.author.twitter}`} target="_blank" rel="noopener noreferrer">𝕏 Twitter</a>}
              {post.author.linkedin && <a href={`https://linkedin.com/${post.author.linkedin}`} target="_blank" rel="noopener noreferrer">🔗 LinkedIn</a>}
            </div>
          </div>
          
          <div className="share-card">
            <h4>Share this article</h4>
            <div className="share-buttons">
              <button onClick={() => shareOnSocial('twitter')} className="share-btn twitter">𝕏</button>
              <button onClick={() => shareOnSocial('linkedin')} className="share-btn linkedin">in</button>
              <button onClick={() => shareOnSocial('facebook')} className="share-btn facebook">f</button>
              <button onClick={() => shareOnSocial('email')} className="share-btn email">✉️</button>
              <button onClick={copyToClipboard} className="share-btn copy">🔗</button>
            </div>
          </div>

          <div className="tags-card">
            <h4>Tags</h4>
            <div className="tags-list">
              {post.tags.map(tag => (
                <Link key={tag} to={`/blog?tag=${tag}`} className="tag">#{tag}</Link>
              ))}
            </div>
          </div>
        </div>

        <div className="post-content">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
          
          <div className="post-actions">
            <button className={`like-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
              ❤️ {post.likes} {post.likes === 1 ? 'Like' : 'Likes'}
            </button>
            <button className="share-btn-main" onClick={() => setShowShareModal(true)}>
              📤 Share Article
            </button>
          </div>
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="related-posts">
          <h2>Related Articles</h2>
          <div className="related-grid">
            {relatedPosts.map(related => (
              <Link key={related.id} to={`/blog/${related.slug}`} className="related-card">
                <div className="related-image" data-image={related.featured_image} />
                <div className="related-content">
                  <div className="related-category">{related.category}</div>
                  <h3>{related.title}</h3>
                  <p>{related.excerpt.substring(0, 80)}...</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="comments-section">
        <h2>Comments ({comments.length})</h2>
        
        <form className="comment-form" onSubmit={handleCommentSubmit}>
          <h3>Leave a Comment</h3>
          <div className="form-row">
            <input
              type="text"
              placeholder="Your Name *"
              value={newComment.name}
              onChange={(e) => setNewComment({ ...newComment, name: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Your Email *"
              value={newComment.email}
              onChange={(e) => setNewComment({ ...newComment, email: e.target.value })}
              required
            />
          </div>
          <textarea
            rows={4}
            placeholder="Share your thoughts..."
            value={newComment.content}
            onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
            required
          />
          <button type="submit" className="btn-primary">Post Comment</button>
        </form>

        <div className="comments-list">
          {comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-avatar">{comment.author_avatar}</div>
              <div className="comment-content">
                <div className="comment-header">
                  <strong>{comment.author_name}</strong>
                  <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                </div>
                <p>{comment.content}</p>
                <button className="comment-like">❤️ {comment.likes}</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowShareModal(false)}>×</button>
            <h3>Share this article</h3>
            <div className="share-options">
              <button onClick={() => shareOnSocial('twitter')} className="share-option twitter">𝕏 Twitter</button>
              <button onClick={() => shareOnSocial('linkedin')} className="share-option linkedin">in LinkedIn</button>
              <button onClick={() => shareOnSocial('facebook')} className="share-option facebook">f Facebook</button>
              <button onClick={() => shareOnSocial('email')} className="share-option email">✉️ Email</button>
              <button onClick={copyToClipboard} className="share-option copy">🔗 Copy Link</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .blog-post-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
          font-family: 'Inter', sans-serif;
        }
        .post-hero {
          height: 500px;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
        }
        .post-hero-content {
          max-width: 800px;
          padding: 2rem;
        }
        .post-category {
          display: inline-block;
          padding: 0.3rem 0.8rem;
          background: #7c5fe6;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        .post-hero h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        .post-meta-large {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2rem;
          flex-wrap: wrap;
        }
        .post-author-large {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .author-avatar-large {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 700;
        }
        .post-stats {
          display: flex;
          gap: 1rem;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.7);
        }
        .post-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 3rem 2rem;
          display: flex;
          gap: 3rem;
        }
        .post-sidebar {
          width: 280px;
          flex-shrink: 0;
        }
        .author-card, .share-card, .tags-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1rem;
          margin-bottom: 1rem;
          text-align: center;
        }
        .author-bio {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.6);
          margin: 0.5rem 0;
        }
        .share-buttons {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }
        .share-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          font-size: 1rem;
        }
        .share-btn.twitter { background: #1DA1F2; color: white; }
        .share-btn.linkedin { background: #0077B5; color: white; }
        .share-btn.facebook { background: #4267B2; color: white; }
        .share-btn.email { background: #6b6b7a; color: white; }
        .share-btn.copy { background: #48bb78; color: white; }
        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .tag {
          padding: 0.2rem 0.6rem;
          background: rgba(124,95,230,0.2);
          border-radius: 20px;
          font-size: 0.7rem;
          color: #9b7ff0;
          text-decoration: none;
        }
        .post-content {
          flex: 1;
          color: rgba(255,255,255,0.9);
          line-height: 1.8;
        }
        .post-content h2 {
          font-size: 1.5rem;
          margin: 1.5rem 0 1rem;
          color: #9b7ff0;
        }
        .post-content h3 {
          font-size: 1.2rem;
          margin: 1rem 0 0.5rem;
        }
        .post-content p {
          margin-bottom: 1rem;
        }
        .post-content ul, .post-content ol {
          margin: 1rem 0;
          padding-left: 2rem;
        }
        .post-content li {
          margin-bottom: 0.3rem;
        }
        .post-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .like-btn {
          background: none;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 40px;
          padding: 0.5rem 1rem;
          color: white;
          cursor: pointer;
        }
        .like-btn.liked {
          background: #fc8181;
          border-color: #fc8181;
        }
        .share-btn-main {
          background: none;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 40px;
          padding: 0.5rem 1rem;
          color: white;
          cursor: pointer;
        }
        .related-posts {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .related-posts h2 {
          margin-bottom: 1.5rem;
        }
        .related-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .related-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
          text-decoration: none;
          color: white;
          transition: all 0.3s;
        }
        .related-card:hover {
          transform: translateY(-4px);
          background: rgba(255,255,255,0.05);
        }
        .related-image {
          height: 140px;
          background-size: cover;
          background-position: center;
        }
        .related-content {
          padding: 1rem;
        }
        .related-category {
          display: inline-block;
          padding: 0.2rem 0.5rem;
          background: rgba(124,95,230,0.2);
          border-radius: 12px;
          font-size: 0.7rem;
          color: #9b7ff0;
          margin-bottom: 0.5rem;
        }
        .related-content h3 {
          font-size: 0.9rem;
          margin-bottom: 0.3rem;
        }
        .related-content p {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.6);
        }
        .comments-section {
          max-width: 800px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }
        .comments-section h2 {
          margin-bottom: 2rem;
        }
        .comment-form {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        .comment-form h3 {
          margin-bottom: 1rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .comment-form input, .comment-form textarea {
          width: 100%;
          padding: 0.6rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
        }
        .btn-primary {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
        }
        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .comment-item {
          display: flex;
          gap: 1rem;
        }
        .comment-avatar {
          width: 45px;
          height: 45px;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          flex-shrink: 0;
        }
        .comment-content {
          flex: 1;
        }
        .comment-header {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin-bottom: 0.3rem;
        }
        .comment-header span {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.5);
        }
        .comment-content p {
          margin-bottom: 0.3rem;
        }
        .comment-like {
          background: none;
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          font-size: 0.75rem;
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
          max-width: 400px;
          width: 90%;
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
        .share-options {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .share-option {
          padding: 0.6rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          text-align: center;
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
        @media (max-width: 900px) {
          .post-container {
            flex-direction: column;
          }
          .post-sidebar {
            width: 100%;
            order: 2;
          }
          .related-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 600px) {
          .post-hero h1 {
            font-size: 1.8rem;
          }
          .related-grid {
            grid-template-columns: 1fr;
          }
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default BlogPost;