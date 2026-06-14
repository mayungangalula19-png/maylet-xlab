import { SectionHeading } from './SectionHeading';
import type { Testimonial } from '../landing.types';

interface Props {
  testimonials: Testimonial[];
}

export function LandingTestimonials({ testimonials }: Props) {
  return (
    <section className="lp-testimonials" id="testimonials">
      <SectionHeading
        kicker="Testimonials"
        title={
          <>
            Trusted by <span>innovators worldwide</span>
          </>
        }
        subtitle="Founders, researchers, and teams building on Maylet XLab"
      />

      <div className="lp-testimonials-grid">
        {testimonials.map((item, idx) => (
          <article
            key={item.id}
            className="lp-testimonial fade-in-up"
            style={{ animationDelay: `${idx * 0.08}s` }}
          >
            <div className="lp-testimonial__stars" aria-label={`${item.rating} out of 5 stars`}>
              {'★'.repeat(item.rating)}
            </div>
            <blockquote>&ldquo;{item.text}&rdquo;</blockquote>
            <footer>
              <span className="lp-testimonial__avatar">{item.avatar}</span>
              <div>
                <strong>{item.name}</strong>
                <span>
                  {item.role} · {item.location}
                </span>
              </div>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
