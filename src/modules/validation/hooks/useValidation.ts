import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validationService } from '../services/validationService';
import type {
  ValidationDashboardStats,
  ValidationDecision,
  ValidationRecord,
} from '../types/validation.types';
import type { Project } from '../../../types/project.types';

export function useValidationList(userId: string | undefined) {
  const [records, setRecords] = useState<ValidationRecord[]>([]);
  const [stats, setStats] = useState<ValidationDashboardStats>({
    total: 0,
    pass: 0,
    hold: 0,
    fail: 0,
    pending: 0,
    avgReadiness: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setRecords([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await validationService.listValidations(userId);
      setRecords(list);
      setStats(validationService.computeDashboardStats(list));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load validations');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { records, stats, loading, error, refresh };
}

export function useValidationDetail(validationId: string | undefined, userId: string | undefined) {
  const navigate = useNavigate();
  const [record, setRecord] = useState<ValidationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promoting, setPromoting] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId || !validationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await validationService.getValidation(validationId, userId);
      setRecord(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load validation');
    } finally {
      setLoading(false);
    }
  }, [validationId, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setDecision = useCallback(
    async (decision: ValidationDecision, notes?: string) => {
      if (!userId || !validationId) return;
      const updated = await validationService.updateValidationDecision(validationId, userId, decision, notes);
      setRecord(updated);
    },
    [validationId, userId]
  );

  const promote = useCallback(async () => {
    if (!userId || !validationId) return;
    setPromoting(true);
    setError(null);
    try {
      const { projectId } = await validationService.promoteToFunding(validationId, userId);
      navigate(`/funding/create?projectId=${projectId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Promotion failed');
    } finally {
      setPromoting(false);
    }
  }, [navigate, validationId, userId]);

  return { record, loading, error, promoting, refresh, setDecision, promote };
}

export function useCreateValidation(userId: string | undefined) {
  const navigate = useNavigate();
  const [eligible, setEligible] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    validationService
      .listEligibleProjects(userId)
      .then(setEligible)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load projects'))
      .finally(() => setLoading(false));
  }, [userId]);

  const create = useCallback(
    async (projectId: string) => {
      if (!userId) return;
      setSubmitting(true);
      setError(null);
      try {
        const record = await validationService.createValidation(projectId, userId);
        navigate(`/validation/${record.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create validation');
      } finally {
        setSubmitting(false);
      }
    },
    [navigate, userId]
  );

  return { eligible, loading, submitting, error, create };
}
