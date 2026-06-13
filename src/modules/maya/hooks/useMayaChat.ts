import { useCallback, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { sendMayaMessage } from '../services/maya.service';
import type { MayaModelId, MayaChatMessage } from '../ai/types';

export function useMayaChat(initialProjectId?: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MayaChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [projectId, setProjectId] = useState<string | undefined>(initialProjectId);
  const [modelId, setModelId] = useState<MayaModelId>('groq');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (text: string) => {
      if (!user?.id || !text.trim()) return;
      setLoading(true);
      setError(null);
      const userMsg: MayaChatMessage = { role: 'user', content: text.trim() };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const { sessionId: sid, response } = await sendMayaMessage({
          userId: user.id,
          message: text.trim(),
          sessionId,
          projectId,
          modelId,
          userName: user.user_metadata?.full_name as string | undefined,
          userType: user.user_metadata?.user_type as string | undefined,
        });
        setSessionId(sid);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: response.content },
        ]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to send message';
        setError(msg);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${msg}` },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [user, sessionId, projectId, modelId]
  );

  return {
    messages,
    send,
    loading,
    error,
    sessionId,
    projectId,
    setProjectId,
    modelId,
    setModelId,
    clear: () => {
      setMessages([]);
      setSessionId(undefined);
      setError(null);
    },
  };
}
