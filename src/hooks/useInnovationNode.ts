import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client';
import type { InnovationNode } from '../lib/maya/types';
import { getOrCreateInnovationNode } from '../services/maya.service';

export function useInnovationNode(projectId?: string, title?: string) {
  const [node, setNode] = useState<InnovationNode | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    supabase
      .from('innovation_nodes')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle()
      .then(({ data }) => {
        setNode(data as InnovationNode | null);
        setLoading(false);
      });
  }, [projectId]);

  const ensureNode = async (userId: string, projectTitle: string, description?: string) => {
    const n = await getOrCreateInnovationNode({
      userId,
      projectId,
      title: projectTitle || title || 'Untitled',
      description,
    });
    setNode(n);
    return n;
  };

  return { node, loading, ensureNode };
}
