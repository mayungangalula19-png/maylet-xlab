import { memo } from 'react';
import type { VaultFolderNode } from '../types/vaultOpsAdmin.types';

interface VaultExplorerProps {
  folders: VaultFolderNode[];
  collections: { id: string; label: string; count: number }[];
  domains: { id: string; label: string; count: number }[];
  activeFolder: string;
  onFolderSelect: (folder: string) => void;
  onCollectionSelect: (collection: string) => void;
  onDomainSelect: (domain: string) => void;
}

export const VaultExplorer = memo(function VaultExplorer({
  folders,
  collections,
  domains,
  activeFolder,
  onFolderSelect,
  onCollectionSelect,
  onDomainSelect,
}: VaultExplorerProps) {
  return (
    <aside className="admin-vault-explorer admin-vault-glass">
      <h3>Vault Explorer</h3>
      <p className="admin-muted">Folders · Collections · Knowledge domains</p>

      <div className="admin-vault-explorer-section">
        <h4>Folders</h4>
        <ul className="admin-vault-tree">
          <li>
            <button
              type="button"
              className={`admin-vault-tree-item ${activeFolder === 'all' ? 'admin-vault-tree-item--active' : ''}`}
              onClick={() => onFolderSelect('all')}
            >
              <span>📁 All Assets</span>
            </button>
          </li>
          {folders.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                className={`admin-vault-tree-item ${activeFolder === f.label ? 'admin-vault-tree-item--active' : ''}`}
                onClick={() => onFolderSelect(f.label)}
              >
                <span>📂 {f.label}</span>
                <strong>{f.count}</strong>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="admin-vault-explorer-section">
        <h4>Collections</h4>
        <ul className="admin-vault-tree">
          {collections.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="admin-vault-tree-item"
                onClick={() => onCollectionSelect(c.label)}
              >
                <span>🗂 {c.label}</span>
                <strong>{c.count}</strong>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="admin-vault-explorer-section">
        <h4>Knowledge Domains</h4>
        <ul className="admin-vault-tree">
          {domains.slice(0, 8).map((d) => (
            <li key={d.id}>
              <button
                type="button"
                className="admin-vault-tree-item"
                onClick={() => onDomainSelect(d.label)}
              >
                <span>🌐 {d.label}</span>
                <strong>{d.count}</strong>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
});
