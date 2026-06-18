import { useCallback, useEffect, useMemo, useState } from 'react';
import { canAuthorizePrototype, evaluateGate } from '../ai/gateEngine';
import { gateService } from '../services/gateService';
import type { GateCheckItem, GateDecision, GateReviewRecord } from '../types/gate.types';
import type { ProjectResearchSnapshot } from '../types/research.types';

export function useGateApproval(
  projectId: string | undefined,
  userId: string | undefined,
  snapshot: ProjectResearchSnapshot | null
) {
  const [record, setRecord] = useState<GateReviewRecord | null>(null);
  const [sectionC, setSectionC] = useState<GateCheckItem[]>([]);
  const [decision, setDecision] = useState<GateDecision>('pending');
  const [v1Scope, setV1Scope] = useState('');
  const [outOfScope, setOutOfScope] = useState('');
  const [openRisks, setOpenRisks] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluation = useMemo(
    () => (snapshot ? evaluateGate(snapshot) : null),
    [snapshot]
  );

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const latest = await gateService.getLatest(projectId);
      setRecord(latest);
      if (latest) {
        setSectionC(latest.section_c);
        setDecision(latest.decision);
        setV1Scope(latest.v1_scope ?? '');
        setOutOfScope(latest.out_of_scope ?? '');
        setOpenRisks(latest.open_risks ?? '');
        setReviewerName(latest.reviewer_name ?? '');
      } else if (evaluation) {
        setSectionC(evaluation.sectionC);
        setDecision(evaluation.recommendedDecision);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load gate review');
    } finally {
      setLoading(false);
    }
  }, [projectId, evaluation]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!record && evaluation && sectionC.length === 0) {
      setSectionC(evaluation.sectionC);
      setDecision(evaluation.recommendedDecision);
    }
  }, [record, evaluation, sectionC.length]);

  const toggleSectionC = useCallback((id: string) => {
    setSectionC((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === 'pass' ? 'pending' : 'pass' }
          : c
      )
    );
  }, []);

  const confirmAllSectionC = useCallback(() => {
    setSectionC((prev) => prev.map((c) => ({ ...c, status: 'pass' as const })));
  }, []);

  const resetSectionC = useCallback(() => {
    setSectionC((prev) => prev.map((c) => ({ ...c, status: 'pending' as const })));
  }, []);

  const submitReview = useCallback(async () => {
    if (!projectId || !userId || !evaluation) return false;
    if (!reviewerName.trim()) {
      setError('Reviewer name is required for gate approval.');
      return false;
    }
    if (canAuthorizePrototype(decision) && !v1Scope.trim()) {
      setError('Approved V1 scope is required for GO or Conditional GO.');
      return false;
    }
    setSaving(true);
    try {
      const saved = await gateService.submit(projectId, userId, evaluation, {
        sectionB: evaluation.sectionB,
        sectionC,
        decision,
        v1Scope,
        outOfScope,
        openRisks,
        reviewerName,
      });
      setRecord(saved);
      setError(null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save gate review');
      return false;
    } finally {
      setSaving(false);
    }
  }, [projectId, userId, evaluation, sectionC, decision, v1Scope, outOfScope, openRisks, reviewerName]);

  const prototypeAuthorized = canAuthorizePrototype(record?.decision ?? decision);

  return {
    evaluation,
    record,
    sectionC,
    decision,
    v1Scope,
    outOfScope,
    openRisks,
    reviewerName,
    loading,
    saving,
    error,
    setDecision,
    setV1Scope,
    setOutOfScope,
    setOpenRisks,
    setReviewerName,
    toggleSectionC,
    confirmAllSectionC,
    resetSectionC,
    submitReview,
    prototypeAuthorized,
    refresh: load,
  };
}
