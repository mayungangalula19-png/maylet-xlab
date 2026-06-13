import { Link } from 'react-router-dom';
import { BrandLogo } from '../../../../components/common/BrandLogo';
import { LandingFaq } from './LandingFaq';
import type { FaqItem, FooterColumn } from '../landing.types';

interface Props {
  columns: FooterColumn[];
  faqItems: FaqItem[];
}

export function LandingFooter({ columns, faqItems }: Props) {
  const year = new Date().getFullYear();

  return (
    <footer className="lp-footer">
      <div className="lp-footer__top">
        <div className="lp-footer__brand">
          <Link to="/" className="lp-brand">
            <BrandLogo size="sm" className="brand-logo-img" />
            <div className="lp-brand-copy">
              <div className="lp-brand-title">
                Maylet <span>XLab</span>
              </div>
              <div className="lp-brand-note">Innovation OS</div>
            </div>
          </Link>
          <p>The complete platform for taking ideas from research to commercialization.</p>
        </div>

        {columns.map((column) => (
          <div key={column.title} className="lp-footer__col">
            <h4>{column.title}</h4>
            <ul>
              {column.links.map((link) => (
                <li key={link.label}>
                  {link.route.startsWith('#') ? (
                    <a href={link.route}>{link.label}</a>
                  ) : (
                    <Link to={link.route}>{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <LandingFaq items={faqItems} inFooter />

      <div className="lp-footer__bottom">
        <span>© {year} Maylet XLab. All rights reserved.</span>
        <div className="lp-footer__social">
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
            𝕏
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            in
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            GH
          </a>
        </div>
      </div>
    </footer>
  );
}
