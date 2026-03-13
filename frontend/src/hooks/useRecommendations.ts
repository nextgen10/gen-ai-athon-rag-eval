import { useCallback, useEffect, useRef, useState } from 'react';
import { toNumber } from '../lib/number';
import type { DrilldownRow } from '../types/evaluation';

interface ThresholdConfig {
  faithfulnessEnabled: boolean;
  answerRelevancyEnabled: boolean;
  answerCorrectnessEnabled: boolean;
  contextRecallEnabled: boolean;
  contextPrecisionEnabled: boolean;
  faithfulnessThreshold: number;
  answerRelevancyThreshold: number;
  answerCorrectnessThreshold: number;
  contextRecallThreshold: number;
  contextPrecisionThreshold: number;
  rqsThreshold: number;
}

interface UseRecommendationsOptions {
  activeView: string;
  dataId?: string;
  drilldownRows: DrilldownRow[];
  thresholds: ThresholdConfig;
}

export function useRecommendations({ activeView, dataId, drilldownRows, thresholds }: UseRecommendationsOptions) {
  const [recommendationByKey, setRecommendationByKey] = useState<Record<string, string>>({});
  const [recommendationLoadingByKey, setRecommendationLoadingByKey] = useState<Record<string, boolean>>({});
  const [recommendationDetailOpen, setRecommendationDetailOpen] = useState(false);
  const [recommendationDetailText, setRecommendationDetailText] = useState('');
  const [recommendationDetailRow, setRecommendationDetailRow] = useState('');
  const inFlightKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setRecommendationByKey({});
    setRecommendationLoadingByKey({});
  }, [
    dataId,
    thresholds.faithfulnessEnabled,
    thresholds.answerRelevancyEnabled,
    thresholds.answerCorrectnessEnabled,
    thresholds.contextRecallEnabled,
    thresholds.contextPrecisionEnabled,
    thresholds.faithfulnessThreshold,
    thresholds.answerRelevancyThreshold,
    thresholds.answerCorrectnessThreshold,
    thresholds.contextRecallThreshold,
    thresholds.contextPrecisionThreshold,
    thresholds.rqsThreshold,
  ]);

  const requestRecommendationForRow = useCallback(
    async (row: DrilldownRow) => {
      const safeVal = (v: unknown) => toNumber(v);
      const isBelowAnyThreshold =
        (thresholds.faithfulnessEnabled && safeVal(row.metrics.faithfulness) < thresholds.faithfulnessThreshold) ||
        (thresholds.answerRelevancyEnabled && safeVal(row.metrics.answer_relevancy) < thresholds.answerRelevancyThreshold) ||
        (thresholds.answerCorrectnessEnabled && safeVal(row.metrics.semantic_similarity) < thresholds.answerCorrectnessThreshold) ||
        (thresholds.contextRecallEnabled && safeVal(row.metrics.context_recall) < thresholds.contextRecallThreshold) ||
        (thresholds.contextPrecisionEnabled && safeVal(row.metrics.context_precision) < thresholds.contextPrecisionThreshold) ||
        safeVal(row.metrics.rqs) < thresholds.rqsThreshold;

      // Token guard: skip generation when all scored metrics are above threshold.
      if (!isBelowAnyThreshold) {
        return '';
      }

      if (inFlightKeysRef.current.has(row.key)) {
        return recommendationByKey[row.key] || '';
      }

      inFlightKeysRef.current.add(row.key);
      setRecommendationLoadingByKey((prev) => ({ ...prev, [row.key]: true }));

      try {
        const contextRaw = row.testCase.bot_contexts?.[row.bot];
        const context = Array.isArray(contextRaw) ? contextRaw.join('\n') : contextRaw || '';
        const response = await fetch('http://localhost:8000/recommendation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: row.testCase.query || '',
            answer: row.testCase.bot_responses?.[row.bot] || '',
            ground_truth: row.testCase.ground_truth || '',
            context,
            scores: {
              faithfulness: safeVal(row.metrics.faithfulness),
              hallucination: 1 - safeVal(row.metrics.faithfulness),
              answer_relevancy: safeVal(row.metrics.answer_relevancy),
              answer_correctness: safeVal(row.metrics.semantic_similarity),
              context_recall: safeVal(row.metrics.context_recall),
              context_precision: safeVal(row.metrics.context_precision),
              toxicity: safeVal(row.metrics.toxicity),
              rqs: safeVal(row.metrics.rqs),
            },
            thresholds: {
              faithfulness: thresholds.faithfulnessThreshold,
              answer_relevancy: thresholds.answerRelevancyThreshold,
              answer_correctness: thresholds.answerCorrectnessThreshold,
              context_recall: thresholds.contextRecallThreshold,
              context_precision: thresholds.contextPrecisionThreshold,
              rqs: thresholds.rqsThreshold,
            },
          }),
        });

        const payload = await response.json();
        const recommendation =
          response.ok && payload?.recommendation
            ? payload.recommendation
            : 'Unable to generate recommendation for this row.';

        setRecommendationByKey((prev) => ({ ...prev, [row.key]: recommendation }));
        return recommendation;
      } catch {
        const fallback = 'Recommendation service unavailable; review low metrics and retrieval grounding.';
        setRecommendationByKey((prev) => ({ ...prev, [row.key]: fallback }));
        return fallback;
      } finally {
        inFlightKeysRef.current.delete(row.key);
        setRecommendationLoadingByKey((prev) => ({ ...prev, [row.key]: false }));
      }
    },
    [
      recommendationByKey,
      thresholds.faithfulnessEnabled,
      thresholds.answerRelevancyEnabled,
      thresholds.answerCorrectnessEnabled,
      thresholds.contextRecallEnabled,
      thresholds.contextPrecisionEnabled,
      thresholds.faithfulnessThreshold,
      thresholds.answerRelevancyThreshold,
      thresholds.answerCorrectnessThreshold,
      thresholds.contextRecallThreshold,
      thresholds.contextPrecisionThreshold,
      thresholds.rqsThreshold,
    ]
  );

  useEffect(() => {
    if (activeView !== 'drilldown' || drilldownRows.length === 0) return;
    const pendingRows = drilldownRows.filter((row) => {
      const isBelowAnyThreshold =
        (thresholds.faithfulnessEnabled && toNumber(row.metrics.faithfulness) < thresholds.faithfulnessThreshold) ||
        (thresholds.answerRelevancyEnabled && toNumber(row.metrics.answer_relevancy) < thresholds.answerRelevancyThreshold) ||
        (thresholds.answerCorrectnessEnabled && toNumber(row.metrics.semantic_similarity) < thresholds.answerCorrectnessThreshold) ||
        (thresholds.contextRecallEnabled && toNumber(row.metrics.context_recall) < thresholds.contextRecallThreshold) ||
        (thresholds.contextPrecisionEnabled && toNumber(row.metrics.context_precision) < thresholds.contextPrecisionThreshold) ||
        toNumber(row.metrics.rqs) < thresholds.rqsThreshold;
      return isBelowAnyThreshold && !recommendationByKey[row.key] && !recommendationLoadingByKey[row.key];
    });
    if (pendingRows.length === 0) return;

    const rowsToFetch = pendingRows.slice(0, 8);
    Promise.all(rowsToFetch.map((row) => requestRecommendationForRow(row)));
  }, [activeView, drilldownRows, recommendationByKey, recommendationLoadingByKey, requestRecommendationForRow]);

  const openRecommendationDetail = (text: string, rowLabel: string) => {
    setRecommendationDetailText(text);
    setRecommendationDetailRow(rowLabel);
    setRecommendationDetailOpen(true);
  };

  return {
    recommendationByKey,
    recommendationLoadingByKey,
    recommendationDetailOpen,
    recommendationDetailText,
    recommendationDetailRow,
    setRecommendationDetailOpen,
    requestRecommendationForRow,
    openRecommendationDetail,
  };
}
