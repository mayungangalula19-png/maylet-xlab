import { Link } from 'react-router-dom';

const tools = [
  { label: '🛡️ Check Patent / IP', path: '/patent' },
  { label: '📊 Build Pitch Deck', path: '/funding/create' },
  { label: '🧪 New Experiment', path: '/experiments/create' },
  { label: '🔐 Save to Vault', path: '/vault/save' },
  { label: '🤝 AI Co-Founder', path: '/co-founder' },
];

export function MayaQuickTools() {
  return (
    <div>
      <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.5rem' }}>
        Quick tools
      </h4>
      {tools.map((t) => (
        <Link key={t.path} to={t.path} className="maya-quick-tool">
          {t.label}
        </Link>
      ))}
    </div>
  );
}
