import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../../../../../modules/shared/components/common/BrandLogo';
import { useAuth } from '../../../../../hooks/useAuth';

interface Props {
  scrolled: boolean;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onCloseMobile: () => void;
}

const NAV_LINKS = [
  { label: 'Features', route: '/features', isAnchor: false },
  { label: 'Workflow', route: '#workflow', isAnchor: true },
  { label: 'Ecosystem', route: '#ecosystem', isAnchor: true },
  { label: 'Pricing', route: '#pricing', isAnchor: true },
  { label: 'Resources', route: '#resources', isAnchor: true },
];

export function LandingHeader({ scrolled, mobileOpen, onToggleMobile, onCloseMobile }: Props) {
  const { user } = useAuth();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const syncHeaderHeight = () => {
      const height = headerRef.current?.offsetHeight ?? 64;
      document.documentElement.style.setProperty('--lp-header-h', `${height}px`);
    };

    syncHeaderHeight();
    window.addEventListener('resize', syncHeaderHeight);
    return () => window.removeEventListener('resize', syncHeaderHeight);
  }, [mobileOpen]);

  const authButtons = user ? (
    <>
      <Link to="/dashboard" className="lp-btn lp-btn--ghost" onClick={onCloseMobile}>
        Dashboard
      </Link>
      <Link to="/projects" className="lp-btn lp-btn--primary" onClick={onCloseMobile}>
        My Projects →
      </Link>
    </>
  ) : (
    <>
      <Link to="/login" className="lp-btn lp-btn--ghost" onClick={onCloseMobile}>
        Sign in
      </Link>
      <Link to="/register" className="lp-btn lp-btn--primary" onClick={onCloseMobile}>
        Get Started →
      </Link>
    </>
  );

  return (
    <div
      className={`lp-header-shell ${scrolled ? 'lp-header-shell--scrolled' : ''} ${mobileOpen ? 'lp-header-shell--menu-open' : ''}`}
    >
      <header className="lp-header" ref={headerRef}>
        <Link to="/" className="lp-brand" onClick={onCloseMobile}>
          <BrandLogo size="md" eager className="brand-logo-img" />
          <div className="lp-brand-copy">
            <div className="lp-brand-title">
              Maylet <span>XLab</span>
            </div>
            <div className="lp-brand-note">Innovation OS</div>
          </div>
        </Link>

        <nav className="lp-nav lp-nav--desktop" aria-label="Main navigation">
          {NAV_LINKS.map((item) =>
            item.isAnchor ? (
              <a key={item.label} href={item.route}>
                {item.label}
              </a>
            ) : (
              <Link key={item.label} to={item.route}>
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="lp-actions lp-actions--desktop">{authButtons}</div>

        <button
          type="button"
          className={`lp-mobile-toggle ${mobileOpen ? 'lp-mobile-toggle--open' : ''}`}
          onClick={onToggleMobile}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="lp-mobile-menu"
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <div
        id="lp-mobile-menu"
        className={`lp-mobile-menu ${mobileOpen ? 'lp-mobile-menu--open' : ''}`}
        aria-hidden={!mobileOpen}
      >
        <div className="lp-mobile-menu__backdrop" onClick={onCloseMobile} aria-hidden />
        <div className="lp-mobile-menu__panel" role="dialog" aria-modal="true" aria-label="Mobile menu">
          <div className="lp-mobile-menu__head">
            <span>Menu</span>
            <button type="button" className="lp-mobile-close" onClick={onCloseMobile} aria-label="Close menu">
              ✕
            </button>
          </div>
          <nav className="lp-nav lp-nav--mobile" aria-label="Mobile navigation">
            {NAV_LINKS.map((item) =>
              item.isAnchor ? (
                <a key={item.label} href={item.route} onClick={onCloseMobile}>
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} to={item.route} onClick={onCloseMobile}>
                  {item.label}
                </Link>
              )
            )}
          </nav>
          <div className="lp-actions lp-actions--mobile">{authButtons}</div>
        </div>
      </div>
    </div>
  );
}
