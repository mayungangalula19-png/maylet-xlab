import { Link } from 'react-router-dom';
import { SectionHeading } from './SectionHeading';
import type { BlogPreview, ResourceLink } from '../landing.types';

interface Props {
  blogPosts: BlogPreview[];
  resources: ResourceLink[];
}

export function LandingBlogResources({ blogPosts, resources }: Props) {
  return (
    <section className="lp-resources" id="resources">
      <SectionHeading
        kicker="Blog & resources"
        title={
          <>
            Learn, build, and <span>stay ahead</span>
          </>
        }
        subtitle="Guides, playbooks, and community resources for every stage of innovation"
      />

      <div className="lp-resources-layout">
        <div className="lp-blog-grid">
          {blogPosts.map((post, idx) => (
            <Link
              to={`/blog/${post.slug}`}
              key={post.id}
              className="lp-blog-card fade-in-up"
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              <span className="lp-blog-card__category">{post.category}</span>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <div className="lp-blog-card__meta">
                <span>{post.readTime}</span>
                <span>{post.date}</span>
              </div>
            </Link>
          ))}
        </div>

        <aside className="lp-resource-links fade-in-up lp-delay-2">
          <h3>Quick resources</h3>
          <ul>
            {resources.map((resource) => (
              <li key={resource.id}>
                <Link to={resource.route}>
                  <span className="lp-resource-links__icon">{resource.icon}</span>
                  <div>
                    <strong>{resource.title}</strong>
                    <span>{resource.description}</span>
                  </div>
                  <span aria-hidden>→</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/blog" className="lp-btn lp-btn--ghost lp-btn--block">
            View all resources →
          </Link>
        </aside>
      </div>
    </section>
  );
}
