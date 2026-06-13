import { Link } from 'react-router-dom';
import { EMPTY, formatCount } from '../../../lib/innovation/dashboardData';
import type { ExperimentStatus, FundingStatus, ResearchStatus, TeamStatus, VaultSummary } from '../../../lib/supabase/commandCenter.queries';

export function ResearchStatusPanel({ research }: { research: ResearchStatus }) {
  return (
    <div className="icc-glass icc-widget">
      <div className="icc-widget-header">
        <h3>Research</h3>
        <Link to="/research" className="icc-widget-link">Research</Link>
      </div>
      <div className="icc-status-rows">
        <div className="icc-status-row">
          <span>Documents</span>
          <strong>{formatCount(research.totalDocuments)}</strong>
        </div>
        <div className="icc-status-row">
          <span>Research files</span>
          <strong>{formatCount(research.researchTaggedCount)}</strong>
        </div>
      </div>
      {research.recentDocuments.length === 0 ? (
        <p className="icc-widget-empty-text">{EMPTY.COMPLETE_SETUP}</p>
      ) : (
        research.recentDocuments.slice(0, 4).map((doc) => (
          <Link key={doc.id} to={doc.project_id ? `/research/${doc.project_id}` : '/research'} className="icc-doc-item icc-clickable">
            <div style={{ fontWeight: 600 }}>{doc.name}</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
              {doc.file_type ?? 'Document'}
            </div>
          </Link>
        ))
      )}
    </div>
  );
}

export function ExperimentStatusPanel({ experiments }: { experiments: ExperimentStatus }) {
  return (
    <div className="icc-glass icc-widget">
      <div className="icc-widget-header">
        <h3>Experiments</h3>
        <Link to="/experiments" className="icc-widget-link">Experiments</Link>
      </div>
      <div className="icc-status-rows">
        <div className="icc-status-row"><span>Total</span><strong>{formatCount(experiments.total)}</strong></div>
        <div className="icc-status-row"><span>Running</span><strong>{experiments.running > 0 ? experiments.running : EMPTY.NO_DATA}</strong></div>
        <div className="icc-status-row"><span>Completed</span><strong>{experiments.completed > 0 ? experiments.completed : EMPTY.NO_DATA}</strong></div>
      </div>
      {experiments.total === 0 && (
        <Link to="/experiments/create" className="icc-widget-cta">{EMPTY.COMPLETE_SETUP} →</Link>
      )}
    </div>
  );
}

export function FundingStatusPanel({ funding }: { funding: FundingStatus }) {
  return (
    <div className="icc-glass icc-widget">
      <div className="icc-widget-header">
        <h3>Funding</h3>
        <Link to="/funding" className="icc-widget-link">Hub</Link>
      </div>
      <div className="icc-status-row">
        <span>Pitches</span>
        <strong>{formatCount(funding.totalPitches)}</strong>
      </div>
      {funding.recentPitches.length === 0 ? (
        <p className="icc-widget-empty-text">{EMPTY.NOT_AVAILABLE}</p>
      ) : (
        funding.recentPitches.map((pitch) => (
          <Link key={pitch.id} to="/funding" className="icc-doc-item icc-clickable">
            <div style={{ fontWeight: 600 }}>{pitch.title}</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
              {pitch.status ?? 'Recorded'}
            </div>
          </Link>
        ))
      )}
    </div>
  );
}

export function VaultStatusPanel({ vault }: { vault: VaultSummary }) {
  const total = vault.vaultEntries + vault.vaultItems;
  return (
    <div className="icc-glass icc-widget">
      <div className="icc-widget-header">
        <h3>Vault</h3>
        <Link to="/vault" className="icc-widget-link">Open</Link>
      </div>
      <div className="icc-status-rows">
        <div className="icc-status-row"><span>Entries</span><strong>{formatCount(vault.vaultEntries)}</strong></div>
        <div className="icc-status-row"><span>Items</span><strong>{formatCount(vault.vaultItems)}</strong></div>
        <div className="icc-status-row"><span>Protected</span><strong>{formatCount(vault.protectedIdeas)}</strong></div>
      </div>
      {total === 0 && <p className="icc-widget-empty-text">{EMPTY.COMPLETE_SETUP}</p>}
    </div>
  );
}

export function TeamStatusPanel({ team }: { team: TeamStatus }) {
  return (
    <div className="icc-glass icc-widget">
      <div className="icc-widget-header">
        <h3>Team</h3>
        <Link to="/teams" className="icc-widget-link">Teams</Link>
      </div>
      <div className="icc-status-row">
        <span>Members</span>
        <strong>{formatCount(team.memberCount)}</strong>
      </div>
      {team.members.length === 0 ? (
        <>
          <p className="icc-widget-empty-text">{EMPTY.NO_DATA}</p>
          <Link to="/teams/create" className="icc-widget-cta">{EMPTY.COMPLETE_SETUP} →</Link>
        </>
      ) : (
        team.members.map((m) => (
          <Link key={m.id} to="/teams" className="icc-team-item icc-clickable">
            <strong>{m.name}</strong>
            <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>{m.role}</span>
          </Link>
        ))
      )}
    </div>
  );
}
