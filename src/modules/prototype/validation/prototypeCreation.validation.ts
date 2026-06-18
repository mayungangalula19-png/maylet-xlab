import type { PrototypeCreationDraft } from '../types/prototypeCreation.types';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validatePrototypeName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Prototype name is required';
  if (trimmed.length < 3) return 'Name must be at least 3 characters';
  if (trimmed.length > 120) return 'Name must be 120 characters or fewer';
  return null;
}

export function validateCreationDraft(draft: PrototypeCreationDraft, mode: 'draft' | 'publish'): ValidationResult {
  const errors: Record<string, string> = {};

  const nameErr = validatePrototypeName(draft.name);
  if (nameErr) errors.name = nameErr;

  if (draft.description.length > 2000) {
    errors.description = 'Description must be 2000 characters or fewer';
  }

  if (mode === 'publish') {
    if (!draft.problemStatement.trim()) {
      errors.problemStatement = 'Problem statement is required to publish';
    }
    if (!draft.solutionOverview.trim()) {
      errors.solutionOverview = 'Solution overview is required to publish';
    }
    if (draft.features.length === 0) {
      errors.features = 'Add at least one feature before publishing';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function sectionCompletion(draft: PrototypeCreationDraft): Record<string, number> {
  const pct = (filled: number, total: number) => (total === 0 ? 0 : Math.round((filled / total) * 100));

  const detailsFields = [
    draft.name,
    draft.description,
    draft.category,
    draft.industry,
    draft.tags.length > 0,
    draft.projectId || draft.researchId,
  ];
  const problemFields = [draft.problemStatement, draft.targetUsers, draft.currentLimitations, draft.marketNeed];
  const solutionFields = [
    draft.solutionOverview,
    draft.keyInnovation,
    draft.competitiveAdvantage,
    draft.technicalApproach,
  ];
  const archFields = [
    draft.frontendStack,
    draft.backendStack,
    draft.database,
    draft.apis,
    draft.aiIntegrations,
    draft.infrastructure,
  ];

  return {
    details: pct(detailsFields.filter(Boolean).length, detailsFields.length),
    problem: pct(problemFields.filter((f) => String(f).trim()).length, problemFields.length),
    solution: pct(solutionFields.filter((f) => String(f).trim()).length, solutionFields.length),
    flow: draft.userFlow.length > 0 ? 100 : 0,
    features: draft.features.length > 0 ? Math.min(100, draft.features.length * 25) : 0,
    architecture: pct(archFields.filter((f) => f.trim()).length, archFields.length),
    experiments: draft.experiments.length > 0 ? 100 : 0,
    validation:
      draft.validation.feedback.trim() || draft.validation.testResults.trim()
        ? 70
        : draft.validation.validationScore != null
          ? 100
          : 0,
    attachments: draft.attachments.length > 0 ? 100 : 0,
  };
}

export function overallCompletion(sections: Record<string, number>): number {
  const values = Object.values(sections);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}
