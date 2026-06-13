import { useCallback, useState } from 'react';
import { useMayaChat } from '../../../hooks/useMayaChat';
import {
  buildMayaApiPayload,
  detectKnowledgeGaps,
  generateInsights,
  suggestResearchQuestions,
  summarizeResearch,
} from '../ai/mayaResearchAI';
import { RESEARCH_PROMPTS, type ResearchPromptKey } from '../ai/prompts';
import type { ProjectResearchSnapshot } from '../types/research.types';

export function useMayaAI(projectId: string | undefined, projectName: string, snapshot: ProjectResearchSnapshot | null) {
  const chat = useMayaChat(projectId);
  const [localAnalysis, setLocalAnalysis] = useState<ReturnType<typeof summarizeResearch> | null>(null);

  const runLocalAnalysis = useCallback(() => {
    if (!snapshot) return null;
    const result = summarizeResearch({ projectName, snapshot });
    setLocalAnalysis(result);
    return result;
  }, [projectName, snapshot]);

  const runPrompt = useCallback(
    async (key: ResearchPromptKey) => {
      if (!snapshot) return;
      const payload = buildMayaApiPayload({ projectName, snapshot }, key);
      await chat.send(`${payload.user}`);
    },
    [chat, projectName, snapshot]
  );

  const gaps = snapshot ? detectKnowledgeGaps({ projectName, snapshot }) : [];
  const insights = snapshot ? generateInsights({ projectName, snapshot }) : [];
  const questions = snapshot ? suggestResearchQuestions({ projectName, snapshot }) : [];

  return {
    ...chat,
    localAnalysis,
    runLocalAnalysis,
    runPrompt,
    gaps,
    insights,
    questions,
    prompts: RESEARCH_PROMPTS,
  };
}
