import { Link } from 'react-router-dom';
import type { VaultSummary } from '../../../lib/supabase/commandCenter.queries';

interface Props {
  vault: VaultSummary;
}

export function InnovationVaultSummary({ vault }: Props) {
  const items = [
    { label: 'Protected Ideas', value: vault.protectedIdeas, route: '/vault' },
    { label: 'Vault Entries', value: vault.vaultEntries, route: '/vault' },
    { label: 'Patent Candidates', value: vault.patentCandidates, route: '/patent' },
    { label: 'Ownership Records', value: vault.ownershipRecords, route: '/vault' },
  ];

  return (
    <div className="icc-glass icc-widget">
      <div className="icc-widget-header">
        <h3>Innovation Vault</h3>
        <Link to="/vault" className="icc-widget-link">Open Vault</Link>
      </div>
      <div className="icc-vault-grid">
        {items.map((item) => (
          <Link key={item.label} to={item.route} className="icc-vault-stat icc-clickable">
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
      <Link to="/vault/save" className="icc-widget-cta">Protect a new idea →</Link>
    </div>
  );
}
