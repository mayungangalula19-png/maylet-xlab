import { useCallback, useEffect, useRef, useState } from 'react';
import { messagesAIService } from '../services/messagesAI.service';
import { messagesAIMemoryService } from '../services/messagesAIMemory.service';
import type { AsyncState, AiAssistantPayload, Message } from '../types/messages.types';

const ANALYZE_DEBOUNCE_MS = 600;

export function useAIMessagingAssistant(conversationId: string | null, messages: Message[]) {
  const [aiPanel, setAiPanel] = useState<AsyncState<AiAssistantPayload>>({
    loading: false,
    error: null,
    data: null,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFingerprintRef = useRef('');

  const runAnalysis = useCallback(async (convId: string, list: Message[]) => {
    setAiPanel((s) => ({ ...s, loading: true, error: null }));
    try {
      const persisted = await messagesAIService.loadPersistedMemory(convId);
      const memory = messagesAIMemoryService.extractMemory(convId, list);
      const mergedMemory = persisted
        ? {
            ...memory,
            decisions: [...new Set([...persisted.decisions, ...memory.decisions])].slice(0, 6),
            actionItems: [...new Set([...persisted.actionItems, ...memory.actionItems])].slice(0, 8),
            risks: [...new Set([...persisted.risks, ...memory.risks])].slice(0, 6),
          }
        : memory;

      const payload = await messagesAIService.analyze(convId, list);
      payload.decisions = mergedMemory.decisions;
      payload.actionItems = mergedMemory.actionItems.length
        ? mergedMemory.actionItems
        : payload.actionItems;
      payload.risks = mergedMemory.risks.length ? mergedMemory.risks : payload.risks;
      payload.topics = mergedMemory.topics.length ? mergedMemory.topics : payload.topics;

      const memoryToPersist = { ...mergedMemory, summary: payload.summary };
      void messagesAIService.persistMemory(memoryToPersist);
      messagesAIMemoryService.buildContext(memoryToPersist, list);

      setAiPanel({ loading: false, error: null, data: payload });
    } catch (e) {
      setAiPanel({
        loading: false,
        error: e instanceof Error ? e.message : 'AI analysis failed',
        data: null,
      });
    }
  }, []);

  useEffect(() => {
    if (!conversationId) {
      setAiPanel({ loading: false, error: null, data: null });
      return;
    }

    const fingerprint = `${conversationId}:${messages.length}:${messages[messages.length - 1]?.id ?? ''}`;
    if (fingerprint === lastFingerprintRef.current) return;
    lastFingerprintRef.current = fingerprint;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void runAnalysis(conversationId, messages);
    }, ANALYZE_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [conversationId, messages, runAnalysis]);

  const refresh = useCallback(() => {
    if (!conversationId) return;
    lastFingerprintRef.current = '';
    void runAnalysis(conversationId, messages);
  }, [conversationId, messages, runAnalysis]);

  return { aiPanel, refreshAi: refresh };
}
