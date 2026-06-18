import { memo } from 'react';
import type { AdminVaultAssetRow } from '../types/vaultOpsAdmin.types';
import type { VaultKnowledgeEdge, VaultKnowledgeNode } from '../types/vaultOpsAdmin.types';

interface VaultKnowledgeGraphProps {
  nodes: VaultKnowledgeNode[];
  edges: VaultKnowledgeEdge[];
  selected: AdminVaultAssetRow | null;
}

export const VaultKnowledgeGraph = memo(function VaultKnowledgeGraph({
  nodes,
  edges,
  selected,
}: VaultKnowledgeGraphProps) {
  if (!selected || nodes.length === 0) {
    return (
      <div className="admin-vault-graph admin-vault-glass">
        <h4>Knowledge Graph</h4>
        <p className="admin-muted">Select an asset to visualize relationships.</p>
      </div>
    );
  }

  return (
    <div className="admin-vault-graph admin-vault-glass">
      <h4>Knowledge Graph — {selected.title.slice(0, 40)}</h4>
      <svg viewBox="0 0 100 100" className="admin-vault-graph-svg" role="img" aria-label="Knowledge graph">
        {edges.map((e) => {
          const from = nodes.find((n) => n.id === e.from);
          const to = nodes.find((n) => n.id === e.to);
          if (!from?.x || !to?.x) return null;
          return (
            <line
              key={`${e.from}-${e.to}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="rgba(47,212,255,0.35)"
              strokeWidth="0.4"
            />
          );
        })}
        {nodes.map((n) => (
          <g key={n.id}>
            <circle
              cx={n.x ?? 50}
              cy={n.y ?? 50}
              r={n.id === selected.sourceKey ? 6 : 4}
              fill={n.id === selected.sourceKey ? '#2fd4ff' : 'rgba(124,95,230,0.8)'}
            />
            <text
              x={n.x ?? 50}
              y={(n.y ?? 50) + 8}
              textAnchor="middle"
              fontSize="3"
              fill="rgba(255,255,255,0.75)"
            >
              {n.label.slice(0, 14)}
            </text>
          </g>
        ))}
      </svg>
      <ul className="admin-vault-graph-legend">
        {edges.slice(0, 6).map((e) => (
          <li key={`leg-${e.from}-${e.to}`}>
            <span>{e.label}</span>
            <span className="admin-muted">
              {nodes.find((n) => n.id === e.from)?.label?.slice(0, 16)} →{' '}
              {nodes.find((n) => n.id === e.to)?.label?.slice(0, 16)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
});
