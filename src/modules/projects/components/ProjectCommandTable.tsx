import { Link } from 'react-router-dom';
import type { Project } from '../../../types/project.types';
import { getInnovationMetrics } from '../../../lib/innovation/lifecycle';

interface Props {
  projects: Project[];
}

function healthClass(score: number, risk: string) {
  if (risk === 'high') return 'icc-health-critical';
  if (score >= 70) return 'icc-health-good';
  if (score >= 40) return 'icc-health-fair';
  return 'icc-health-poor';
}

export function ProjectCommandTable({ projects }: Props) {
  const recent = projects.slice(0, 6);

  if (recent.length === 0) {
    return (
      <div className="icc-glass icc-project-table-empty">
        <p>No projects yet — create your first innovation to populate the command center.</p>
      </div>
    );
  }

  return (
    <div className="icc-glass icc-project-table-wrap">
      <table className="icc-project-table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Health</th>
            <th>Progress</th>
            <th>Stage</th>
            <th>Risk</th>
            <th>Team</th>
            <th>Research</th>
            <th>Experiment</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((project) => {
            const m = getInnovationMetrics(project);
            const health = healthClass(m.readinessScore, m.riskLevel);
            const researchStatus =
              m.stage === 'Research' || m.stage === 'Idea' ? 'Active' : m.progress >= 30 ? 'Complete' : 'Pending';
            const experimentStatus =
              m.stage === 'Experiment' ? 'Running' : m.stage === 'Prototype' ? 'Planned' : '—';

            return (
              <tr key={project.id}>
                <td>
                  <Link to={`/projects/${project.id}`} className="icc-table-project icc-clickable">
                    {project.name}
                  </Link>
                  <span className="icc-table-sector">{project.sector}</span>
                </td>
                <td>
                  <span className={`icc-health-dot ${health}`} title={`Readiness ${m.readinessScore}`} />
                </td>
                <td>
                  <div className="icc-table-progress">
                    <div className="icc-bar-track">
                      <div className="icc-bar-fill" style={{ width: `${m.progress}%` }} />
                    </div>
                    <span>{m.progress}%</span>
                  </div>
                </td>
                <td><span className="icc-table-stage">{m.stage}</span></td>
                <td><span className={`icc-risk-${m.riskLevel}`}>{m.riskLevel}</span></td>
                <td>{project.team_size}</td>
                <td>{researchStatus}</td>
                <td>{experimentStatus}</td>
                <td>
                  <div className="icc-table-actions">
                    <Link to={`/projects/${project.id}`} className="icc-table-btn">View</Link>
                    <Link to={`/projects/${project.id}/edit`} className="icc-table-btn">Edit</Link>
                    <Link to="/documents" className="icc-table-btn">Research</Link>
                    <Link to={`/experiments/new?projectId=${project.id}`} className="icc-table-btn">Experiment</Link>
                    <Link to="/funding" className="icc-table-btn">Funding</Link>
                    <Link to={`/ai-assistant/analyze?projectId=${project.id}`} className="icc-table-btn icc-table-btn--maya">MAYA</Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
