export interface FlowStep {
  id: string;
  label: string;
  description: string;
  icon: string;
  route: string;
}

export interface PlatformStat {
  id: string;
  label: string;
  description: string;
  prefix?: string;
  suffix?: string;
  targetValue: number;
}

export interface FeatureModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  tag: string;
}

export interface EcosystemProgram {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  metric: string;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  location: string;
  text: string;
  avatar: string;
  rating: number;
}

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  cta: string;
  ctaLink: string;
  popular: boolean;
}

export interface BlogPreview {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  slug: string;
}

export interface ResourceLink {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  type: string;
}

export interface FooterColumn {
  title: string;
  links: { label: string; route: string }[];
}
