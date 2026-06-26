import { useEffect, useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import {
  BLOG_PREVIEWS,
  CORE_FEATURES,
  ECOSYSTEM_PROGRAMS,
  FOOTER_NAV,
  INNOVATION_FLOW,
  PRICING_PLANS,
  RESOURCE_LINKS,
  TESTIMONIALS,
} from './landing.data';
import { LandingHeader } from './components/LandingHeader';
import { LandingHero } from './components/LandingHero';
import { LandingFeatures } from './components/LandingFeatures';
import { LandingWorkflow } from './components/LandingWorkflow';
import { LandingEcosystem } from './components/LandingEcosystem';
import { LandingTestimonials } from './components/LandingTestimonials';
import { LandingPricing } from './components/LandingPricing';
import { LandingBlogResources } from './components/LandingBlogResources';
import { LandingFinalCta } from './components/LandingFinalCta';
import { LandingFooter } from './components/LandingFooter';
import './landing.css';

export default function LandingPage() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };

    const onResize = () => {
      if (window.innerWidth > 768) setMobileOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="lp-page">
      <a href="#main-content" className="lp-skip-link">
        Skip to content
      </a>

      <LandingHeader
        scrolled={scrolled}
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen((open) => !open)}
        onCloseMobile={closeMobile}
      />

      <LandingHero steps={INNOVATION_FLOW} testimonials={TESTIMONIALS} isAuthenticated={!!user} />
      <LandingFeatures features={CORE_FEATURES} />
      <LandingWorkflow steps={INNOVATION_FLOW} />
      <LandingEcosystem programs={ECOSYSTEM_PROGRAMS} />
      <LandingTestimonials testimonials={TESTIMONIALS} />
      <LandingPricing plans={PRICING_PLANS} />
      <LandingBlogResources blogPosts={BLOG_PREVIEWS} resources={RESOURCE_LINKS} />
      <LandingFinalCta isAuthenticated={!!user} />
      <LandingFooter columns={FOOTER_NAV} />
    </div>
  );
}
