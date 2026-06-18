import { Link } from 'react-router-dom';
import { AdminBadge } from '../ui/AdminBadge';
import { AdminDetailGrid, AdminDetailItem } from '../ui/AdminDetailGrid';
import { formatAdminDate, formatAdminDateTime } from '../../utils/adminPage.utils';
import type { AdminExperimentDetailBundle } from '../../types/innovationAdmin.types';

interface AdminExperimentDetailViewProps {
  bundle: AdminExperimentDetailBundle;
}

export function AdminExperimentDetailView({ bundle }: AdminExperimentDetailViewProps) {
  const { experiment, owner } = bundle;
  const exp = experiment;

  return (
    <div className="admin-innovation-detail">
      <section className="admin-section-card">
        <div className="admin-innovation-header">
          <div>
            <div className="admin-innovation-badges">
              <AdminBadge variant="purple">{exp.type}</AdminBadge>
              <AdminBadge variant="info">{exp.status}</AdminBadge>
              <AdminBadge variant={exp.validationReady ? 'success' : 'default'}>
                {exp.pipelineStage}
              </AdminBadge>
            </div>
          </div>
          <div className="admin-innovation-scores">
            <Score label="Confidence" value={`${exp.confidenceScore}%`} />
            <Score label="Evidence" value={`${exp.evidenceQuality}%`} />
            <Score label="Data quality" value={`${exp.dataQuality}%`} />
          </div>
        </div>

        <AdminDetailGrid>
          <AdminDetailItem label="Experiment ID" value={exp.id} mono />
          <AdminDetailItem label="Pipeline stage" value={exp.pipelineStage} />
          <AdminDetailItem label="Days in stage" value={String(exp.daysInStage)} />
          <AdminDetailItem label="Created" value={formatAdminDate(exp.created_at)} />
          <AdminDetailItem label="Updated" value={formatAdminDateTime(exp.updated_at)} />
          <AdminDetailItem label="Data completeness" value={`${exp.dataCompleteness}%`} />
        </AdminDetailGrid>
      </section>

      <div className="admin-two-columns">
        <section className="admin-section-card">
          <h3>Hypothesis</h3>
          <p className="admin-innovation-text">{exp.hypothesis || 'No hypothesis recorded.'}</p>

          {exp.config.objectives ? (
            <>
              <h3>Objectives</h3>
              <p className="admin-innovation-text">{exp.config.objectives}</p>
            </>
          ) : null}

          {exp.config.methodology ? (
            <>
              <h3>Methodology</h3>
              <p className="admin-innovation-text">{exp.config.methodology}</p>
            </>
          ) : null}

          {exp.results ? (
            <>
              <h3>Results</h3>
              <p className="admin-innovation-text">{exp.results}</p>
            </>
          ) : null}

          {exp.config.key_findings ? (
            <>
              <h3>Key findings</h3>
              <p className="admin-innovation-text">{exp.config.key_findings}</p>
            </>
          ) : null}
        </section>

        <div className="admin-project-detail-col">
          <section className="admin-section-card">
            <h3>Owner</h3>
            <div className="admin-user-cell">
              <div className="admin-user-avatar">{owner.name.charAt(0).toUpperCase()}</div>
              <div>
                <div>{owner.name}</div>
                <div className="admin-project-meta">{owner.email}</div>
                <Link to={`/admin/users/${owner.id}`} className="admin-card-link">
                  View profile →
                </Link>
              </div>
            </div>
          </section>

          <section className="admin-section-card">
            <h3>Links</h3>
            <AdminDetailGrid>
              <AdminDetailItem
                label="Project"
                value={exp.project_name ?? '—'}
              />
              {exp.project_id ? (
                <div className="admin-detail-item admin-detail-item--action">
                  <dt>Project admin</dt>
                  <dd>
                    <Link to={`/admin/projects/${exp.project_id}`} className="admin-action-link">
                      Open project →
                    </Link>
                  </dd>
                </div>
              ) : null}
              <AdminDetailItem label="Prototype" value={exp.prototype_name ?? '—'} />
              {exp.prototype_id ? (
                <div className="admin-detail-item admin-detail-item--action">
                  <dt>Prototype admin</dt>
                  <dd>
                    <Link to={`/admin/prototypes/${exp.prototype_id}`} className="admin-action-link">
                      Open prototype →
                    </Link>
                  </dd>
                </div>
              ) : null}
            </AdminDetailGrid>
          </section>

          {(exp.config.success_criteria || exp.config.metrics) && (
            <section className="admin-section-card">
              <h3>Success criteria & metrics</h3>
              {exp.config.success_criteria ? (
                <p className="admin-innovation-text">{exp.config.success_criteria}</p>
              ) : null}
              {exp.config.metrics ? (
                <p className="admin-innovation-text admin-form-hint">{exp.config.metrics}</p>
              ) : null}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Score({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-innovation-score">
      <div className="admin-innovation-score-value">{value}</div>
      <div className="admin-quick-stat-label">{label}</div>
    </div>
  );
}
