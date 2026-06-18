import { invokeMayaChat } from '../../../lib/maya/mayaChat.service';
import type { ScreenshotCategory, ScreenshotDescription, ScreenshotInput } from '../types/prototype.types';

const CATEGORY_LABELS: Record<ScreenshotCategory, string> = {
  ui: 'User Interface',
  workflow: 'User Workflow',
  architecture: 'System Architecture',
  analytics: 'Analytics & Reporting',
  other: 'Product Feature',
};

function buildPrompt(input: ScreenshotInput): string {
  const category = input.category ?? 'ui';
  return `You are a senior UX writer for MAYLET X LAB, an enterprise innovation platform.

Generate structured documentation for a prototype screenshot.

Screenshot title: ${input.title}
Category: ${CATEGORY_LABELS[category]}
${input.context ? `Context: ${input.context}` : ''}

Return EXACTLY this format (plain text, no markdown headers beyond labels):

TITLE: [clean professional UI screen title]
PURPOSE: [what this screen is used for in the system]
UX: [what the user sees and interacts with]
FUNCTIONALITY: [what the system does behind the scenes]
VALUE: [why this screen matters in the product workflow]

Be precise, technical, and enterprise SaaS tone. No fluff.`;
}

function parseAiResponse(raw: string, fallbackTitle: string): ScreenshotDescription {
  const pick = (label: string): string => {
    const re = new RegExp(`${label}:\\s*([\\s\\S]*?)(?=\\n[A-Z]+:|$)`, 'i');
    const m = raw.match(re);
    return m?.[1]?.trim() ?? '';
  };

  const title = pick('TITLE') || fallbackTitle;
  const purpose = pick('PURPOSE');
  const uxDescription = pick('UX');
  const functionality = pick('FUNCTIONALITY');
  const userValue = pick('VALUE');

  if (purpose && uxDescription) {
    return { title, purpose, uxDescription, functionality, userValue };
  }

  return buildTemplateDescription({ title: fallbackTitle, context: raw.slice(0, 200), category: 'ui' });
}

export function buildTemplateDescription(input: ScreenshotInput): ScreenshotDescription {
  const category = input.category ?? 'ui';
  const title = input.title.trim() || 'Prototype Screen';

  const byCategory: Record<ScreenshotCategory, Omit<ScreenshotDescription, 'title'>> = {
    ui: {
      purpose: `Presents a core ${CATEGORY_LABELS.ui.toLowerCase()} surface within the prototype experience.`,
      uxDescription:
        'Displays structured layout regions, navigation, and interactive controls aligned with the innovation workflow.',
      functionality:
        'Renders prototype state from persisted records and reflects the latest build configuration.',
      userValue: 'Helps stakeholders validate usability and clarity before advancing to experiment or validation.',
    },
    workflow: {
      purpose: 'Documents a step in the end-to-end innovation lifecycle.',
      uxDescription: 'Shows sequential actions, status indicators, and decision points across the workflow.',
      functionality: 'Coordinates stage transitions against workflow engine rules and readiness scores.',
      userValue: 'Makes process compliance visible and reduces ambiguity during gate reviews.',
    },
    architecture: {
      purpose: 'Communicates system structure and integration boundaries for the prototype.',
      uxDescription: 'Visualizes modules, data flows, and service dependencies in a diagrammatic layout.',
      functionality: 'Maps components to backend services, storage, and external APIs used by the platform.',
      userValue: 'Supports technical review, security assessment, and enterprise onboarding conversations.',
    },
    analytics: {
      purpose: 'Surfaces measurable signals about prototype or project performance.',
      uxDescription: 'Presents charts, KPIs, and trend summaries with filterable time ranges.',
      functionality: 'Aggregates events and metrics from project activity and testing outcomes.',
      userValue: 'Enables evidence-based decisions on readiness, funding, and commercialization.',
    },
    other: {
      purpose: 'Highlights a supporting capability within the MAYLET X LAB prototype.',
      uxDescription: 'Combines contextual copy with focused UI elements for a specific user task.',
      functionality: 'Integrates with shared platform services while scoped to the prototype domain.',
      userValue: 'Clarifies scope and value for reviewers evaluating prototype completeness.',
    },
  };

  const base = byCategory[category];
  const contextNote = input.context?.trim()
    ? ` Context: ${input.context.trim()}`
    : '';

  return {
    title,
    purpose: base.purpose + contextNote,
    uxDescription: base.uxDescription,
    functionality: base.functionality,
    userValue: base.userValue,
  };
}

/** Generate documentation-ready screenshot descriptions (AI with template fallback). */
export async function generateScreenshotDescription(
  input: ScreenshotInput
): Promise<ScreenshotDescription> {
  if (!input.title?.trim()) {
    throw new Error('Screenshot title is required');
  }

  try {
    const raw = await invokeMayaChat([
      {
        role: 'user',
        content: buildPrompt(input),
      },
    ]);
    return parseAiResponse(raw, input.title.trim());
  } catch {
    return buildTemplateDescription(input);
  }
}

/** Batch-generate descriptions for multiple screenshots. */
export async function generateScreenshotDescriptions(
  inputs: ScreenshotInput[]
): Promise<ScreenshotDescription[]> {
  const results: ScreenshotDescription[] = [];
  for (const input of inputs) {
    results.push(await generateScreenshotDescription(input));
  }
  return results;
}

/** Format description as documentation-ready markdown. */
export function formatScreenshotDocumentation(desc: ScreenshotDescription): string {
  return `### 🖼️ Screenshot Title: ${desc.title}

**🎯 Purpose:**
${desc.purpose}

**🧭 UX Description:**
${desc.uxDescription}

**⚙️ Functionality:**
${desc.functionality}

**💡 User Value:**
${desc.userValue}`;
}
