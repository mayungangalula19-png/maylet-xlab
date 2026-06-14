import type {
  BlogPreview,
  EcosystemProgram,
  FeatureModule,
  FlowStep,
  FooterColumn,
  PlatformStat,
  PricingPlan,
  ResourceLink,
  Testimonial,
} from './landing.types';

/** 7-step innovation flow — hero + aligns with app pipeline */
export const INNOVATION_FLOW: FlowStep[] = [
  { id: 'idea', label: 'Idea', description: 'Capture your vision', icon: '💡', route: '/register' },
  { id: 'research', label: 'Research', description: 'Validate the problem', icon: '🔬', route: '/research' },
  { id: 'prototype', label: 'Prototype', description: 'Build your MVP', icon: '📦', route: '/prototypes' },
  { id: 'experiment', label: 'Experiment', description: 'Test hypotheses', icon: '🧪', route: '/experiments' },
  { id: 'validation', label: 'Validation', description: 'Prove readiness', icon: '✅', route: '/validation' },
  { id: 'funding', label: 'Funding', description: 'Raise capital', icon: '💰', route: '/funding' },
  { id: 'commercialization', label: 'Commercialization', description: 'Scale to market', icon: '🚀', route: '/commercialization' },
];

/** 6 core product modules */
export const CORE_FEATURES: FeatureModule[] = [
  {
    id: 'projects',
    title: 'Projects Command Center',
    description: 'Manage your innovation portfolio, pipeline stages, and progress in one workspace.',
    icon: '📁',
    route: '/features/projects',
    tag: 'Hub',
  },
  {
    id: 'research',
    title: 'Research Center',
    description: 'Literature review, findings, documents, and research gates linked to every project.',
    icon: '🔬',
    route: '/research',
    tag: 'Discovery',
  },
  {
    id: 'prototypes',
    title: 'Prototypes & Testing',
    description: 'Build, upload, test, and iterate prototypes with version history and pass-rate tracking.',
    icon: '📦',
    route: '/prototypes',
    tag: 'Build',
  },
  {
    id: 'experiments',
    title: 'Experiments Lab',
    description: 'Run structured market, user, and technical experiments with measurable outcomes.',
    icon: '🧪',
    route: '/experiments',
    tag: 'Validate',
  },
  {
    id: 'validation',
    title: 'Validation Gate',
    description: 'Evidence-based scoring from research, prototypes, and experiments before funding.',
    icon: '✅',
    route: '/validation',
    tag: 'Decision',
  },
  {
    id: 'funding',
    title: 'Funding Hub',
    description: 'Create pitches, discover investors, and track funding applications.',
    icon: '💰',
    route: '/funding',
    tag: 'Capital',
  },
];

export const PLATFORM_STATS: PlatformStat[] = [
  { id: 'innovators', label: 'Innovators', description: 'Builders on the platform', suffix: '+', targetValue: 10000 },
  { id: 'projects', label: 'Projects', description: 'Ideas advanced through the pipeline', suffix: '+', targetValue: 2000 },
  { id: 'funding', label: 'Funds Connected', description: 'Capital linked through Funding Hub', prefix: '$', suffix: 'M+', targetValue: 5 },
  { id: 'countries', label: 'Countries', description: 'Global innovation community', suffix: '+', targetValue: 35 },
];

export const ECOSYSTEM_PROGRAMS: EcosystemProgram[] = [
  {
    id: 'incubator',
    title: 'Startup Incubator',
    description: 'Structured support from idea to incorporation with mentors and milestones.',
    icon: '🌱',
    route: '/ecosystem/incubator',
    metric: '50+ startups accelerated',
  },
  {
    id: 'academy',
    title: 'Innovation Academy',
    description: 'Workshops, playbooks, and masterclasses from experienced founders.',
    icon: '🎓',
    route: '/ecosystem/academy',
    metric: '10,000+ learners',
  },
  {
    id: 'community',
    title: 'Global Community',
    description: 'Connect with innovators, mentors, and investors across regions.',
    icon: '🌍',
    route: '/ecosystem/community',
    metric: '35+ countries',
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Amina Kimaro',
    role: 'AgriTech Founder',
    location: 'Dar es Salaam, Tanzania',
    text: 'The validation gate saved months of guesswork. I knew exactly when my project was funding-ready.',
    avatar: 'AK',
    rating: 5,
  },
  {
    id: 2,
    name: 'David Mwangi',
    role: 'Full-Stack Developer',
    location: 'Nairobi, Kenya',
    text: 'Research, prototypes, and experiments in one place — our team ships faster with less context switching.',
    avatar: 'DM',
    rating: 5,
  },
  {
    id: 3,
    name: 'Sarah Okonkwo',
    role: 'Health Tech Researcher',
    location: 'Lagos, Nigeria',
    text: 'The Innovation Vault and structured pipeline gave me confidence to share and protect my IP.',
    avatar: 'SO',
    rating: 5,
  },
  {
    id: 4,
    name: 'James Mutua',
    role: 'University Student',
    location: 'Kampala, Uganda',
    text: 'I moved from idea to experiment to funding pitch without leaving the platform.',
    avatar: 'JM',
    rating: 5,
  },
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    tagline: 'Perfect for getting started',
    features: ['3 Active Projects', 'Basic AI Validation', '5 Team Members', 'Community Access', 'Innovation Vault (3 items)'],
    cta: 'Start for Free',
    ctaLink: '/register',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$15',
    period: '/month',
    tagline: 'For serious innovators',
    features: [
      'Unlimited Projects',
      'Advanced AI Analytics',
      'Unlimited Team Members',
      'Funding Hub Access',
      'Unlimited Vault Storage',
      'Priority Support',
    ],
    cta: 'Get Pro',
    ctaLink: '/register?plan=pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    tagline: 'For organizations',
    features: ['Everything in Pro', 'Admin Dashboard', 'SSO & Advanced Security', 'Dedicated Account Manager', 'API Access', 'SLA Guarantee'],
    cta: 'Contact Sales',
    ctaLink: '/contact',
    popular: false,
  },
];

export const BLOG_PREVIEWS: BlogPreview[] = [
  {
    id: 1,
    title: 'Validating Your Startup Idea',
    excerpt: 'A practical framework to test market demand before you build.',
    date: 'May 15, 2025',
    readTime: '8 min read',
    category: 'Strategy',
    slug: 'validate-idea',
  },
  {
    id: 2,
    title: 'Raising Your First Capital',
    excerpt: 'From pitch deck to term sheet — early-stage fundraising essentials.',
    date: 'May 10, 2025',
    readTime: '12 min read',
    category: 'Funding',
    slug: 'raise-capital',
  },
  {
    id: 3,
    title: 'AI-Powered Innovation Trends',
    excerpt: 'How top teams use AI across the Idea → Commercialization pipeline.',
    date: 'May 5, 2025',
    readTime: '6 min read',
    category: 'AI',
    slug: 'ai-trends',
  },
];

export const RESOURCE_LINKS: ResourceLink[] = [
  { id: 'guide', title: 'Innovation Guide', description: 'Framework for taking ideas to market', icon: '📘', route: '/resources/guide', type: 'E-book' },
  { id: 'videos', title: 'Video Tutorials', description: 'See how innovators use XLab', icon: '🎥', route: '/resources/videos', type: 'Video' },
  { id: 'case-studies', title: 'Success Stories', description: 'Case studies from funded startups', icon: '📊', route: '/resources/case-studies', type: 'Cases' },
  { id: 'prompts', title: 'AI Prompt Library', description: 'Templates for validation', icon: '💡', route: '/resources/prompts', type: 'Templates' },
  { id: 'webinars', title: 'Live Webinars', description: 'Weekly sessions with experts', icon: '🎤', route: '/resources/webinars', type: 'Events' },
  { id: 'newsletter', title: 'Newsletter', description: 'Innovation insights delivered', icon: '📧', route: '/resources/newsletter', type: 'Updates' },
];

export const FOOTER_COLUMNS = {
  product: [
    { label: 'Features', route: '/features' },
    { label: 'Pricing', route: '/pricing' },
    { label: 'Sign Up', route: '/register' },
    { label: 'Request Demo', route: '/demo' },
  ],
  company: [
    { label: 'About', route: '/about' },
    { label: 'Blog', route: '/blog' },
    { label: 'Careers', route: '/careers' },
    { label: 'Press', route: '/press' },
  ],
  legal: [
    { label: 'Privacy Policy', route: '/privacy' },
    { label: 'Terms of Use', route: '/terms' },
    { label: 'Security', route: '/security' },
    { label: 'Cookie Policy', route: '/cookies' },
  ],
  support: [
    { label: 'FAQ', route: '/faq' },
    { label: 'Help Center', route: '/help' },
    { label: 'Contact Us', route: '/contact' },
    { label: 'System Status', route: '/status' },
    { label: 'Community', route: '/community' },
  ],
} as const;

export const FOOTER_NAV: FooterColumn[] = [
  { title: 'Product', links: [...FOOTER_COLUMNS.product] },
  { title: 'Company', links: [...FOOTER_COLUMNS.company] },
  { title: 'Legal', links: [...FOOTER_COLUMNS.legal] },
  { title: 'Support', links: [...FOOTER_COLUMNS.support] },
];
