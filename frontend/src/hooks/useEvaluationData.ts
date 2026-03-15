import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../lib/apiClient';
import type { EvaluationData, EvaluationHistoryEntry } from '../types/evaluation';

interface UseEvaluationDataOptions {
  activeView: string;
  onReportLoaded?: () => void;
  onError?: (message: string) => void;
}

export function useEvaluationData({ activeView, onReportLoaded, onError }: UseEvaluationDataOptions) {
  const [data, setData] = useState<EvaluationData | null>(null);
  const [history, setHistory] = useState<EvaluationHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const items = await apiFetch<EvaluationHistoryEntry[]>('/evaluations');
      setHistory(items);
      setHasLoadedHistory(true);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load evaluation history.';
      console.error('Failed to fetch history', err);
      onError?.(msg);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [onError]);

  useEffect(() => {
    if (activeView !== 'history') return;
    if (hasLoadedHistory) return;
    fetchHistory();
  }, [activeView, hasLoadedHistory, fetchHistory]);

  useEffect(() => {
    const fetchData = async () => {
      const [latestResult, histResult] = await Promise.allSettled([
        apiFetch<EvaluationData>('/latest'),
        apiFetch<EvaluationHistoryEntry[]>('/evaluations'),
      ]);

      if (latestResult.status === 'fulfilled') {
        setData(latestResult.value);
      }
      if (histResult.status === 'fulfilled') {
        setHistory(histResult.value);
        setHasLoadedHistory(true);
      } else {
        console.error('Connectivity issue with backend engine.', histResult.reason);
      }
    };
    fetchData();
  }, []);

  const loadReport = useCallback(
    async (runId: string) => {
      setIsLoadingReport(true);
      try {
        const fullData = await apiFetch<EvaluationData>(`/evaluations/${runId}`);
        setData(fullData);
        onReportLoaded?.();
      } catch (error) {
        console.error('Error loading report:', error);
        const msg = error instanceof ApiError ? error.message : 'Error connecting to server.';
        onError?.(msg);
      } finally {
        setIsLoadingReport(false);
      }
    },
    [onError, onReportLoaded]
  );

  return {
    data,
    setData,
    history,
    setHistory,
    isLoadingHistory,
    isLoadingReport,
    loadReport,
  };
}
