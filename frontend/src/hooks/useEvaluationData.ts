import { useCallback, useEffect, useState } from 'react';
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

  useEffect(() => {
    if (activeView !== 'history') return;
    setIsLoadingHistory(true);
    fetch('http://localhost:8000/evaluations')
      .then((res) => res.json())
      .then((items) => {
        setHistory(items);
        setIsLoadingHistory(false);
      })
      .catch((err) => {
        console.error('Failed to fetch history', err);
        setIsLoadingHistory(false);
      });
  }, [activeView]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [latestRes, historyRes] = await Promise.all([
          fetch('http://localhost:8000/latest'),
          fetch('http://localhost:8000/evaluations'),
        ]);

        if (latestRes.ok) {
          const latest = await latestRes.json();
          setData(latest);
        }
        if (historyRes.ok) {
          const hist = await historyRes.json();
          setHistory(hist);
        }
      } catch {
        console.error('Connectivity issue with backend engine.');
      }
    };
    fetchData();
  }, []);

  const loadReport = useCallback(
    async (runId: string) => {
      setIsLoadingReport(true);
      try {
        const res = await fetch(`http://localhost:8000/evaluations/${runId}`);
        if (!res.ok) {
          onError?.('Failed to load report details.');
          return;
        }
        const fullData = await res.json();
        setData(fullData);
        onReportLoaded?.();
      } catch (error) {
        console.error('Error loading report:', error);
        onError?.('Error connecting to server.');
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
