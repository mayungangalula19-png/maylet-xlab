// C:\Users\user\maylet-xlab\src\app\routes\LandingPage.tsx
// PURE CODE - NO SIDEBAR - MARKETING PAGE

import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';

// ============================================================
// TYPES
// ============================================================
interface Testimonial {
  id: number;
  name: string;
  role: string;
  location: string;
  text: string;
  avatar: string;
  rating: number;
}

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  cta: string;
  ctaLink: string;
  popular: boolean;
}

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  tag: string;
}

interface EcosystemCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  metric: string;
}

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  slug: string;
}

interface ResourceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  type: string;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

// ============================================================
// STATIC DATA
// ============================================================
const heroCards = [
  { id: 'ideate', label: 'Ideate', desc: 'Capture your vision', icon: '💡', route: '/features/ideate' },
  { id: 'experiment', label: 'Experiment', desc: 'AI validation', icon: '⚗️', route: '/features/experiment' },
  { id: 'build', label: 'Build', desc: 'Create MVP', icon: '📦', route: '/features/build' },
  { id: 'collaborate', label: 'Collaborate', desc: 'Team workspace', icon: '👥', route: '/features/collaborate' },
  { id: 'launch', label: 'Launch', desc: 'Go to market', icon: '🚀', route: '/features/launch' },
  { id: 'fund', label: 'Fund', desc: 'Raise capital', icon: '💰', route: '/funding' },
  { id: 'scale', label: 'Scale', desc: 'Grow globally', icon: '📈', route: '/features/scale' },
];

const brandLogos = [
  { name: 'Microsoft', icon: '💠', link: 'https://microsoft.com' },
  { name: 'Google for Startups', icon: '🔍', link: 'https://startup.google.com' },
  { name: 'AWS', icon: '☁️', link: 'https://aws.amazon.com/startups' },
  { name: 'GitHub', icon: '🐙', link: 'https://github.com' },
  { name: 'NVIDIA', icon: '🎮', link: 'https://nvidia.com' },
  { name: 'Stripe', icon: '💳', link: 'https://stripe.com' },
];

const featureCards: FeatureCard[] = [
  { id: 'ai', title: 'AI Idea Validation', description: 'Get instant market-fit scores, competitor analysis, and risk assessment powered by AI before writing any code.', icon: '🤖', route: '/features/ai', tag: 'AI-Powered' },
  { id: 'prototypes', title: 'Prototypes & MVPs', description: 'Build, iterate and showcase prototypes with integrated file management, version history, and user feedback tools.', icon: '📦', route: '/features/prototypes', tag: 'Design' },
  { id: 'collaboration', title: 'Team Collaboration', description: 'Find co-founders, assemble teams, and work together with real-time kanban, chat, and shared documents.', icon: '👥', route: '/features/collaboration', tag: 'Real-time' },
  { id: 'projects', title: 'Projects & Tasks', description: 'Manage projects, tasks and milestones in one powerful workspace with progress tracking and deadline reminders.', icon: '📊', route: '/features/projects', tag: 'Organization' },
  { id: 'funding', title: 'Funding Hub', description: 'Discover grants, angel investors, and VCs. Submit pitches directly through the platform and track investments.', icon: '💰', route: '/funding', tag: 'Opportunity' },
  { id: 'vault', title: 'Innovation Vault', description: 'Cryptographically timestamp your ideas and IP with legally defensible proof of invention and blockchain-grade security.', icon: '🔐', route: '/vault', tag: 'Security' },
];

const ecosystemCards: EcosystemCard[] = [
  { id: 'incubator', title: 'Startup Incubator', description: 'From idea to incorporation – we guide you through every step of building your startup.', icon: '🌱', route: '/ecosystem/incubator', metric: '50+ startups accelerated' },
  { id: 'academy', title: 'Innovation Academy', description: 'Masterclasses, workshops, and resources from top innovators and industry leaders.', icon: '🎓', route: '/ecosystem/academy', metric: '10,000+ learners' },
  { id: 'community', title: 'Global Community', description: 'Connect with innovators, mentors, and investors across multiple countries worldwide.', icon: '🌍', route: '/ecosystem/community', metric: '35+ countries' },
];

const stats = [
  { id: 'stat1', value: '10K+', label: 'Innovators', description: 'Active builders across Africa and beyond', targetValue: 10000 },
  { id: 'stat2', value: '2K+', label: 'Projects Built', description: 'From MVPs to full-scale products', targetValue: 2000 },
  { id: 'stat3', value: '$5M+', label: 'Funds Raised', description: 'Capital connected through our platform', targetValue: 5000000 },
  { id: 'stat4', value: '35+', label: 'Countries', description: 'Innovators from around the globe', targetValue: 35 },
];

const testimonials: Testimonial[] = [
  { id: 1, name: 'Amina Kimaro', role: 'AgriTech Founder', location: 'Dar es Salaam, Tanzania', text: 'The AI validation feature saved months of manual research. Within weeks, I had a validated concept and paying customers.', avatar: 'AK', rating: 5 },
  { id: 2, name: 'David Mwangi', role: 'Full-Stack Developer', location: 'Nairobi, Kenya', text: 'Found my co-founder through the platform and built our first prototype entirely within XLab. The collaboration tools are exceptional.', avatar: 'DM', rating: 5 },
  { id: 3, name: 'Sarah Okonkwo', role: 'Health Tech Researcher', location: 'Lagos, Nigeria', text: 'The Innovation Vault gave me confidence to share ideas publicly. My IP is now protected with timestamped, legally defensible proof.', avatar: 'SO', rating: 5 },
  { id: 4, name: 'James Mutua', role: 'University Student', location: 'Kampala, Uganda', text: 'Discovered a student innovation grant through the Funding Hub and won it. Now building my startup full-time.', avatar: 'JM', rating: 5 },
  { id: 5, name: 'Nadia Khalil', role: 'Enterprise Innovation Lead', location: 'Cairo, Egypt', text: 'Consolidated multiple tools into one private workspace. Our R&D productivity increased significantly.', avatar: 'NK', rating: 5 },
];

const pricingPlans: PricingPlan[] = [
  { name: 'Free', price: '$0', period: '/month', tagline: 'Perfect for getting started', features: ['3 Active Projects', 'Basic AI Validation', '5 Team Members', 'Community Access', 'Innovation Vault (3 items)'], cta: 'Start for Free', ctaLink: '/register', popular: false },
  { name: 'Pro', price: '$15', period: '/month', tagline: 'For serious innovators', features: ['Unlimited Projects', 'Advanced AI Analytics', 'Unlimited Team Members', 'Funding Hub Access', 'Unlimited Vault Storage', 'Priority Support', 'Custom Domains'], cta: 'Get Pro', ctaLink: '/register?plan=pro', popular: true },
  { name: 'Enterprise', price: '$99', period: '/month', tagline: 'For organizations', features: ['Everything in Pro', 'Admin Dashboard', 'SSO & Advanced Security', 'Dedicated Account Manager', 'API Access', 'Private Innovation Lab', 'SLA Guarantee'], cta: 'Contact Sales', ctaLink: '/contact', popular: false },
];

const blogPosts: BlogPost[] = [
  { id: 1, title: 'Validating Your Startup Idea', excerpt: 'Learn the framework used by successful founders to test market demand before building.', date: 'May 15, 2025', readTime: '8 min read', category: 'Strategy', slug: 'validate-idea' },
  { id: 2, title: 'Raising Your First Capital', excerpt: 'From pitch deck to term sheet – everything about early-stage fundraising.', date: 'May 10, 2025', readTime: '12 min read', category: 'Funding', slug: 'raise-capital' },
  { id: 3, title: 'AI-Powered Innovation Trends', excerpt: 'How top innovators leverage AI to accelerate product development.', date: 'May 5, 2025', readTime: '6 min read', category: 'AI', slug: 'ai-trends' },
];

const resources: ResourceItem[] = [
  { id: 'guide', title: 'Innovation Guide', description: 'Framework for taking ideas to market', icon: '📘', route: '/resources/guide', type: 'E-book' },
  { id: 'videos', title: 'Video Tutorials', description: 'Watch how innovators use XLab', icon: '🎥', route: '/resources/videos', type: 'Video Series' },
  { id: 'case-studies', title: 'Success Stories', description: 'Case studies from funded startups', icon: '📊', route: '/resources/case-studies', type: 'Case Studies' },
  { id: 'prompts', title: 'AI Prompt Library', description: 'Templates for idea validation', icon: '💡', route: '/resources/prompts', type: 'Templates' },
  { id: 'webinars', title: 'Live Webinars', description: 'Weekly sessions with experts', icon: '🎤', route: '/resources/webinars', type: 'Events' },
  { id: 'newsletter', title: 'Weekly Newsletter', description: 'Innovation insights delivered', icon: '📧', route: '/resources/newsletter', type: 'Newsletter' },
];

const faqItems: FaqItem[] = [
  { id: 'faq1', question: 'What is Maylet XLab?', answer: 'Maylet XLab is an all-in-one innovation platform that helps you validate ideas, build prototypes, collaborate with teams, protect your IP, and raise funding — all in one workspace.' },
  { id: 'faq2', question: 'How does AI validation work?', answer: 'Our AI analyzes your idea against market data, competitor landscapes, and success patterns to give you a feasibility score, risk assessment, and actionable recommendations.' },
  { id: 'faq3', question: 'Can I invite team members?', answer: 'Yes. The Pro and Enterprise plans allow unlimited team members with role-based access, real-time collaboration, and shared workspaces.' },
  { id: 'faq4', question: 'How is my IP protected?', answer: 'The Innovation Vault cryptographically timestamps your ideas with blockchain-grade security, providing legally defensible proof of invention.' },
];

// ============================================================
// ANIMATED COUNTER COMPONENT
// ============================================================
const AnimatedCounter = ({ target, suffix = '' }: { target: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const duration = 2000;
          const step = (timestamp: number) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return <div ref={ref}>{count}{suffix}</div>;
};

// ============================================================
// MAIN LANDING PAGE COMPONENT
// ============================================================
const LandingPage = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(timer);
    };
  }, []);

  const filteredFeatures = activeFilter === 'all' 
    ? featureCards 
    : featureCards.filter(f => f.tag.toLowerCase() === activeFilter.toLowerCase());

  const filters = ['all', ...new Set(featureCards.map(f => f.tag.toLowerCase()))];

  return (
    <div className="landing-page">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* ========== NAVIGATION ========== */}
      <header className={`landing-header ${scrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="landing-brand">
          {/* Logo image added here */}
          <img src="/images/logo.jpeg" alt="Maylet XLab Logo" className="brand-logo-img" />
          <div className="brand-copy">
            <div className="brand-title">Maylet <span>XLab</span></div>
            <div className="brand-note">Innovation OS</div>
          </div>
        </Link>

        <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <span></span><span></span><span></span>
        </button>

        <nav className={`landing-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <Link to="/features">Features</Link>
          <Link to="/ecosystem">Ecosystem</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/resources">Resources</Link>
          <Link to="/about">About</Link>
        </nav>

        <div className="landing-actions">
          <Link to="/login" className="link-button">Sign in</Link>
          <Link to="/register" className="primary-button">Get Started →</Link>
        </div>
      </header>

      {/* ========== HERO SECTION ========== */}
      <main id="main-content" className="hero-section">
        <section className="hero-copy fade-in-up">
          <div className="hero-pill"><span>🚀</span> The All-in-One Innovation Platform</div>
          <h1>From Idea to <span>Scalable Startup</span> — in One Platform</h1>
          <p>Maylet XLab helps innovators experiment, build, collaborate and launch their ideas faster with the power of AI, teamwork and funding.</p>
          <div className="hero-buttons">
            <Link to="/register" className="primary-button">Start Building Now →</Link>
            <Link to="/features" className="secondary-button">Watch Demo</Link>
          </div>
          <div className="hero-proof">
            <div className="proof-avatars">
              {testimonials.slice(0, 5).map((t, i) => <span key={i} style={{ zIndex: 5 - i }}>{t.avatar}</span>)}
            </div>
            <div className="proof-text">Join <strong>10,000+</strong> innovators building the future</div>
          </div>
        </section>

        <section className="hero-visual fade-in-up delay-1">
          <div className="visual-portal">
            <div className="visual-center">X</div>
            <div className="visual-pulse"></div>
            <div className="visual-orb-1"></div>
            <div className="visual-orb-2"></div>
          </div>
          <div className="visual-labels">
            {heroCards.map((card, idx) => (
              <Link to={card.route} key={card.id} className="visual-tag" style={{ animationDelay: `${idx * 0.05}s` }}>
                <span className="tag-icon">{card.icon}</span>
                <strong>{card.label}</strong>
                <small>{card.desc}</small>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* ========== TRUSTED BRANDS ========== */}
      <section className="brand-bar fade-in-up delay-2">
        <div className="brand-heading">Trusted by innovators and organizations worldwide</div>
        <div className="brand-list">
          {brandLogos.map((logo) => (
            <a key={logo.name} href={logo.link} target="_blank" rel="noopener noreferrer" className="brand-logo">
              <span className="brand-icon">{logo.icon}</span>
              <span>{logo.name}</span>
            </a>
          ))}
        </div>
      </section>

      {/* ========== STATS SECTION ========== */}
      <section className="stats-section">
        {stats.map((stat) => (
          <div key={stat.id} className="stat-block fade-in-up">
            <div className="stat-value">
              {stat.id === 'stat3' ? '$' : ''}
              <AnimatedCounter target={stat.targetValue} suffix={stat.id === 'stat3' ? '+' : (stat.id === 'stat1' || stat.id === 'stat2' ? '+' : '')} />
            </div>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-desc">{stat.description}</div>
          </div>
        ))}
      </section>

      {/* ========== FEATURES SECTION ========== */}
      <section className="feature-grid" id="features">
        <div className="feature-grid-heading fade-in-up">
          <div className="feature-kicker">Powerful features for every innovator</div>
          <h2>Everything you need to turn ideas into <span>impact</span></h2>
          <p className="feature-sub">From validation to launch — all the tools you need in one workspace</p>
        </div>

        <div className="feature-filters fade-in-up delay-1">
          {filters.map(filter => (
            <button key={filter} className={`filter-btn ${activeFilter === filter ? 'active' : ''}`} onClick={() => setActiveFilter(filter)}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        <div className="feature-card-grid">
          {filteredFeatures.map((feature, idx) => (
            <Link to={feature.route} key={feature.id} className="feature-card" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="feature-icon">{feature.icon}</div>
              <div className="feature-tag">{feature.tag}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="feature-hover"><span>Learn more</span><span className="feature-arrow">→</span></div>
            </Link>
          ))}
        </div>

        <div className="feature-footer">
          <Link to="/features" className="secondary-button">Explore All Features →</Link>
        </div>
      </section>

      {/* ========== WORKFLOW SECTION ========== */}
      <section className="workflow-section">
        <div className="workflow-heading fade-in-up">
          <div className="feature-kicker">The Innovation Journey</div>
          <h2>Your path from <span>idea to scale</span></h2>
          <p>Seven steps, one platform — everything you need to succeed</p>
        </div>
        <div className="workflow-steps">
          {heroCards.map((step, idx) => (
            <Link to={step.route} key={step.id} className="workflow-step fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="step-number">{String(idx + 1).padStart(2, '0')}</div>
              <div className="step-icon">{step.icon}</div>
              <div className="step-label">{step.label}</div>
              <div className="step-desc">{step.desc}</div>
              {idx < heroCards.length - 1 && <div className="step-line" />}
            </Link>
          ))}
        </div>
      </section>

      {/* ========== ECOSYSTEM SECTION ========== */}
      <section className="ecosystem-section" id="ecosystem">
        <div className="ecosystem-heading fade-in-up">
          <div className="feature-kicker">More Than Just Software</div>
          <h2>A complete <span>innovation ecosystem</span></h2>
          <p>Beyond the platform — access capital, community, and expertise</p>
        </div>
        <div className="ecosystem-grid">
          {ecosystemCards.map((card, idx) => (
            <Link to={card.route} key={card.id} className="ecosystem-card fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="eco-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <div className="eco-stats">{card.metric}</div>
              <span className="eco-arrow">Explore →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ========== TESTIMONIALS SECTION ========== */}
      <section className="testimonials-section">
        <div className="testimonials-heading fade-in-up">
          <div className="feature-kicker">Community Voices</div>
          <h2>What our innovators <span>say</span></h2>
          <p>Join thousands of builders who trust Maylet XLab</p>
        </div>
        <div className="testimonial-card fade-in-up">
          <div className="testimonial-stars">{'★'.repeat(testimonials[activeTestimonial].rating)}</div>
          <p className="testimonial-text">"{testimonials[activeTestimonial].text}"</p>
          <div className="testimonial-author">
            <div className="author-avatar">{testimonials[activeTestimonial].avatar}</div>
            <div>
              <strong>{testimonials[activeTestimonial].name}</strong>
              <span>{testimonials[activeTestimonial].role} · {testimonials[activeTestimonial].location}</span>
            </div>
          </div>
        </div>
        <div className="testimonial-dots">
          {testimonials.map((_, i) => (
            <button key={i} className={`dot ${i === activeTestimonial ? 'active' : ''}`} onClick={() => setActiveTestimonial(i)} />
          ))}
        </div>
      </section>

      {/* ========== PRICING SECTION ========== */}
      <section className="pricing-section" id="pricing">
        <div className="pricing-heading fade-in-up">
          <div className="feature-kicker">Simple, Transparent Pricing</div>
          <h2>Choose your <span>plan</span></h2>
          <p>Start free, scale when you're ready — no hidden fees</p>
        </div>
        <div className="pricing-grid">
          {pricingPlans.map((plan, idx) => (
            <div key={plan.name} className={`pricing-card fade-in-up ${plan.popular ? 'popular' : ''}`} style={{ animationDelay: `${idx * 0.1}s` }}>
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              <div className="plan-name">{plan.name}</div>
              <div className="plan-price">{plan.price}<span>{plan.period}</span></div>
              <div className="plan-tagline">{plan.tagline}</div>
              <ul className="plan-features">
                {plan.features.map((feature) => (
                  <li key={feature}><span className="check">✓</span> {feature}</li>
                ))}
              </ul>
              <Link to={plan.ctaLink} className={`plan-cta ${plan.popular ? 'primary-button' : 'secondary-button'}`}>{plan.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* ========== BLOG SECTION ========== */}
      <section className="blog-section">
        <div className="blog-heading fade-in-up">
          <div className="feature-kicker">Latest Insights</div>
          <h2>Innovation <span>resources</span></h2>
          <p>Actionable guides from industry experts</p>
        </div>
        <div className="blog-grid">
          {blogPosts.map((post, idx) => (
            <Link to={`/blog/${post.slug}`} key={post.id} className="blog-card fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="blog-category">{post.category}</div>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <div className="blog-meta"><span>{post.date}</span><span>{post.readTime}</span></div>
              <div className="blog-link">Read article →</div>
            </Link>
          ))}
        </div>
        <div className="blog-footer">
          <Link to="/blog" className="secondary-button">View All Articles →</Link>
        </div>
      </section>

      {/* ========== RESOURCES SECTION ========== */}
      <section className="resources-section" id="resources">
        <div className="resources-heading fade-in-up">
          <div className="feature-kicker">Learn & Grow</div>
          <h2>Free resources for <span>innovators</span></h2>
        </div>
        <div className="resources-grid">
          {resources.map((resource, idx) => (
            <Link to={resource.route} key={resource.id} className="resource-card fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="resource-icon">{resource.icon}</div>
              <div className="resource-type">{resource.type}</div>
              <h3>{resource.title}</h3>
              <p>{resource.description}</p>
              <span className="resource-link">Access →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ========== FAQ SECTION ========== */}
      <section className="faq-section">
        <div className="faq-heading fade-in-up">
          <div className="feature-kicker">Common Questions</div>
          <h2>Frequently asked <span>questions</span></h2>
        </div>
        <div className="faq-grid">
          {faqItems.map((item, idx) => (
            <div key={item.id} className="faq-item fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </div>
          ))}
        </div>
        <div className="faq-footer">
          <Link to="/faq" className="secondary-button">View All FAQs →</Link>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="final-cta fade-in-up">
        <div className="cta-glow"></div>
        <div className="feature-kicker">Ready to Build the Future?</div>
        <h2>Your idea is waiting<br />to become real.</h2>
        <p>Join thousands of innovators from multiple countries — from students to enterprise teams — building the future with Maylet XLab.</p>
        <div className="cta-buttons">
          <Link to="/register" className="primary-button btn-large">Create Free Account →</Link>
          <Link to="/login" className="secondary-button">Already have an account? Sign in</Link>
        </div>
        <div className="cta-names">{testimonials.map((t) => t.name.split(' ')[0]).join(' · ')} · and thousands more</div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">Maylet XLab</div>
            <p>Innovation Operating System<br />for Africa and beyond.</p>
            <div className="footer-social">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">YouTube</a>
            </div>
          </div>
          <div className="footer-col">
            <strong>Product</strong>
            <Link to="/features">Features</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/register">Sign Up</Link>
            <Link to="/demo">Request Demo</Link>
          </div>
          <div className="footer-col">
            <strong>Company</strong>
            <Link to="/about">About</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/careers">Careers</Link>
            <Link to="/press">Press</Link>
          </div>
          <div className="footer-col">
            <strong>Legal</strong>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Use</Link>
            <Link to="/security">Security</Link>
            <Link to="/cookies">Cookie Policy</Link>
          </div>
          <div className="footer-col">
            <strong>Support</strong>
            <Link to="/help">Help Center</Link>
            <Link to="/contact">Contact Us</Link>
            <Link to="/status">System Status</Link>
            <Link to="/community">Community</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 Maylet Technology Ltd. All rights reserved.</span>
          <div className="footer-flags">
            <span>🌍 Global</span>
            <span>🇹🇿 Tanzania</span>
            <span>🇰🇪 Kenya</span>
            <span>🇳🇬 Nigeria</span>
            <span>🇿🇦 South Africa</span>
          </div>
        </div>
      </footer>

      {/* ========== STYLES ========== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root { color-scheme: dark; scroll-behavior: smooth; }
        
        .landing-page { 
          min-height: 100vh; 
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
          font-family: 'Inter', sans-serif; 
          color: #f7f9ff; 
          overflow-x: hidden; 
        }
        
        .skip-link { position: absolute; top: -40px; left: 0; background: #7c5fe6; color: white; padding: 8px 16px; text-decoration: none; z-index: 200; }
        .skip-link:focus { top: 0; }
        
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { opacity: 0.4; transform: scale(0.8); } 100% { opacity: 0; transform: scale(1.8); } }
        
        .fade-in-up { animation: fadeInUp 0.6s ease forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.2s; } .delay-2 { animation-delay: 0.4s; }
        
        .landing-header { max-width: 1280px; margin: 0 auto; padding: 1rem 2rem; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; transition: all 0.3s ease; }
        .landing-header.scrolled { background: rgba(4, 6, 16, 0.95); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.08); }
        
        .landing-brand { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: inherit; }
        /* Logo image style */
        .brand-logo-img {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          object-fit: cover;
        }
        .brand-title { font-size: 1rem; font-weight: 700; }
        .brand-title span { color: #7c5fe6; }
        .brand-note { font-size: 0.7rem; color: rgba(255,255,255,0.5); }
        
        .mobile-menu-toggle { display: none; background: none; border: none; cursor: pointer; flex-direction: column; gap: 4px; }
        .mobile-menu-toggle span { width: 24px; height: 2px; background: white; }
        
        .landing-nav { display: flex; gap: 2rem; align-items: center; }
        .landing-nav a { color: rgba(255,255,255,0.7); text-decoration: none; font-size: 0.9rem; transition: color 0.2s; }
        .landing-nav a:hover { color: #fff; }
        
        .landing-actions { display: flex; gap: 0.75rem; align-items: center; }
        .link-button { color: white; text-decoration: none; padding: 0.5rem 1rem; border-radius: 40px; border: 1px solid rgba(255,255,255,0.15); }
        .link-button:hover { background: rgba(255,255,255,0.05); }
        .primary-button { background: linear-gradient(135deg, #7c5fe6, #2fd4ff); color: #0a0d1a; padding: 0.6rem 1.4rem; border-radius: 40px; font-weight: 600; text-decoration: none; display: inline-block; }
        .primary-button:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(124,95,230,0.4); }
        .secondary-button { background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0.6rem 1.4rem; border-radius: 40px; font-weight: 500; text-decoration: none; display: inline-block; }
        .secondary-button:hover { border-color: #7c5fe6; background: rgba(124,95,230,0.2); }
        
        .hero-section { max-width: 1280px; margin: 0 auto; padding: 4rem 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }
        .hero-pill { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(124,95,230,0.15); border: 1px solid rgba(124,95,230,0.25); padding: 0.3rem 1rem; border-radius: 40px; font-size: 0.75rem; color: #9b7ff0; margin-bottom: 1.5rem; }
        .hero-copy h1 { font-size: clamp(2.5rem, 4.5vw, 4.5rem); line-height: 1.05; margin-bottom: 1rem; }
        .hero-copy h1 span { color: #7c5fe6; }
        .hero-copy p { max-width: 500px; color: rgba(255,255,255,0.85); line-height: 1.7; margin-bottom: 1.5rem; }
        .hero-buttons { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
        .hero-proof { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .proof-avatars { display: flex; }
        .proof-avatars span { width: 38px; height: 38px; background: linear-gradient(135deg, #7c5fe6, #2fd4ff); border-radius: 50%; display: grid; place-items: center; font-size: 0.7rem; font-weight: 700; margin-left: -8px; border: 2px solid rgba(4,6,16,0.8); }
        .proof-avatars span:first-child { margin-left: 0; }
        
        .hero-visual { position: relative; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
        .visual-portal { position: relative; width: 100%; max-width: 400px; aspect-ratio: 1; border-radius: 50px; background: linear-gradient(145deg, rgba(124,95,230,0.15), rgba(47,212,255,0.08)); backdrop-filter: blur(8px); border: 1px solid rgba(124,95,230,0.3); display: grid; place-items: center; overflow: hidden; }
        .visual-center { width: 120px; height: 120px; border-radius: 30px; background: rgba(10,13,26,0.9); color: #7c5fe6; font-size: 2.5rem; font-weight: 800; display: grid; place-items: center; z-index: 2; }
        .visual-pulse { position: absolute; width: 100%; height: 100%; background: radial-gradient(circle, rgba(124,95,230,0.2), transparent); animation: pulse 2s infinite; }
        .visual-orb-1, .visual-orb-2 { position: absolute; width: 60%; height: 60%; background: rgba(124,95,230,0.1); border-radius: 50%; filter: blur(40px); }
        .visual-orb-1 { top: -20%; right: -20%; }
        .visual-orb-2 { bottom: -20%; left: -20%; background: rgba(47,212,255,0.1); }
        .visual-labels { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; width: 100%; }
        .visual-tag { background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 0.5rem; text-align: center; transition: all 0.2s; text-decoration: none; color: white; }
        .visual-tag:hover { background: rgba(124,95,230,0.2); transform: translateY(-2px); }
        .tag-icon { font-size: 1rem; display: block; margin-bottom: 4px; }
        .visual-tag strong { font-size: 0.7rem; display: block; }
        .visual-tag small { font-size: 0.55rem; color: rgba(255,255,255,0.6); }
        
        .brand-bar { max-width: 1280px; margin: 0 auto; padding: 2rem; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .brand-heading { color: rgba(255,255,255,0.7); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1rem; }
        .brand-list { display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap; }
        .brand-logo { display: flex; align-items: center; gap: 0.5rem; color: rgba(255,255,255,0.7); font-size: 0.85rem; text-decoration: none; }
        .brand-logo:hover { color: #fff; }
        
        .stats-section { max-width: 1280px; margin: 0 auto; padding: 3rem 2rem; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .stat-block { text-align: center; padding: 1.5rem; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
        .stat-block:hover { transform: translateY(-4px); background: rgba(0,0,0,0.6); }
        .stat-value { font-size: 2.2rem; font-weight: 800; background: linear-gradient(135deg, #fff, #9b7ff0); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .stat-label { font-size: 0.85rem; font-weight: 600; margin-top: 0.5rem; }
        .stat-desc { font-size: 0.7rem; color: rgba(255,255,255,0.6); margin-top: 0.25rem; }
        
        .feature-grid { max-width: 1280px; margin: 0 auto; padding: 4rem 2rem; }
        .feature-grid-heading { text-align: center; margin-bottom: 2rem; }
        .feature-kicker { color: #7c5fe6; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.15em; margin-bottom: 0.75rem; display: inline-block; }
        .feature-grid-heading h2 { font-size: clamp(1.8rem, 3vw, 2.8rem); margin-bottom: 0.5rem; }
        .feature-grid-heading h2 span { color: #2fd4ff; }
        .feature-sub { color: rgba(255,255,255,0.7); max-width: 600px; margin: 0 auto; font-size: 0.9rem; }
        .feature-filters { display: flex; justify-content: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 2rem; }
        .filter-btn { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.08); padding: 0.4rem 1rem; border-radius: 40px; color: rgba(255,255,255,0.7); font-size: 0.8rem; cursor: pointer; }
        .filter-btn:hover, .filter-btn.active { background: #7c5fe6; color: white; }
        
        .feature-card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        .feature-card { background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.06); border-radius: 24px; padding: 1.5rem; text-decoration: none; color: inherit; transition: all 0.3s; position: relative; display: block; }
        .feature-card:hover { transform: translateY(-6px); background: rgba(0,0,0,0.7); border-color: rgba(124,95,230,0.3); }
        .feature-icon { font-size: 1.8rem; margin-bottom: 0.75rem; }
        .feature-tag { position: absolute; top: 1rem; right: 1rem; font-size: 0.6rem; background: rgba(124,95,230,0.3); padding: 0.2rem 0.5rem; border-radius: 20px; color: #9b7ff0; }
        .feature-card h3 { font-size: 1.1rem; margin-bottom: 0.5rem; }
        .feature-card p { color: rgba(255,255,255,0.7); line-height: 1.6; font-size: 0.8rem; margin-bottom: 1rem; }
        .feature-hover { display: flex; justify-content: space-between; align-items: center; opacity: 0; }
        .feature-card:hover .feature-hover { opacity: 1; }
        .feature-arrow { transition: transform 0.2s; }
        .feature-card:hover .feature-arrow { transform: translateX(4px); }
        .feature-footer { text-align: center; margin-top: 2rem; }
        
        .workflow-section { background: rgba(0,0,0,0.4); padding: 4rem 2rem; }
        .workflow-heading { text-align: center; margin-bottom: 2rem; }
        .workflow-heading h2 span { color: #2fd4ff; }
        .workflow-steps { display: flex; justify-content: center; flex-wrap: wrap; gap: 0.5rem; max-width: 1100px; margin: 0 auto; position: relative; }
        .workflow-step { text-align: center; width: 120px; text-decoration: none; color: white; display: block; }
        .step-number { font-size: 0.65rem; color: #7c5fe6; margin-bottom: 0.5rem; font-family: monospace; }
        .step-icon { font-size: 1.6rem; margin-bottom: 0.5rem; }
        .step-label { font-weight: 600; font-size: 0.8rem; }
        .step-desc { font-size: 0.6rem; color: rgba(255,255,255,0.6); }
        .step-line { position: absolute; top: 28px; left: calc(50% + 40px); width: calc(100% - 80px); height: 1px; background: linear-gradient(90deg, rgba(124,95,230,0.4), transparent); }
        
        .ecosystem-section { max-width: 1280px; margin: 0 auto; padding: 4rem 2rem; }
        .ecosystem-heading { text-align: center; margin-bottom: 2rem; }
        .ecosystem-heading h2 span { color: #2fd4ff; }
        .ecosystem-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        .ecosystem-card { background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.06); border-radius: 24px; padding: 1.5rem; text-decoration: none; color: inherit; text-align: center; display: block; }
        .ecosystem-card:hover { transform: translateY(-6px); background: rgba(124,95,230,0.15); }
        .eco-icon { font-size: 2rem; margin-bottom: 0.75rem; }
        .ecosystem-card h3 { margin-bottom: 0.5rem; font-size: 1.1rem; }
        .ecosystem-card p { color: rgba(255,255,255,0.7); font-size: 0.8rem; line-height: 1.6; margin-bottom: 0.75rem; }
        .eco-stats { font-size: 0.7rem; color: #2fd4ff; margin-bottom: 0.5rem; }
        .eco-arrow { color: #7c5fe6; font-size: 0.8rem; font-weight: 600; }
        
        .testimonials-section { max-width: 800px; margin: 0 auto; padding: 4rem 2rem; text-align: center; }
        .testimonials-heading { margin-bottom: 2rem; }
        .testimonials-heading h2 span { color: #2fd4ff; }
        .testimonial-card { background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.08); border-radius: 32px; padding: 2rem; margin-bottom: 1.5rem; }
        .testimonial-stars { color: #f5b042; margin-bottom: 0.75rem; font-size: 1rem; }
        .testimonial-text { font-size: 1rem; line-height: 1.6; font-style: italic; color: rgba(255,255,255,0.9); margin-bottom: 1rem; }
        .testimonial-author { display: flex; align-items: center; justify-content: center; gap: 1rem; }
        .author-avatar { width: 45px; height: 45px; background: linear-gradient(135deg, #7c5fe6, #2fd4ff); border-radius: 50%; display: grid; place-items: center; font-weight: 700; font-size: 0.8rem; }
        .testimonial-author div { text-align: left; }
        .testimonial-author span { display: block; font-size: 0.7rem; color: rgba(255,255,255,0.6); }
        .testimonial-dots { display: flex; justify-content: center; gap: 0.5rem; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.3); border: none; cursor: pointer; }
        .dot.active { width: 24px; border-radius: 4px; background: #7c5fe6; }
        
        .pricing-section { max-width: 1280px; margin: 0 auto; padding: 4rem 2rem; }
        .pricing-heading { text-align: center; margin-bottom: 2rem; }
        .pricing-heading h2 span { color: #2fd4ff; }
        .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        .pricing-card { background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.06); border-radius: 32px; padding: 1.5rem; position: relative; }
        .pricing-card:hover { transform: translateY(-6px); }
        .pricing-card.popular { border-color: #7c5fe6; background: linear-gradient(135deg, rgba(124,95,230,0.15), rgba(47,212,255,0.08)); }
        .popular-badge { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #7c5fe6, #2fd4ff); color: #0a0d1a; font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.8rem; border-radius: 20px; white-space: nowrap; }
        .plan-name { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.6); margin-bottom: 0.5rem; }
        .plan-price { font-size: 2.2rem; font-weight: 800; margin-bottom: 0.25rem; }
        .plan-price span { font-size: 0.8rem; font-weight: 400; color: rgba(255,255,255,0.5); }
        .plan-tagline { font-size: 0.75rem; color: rgba(255,255,255,0.6); margin-bottom: 1rem; }
        .plan-features { list-style: none; margin-bottom: 1.5rem; }
        .plan-features li { padding: 0.3rem 0; color: rgba(255,255,255,0.7); font-size: 0.8rem; display: flex; align-items: center; gap: 0.5rem; }
        .check { color: #2fd4ff; }
        .plan-cta { width: 100%; text-align: center; display: block; padding: 0.6rem; font-size: 0.85rem; text-decoration: none; }
        
        .blog-section { max-width: 1280px; margin: 0 auto; padding: 4rem 2rem; background: rgba(0,0,0,0.3); }
        .blog-heading { text-align: center; margin-bottom: 2rem; }
        .blog-heading h2 span { color: #2fd4ff; }
        .blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        .blog-card { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 1.5rem; text-decoration: none; color: inherit; display: block; }
        .blog-card:hover { transform: translateY(-4px); background: rgba(0,0,0,0.7); }
        .blog-category { font-size: 0.65rem; color: #7c5fe6; text-transform: uppercase; margin-bottom: 0.5rem; }
        .blog-card h3 { font-size: 1rem; margin-bottom: 0.5rem; }
        .blog-card p { font-size: 0.8rem; color: rgba(255,255,255,0.7); line-height: 1.6; margin-bottom: 0.75rem; }
        .blog-meta { display: flex; gap: 0.75rem; font-size: 0.65rem; color: rgba(255,255,255,0.5); margin-bottom: 0.5rem; }
        .blog-link { color: #7c5fe6; font-size: 0.75rem; font-weight: 500; }
        .blog-footer { text-align: center; margin-top: 2rem; }
        
        .resources-section { max-width: 1280px; margin: 0 auto; padding: 4rem 2rem; }
        .resources-heading { text-align: center; margin-bottom: 2rem; }
        .resources-heading h2 span { color: #2fd4ff; }
        .resources-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1rem; }
        .resource-card { background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 1rem; text-align: center; text-decoration: none; color: inherit; display: block; }
        .resource-card:hover { transform: translateY(-4px); background: rgba(0,0,0,0.7); }
        .resource-icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .resource-type { font-size: 0.6rem; color: #7c5fe6; text-transform: uppercase; margin-bottom: 0.3rem; }
        .resource-card h3 { font-size: 0.85rem; margin-bottom: 0.3rem; }
        .resource-card p { font-size: 0.7rem; color: rgba(255,255,255,0.7); margin-bottom: 0.5rem; }
        .resource-link { color: #7c5fe6; font-size: 0.7rem; font-weight: 500; }
        
        .faq-section { max-width: 1280px; margin: 0 auto; padding: 4rem 2rem; background: rgba(0,0,0,0.3); }
        .faq-heading { text-align: center; margin-bottom: 2rem; }
        .faq-heading h2 span { color: #2fd4ff; }
        .faq-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .faq-item { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 1rem; }
        .faq-item h3 { font-size: 0.9rem; margin-bottom: 0.5rem; color: #9b7ff0; }
        .faq-item p { font-size: 0.8rem; color: rgba(255,255,255,0.7); line-height: 1.6; }
        .faq-footer { text-align: center; margin-top: 2rem; }
        
        .final-cta { text-align: center; padding: 4rem 2rem; position: relative; overflow: hidden; }
        .cta-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 500px; height: 500px; background: radial-gradient(circle, rgba(124,95,230,0.15), transparent); pointer-events: none; }
        .final-cta h2 { font-size: clamp(1.8rem, 3.5vw, 3rem); margin-bottom: 0.75rem; }
        .final-cta p { max-width: 600px; margin: 0 auto 1.5rem; color: rgba(255,255,255,0.8); font-size: 0.9rem; }
        .cta-buttons { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
        .btn-large { padding: 0.8rem 2rem; font-size: 0.95rem; }
        .cta-names { font-size: 0.7rem; color: rgba(255,255,255,0.5); }
        
        .footer { max-width: 1280px; margin: 0 auto; padding: 3rem 2rem 2rem; border-top: 1px solid rgba(255,255,255,0.06); }
        .footer-top { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 2rem; margin-bottom: 2rem; }
        .footer-brand p { color: rgba(255,255,255,0.6); font-size: 0.75rem; margin-top: 0.5rem; }
        .footer-social { display: flex; gap: 1rem; margin-top: 1rem; }
        .footer-social a { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 0.8rem; }
        .footer-social a:hover { color: white; }
        .footer-col { display: flex; flex-direction: column; gap: 0.4rem; }
        .footer-col strong { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.6); margin-bottom: 0.3rem; }
        .footer-col a { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 0.75rem; }
        .footer-col a:hover { color: white; }
        .footer-bottom { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.06); font-size: 0.7rem; color: rgba(255,255,255,0.5); }
        .footer-flags { display: flex; gap: 1rem; }
        
        @media (max-width: 1024px) {
          .feature-card-grid, .ecosystem-grid, .pricing-grid, .blog-grid { grid-template-columns: repeat(2, 1fr); }
          .resources-grid { grid-template-columns: repeat(3, 1fr); }
          .stats-section { grid-template-columns: repeat(2, 1fr); }
          .faq-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .hero-section { grid-template-columns: 1fr; text-align: center; gap: 2rem; }
          .hero-copy h1 { font-size: 2rem; }
          .hero-copy p { margin-left: auto; margin-right: auto; }
          .hero-buttons, .hero-proof { justify-content: center; }
          .landing-header { flex-wrap: wrap; }
          .landing-nav { display: none; position: absolute; top: 70px; left: 0; right: 0; background: #0a0d1a; flex-direction: column; padding: 1rem; gap: 1rem; }
          .landing-nav.open { display: flex; }
          .mobile-menu-toggle { display: flex; }
          .feature-card-grid, .ecosystem-grid, .pricing-grid, .blog-grid { grid-template-columns: 1fr; }
          .resources-grid { grid-template-columns: repeat(2, 1fr); }
          .stats-section { grid-template-columns: 1fr; }
          .workflow-steps { flex-direction: column; align-items: center; gap: 1rem; }
          .step-line { display: none; }
          .visual-labels { grid-template-columns: repeat(2, 1fr); }
          .footer-top { flex-direction: column; text-align: center; }
          .footer-social { justify-content: center; }
          .footer-bottom { flex-direction: column; text-align: center; }
        }
        @media (max-width: 480px) {
          .resources-grid { grid-template-columns: 1fr; }
          .landing-actions { gap: 0.5rem; }
          .primary-button, .secondary-button, .link-button { padding: 0.4rem 0.8rem; font-size: 0.8rem; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;