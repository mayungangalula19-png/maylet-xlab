import { Link } from 'react-router-dom';
import { AdvancedMarketingPage } from './marketing/AdvancedMarketingPage';

const LAST_UPDATED = 'June 12, 2026';

const USAGE_AREAS = [
  {
    title: 'Authentication',
    description:
      'Session cookies keep you signed in securely and verify your identity when you access projects, the vault, and admin areas.',
  },
  {
    title: 'User preferences',
    description:
      'We store theme, language, and UI settings so your workspace looks and behaves the way you expect on return visits.',
  },
  {
    title: 'Analytics',
    description:
      'Anonymous usage data helps us understand which features innovators use most and where the experience can improve.',
  },
  {
    title: 'System performance',
    description:
      'Performance cookies measure load times, errors, and reliability so we can keep the platform fast and stable.',
  },
];

const COOKIE_TYPES = [
  {
    name: 'Essential',
    required: true,
    examples: 'Session ID, auth tokens, security flags',
    purpose:
      'Required for login, account security, and core platform functionality. These cannot be disabled while using Maylet XLab.',
  },
  {
    name: 'Performance',
    required: false,
    examples: 'Load timing, error tracking, CDN routing',
    purpose:
      'Help us monitor speed, uptime, and technical issues. Data is aggregated and not used for advertising.',
  },
  {
    name: 'Analytics',
    required: false,
    examples: 'Feature usage, navigation paths, anonymized events',
    purpose:
      'Support product decisions and roadmap planning. We do not use analytics cookies to profile you for third-party ads.',
  },
];

const USER_CHOICES = [
  {
    action: 'Accept cookies',
    summary: 'Allow essential, performance, and analytics cookies.',
    detail:
      'Choose this if you want the full platform experience, including usage insights that help us improve Maylet XLab.',
  },
  {
    action: 'Reject non-essential cookies',
    summary: 'Allow only essential cookies required to run the service.',
    detail:
      'Performance and analytics cookies will not be used. Some personalization and aggregated improvement data may be limited.',
  },
  {
    action: 'Manage preferences',
    summary: 'Choose category by category.',
    detail:
      'Enable or disable performance and analytics cookies individually. Essential cookies always remain active for security and login.',
  },
];

export default function Cookies() {
  return (
    <AdvancedMarketingPage
      pill="Legal · Cookie Policy"
      title="Cookie"
      titleAccent="Policy"
      subtitle="How Maylet XLab uses cookies and similar technologies on mayletxlab.com and the innovation platform."
    >
      {/* 1. What cookies are */}
      <section className="mkt-section">
        <div className="mkt-section__head">
          <div className="mkt-kicker">Overview</div>
          <h2>What are cookies?</h2>
        </div>
        <div className="mkt-panel">
          <p style={{ margin: '0 0 1rem' }}>
            Cookies are small text files placed on your device when you visit a website. They help
            sites remember your session, preferences, and how the service is used.
          </p>
          <p style={{ margin: 0 }}>
            Maylet XLab also uses similar technologies — such as local storage for workspace
            settings — where cookies alone are not the best fit. This policy covers cookies and
            comparable browser storage used for the same purposes.
          </p>
        </div>
      </section>

      {/* 2. How we use cookies */}
      <section className="mkt-section">
        <div className="mkt-section__head">
          <div className="mkt-kicker">Usage</div>
          <h2>How Maylet XLab uses cookies</h2>
          <p>We use cookies only to operate, secure, and improve the innovation platform.</p>
        </div>
        <div className="mkt-grid">
          {USAGE_AREAS.map((item) => (
            <div key={item.title} className="mkt-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Cookie types */}
      <section className="mkt-section">
        <div className="mkt-section__head">
          <div className="mkt-kicker">Categories</div>
          <h2>Cookie types</h2>
        </div>
        <div className="mkt-table-wrap">
          <table className="mkt-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Examples</th>
                <th>Purpose</th>
                <th>Required</th>
              </tr>
            </thead>
            <tbody>
              {COOKIE_TYPES.map((c) => (
                <tr key={c.name}>
                  <td>
                    <strong>{c.name}</strong>
                  </td>
                  <td style={{ opacity: 0.75, fontSize: '0.82rem' }}>{c.examples}</td>
                  <td>{c.purpose}</td>
                  <td>
                    {c.required ? (
                      <span className="mkt-badge mkt-badge--info">Always on</span>
                    ) : (
                      <span className="mkt-badge mkt-badge--warn">Optional</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Privacy statement */}
      <section className="mkt-section">
        <div className="mkt-section__head">
          <div className="mkt-kicker">Privacy</div>
          <h2>Our privacy commitment</h2>
        </div>
        <div
          className="mkt-panel"
          style={{ borderLeft: '3px solid #7c5fe6', paddingLeft: '1.25rem' }}
        >
          <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.85 }}>
            <li>
              <strong>We do not sell your data.</strong> Cookie and usage data is never sold to
              advertisers or data brokers.
            </li>
            <li>
              <strong>Data is used for system improvement only.</strong> Analytics and performance
              information helps us fix bugs, optimize speed, and build better innovation tools.
            </li>
            <li>
              <strong>Third parties are limited.</strong> Infrastructure providers (e.g. hosting,
              auth) may process technical data under contract and only as needed to run the
              service.
            </li>
          </ul>
          <p style={{ margin: '1rem 0 0', fontSize: '0.88rem' }}>
            For full details, see our{' '}
            <Link to="/privacy" style={{ color: '#9b7ff0' }}>
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link to="/security" style={{ color: '#9b7ff0' }}>
              Security overview
            </Link>
            .
          </p>
        </div>
      </section>

      {/* 5. User controls */}
      <section className="mkt-section">
        <div className="mkt-section__head">
          <div className="mkt-kicker">Your choices</div>
          <h2>User controls</h2>
          <p>
            You can control non-essential cookies through the options below. Essential cookies
            remain active when you use the platform.
          </p>
        </div>
        <div className="mkt-grid">
          {USER_CHOICES.map((choice) => (
            <div key={choice.action} className="mkt-card">
              <h3>{choice.action}</h3>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>{choice.summary}</strong>
              </p>
              <p>{choice.detail}</p>
            </div>
          ))}
        </div>
        <p className="mkt-panel" style={{ marginTop: '1.25rem', fontSize: '0.88rem' }}>
          You may also block or delete cookies through your browser settings. Note that disabling
          essential cookies may prevent you from signing in or using protected areas of Maylet
          XLab.
        </p>
      </section>

      {/* 6. Last updated */}
      <section className="mkt-section">
        <div className="mkt-section__head">
          <div className="mkt-kicker">Document</div>
          <h2>Last updated</h2>
        </div>
        <p className="mkt-panel" style={{ margin: 0 }}>
          This Cookie Policy was last updated on <strong>{LAST_UPDATED}</strong>. We may revise it
          when our practices or legal requirements change. Material updates will be reflected on
          this page.
        </p>
        <p className="mkt-disclaimer" style={{ marginTop: '1.5rem' }}>
          Questions? Contact us at{' '}
          <Link to="/contact" style={{ color: '#9b7ff0' }}>
            /contact
          </Link>
          .
        </p>
      </section>
    </AdvancedMarketingPage>
  );
}
