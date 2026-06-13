import { Link } from 'react-router-dom';
import { MarketingStubPage } from './marketing/MarketingStubPage';

export default function SecurityOverview() {
  return (
    <MarketingStubPage
      title="Security"
      subtitle="How we protect your data, ideas, and innovation vault."
    >
      <p>
        Maylet XLab uses encrypted transport, row-level security on Supabase, and secure AI proxies so
        provider keys never reach the browser.
      </p>
      <p>
        Signed-in users can review sessions and security events in{' '}
        <Link to="/settings/security" style={{ color: '#9b7ff0' }}>
          account security settings
        </Link>
        .
      </p>
    </MarketingStubPage>
  );
}
