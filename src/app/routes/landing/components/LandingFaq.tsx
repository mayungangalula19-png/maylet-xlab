import { useState } from 'react';
import type { FaqItem } from '../landing.types';

interface Props {
  items: FaqItem[];
  inFooter?: boolean;
}

export function LandingFaq({ items, inFooter = false }: Props) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className={inFooter ? 'lp-footer__faq' : 'lp-faq'} id="faq">
      <div className="lp-faq__intro">
        <div className="lp-kicker">FAQ</div>
        <h2>
          Questions? <span>We&apos;ve got answers</span>
        </h2>
        {!inFooter && (
          <p className="lp-section-sub">
            Everything you need to know about getting started with Maylet XLab
          </p>
        )}
      </div>

      <div className="lp-faq-list">
        {items.map((item, idx) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className={`lp-faq-item fade-in-up ${isOpen ? 'lp-faq-item--open' : ''}`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <button
                type="button"
                className="lp-faq-item__trigger"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                aria-expanded={isOpen}
              >
                {item.question}
                <span aria-hidden>{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && <div className="lp-faq-item__answer">{item.answer}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
