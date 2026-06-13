import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdvancedMarketingPage } from './marketing/AdvancedMarketingPage';

const COOKIE_TYPES = [
  {
    id: 'essential',
    name: 'Essential',
    required: true,
    description: 'Authentication, session, and security cookies required for the platform to work.',
  },
  {
    id: 'preferences',
    name: 'Preferences',
    required: false,
    description: 'Theme, language, and UI settings stored locally or in your profile.',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    required: false,
    description: 'Anonymous usage metrics to improve performance and feature adoption.',
  },
];

export default function Cookies() {
  const [prefs, setPrefs] = useState({ preferences: true, analytics: false });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AdvancedMarketingPage
      pill="🍪 Cookie policy"
      title="Cookie"
      titleAccent="Preferences"
      subtitle="How we use cookies on mayletxlab.com. Preferences below are a demo — nothing is persisted on this page."
      disclaimer="Demo preferences UI only — no cookies are written from this marketing page."
    >
      <section className="mkt-section">
        <p className="mkt-panel">
          We use essential cookies for authentication and preferences, and optional analytics cookies
          to improve the product. See also our{' '}
          <Link to="/privacy" style={{ color: '#9b7ff0' }}>
            Privacy Policy
          </Link>
          .
        </p>
      </section>

      <section className="mkt-section">
        <div className="mkt-table-wrap">
          <table className="mkt-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Purpose</th>
                <th>Control</th>
              </tr>
            </thead>
            <tbody>
              {COOKIE_TYPES.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.name}</strong>
                    {c.required && (
                      <>
                        {' '}
                        <span className="mkt-badge mkt-badge--info">Required</span>
                      </>
                    )}
                  </td>
                  <td>{c.description}</td>
                  <td>
                    {c.required ? (
                      <span style={{ opacity: 0.5 }}>Always on</span>
                    ) : (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={prefs[c.id as keyof typeof prefs]}
                          onChange={(e) =>
                            setPrefs((p) => ({ ...p, [c.id]: e.target.checked }))
                          }
                        />
                        Allow
                      </label>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" className="mkt-btn mkt-btn--primary" style={{ marginTop: '1rem' }} onClick={handleSave}>
          Save preferences (demo)
        </button>
        {saved && <p className="mkt-toast">Preferences saved locally for this preview only.</p>}
      </section>
    </AdvancedMarketingPage>
  );
}
