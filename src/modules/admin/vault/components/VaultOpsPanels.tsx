import { memo } from 'react';
import { Link } from 'react-router-dom';
import type {
  AdminVaultAssetRow,
  VaultActivityItem,
  VaultApprovalItem,
} from '../types/vaultOpsAdmin.types';
import { VaultKnowledgeGraph } from './VaultKnowledgeGraph';
import { VaultPreviewCenter } from './VaultPreviewCenter';
import type { VaultKnowledgeEdge, VaultKnowledgeNode } from '../types/vaultOpsAdmin.types';

interface VaultOpsPanelsProps {
  selected: AdminVaultAssetRow | null;
  activity: VaultActivityItem[];
  approvals: VaultApprovalItem[];
  graphNodes: VaultKnowledgeNode[];
  graphEdges: VaultKnowledgeEdge[];
}

export const VaultOpsPanels = memo(function VaultOpsPanels({
  selected,
  activity,
  approvals,
  graphNodes,
  graphEdges,
}: VaultOpsPanelsProps) {
  return (
    <div className="admin-vault-panels-grid">
      <VaultPreviewCenter asset={selected} />
      <VaultKnowledgeGraph nodes={graphNodes} edges={graphEdges} selected={selected} />

      <div className="admin-vault-panel admin-vault-glass">
        <h4>Version Control</h4>
        {selected ? (
          <ul className="admin-vault-version-list">
            <li>
              <strong>v{selected.version}</strong>
              <span className="admin-muted">Current · {selected.updatedAt.slice(0, 10)}</span>
            </li>
            {selected.version > 1 ? (
              <li>
                <span>Prior revisions tracked in vault_asset_versions</span>
              </li>
            ) : (
              <li className="admin-muted">Initial version — no prior revisions</li>
            )}
          </ul>
        ) : (
          <p className="admin-muted">Select an asset for version history.</p>
        )}
      </div>

      <div className="admin-vault-panel admin-vault-glass">
        <h4>Approval Workflow</h4>
        <ul className="admin-vault-approval-list">
          {approvals.length === 0 ? (
            <li className="admin-muted">No pending approvals.</li>
          ) : (
            approvals.map((a) => (
              <li key={a.id}>
                <strong>{a.assetTitle}</strong>
                <span className="admin-muted">
                  {a.reviewerRole} · {a.status}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="admin-vault-panel admin-vault-glass">
        <h4>Audit Center</h4>
        <ul className="admin-vault-audit-timeline">
          {activity.slice(0, 8).map((item) => (
            <li key={item.id}>
              <span className="admin-vault-audit-dot" />
              <div>
                <time>{new Date(item.at).toLocaleString()}</time>
                <span>{item.action}</span>
                <span className="admin-muted">{item.assetTitle}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="admin-vault-panel admin-vault-glass">
        <h4>Classification &amp; Security</h4>
        {selected ? (
          <dl className="admin-vault-classification-dl">
            <dt>Classification</dt>
            <dd>{selected.classification.replace(/_/g, ' ')}</dd>
            <dt>Organization</dt>
            <dd>{selected.organization}</dd>
            <dt>Author</dt>
            <dd>
              <Link to={`/admin/users/${selected.authorId}`} className="admin-link">
                {selected.authorName}
              </Link>
            </dd>
            <dt>Download control</dt>
            <dd>
              {['restricted', 'patent_sensitive', 'ip_protected'].includes(selected.classification)
                ? 'Restricted — admin approval required'
                : 'Standard access policy'}
            </dd>
          </dl>
        ) : (
          <p className="admin-muted">Select an asset for security details.</p>
        )}
      </div>
    </div>
  );
});
