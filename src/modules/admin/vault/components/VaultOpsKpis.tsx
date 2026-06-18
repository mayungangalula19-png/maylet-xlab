import { memo } from 'react';
import { AdminStatCard } from '../../components/dashboard/AdminStatCard';
import type { AdminVaultOpsStats } from '../types/vaultOpsAdmin.types';

interface VaultOpsKpisProps {
  stats: AdminVaultOpsStats;
}

function trendHint(pct: number, label: string): string {
  if (pct > 0) return `↑ ${pct}% ${label}`;
  if (pct < 0) return `↓ ${Math.abs(pct)}% ${label}`;
  return `Stable ${label}`;
}

export const VaultOpsKpis = memo(function VaultOpsKpis({ stats }: VaultOpsKpisProps) {
  return (
    <div className="admin-stats-grid admin-vault-ops-kpis">
      <AdminStatCard
        icon="📚"
        label="Total Assets"
        value={stats.totalAssets}
        hint={trendHint(stats.trendTotalPct, 'growth')}
        color="#2fd4ff"
        link="/admin/vault"
      />
      <AdminStatCard
        icon="✅"
        label="Active Assets"
        value={stats.activeAssets}
        color="#48bb78"
        link="/admin/vault"
      />
      <AdminStatCard
        icon="📦"
        label="Archived"
        value={stats.archivedAssets}
        color="#718096"
        link="/admin/vault"
      />
      <AdminStatCard
        icon="🔒"
        label="Confidential"
        value={stats.confidentialAssets}
        color="#fc8181"
        link="/admin/vault"
      />
      <AdminStatCard
        icon="⚖"
        label="Patents / IP"
        value={stats.patents}
        color="#9f7aea"
        link="/admin/vault"
      />
      <AdminStatCard
        icon="🔬"
        label="Research Docs"
        value={stats.researchDocuments}
        color="#4299e1"
        link="/admin/vault"
      />
      <AdminStatCard
        icon="🛠"
        label="Prototypes Stored"
        value={stats.prototypesStored}
        color="#805ad5"
        link="/admin/vault"
      />
      <AdminStatCard
        icon="🧪"
        label="Experiments Stored"
        value={stats.experimentsStored}
        color="#7c5fe6"
        link="/admin/vault"
      />
      <AdminStatCard
        icon="🚀"
        label="Commercial Assets"
        value={stats.commercialAssets}
        color="#38b2ac"
        link="/admin/vault"
      />
      <AdminStatCard
        icon="💎"
        label="Knowledge Health"
        value={stats.knowledgeHealthScore}
        suffix="/10"
        hint={trendHint(stats.trendActivityPct, 'activity')}
        color="#f6c90e"
        link="/admin/vault"
      />
    </div>
  );
});
