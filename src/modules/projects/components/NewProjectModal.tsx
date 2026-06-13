import { useState } from 'react';
import { createProject } from '../../../lib/supabase/projects.queries';
import {
  PIPELINE_STAGES,
  type PipelineStage,
  type Project,
} from '../../../types/project.types';
import './projects-pipeline.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
  userId: string;
  prefillTeamId?: string;
}

const SECTORS = [
  'Agriculture',
  'Health',
  'Education',
  'FinTech',
  'Environment',
  'Blockchain',
  'AI/ML',
  'IoT',
  'E-commerce',
  'Logistics',
  'Tourism',
  'Cybersecurity',
  'Gaming',
  'Other',
];

export function NewProjectModal({ isOpen, onClose, onSuccess, userId, prefillTeamId }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sector, setSector] = useState('Agriculture');
  const [initialStage, setInitialStage] = useState<PipelineStage>('Idea');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setDescription('');
    setSector('Agriculture');
    setInitialStage('Idea');
    setError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const project = await createProject({
        name,
        description,
        sector,
        initialStage,
        userId,
        metadata: prefillTeamId ? { team_id: prefillTeamId } : undefined,
      });
      resetForm();
      onSuccess(project);
      onClose();
    } catch (err) {
      console.error('[NewProjectModal]', err);
      setError(err instanceof Error ? err.message : 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="new-project-overlay" onClick={handleClose}>
      <div className="new-project-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Create New Project</h2>
        <p>Start a new innovation on the Maylet XLab pipeline.</p>

        <form onSubmit={handleSubmit}>
          <div className="new-project-field">
            <label htmlFor="project-name">Project name</label>
            <input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AI Smart Farming"
              maxLength={120}
              required
            />
          </div>

          <div className="new-project-field">
            <label htmlFor="project-description">Description</label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What problem does this project solve?"
            />
          </div>

          <div className="new-project-field">
            <label htmlFor="project-sector">Sector</label>
            <select id="project-sector" value={sector} onChange={(e) => setSector(e.target.value)}>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="new-project-field">
            <label htmlFor="project-stage">Initial pipeline stage</label>
            <select
              id="project-stage"
              value={initialStage}
              onChange={(e) => setInitialStage(e.target.value as PipelineStage)}
            >
              {PIPELINE_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="new-project-error">{error}</p>}

          <div className="new-project-actions">
            <button type="button" className="new-project-btn-cancel" onClick={handleClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="new-project-btn-submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
