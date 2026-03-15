export interface ConfigState {
  faithfulnessEnabled: boolean;
  answerRelevancyEnabled: boolean;
  answerCorrectnessEnabled: boolean;
  contextRecallEnabled: boolean;
  contextPrecisionEnabled: boolean;
  toxicityEnabled: boolean;
  faithfulnessThreshold: number;
  answerRelevancyThreshold: number;
  answerCorrectnessThreshold: number;
  contextRecallThreshold: number;
  contextPrecisionThreshold: number;
  rqsThreshold: number;
  exportFormat: 'PDF' | 'Excel' | 'CSV' | 'JSON';
  alpha: number;
  beta: number;
  gamma: number;
  temperature: number;
  maxRows: number;
}

export interface BotMetric {
  faithfulness?: number | string;
  answer_relevancy?: number | string;
  answer_correctness?: number | string;
  semantic_similarity?: number | string;
  context_recall?: number | string;
  context_precision?: number | string;
  toxicity?: number | string;
  rqs?: number | string;
  total_tokens?: number | string;
}

export interface TestCaseData {
  id: string;
  query?: string;
  ground_truth?: string;
  bot_responses?: Record<string, string>;
  bot_contexts?: Record<string, string[] | string>;
}

export interface EvaluationSummaryEntry {
  avg_rqs?: number | string;
  gt_alignment?: number | string;
  retrieval_success?: number | string;
  avg_faithfulness?: number | string;
  avg_relevancy?: number | string;
  avg_context_precision?: number | string;
  avg_toxicity?: number | string;
  avg_latency?: number | string;
  avg_tokens?: number | string;
  [key: string]: unknown;
}

export interface LeaderboardRow {
  bot_id?: string;
  avg_rqs?: number | string;
  [key: string]: unknown;
}

export interface ConfusionMatrixEntry {
  matrix: { TP: number; FP: number; FN: number; TN: number };
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
  pass_rates: Record<string, number>;
  total_cases: number;
  measured_cases: number;
  skipped_no_gt: number;
  thresholds: { context_recall: number; answer_correctness: number };
}

export interface EvaluationData {
  id: string;
  name?: string;
  winner?: string | null;
  config?: Partial<ConfigState>;
  test_cases: TestCaseData[];
  bot_metrics: Record<string, Record<string, BotMetric>>;
  summaries: Record<string, EvaluationSummaryEntry>;
  leaderboard: LeaderboardRow[];
  confusion_matrix?: Record<string, ConfusionMatrixEntry>;
}

export interface EvaluationHistoryEntry {
  id: string;
  name: string;
  winner?: string | null;
  total_test_cases?: number;
  timestamp?: string;
  summaries?: Record<string, EvaluationSummaryEntry>;
}

export interface DrilldownRow {
  key: string;
  testCase: TestCaseData;
  bot: string;
  metrics: BotMetric;
}
