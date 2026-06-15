import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageLoad } from '../../../core/hooks/usePageLoad';
import {
  ecosystemService,
  learningHubService,
  type LearningResourceRecord,
  type ResourceType,
  type SkillLevel,
  type UserLearningProgressRecord,
} from '../../../core';

export function useLearningHubPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    resources: LearningResourceRecord[];
    progress: UserLearningProgressRecord[];
  } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<SkillLevel | 'all'>('all');

  useEffect(() => {
    void ecosystemService.getCurrentUserId().then((id) => {
      if (!id) navigate('/login');
      else setUserId(id);
    });
  }, [navigate]);

  usePageLoad(async ({ cancelled }) => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await learningHubService.getData(userId);
      if (cancelled()) return;
      setData(result);
    } catch (err) {
      if (!cancelled()) setError(err instanceof Error ? err.message : 'Failed to load learning hub');
    } finally {
      if (!cancelled()) setLoading(false);
    }
  }, [userId]);

  const toggleComplete = useCallback(
    async (resourceId: string, completed: boolean) => {
      if (!userId || !data) return;
      try {
        if (completed) {
          const record = await learningHubService.markComplete(userId, resourceId);
          setData((prev) =>
            prev
              ? { ...prev, progress: [...prev.progress, record] }
              : prev
          );
        } else {
          const existing = data.progress.find((p) => p.resource_id === resourceId);
          if (existing) {
            await learningHubService.markIncomplete(existing.id);
            setData((prev) =>
              prev
                ? { ...prev, progress: prev.progress.filter((p) => p.resource_id !== resourceId) }
                : prev
            );
          }
        }
      } catch (err) {
        console.error('Update progress error:', err);
      }
    },
    [data, userId]
  );

  const resources = data?.resources ?? [];
  const progress = data?.progress ?? [];
  const isCompleted = (resourceId: string) => progress.some((p) => p.resource_id === resourceId);

  const filteredResources = resources.filter((res) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      res.title.toLowerCase().includes(q) ||
      res.description.toLowerCase().includes(q) ||
      res.tags.some((t) => t.toLowerCase().includes(q));
    const matchesType = typeFilter === 'all' || res.type === typeFilter;
    const matchesLevel = levelFilter === 'all' || res.skill_level === levelFilter;
    return matchesSearch && matchesType && matchesLevel;
  });

  return {
    loading,
    error,
    data,
    resources,
    progress,
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    levelFilter,
    setLevelFilter,
    filteredResources,
    isCompleted,
    toggleComplete,
  };
}
