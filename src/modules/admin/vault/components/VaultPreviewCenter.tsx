import { memo } from 'react';
import type { AdminVaultAssetRow } from '../types/vaultOpsAdmin.types';

interface VaultPreviewCenterProps {
  asset: AdminVaultAssetRow | null;
}

export const VaultPreviewCenter = memo(function VaultPreviewCenter({ asset }: VaultPreviewCenterProps) {
  if (!asset) {
    return (
      <div className="admin-vault-preview admin-vault-glass">
        <h4>Document Preview Center</h4>
        <p className="admin-muted">Select an asset to preview.</p>
      </div>
    );
  }

  return (
    <div className="admin-vault-preview admin-vault-glass">
      <h4>Document Preview — {asset.title}</h4>
      <div className="admin-vault-preview-meta">
        <span>{asset.assetType.replace(/_/g, ' ')}</span>
        <span>{asset.classification.replace(/_/g, ' ')}</span>
        <span>v{asset.version}</span>
        {asset.sizeBytes ? <span>{(asset.sizeBytes / 1024).toFixed(1)} KB</span> : null}
      </div>

      <div className="admin-vault-preview-body">
        {asset.previewKind === 'pdf' && asset.fileUrl ? (
          <iframe title={asset.title} src={asset.fileUrl} className="admin-vault-preview-frame" />
        ) : asset.previewKind === 'image' && asset.fileUrl ? (
          <img src={asset.fileUrl} alt={asset.title} className="admin-vault-preview-image" />
        ) : asset.previewKind === 'video' && asset.fileUrl ? (
          <video src={asset.fileUrl} controls className="admin-vault-preview-video">
            <track kind="captions" />
          </video>
        ) : asset.contentPreview ? (
          <pre className="admin-vault-preview-text">{asset.contentPreview}</pre>
        ) : (
          <div className="admin-vault-preview-placeholder">
            <p>
              {asset.previewKind === 'cad'
                ? 'CAD metadata — open file for full model'
                : asset.previewKind === 'spreadsheet'
                  ? 'Spreadsheet preview — download to view'
                  : asset.previewKind === 'presentation'
                    ? 'Presentation preview — download to view'
                    : 'No inline preview available'}
            </p>
            {asset.fileUrl ? (
              <a href={asset.fileUrl} target="_blank" rel="noreferrer" className="admin-link">
                Open file →
              </a>
            ) : null}
          </div>
        )}
      </div>

      {asset.tags.length > 0 ? (
        <div className="admin-vault-preview-tags">
          {asset.tags.map((t) => (
            <span key={t} className="admin-vault-tag">
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
});
