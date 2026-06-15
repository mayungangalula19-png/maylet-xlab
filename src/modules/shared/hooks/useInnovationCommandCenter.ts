import { useEffect, useMemo, useState } from 'react';
import type { Project } from '../../../types/project.types';
import { computeOperationalActions, computeOperationalQueues } from '../../../lib/innovation/operational';
import {
  fetchRealDashboardSnapshot,
  type RealDashboardSnapshot,
} from '../../../lib/supabase/commandCenter.queries';
import type { OperationalAction } from '../../../lib/innovation/operational';

export type { RealDashboardSnapshot };

export interface CommandCenterData extends RealDashboardSnapshot {
  operationalActions: OperationalAction[];
  operationalQueues: ReturnType<typeof computeOperationalQueues>;
}

function buildFromSnapshot(snapshot: RealDashboardSnapshot, projects: Project[]): CommandCenterData {
  return {
    ...snapshot,
    operationalActions: computeOperationalActions(
      projects,
      snapshot.research.totalDocuments,
      snapshot.experiments.total,
      snapshot.funding.totalPitches
    ),
    operationalQueues: computeOperationalQueues(projects),
  };
}

const EMPTY_SNAPSHOT: RealDashboardSnapshot = {
  projectCount: 0,
  stageCounts: {
    Idea: 0,
    Research: 0,
    Prototype: 0,
    Experiment: 0,
    Validation: 0,
    Funding: 0,
    Commercialization: 0,
  },
  research: { totalDocuments: 0, researchTaggedCount: 0, recentDocuments: [] },
  experiments: { total: 0, running: 0, completed: 0 },
  funding: { totalPitches: 0, recentPitches: [] },
  team: { memberCount: 0, members: [], pendingInvitations: 0 },
  vault: {
    vaultEntries: 0,
    vaultItems: 0,
    protectedIdeas: 0,
    ownershipRecords: 0,
    patentCandidates: 0,
  },
  timeline: [],
};

export function useInnovationCommandCenter(userId: string, projects: Project[]) {
  const projectKey = useMemo(
    () => projects.map((p) => p.id).sort().join(','),
    [projects]
  );

  const derived = useMemo(
    () => buildFromSnapshot({ ...EMPTY_SNAPSHOT, projectCount: projects.length }, projects),
    [projects]
  );
  const [data, setData] = useState<CommandCenterData>(derived);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setData(derived);
  }, [derived]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const snapshot = await fetchRealDashboardSnapshot(userId, projects);
        if (!cancelled) setData(buildFromSnapshot(snapshot, projects));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, projectKey, projects]);

  return { data, loading };
}
