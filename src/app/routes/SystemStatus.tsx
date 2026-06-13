import { AdvancedMarketingPage } from './marketing/AdvancedMarketingPage';

const SERVICES = [
  { name: 'Web application', status: 'Operational', uptime: '99.98%' },
  { name: 'Authentication', status: 'Operational', uptime: '99.99%' },
  { name: 'Database (Supabase)', status: 'Operational', uptime: '99.95%' },
  { name: 'File storage', status: 'Operational', uptime: '99.97%' },
  { name: 'MAYA AI proxy', status: 'Operational', uptime: '99.90%' },
  { name: 'Realtime & notifications', status: 'Operational', uptime: '99.92%' },
];

const INCIDENTS = [
  { date: 'Jun 1, 2025', title: 'Scheduled maintenance', detail: 'Database index optimization — no user impact.', resolved: true },
  { date: 'Apr 12, 2025', title: 'Elevated AI latency', detail: 'Provider rate limits — mitigated in 22 minutes.', resolved: true },
];

export default function SystemStatus() {
  return (
    <AdvancedMarketingPage
      pill="● All systems operational"
      title="System"
      titleAccent="Status"
      subtitle="Platform availability for API, auth, storage, and AI services. Sample status page — not connected to live monitoring."
      disclaimer="Status data is illustrative for the public site preview."
    >
      <div className="mkt-stats">
        <div className="mkt-stat">
          <strong style={{ color: '#68d391' }}>●</strong>
          <span>Overall health</span>
        </div>
        <div className="mkt-stat">
          <strong>99.96%</strong>
          <span>30-day uptime</span>
        </div>
        <div className="mkt-stat">
          <strong>0</strong>
          <span>Active incidents</span>
        </div>
        <div className="mkt-stat">
          <strong>&lt;45ms</strong>
          <span>Avg API latency</span>
        </div>
      </div>

      <section className="mkt-section">
        <div className="mkt-section__head">
          <div className="mkt-kicker">Services</div>
          <h2>
            Component <span>status</span>
          </h2>
        </div>
        <div className="mkt-table-wrap">
          <table className="mkt-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Status</th>
                <th>30-day uptime</th>
              </tr>
            </thead>
            <tbody>
              {SERVICES.map((s) => (
                <tr key={s.name}>
                  <td>{s.name}</td>
                  <td>
                    <span className="mkt-badge mkt-badge--ok">{s.status}</span>
                  </td>
                  <td>{s.uptime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-section__head">
          <div className="mkt-kicker">History</div>
          <h2>
            Recent <span>incidents</span>
          </h2>
        </div>
        <ul className="mkt-list">
          {INCIDENTS.map((i) => (
            <li key={i.title}>
              <span>
                <strong>{i.date}</strong> — {i.title}
                <br />
                <span style={{ opacity: 0.65, fontSize: '0.82rem' }}>{i.detail}</span>
              </span>
              <span className="mkt-badge mkt-badge--ok">Resolved</span>
            </li>
          ))}
        </ul>
      </section>
    </AdvancedMarketingPage>
  );
}
