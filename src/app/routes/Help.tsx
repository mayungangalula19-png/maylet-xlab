import { Link } from 'react-router-dom';
import { PageShell } from '../../components/common/PageShell';

export default function Help() {
  return (
    <PageShell title="Help Center" subtitle="Guides, FAQs, and MAYA-assisted support.">
      <ul style={{ lineHeight: 2, opacity: 0.9 }}>
        <li>
          <Link to="/faq">FAQ</Link>
        </li>
        <li>
          <Link to="/support">Contact support</Link>
        </li>
        <li>
          <Link to="/ai-assistant">Ask MAYA AI</Link>
        </li>
        <li>
          <Link to="/resources">Resources & tutorials</Link>
        </li>
      </ul>
    </PageShell>
  );
}
