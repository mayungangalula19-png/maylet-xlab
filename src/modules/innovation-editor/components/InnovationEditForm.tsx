import type { ReactNode } from 'react';
import type {
  CommercializationWorkspaceState,
  ExperimentEditValues,
  FundingEditValues,
  PrototypeEditValues,
  ResearchEditValues,
  TestingEditValues,
  ValidationEditValues,
} from '../adapters/entityAdapters';
import type { InnovationEntityType } from '../types/innovationEditor.types';

interface InnovationEditFormProps {
  entityType: InnovationEntityType;
  values: unknown;
  onChange: (values: unknown) => void;
  disabled?: boolean;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="innovation-edit-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

export function InnovationEditForm({
  entityType,
  values,
  onChange,
  disabled,
}: InnovationEditFormProps) {
  const patch = (partial: Record<string, unknown>) =>
    onChange({ ...(values as Record<string, unknown>), ...partial });

  if (entityType === 'experiment') {
    const v = values as unknown as ExperimentEditValues;
    return (
      <div className="innovation-edit-form">
        <Field label="Title">
          <input
            value={v.title}
            disabled={disabled}
            onChange={(e) => patch({ title: e.target.value })}
          />
        </Field>
        <Field label="Hypothesis">
          <textarea
            value={v.hypothesis}
            disabled={disabled}
            onChange={(e) => patch({ hypothesis: e.target.value })}
          />
        </Field>
        <Field label="Objectives">
          <textarea
            value={v.objectives}
            disabled={disabled}
            onChange={(e) => patch({ objectives: e.target.value })}
          />
        </Field>
        <Field label="Methodology">
          <textarea
            value={v.methodology}
            disabled={disabled}
            onChange={(e) => patch({ methodology: e.target.value })}
          />
        </Field>
        <Field label="Results">
          <textarea
            value={v.results}
            disabled={disabled}
            onChange={(e) => patch({ results: e.target.value })}
          />
        </Field>
        <Field label="Status">
          <select
            value={v.status}
            disabled={disabled}
            onChange={(e) => patch({ status: e.target.value })}
          >
            <option value="draft">Draft</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
          </select>
        </Field>
      </div>
    );
  }

  if (entityType === 'prototype') {
    const v = values as unknown as PrototypeEditValues;
    return (
      <div className="innovation-edit-form">
        <Field label="Name">
          <input
            value={v.name}
            disabled={disabled}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </Field>
        <Field label="Description">
          <textarea
            value={v.description}
            disabled={disabled}
            onChange={(e) => patch({ description: e.target.value })}
          />
        </Field>
        <Field label="Version">
          <input
            value={v.version}
            disabled={disabled}
            onChange={(e) => patch({ version: e.target.value })}
          />
        </Field>
        <Field label="Status">
          <input
            value={v.status}
            disabled={disabled}
            onChange={(e) => patch({ status: e.target.value })}
          />
        </Field>
      </div>
    );
  }

  if (entityType === 'research') {
    const v = values as unknown as ResearchEditValues;
    return (
      <div className="innovation-edit-form">
        {(
          [
            ['problem_statement', 'Problem statement'],
            ['target_users', 'Target users'],
            ['pain_points', 'Pain points'],
            ['existing_solutions', 'Existing solutions'],
            ['research_questions', 'Research questions'],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={label}>
            <textarea
              value={v[key]}
              disabled={disabled}
              onChange={(e) => patch({ [key]: e.target.value })}
            />
          </Field>
        ))}
      </div>
    );
  }

  if (entityType === 'testing') {
    const v = values as unknown as TestingEditValues;
    return (
      <div className="innovation-edit-form">
        <Field label="Test plan summary">
          <textarea
            value={v.test_plan_summary}
            disabled={disabled}
            onChange={(e) => patch({ test_plan_summary: e.target.value })}
          />
        </Field>
        <Field label="Execution notes">
          <textarea
            value={v.execution_notes}
            disabled={disabled}
            onChange={(e) => patch({ execution_notes: e.target.value })}
          />
        </Field>
        <Field label="Status">
          <input
            value={v.status}
            disabled={disabled}
            onChange={(e) => patch({ status: e.target.value })}
          />
        </Field>
      </div>
    );
  }

  if (entityType === 'validation') {
    const v = values as unknown as ValidationEditValues;
    return (
      <div className="innovation-edit-form">
        <Field label="Decision">
          <select
            value={v.decision}
            disabled={disabled}
            onChange={(e) => patch({ decision: e.target.value })}
          >
            <option value="pending">Pending</option>
            <option value="pass">Pass</option>
            <option value="hold">Hold</option>
            <option value="fail">Fail</option>
          </select>
        </Field>
        <Field label="Reviewer notes">
          <textarea
            value={v.reviewer_notes}
            disabled={disabled}
            onChange={(e) => patch({ reviewer_notes: e.target.value })}
          />
        </Field>
      </div>
    );
  }

  if (entityType === 'funding') {
    const v = values as unknown as FundingEditValues;
    return (
      <div className="innovation-edit-form">
        <Field label="Title">
          <input
            value={v.title}
            disabled={disabled}
            onChange={(e) => patch({ title: e.target.value })}
          />
        </Field>
        <Field label="Amount">
          <input
            value={v.amount}
            disabled={disabled}
            onChange={(e) => patch({ amount: e.target.value })}
          />
        </Field>
        <Field label="Equity offered (%)">
          <input
            value={v.equity_offered}
            disabled={disabled}
            onChange={(e) => patch({ equity_offered: e.target.value })}
          />
        </Field>
        <Field label="Summary">
          <textarea
            value={v.summary}
            disabled={disabled}
            onChange={(e) => patch({ summary: e.target.value })}
          />
        </Field>
        <Field label="Status">
          <input
            value={v.status}
            disabled={disabled}
            onChange={(e) => patch({ status: e.target.value })}
          />
        </Field>
      </div>
    );
  }

  const v = values as unknown as CommercializationWorkspaceState;
  return (
    <div className="innovation-edit-form">
      <Field label="Target users">
        <textarea
          value={v.marketStrategy.targetUsers}
          disabled={disabled}
          onChange={(e) =>
            patch({
              marketStrategy: { ...v.marketStrategy, targetUsers: e.target.value },
            })
          }
        />
      </Field>
      <Field label="Market size">
        <input
          value={v.marketStrategy.marketSize}
          disabled={disabled}
          onChange={(e) =>
            patch({
              marketStrategy: { ...v.marketStrategy, marketSize: e.target.value },
            })
          }
        />
      </Field>
      <Field label="Product name">
        <input
          value={v.packaging.productName}
          disabled={disabled}
          onChange={(e) =>
            patch({
              packaging: { ...v.packaging, productName: e.target.value },
            })
          }
        />
      </Field>
      <Field label="Launch recommendation">
        <textarea
          value={v.mayaInsights.launchRecommendation}
          disabled={disabled}
          onChange={(e) =>
            patch({
              mayaInsights: { ...v.mayaInsights, launchRecommendation: e.target.value },
            })
          }
        />
      </Field>
    </div>
  );
}
