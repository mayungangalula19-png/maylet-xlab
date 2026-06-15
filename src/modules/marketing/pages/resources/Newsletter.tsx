import { AdvancedMarketingPage } from '../marketing/AdvancedMarketingPage';
import { Newsletter } from '../../../newsletter';

const ISSUES = [
  { title: 'Validation trends in health-tech', date: 'Jun 12, 2025' },
  { title: '5 MAYA prompts every founder should use', date: 'Jun 5, 2025' },
  { title: 'Funding Hub: grant vs angel playbook', date: 'May 29, 2025' },
];

export default function ResourceNewsletter() {
  return (
    <AdvancedMarketingPage
      pill="📧 Weekly newsletter"
      title="Innovation"
      titleAccent="insights"
      subtitle="Pipeline tips, MAYA prompts, funding opportunities, and ecosystem news — delivered weekly."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <Newsletter source="resources_page" showDashboardCta showFeaturesCta />

        <section>
          <div className="mkt-section__head">
            <h2>
              Recent <span>issues</span>
            </h2>
          </div>
          <ul className="mkt-list">
            {ISSUES.map((i) => (
              <li key={i.title}>
                <span>{i.title}</span>
                <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>{i.date}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AdvancedMarketingPage>
  );
}
