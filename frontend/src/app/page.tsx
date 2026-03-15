"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  IconButton,
  ThemeProvider,
  CssBaseline,
  CircularProgress,
  Avatar,
  Stack,
  Tooltip,
  alpha,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  LayoutDashboard,
  History,
  Layers,
  Settings,
  UploadCloud,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ChevronRight,
  Search,
  ArrowUpRight,
  Cpu,
  ShieldCheck,
  AlignLeft,
  Target,
  Download,
  Info,
  Sun,
  Moon
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { getCustomTheme } from '../theme/dashboardTheme';
import { toNumber } from '../lib/number';
import type {
  ConfigState,
  DrilldownRow,
  TestCaseData,
} from '../types/evaluation';
import { CustomTooltip } from '../components/Common/CustomTooltip';
import { useEvaluationData } from '../hooks/useEvaluationData';
import { useRecommendations } from '../hooks/useRecommendations';
import { API_BASE_URL } from '../lib/apiClient';

// --- Helper Components ---
import { GlassCard } from '../components/Dashboard/GlassCard';
import { PrintOnlyReport } from '../components/Reports/PrintOnlyReport';
import { PaginationControl } from '../components/Common/PaginationControl';
import { LandingPage as LandingPageView } from '../components/Landing/LandingPage';
import { HistoryView } from '../components/Views/HistoryView';
import { ExperimentsView } from '../components/Views/ExperimentsView';
import { ConfigurationView } from '../components/Views/ConfigurationView';
import { AboutView } from '../components/Views/AboutView';
import { ConfusionMatrixView } from '../components/Views/ConfusionMatrixView';
import { CompareEvaluationsDialog } from '../components/Dialogs/CompareEvaluationsDialog';
import { EvaluationProgressBackdrop } from '../components/Dialogs/EvaluationProgressBackdrop';
import { ReportLoadingBackdrop } from '../components/Dialogs/ReportLoadingBackdrop';
import { RecommendationDetailDialog } from '../components/Dialogs/RecommendationDetailDialog';
import { CognizantIcon } from '../components/Common/CognizantIcon';
import { ErrorBoundary } from '../components/Common/ErrorBoundary';
// --- Components ---
const MotionPaper = motion(Paper);



// --- Main Pages ---


// --- Landing Page ---
function LandingPage({ onEnter }: { onEnter: () => void }) {
  return <LandingPageView onEnter={onEnter} />;
}

function EnterpriseDashboardContent() {
  type ThresholdKey =
    | 'faithfulnessThreshold'
    | 'answerRelevancyThreshold'
    | 'answerCorrectnessThreshold'
    | 'contextRecallThreshold'
    | 'contextPrecisionThreshold'
    | 'rqsThreshold';
  type WeightKey = 'alpha' | 'beta' | 'gamma';
  const thresholdItems: Array<{ key: ThresholdKey; label: string }> = [
    { key: 'faithfulnessThreshold', label: 'Faithfulness' },
    { key: 'answerRelevancyThreshold', label: 'Answer Relevancy' },
    { key: 'answerCorrectnessThreshold', label: 'Answer Correctness' },
    { key: 'contextRecallThreshold', label: 'Context Recall' },
    { key: 'contextPrecisionThreshold', label: 'Context Precision' },
    { key: 'rqsThreshold', label: 'RQS' },
  ];
  const weightItems: Array<{ key: WeightKey; label: string }> = [
    { key: 'alpha', label: 'Alpha (Answer Correctness)' },
    { key: 'beta', label: 'Beta (Faithfulness)' },
    { key: 'gamma', label: 'Gamma (Answer Relevancy)' },
  ];

  // Initialize showLanding from localStorage, default to true for first-time visitors
  const [showLanding, setShowLanding] = useState(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('landingDismissed');
      return dismissed !== 'true';
    }
    return true;
  });
  const [config, setConfig] = useState<ConfigState>({
    faithfulnessEnabled: true,
    answerRelevancyEnabled: true,
    answerCorrectnessEnabled: true,
    contextRecallEnabled: true,
    contextPrecisionEnabled: true,
    toxicityEnabled: true,
    faithfulnessThreshold: 0.8,
    answerRelevancyThreshold: 0.8,
    answerCorrectnessThreshold: 0.8,
    contextRecallThreshold: 0.75,
    contextPrecisionThreshold: 0.75,
    rqsThreshold: 0.75,
    exportFormat: 'PDF',
    alpha: 0.4,
    beta: 0.3,
    gamma: 0.3,
    temperature: 0.0,
    maxRows: 200
  });
  const [isExporting, setIsExporting] = useState(false);
  const router = useRouter();
  const [activeView, setActiveView] = useState(() => {
    // Initialize from URL if available
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const viewFromUrl = params.get('view');
      if (viewFromUrl && ['insights', 'drilldown', 'history', 'about', 'config', 'confusion'].includes(viewFromUrl)) {
        return viewFromUrl;
      }
    }
    return 'insights';
  });
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  // Callback for SearchParamsHandler to update activeView
  const handleViewChangeFromUrl = useCallback((view: string) => {
    setActiveView(view);
  }, []);

  // Update URL when activeView changes
  const handleViewChange = (view: string) => {
    setActiveView(view);
    router.push(`/?view=${view}`, { scroll: false });
  };

  const theme = useMemo(() => getCustomTheme(themeMode), [themeMode]);

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };
  const [mounted, setMounted] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false); // Used for generic notifications
  const [snackbarMsg, setSnackbarMsg] = useState('');

  const {
    data,
    setData,
    history,
    setHistory,
    isLoadingHistory,
    isLoadingReport,
    loadReport,
  } = useEvaluationData({
    activeView,
    onReportLoaded: () => {
      setDrilldownPage(1);
      handleViewChange('insights');
    },
    onError: (message) => {
      setSnackbarMsg(message);
      setSaveSuccess(true);
    },
  });

  const effectiveConfig = useMemo(() => ({
    ...(data?.config || {}),
    ...config
  }), [config, data]);
  const isWeightConfigValid = useMemo(
    () => config.alpha + config.beta + config.gamma <= 1,
    [config.alpha, config.beta, config.gamma]
  );
  const handleApplySettings = useCallback(() => {
    if (!isWeightConfigValid) {
      setSnackbarMsg(`Invalid RQS weights: alpha + beta + gamma = ${(config.alpha + config.beta + config.gamma).toFixed(2)} (must be <= 1.00).`);
      setSaveSuccess(true);
      return;
    }
    setSnackbarMsg('Configuration updated (thresholds + RQS weights).');
    setSaveSuccess(true);
  }, [config.alpha, config.beta, config.gamma, isWeightConfigValid]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [statusLogs, setStatusLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEvaluating && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [statusLogs, isEvaluating]);

  // Pagination State
  const [historyPage, setHistoryPage] = useState(1);
  const [drilldownPage, setDrilldownPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Search State
  const [historySearch, setHistorySearch] = useState('');
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [showComparisonResults, setShowComparisonResults] = useState(false);
  const [compareEval1, setCompareEval1] = useState('');
  const [compareEval2, setCompareEval2] = useState('');
  const [drilldownSearch, setDrilldownSearch] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (data?.config) {
      setConfig((prev) => ({ ...prev, ...data.config }));
    }
  }, [data?.id, data?.config]);

  useEffect(() => {
    if (!data?.id) return;
    // Ensure latest run is shown without stale drilldown filters.
    setDrilldownSearch('');
    setDrilldownPage(1);
  }, [data?.id]);

  const filteredHistory = useMemo(() => {
    if (!historySearch) return history;
    const s = historySearch.toLowerCase();
    return history.filter(run =>
      run.name?.toLowerCase().includes(s) ||
      run.id?.toLowerCase().includes(s) ||
      run.winner?.toLowerCase().includes(s)
    );
  }, [history, historySearch]);

  const handleLoadReport = loadReport;

  const filteredTestCases = useMemo(() => {
    if (!data?.test_cases) return [];
    if (!drilldownSearch) return data.test_cases;
    const s = drilldownSearch.toLowerCase();
    return data.test_cases.filter((tc: TestCaseData) =>
      tc.query?.toLowerCase().includes(s) ||
      tc.ground_truth?.toLowerCase().includes(s) ||
      tc.id?.toString().toLowerCase().includes(s)
    );
  }, [data, drilldownSearch]);

  const drilldownRows = useMemo(() => {
    if (!data?.summaries) return [];
    const bots = Object.keys(data.summaries);
    const pageData = filteredTestCases.slice((drilldownPage - 1) * ITEMS_PER_PAGE, drilldownPage * ITEMS_PER_PAGE);
    return pageData.flatMap((testCase: TestCaseData) =>
      bots.map((bot) => ({
        key: `${testCase.id}-${bot}`,
        testCase,
        bot,
        metrics: data.bot_metrics?.[bot]?.[testCase.id] || {}
      }))
    ) as DrilldownRow[];
  }, [data, filteredTestCases, drilldownPage]);

  const {
    recommendationByKey,
    recommendationLoadingByKey,
    recommendationDetailOpen,
    recommendationDetailText,
    recommendationDetailRow,
    setRecommendationDetailOpen,
    requestRecommendationForRow,
    openRecommendationDetail,
  } = useRecommendations({
    activeView,
    dataId: data?.id,
    drilldownRows,
    thresholds: {
      faithfulnessEnabled: effectiveConfig.faithfulnessEnabled,
      answerRelevancyEnabled: effectiveConfig.answerRelevancyEnabled,
      answerCorrectnessEnabled: effectiveConfig.answerCorrectnessEnabled,
      contextRecallEnabled: effectiveConfig.contextRecallEnabled,
      contextPrecisionEnabled: effectiveConfig.contextPrecisionEnabled,
      faithfulnessThreshold: effectiveConfig.faithfulnessThreshold,
      answerRelevancyThreshold: effectiveConfig.answerRelevancyThreshold,
      answerCorrectnessThreshold: effectiveConfig.answerCorrectnessThreshold,
      contextRecallThreshold: effectiveConfig.contextRecallThreshold,
      contextPrecisionThreshold: effectiveConfig.contextPrecisionThreshold,
      rqsThreshold: effectiveConfig.rqsThreshold,
    },
  });

  const handleExport = async () => {
    if (!data) return;
    setIsExporting(true);
    setStatusLogs(prev => [...prev, `Initiating ${config.exportFormat} report generation...`]);

    // Simulate report collation
    await new Promise(resolve => setTimeout(resolve, 1500));
    setStatusLogs(prev => [...prev, `Collating metrics for ${leaderboardData.length} agents...`]);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const timestamp = new Date().toLocaleString('en-GB', { hour12: false }).replace(/[/, :]/g, '_');
    const fileName = `RAGEval_Report_${timestamp}`;

    if (config.exportFormat === 'JSON') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.json`;
      link.click();
    } else if (config.exportFormat === 'Excel') {
      const s = (v: unknown) => toNumber(v);

      // 0. Production Intelligence Sheet (Top Insights)
      const insightHeaders = ['METRIC', 'VALUE', 'CONTEXT'];
      const winner = leaderboardData[0] || {};
      const insightRows = [
        ['TOP_ARCHITECT', winner.id, `MASTER_RQS: ${s(winner.avg_rqs).toFixed(3)}`],
        ['MAX_ANSWER_CORRECTNESS', `${(s(winner.gt_alignment) * 100).toFixed(1)}%`, 'Ground Truth Match'],
        ['TOP_FAITHFULNESS', `${(s(winner.avg_faithfulness) * 100).toFixed(1)}%`, 'Logical Integrity'],
        ['CONTEXT_PRECISION', `${(s(winner.avg_context_precision) * 100).toFixed(1)}%`, 'Information S/N'],
        ['RETRIEVAL_COVERAGE', `${(s(winner.retrieval_success) * 100).toFixed(1)}%`, 'Knowledge Recall'],
        ['HALLUCINATION_RATE', `${((1 - s(winner.avg_faithfulness)) * 100).toFixed(1)}%`, 'Safety Risk'],
        ['TOTAL_TEST_CASES', data.test_cases.length, 'Evaluation Volume']
      ];

      // 1. Summary Sheet (Flattened)
      const summaryHeaders = ['RANK', 'BOT_ID', 'MASTER_RQS', 'ANSWER_CORRECTNESS', 'FAITHFULNESS', 'RELEVANCY', 'CONTEXT_PRECISION', 'RETRIEVAL_SUCCESS'];
      const summaryRows = leaderboardData.map(row => {
        const s = (v: unknown) => toNumber(v);
        return [
          row.rank,
          row.id,
          s(row.avg_rqs).toFixed(3),
          (s(row.gt_alignment) * 100).toFixed(1),
          (s(row.avg_faithfulness) * 100).toFixed(1),
          (s(row.avg_relevancy) * 100).toFixed(1),
          (s(row.avg_context_precision) * 100).toFixed(1),
          (s(row.retrieval_success) * 100).toFixed(1)
        ];
      });

      // 2. Detailed Metrics Sheet (Flattened for analysis)
      const detailHeaders = ['TEST_CASE_ID', 'QUERY', 'GROUND_TRUTH', 'BOT_ID', 'RESPONSE', 'FAITHFULNESS', 'RELEVANCY', 'CONTEXT_PRECISION', 'CONTEXT_RECALL', 'ANSWER_CORRECTNESS', 'RQS'];
      const detailRows: Array<Array<string | number>> = [];

      data.test_cases.forEach((tc: TestCaseData) => {
        Object.keys(data.summaries).forEach(botId => {
          const m = data.bot_metrics[botId]?.[tc.id] || {};
          const response = (tc.bot_responses?.[botId] || "").replace(/"/g, '""');
          const gt = (tc.ground_truth || "").replace(/"/g, '""');
          const s = (v: unknown) => toNumber(v);
          detailRows.push([
            tc.id,
            `"${(tc.query || '').replace(/"/g, '""')}"`,
            `"${gt}"`,
            botId,
            `"${response}"`,
            s(m.faithfulness).toFixed(3),
            s(m.answer_relevancy).toFixed(3),
            s(m.context_precision).toFixed(3),
            s(m.context_recall).toFixed(3),
            s(m.semantic_similarity).toFixed(3),
            s(m.rqs).toFixed(3)
          ]);
        });
      });

      const csvContent =
        "--- PRODUCTION INTELLIGENCE (TOP INSIGHTS) ---\n" +
        insightHeaders.join(",") + "\n" +
        insightRows.map(e => e.join(",")).join("\n") +
        "\n\n--- COMPARISON LEADERBOARD (SUMMARY) ---\n" +
        summaryHeaders.join(",") + "\n" +
        summaryRows.map(e => e.join(",")).join("\n") +
        "\n\n--- DETAILED TRANSACTIONAL METRICS ---\n" +
        detailHeaders.join(",") + "\n" +
        detailRows.map(e => e.join(",")).join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.csv`;
      link.click();
    } else if (config.exportFormat === 'PDF') {
      const originalTitle = document.title;
      document.title = fileName;
      window.print();
      document.title = originalTitle;
    }

    setIsExporting(false);
    setSnackbarMsg(`${config.exportFormat} Report successfully generated.`);
    setSaveSuccess(true);
  };



  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const totalWeight = config.alpha + config.beta + config.gamma;
    if (totalWeight > 1) {
      e.target.value = '';
      setSnackbarMsg(`Invalid RQS weights: alpha + beta + gamma = ${totalWeight.toFixed(2)} (must be <= 1.00).`);
      setSaveSuccess(true);
      return;
    }

    // Reset input value so the same file can be uploaded again without refresh
    e.target.value = '';

    setIsEvaluating(true);
    setStatusLogs([
      `⚡ [ENGINE] Initializing Parallel Inference Pipeline...`,
      `📁 [FS] Mounting dataset: ${file.name}`,
      `[LLM] Default deployment from .env active. Warming up scoring engine...`
    ]);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("alpha", config.alpha.toString());
    formData.append("beta", config.beta.toString());
    formData.append("gamma", config.gamma.toString());
    formData.append("temperature", config.temperature.toString());
    formData.append("max_rows", config.maxRows.toString());
    formData.append("faithfulness_enabled", String(config.faithfulnessEnabled));
    formData.append("answer_relevancy_enabled", String(config.answerRelevancyEnabled));
    formData.append("answer_correctness_enabled", String(config.answerCorrectnessEnabled));
    formData.append("context_recall_enabled", String(config.contextRecallEnabled));
    formData.append("context_precision_enabled", String(config.contextPrecisionEnabled));
    formData.append("toxicity_enabled", String(config.toxicityEnabled));
    formData.append("faithfulness_threshold", config.faithfulnessThreshold.toString());
    formData.append("answer_relevancy_threshold", config.answerRelevancyThreshold.toString());
    formData.append("answer_correctness_threshold", config.answerCorrectnessThreshold.toString());
    formData.append("context_recall_threshold", config.contextRecallThreshold.toString());
    formData.append("context_precision_threshold", config.contextPrecisionThreshold.toString());
    formData.append("rqs_threshold", config.rqsThreshold.toString());

    let statusTicker: ReturnType<typeof setInterval> | null = null;
    try {
      const messages = [
        `[GPU] Computing metric scores in parallel...`,
        `[JUDGE] Cross-referencing latent space alignment...`,
        `[IO] Writing evaluation metrics to local buffer...`,
        `[SYSTEM] Optimization pass ${Math.floor(Math.random() * 5)} active...`,
        `[RAG] Recalculating Context Precision for Bot B...`,
        `[AUTH] Synchronizing cloud inference tokens...`
      ];

      statusTicker = setInterval(() => {
        const msg = messages[Math.floor(Math.random() * messages.length)];
        setStatusLogs(prev => [...prev, msg]);
      }, 1500);

      const response = await fetch(`${API_BASE_URL}/evaluate-excel`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errDetail = await response.json().catch(() => ({ detail: "Backend Protocol Failure" }));
        throw new Error(errDetail.detail || "Evaluation Failed");
      }

      const sessionData = await response.json();
      setData(sessionData);
      setDrilldownPage(1);
      setStatusLogs(prev => [...prev, "✨ [SUCCESS] Full evaluation synchronized. Matrix data outputted to internal DB."]);

      // Refresh history to show the new evaluation
      fetch(`${API_BASE_URL}/evaluations`)
        .then(res => res.json())
        .then(data => setHistory(data))
        .catch(err => console.error("Failed to refresh history", err));

      setTimeout(() => setIsEvaluating(false), 1200);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setStatusLogs(prev => [...prev, `🛑 [CRITICAL] pipeline failed: ${errorMessage}`]);
      setTimeout(() => setIsEvaluating(false), 3000);
    } finally {
      if (statusTicker) {
        clearInterval(statusTicker);
      }
    }
  };

  const leaderboardData = useMemo(() => {
    if (!data?.summaries) return [];
    return Object.keys(data.summaries).map(id => {
      const s = data.summaries[id];
      const safe = (v: unknown) => toNumber(v);
      return {
        id,
        ...s,
        avg_rqs: safe(s.avg_rqs),
        gt_alignment: safe(s.gt_alignment),
        avg_faithfulness: safe(s.avg_faithfulness),
        avg_relevancy: safe(s.avg_relevancy),
        avg_context_precision: safe(s.avg_context_precision),
        retrieval_success: safe(s.retrieval_success),
        rank: 0
      };
    }).sort((a, b) => b.avg_rqs - a.avg_rqs).map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [data]);

  const winner = leaderboardData.length > 0 ? leaderboardData[0] : null;

  const chartData = useMemo(() => {
    if (!data?.summaries || leaderboardData.length === 0) return [];
    return leaderboardData.map(d => ({
      name: d.id,
      RQS: Number(((d.avg_rqs || 0) * 100).toFixed(1)),
      AnswerCorrectness: Number(((d.gt_alignment || 0) * 100).toFixed(1)),
      Faithfulness: Number(((d.avg_faithfulness || 0) * 100).toFixed(1)),
      Relevancy: Number(((d.avg_relevancy || 0) * 100).toFixed(1)),
      Precision: Number(((d.avg_context_precision || 0) * 100).toFixed(1)),
      Recall: Number(((d.retrieval_success || 0) * 100).toFixed(1))
    }));
  }, [leaderboardData, data]);

  const trends = useMemo(() => {
    // Early return if no winner or insufficient history
    if (!winner || !history || history.length < 1) return {};

    // Find the most recent run that isn't the current one
    const prevRun = history.find(h => h.id !== data?.id);
    if (!prevRun || !prevRun.summaries) return {};

    const prevWinnerId = prevRun.winner || Object.keys(prevRun.summaries)[0];
    const p = prevRun.summaries[prevWinnerId];
    if (!p) return {};

    const calc = (curr: number, prev: number) => {
      // Handle undefined, null, or zero values
      if (prev === 0) return null;
      const diff = ((curr - prev) / prev) * 100;
      return (diff >= 0 ? "+" : "") + diff.toFixed(1) + "%";
    };

    return {
      rqs: calc(toNumber(winner.avg_rqs), toNumber(p.avg_rqs)),
      correctness: calc(toNumber(winner.gt_alignment), toNumber(p.gt_alignment)),
      faithfulness: calc(toNumber(winner.avg_faithfulness), toNumber(p.avg_faithfulness)),
      relevancy: calc(toNumber(winner.avg_relevancy), toNumber(p.avg_relevancy)),
      precision: calc(toNumber(winner.avg_context_precision), toNumber(p.avg_context_precision)),
      recall: calc(toNumber(winner.retrieval_success), toNumber(p.retrieval_success)),
    };
  }, [history, data, winner]);

  if (!mounted) return null;
  if (showLanding) return (
    <ThemeProvider theme={getCustomTheme('dark')}>
      <LandingPage onEnter={() => {
        setShowLanding(false);
        localStorage.setItem('landingDismissed', 'true');
      }} />
    </ThemeProvider>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <>
        {/* Search params handler wrapped in Suspense */}
        <Suspense fallback={null}>
          <SearchParamsHandler onViewChange={handleViewChangeFromUrl} />
        </Suspense>
        <Box className="main-ui-container" sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', bgcolor: 'background.default', color: 'text.primary' }}>

          {/* Top Navigation Bar */}
          <Box sx={{
            flexShrink: 0,
            mx: { xs: 1, md: 3 },
            mt: { xs: 1, md: 3 },
            mb: 1,
            zIndex: 1200,
            px: { xs: 2, md: 3 },
            py: { xs: 1.5, md: 0 },
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 2, lg: 0 },
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            background: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(28, 28, 30, 0.88)'
              : 'rgba(255, 255, 255, 0.88)',
            borderRadius: { xs: 4, md: 6 },
            border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(60,60,67,0.12)',
            boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 24px rgba(0,0,0,0.6)' : '0 2px 16px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            minHeight: { xs: 'auto', md: 80 },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: { xs: 4, md: 6 },
              padding: '1px',
              background: (theme) => theme.palette.mode === 'dark'
                ? 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.12), rgba(255,255,255,0.04))'
                : 'linear-gradient(90deg, rgba(0,0,0,0.03), rgba(0,0,0,0.08), rgba(0,0,0,0.03))',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              WebkitMaskComposite: 'destination-out',
              pointerEvents: 'none'
            }
          }}>
            {/* Brand Logo (Left Sector) */}
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <Box
                onClick={() => setShowLanding(true)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  background: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,122,255,0.08)' : 'rgba(0,122,255,0.06)',
                  border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(60,60,67,0.12)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: (theme) => theme.palette.mode === 'dark' ? 'rgba(10,132,255,0.15)' : 'rgba(0,122,255,0.1)',
                    border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(10,132,255,0.4)' : '1px solid rgba(0,122,255,0.3)',
                    transform: 'none',
                    boxShadow: 'none',
                  }
                }}
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <CognizantIcon size={24} color={themeMode === 'dark' ? '#0A84FF' : '#007AFF'} strokeWidth={2} />
                </motion.div>
                <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', color: 'text.primary' }}>
                  RAG <span style={{ color: themeMode === 'dark' ? '#0A84FF' : '#007AFF' }}>EVAL</span>
                </Typography>
              </Box>
            </Box>

            {/* Center Navigation */}
            <Box className="nav-container" sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 0.5,
              p: 0.75,
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.35)' : 'rgba(120,120,128,0.1)',
              borderRadius: { xs: 4, md: 99 },
              border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(60,60,67,0.1)',
              boxShadow: 'none'
            }}>
              {[
                { id: 'insights', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
                { id: 'drilldown', label: 'Experiments', icon: <Activity size={16} /> },
                { id: 'confusion', label: 'Confusion Matrix', icon: <Grid size={16} /> },
                { id: 'history', label: 'History', icon: <History size={16} /> },
                { id: 'config', label: 'Configuration', icon: <Settings size={16} /> },
                { id: 'about', label: 'About', icon: <Info size={16} /> },
              ].map((item) => (
                <Button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  startIcon={item.icon}
                  sx={{
                    px: { xs: 1, sm: 1.5, md: 2.2 },
                    py: 0.7,
                    borderRadius: 99,
                    fontSize: { xs: '0.7rem', md: '0.8rem' },
                    color: activeView === item.id
                      ? (themeMode === 'dark' ? '#fff' : '#007AFF')
                      : (themeMode === 'dark' ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)'),
                    bgcolor: activeView === item.id
                      ? (themeMode === 'dark' ? 'rgba(10,132,255,0.2)' : 'rgba(0,122,255,0.1)')
                      : 'transparent',
                    border: activeView === item.id
                      ? (themeMode === 'dark' ? '1px solid rgba(10,132,255,0.4)' : '1px solid rgba(0,122,255,0.25)')
                      : '1px solid transparent',
                    fontWeight: activeView === item.id ? 700 : 500,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: themeMode === 'dark' ? '#fff' : '#007AFF',
                      bgcolor: activeView === item.id
                        ? (themeMode === 'dark' ? 'rgba(10,132,255,0.2)' : 'rgba(0,122,255,0.12)')
                        : (themeMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')
                    }
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>

            {/* Right Actions (Right Sector) */}
            <Box sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, md: 2 },
              width: { xs: '100%', lg: 'auto' },
              justifyContent: { xs: 'center', lg: 'flex-end' }
            }}>

              {activeView === 'insights' && (
                <Tooltip title={`Export current view as ${config.exportFormat}`}>
                  <IconButton
                    onClick={handleExport}
                    disabled={!data || isExporting}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 99,
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
                      border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(60,60,67,0.12)',
                      color: (theme) => theme.palette.mode === 'dark' ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)',
                        border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(60,60,67,0.2)',
                        color: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#000',
                      },
                      '&.Mui-disabled': {
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        color: (theme) => theme.palette.text.disabled,
                        background: 'none'
                      }
                    }}
                  >
                    {isExporting ? <CircularProgress size={18} color="inherit" /> : <Download size={18} />}
                  </IconButton>
                </Tooltip>
              )}

              {activeView === 'insights' && (
                <Button
                  variant="contained"
                  startIcon={<UploadCloud size={16} />}
                  component="label"
                  sx={{
                    height: 'auto', // Adjusted to auto to let py control height
                    px: 3,
                    py: 1,
                    borderRadius: 99,
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    background: themeMode === 'dark' ? '#0A84FF' : '#007AFF',
                    color: '#fff',
                    textTransform: 'none',
                    border: 'none',
                    boxShadow: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: themeMode === 'dark' ? '#409CFF' : '#0056B3',
                      boxShadow: themeMode === 'dark' ? '0 4px 16px rgba(10,132,255,0.35)' : '0 4px 16px rgba(0,122,255,0.28)',
                      color: '#fff',
                    }
                  }}
                >
                  Evaluate
                  <input type="file" accept=".xlsx,.xls" hidden onChange={handleFileUpload} />
                </Button>
              )}

              <Tooltip title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}>
                <IconButton
                  onClick={toggleTheme}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 99,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
                    border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(60,60,67,0.12)',
                    color: (theme) => theme.palette.mode === 'dark' ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)',
                      color: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#000',
                      transform: 'none',
                      border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(60,60,67,0.2)',
                    }
                  }}
                >
                  {themeMode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </IconButton>
              </Tooltip>
            </Box>

          </Box>

          {/* Main Content Area */}
          <Box component="main" sx={{
            width: '100%',
            flexGrow: 1,
            px: { xs: 2, md: 3 },
            pb: 2,
            pt: 2,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 1 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', md: '1.1rem' }, letterSpacing: '-0.02em', mb: 0.5, color: 'text.primary' }}>
                  {activeView === 'insights' ? 'Production Intelligence' :
                    activeView === 'history' ? 'Historical Evaluations' :
                      activeView === 'drilldown' ? 'Experiments' :
                        activeView === 'confusion' ? 'Confusion Matrix' :
                          activeView === 'about' ? 'Methodology & Framework' : 'Configuration'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}>
                  {activeView === 'insights' ? `Multimodal evaluation across ${leaderboardData.length} active agent architectures.` :
                    activeView === 'history' ? 'Archive of past evaluation runs and performance benchmarks.' :
                      activeView === 'drilldown' ? 'Deep dive into specific model metrics and granular analysis.' :
                        activeView === 'confusion' ? 'Retrieval × generation quality breakdown per bot.' :
                          activeView === 'about' ? 'Detailed breakdown of organizational RAG scoring benchmarks.' : 'System settings and preferences.'}
                </Typography>
              </Box>

              {activeView === 'history' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {filteredHistory.length > ITEMS_PER_PAGE && (
                    <PaginationControl
                      count={Math.ceil(filteredHistory.length / ITEMS_PER_PAGE)}
                      page={historyPage}
                      onChange={(_, v) => setHistoryPage(v)}
                      sx={{ m: 0, scale: '0.9' }}
                    />
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {historySearch && (
                      <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1 }}>
                        FOUND: {filteredHistory.length}
                      </Typography>
                    )}
                    <Box sx={{ position: 'relative', width: 300 }}>
                      <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', width: 16, height: 16 }} />
                      <input
                        placeholder="Search history..."
                        value={historySearch}
                        onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                        style={{
                          width: '100%',
                          backgroundColor: themeMode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: '10px',
                          padding: '10px 12px 10px 38px',
                          color: theme.palette.text.primary,
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      />
                    </Box>
                    <Button
                      variant="contained"
                      onClick={() => setCompareDialogOpen(true)}
                      sx={{
                        px: 2.5,
                        py: 0.8,
                        borderRadius: 99,
                        textTransform: 'none',
                        fontWeight: 900,
                        fontSize: '0.8rem',
                        background: '#2563eb',
                        backdropFilter: 'blur(10px)',
                        color: '#fff',
                        border: (theme) => theme.palette.mode === 'dark'
                          ? '1px solid rgba(255, 255, 255, 0.2)'
                          : '1px solid rgba(0, 0, 0, 0.15)',
                        boxShadow: (theme) => theme.palette.mode === 'dark'
                          ? '0 4px 20px rgba(37, 99, 235, 0.3)'
                          : '0 4px 12px rgba(37, 99, 235, 0.2)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          background: '#1d4ed8',
                          transform: 'translateY(-2px)',
                          boxShadow: (theme) => theme.palette.mode === 'dark'
                            ? '0 8px 30px rgba(37, 99, 235, 0.45)'
                            : '0 6px 20px rgba(37, 99, 235, 0.3)',
                          color: '#fff',
                        }
                      }}
                    >
                      Compare
                    </Button>
                  </Box>
                </Box>
              )}

              {activeView === 'drilldown' && data && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {filteredTestCases.length > ITEMS_PER_PAGE && (
                    <PaginationControl
                      count={Math.ceil(filteredTestCases.length / ITEMS_PER_PAGE)}
                      page={drilldownPage}
                      onChange={(_, v) => {
                        setDrilldownPage(v);
                        contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      sx={{ m: 0, scale: '0.9' }}
                    />
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label={`BATCH LOAD: ${data?.test_cases?.length || 0} QUESTIONS`}
                      sx={{
                        bgcolor: 'rgba(56, 189, 248, 0.1)',
                        color: '#38bdf8',
                        fontWeight: 800,
                        fontSize: '0.65rem',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        '& .MuiChip-icon': { color: 'inherit' }
                      }}
                    />
                    {drilldownSearch && (
                      <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 800, letterSpacing: 1 }}>
                        FILTERED: {filteredTestCases.length} / {data.test_cases.length}
                      </Typography>
                    )}
                    <Box sx={{ position: 'relative', width: 350 }}>
                      <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', width: 16, height: 16 }} />
                      <input
                        placeholder="Search cases..."
                        value={drilldownSearch}
                        onChange={(e) => { setDrilldownSearch(e.target.value); setDrilldownPage(1); }}
                        style={{
                          width: '100%',
                          backgroundColor: themeMode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(0, 0, 0, 0.02)',
                          border: (themeMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : `1px solid ${theme.palette.divider}`),
                          borderRadius: '10px', padding: '10px 12px 10px 38px', color: theme.palette.text.primary, fontSize: '0.85rem', outline: 'none'
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              )}

              {activeView === 'config' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleApplySettings}
                    disabled={!isWeightConfigValid}
                    disableElevation
                    sx={{
                      height: 36,
                      px: 2.5,
                      borderRadius: 99,
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'none',
                      boxShadow: 'none',
                      '&:hover': { boxShadow: 'none' },
                    }}
                  >
                    Apply Settings
                  </Button>
                </Box>
              )}
            </Box>

            {/* Scrollable Content Area (Freeze Pan) */}
            <Box sx={{
              flexGrow: 1,
              overflowY: (activeView === 'about' || activeView === 'history' || activeView === 'config' || activeView === 'confusion') ? 'hidden' : 'auto',
              overflowX: 'hidden',
              width: '100%',
              maxWidth: '100vw',
              maxHeight: 'none',
              pt: 0,
              pb: 0,
              pr: 1, // room for scrollbar
              '&::-webkit-scrollbar': { width: '8px' },
              '&::-webkit-scrollbar-track': { background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.03)' },
              '&::-webkit-scrollbar-thumb': {
                background: (theme) => theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.3)',
                borderRadius: '10px',
                border: (theme) => theme.palette.mode === 'dark' ? 'none' : '2px solid transparent',
                backgroundClip: 'padding-box'
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: (theme) => theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.4)' : 'rgba(37, 99, 235, 0.5)',
                backgroundClip: 'padding-box'
              }
            }} ref={contentScrollRef}>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  style={{ height: ['about', 'history', 'config', 'confusion'].includes(activeView) ? '100%' : 'auto' }}
                >
                  <Box sx={{ height: ['about', 'history', 'config', 'confusion'].includes(activeView) ? '100%' : 'auto' }}>
                    {/* Dashboard View */}
                    {activeView === 'insights' && data && (
                      <Grid container spacing={2} columns={12}>
                        {/* Score Cards - Row 1 */}
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <GlassCard
                            title="Highest RQS"
                            value={winner?.id}
                            color="#ffffff"
                            icon={<Trophy size={24} />}
                            subtitle={`Master Score: ${(winner?.avg_rqs || 0).toFixed(2)}`}
                            trend={trends.rqs}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <GlassCard
                            title="Best Answer Correctness"
                            value={`${((winner?.gt_alignment || 0) * 100).toFixed(0)}%`}
                            color="#22c55e"
                            icon={<CheckCircle2 size={24} />}
                            subtitle="Peak GT consistency"
                            trend={trends.correctness}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <GlassCard
                            title="Best Faithfulness"
                            value={`${((winner?.avg_faithfulness || 0) * 100).toFixed(0)}%`}
                            color="#e879f9"
                            icon={<ShieldCheck size={24} />}
                            subtitle="Grounded logic (Top Model)"
                            trend={trends.faithfulness}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <GlassCard
                            title="Best Relevancy"
                            value={`${((winner?.avg_relevancy || 0) * 100).toFixed(0)}%`}
                            color="#f59e0b"
                            icon={<AlignLeft size={24} />}
                            subtitle="Intent accuracy (Top Model)"
                            trend={trends.relevancy}
                          />
                        </Grid>

                        {/* Score Cards - Row 2 */}
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <GlassCard
                            title="Max Context Prec."
                            value={`${((winner?.avg_context_precision || 0) * 100).toFixed(0)}%`}
                            color="#06b6d4"
                            icon={<Cpu size={24} />}
                            subtitle="Retrieval Signal-to-Noise"
                            trend={trends.precision}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <GlassCard
                            title="Max Context Recall"
                            value={`${((winner?.retrieval_success || 0) * 100).toFixed(0)}%`}
                            color="#6366f1"
                            icon={<Layers size={24} />}
                            subtitle="Information Coverage"
                            trend={trends.recall}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <GlassCard
                            title="Hallucination Rate"
                            value={`${((1 - (winner?.avg_faithfulness || 0)) * 100).toFixed(0)}%`}
                            color="#ef4444"
                            icon={<AlertTriangle size={24} />}
                            subtitle="Safety Risk Assessment"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <GlassCard
                            title="Total Questions"
                            value={data?.test_cases?.length || 0}
                            color="#64748b"
                            icon={<Target size={24} />}
                            subtitle="Total Evaluation Volume"
                          />
                        </Grid>

                        {/* Main Visualization */}
                        <Grid size={{ xs: 12, md: 8 }} className="no-print">
                          <Paper sx={{ px: 3, py: 2.5, height: 440, borderRadius: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.6)', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 0 30px rgba(14, 165, 233, 0.35)' : '0 10px 30px rgba(0,0,0,0.05)' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                              <Box>
                                <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', lineHeight: 1.2 }}>Performance Trajectory</Typography>
                                <Typography variant="caption" color="text.secondary">Multidimensional scoring across top architectures</Typography>
                              </Box>
                            </Box>
                            <Box sx={{ height: 320 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="4 4" vertical={true} stroke={theme.palette.divider} strokeWidth={1.5} />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 10, fontWeight: 700 }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 10, fontWeight: 700 }} />
                                  <ChartTooltip content={<CustomTooltip />} />
                                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 600, top: -10 }} />
                                  <Area name="Master RQS Score" type="monotone" dataKey="RQS" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorPrimary)" />
                                  <Area name="Answer Correctness" type="monotone" dataKey="AnswerCorrectness" stroke="#22c55e" strokeWidth={2} fillOpacity={0} />
                                  <Area name="Answer Faithfulness" type="monotone" dataKey="Faithfulness" stroke="#e879f9" strokeWidth={2} fillOpacity={0} />
                                  <Area name="Answer Relevancy" type="monotone" dataKey="Relevancy" stroke="#f59e0b" strokeWidth={2} fillOpacity={0} />
                                  <Area name="Context Precision" type="monotone" dataKey="Precision" stroke="#06b6d4" strokeWidth={2} fillOpacity={0} />
                                  <Area name="Context Recall" type="monotone" dataKey="Recall" stroke="#6366f1" strokeWidth={2} fillOpacity={0} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </Box>
                          </Paper>
                        </Grid>

                        {/* Neural Profile HUD */}
                        <Grid size={{ xs: 12, md: 4 }} className="no-print">
                          <MotionPaper
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            sx={{
                              p: 2.5,
                              height: 440,
                              borderRadius: 2,
                              background: (theme) => theme.palette.mode === 'dark'
                                ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.6) 0%, rgba(2, 6, 23, 0.8) 100%)'
                                : 'linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.95) 100%)',
                              border: (theme) => `1px solid ${theme.palette.divider}`,
                              boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 0 30px rgba(255, 255, 255, 0.15)' : '0 10px 30px rgba(0,0,0,0.05)',
                              display: 'flex',
                              flexDirection: 'column',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            <Box sx={{ position: 'relative', zIndex: 1, mb: 2 }}>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', lineHeight: 1.2 }}>Neural Topology</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Architectural capability mapping (Top 3)
                              </Typography>
                            </Box>

                            <Box sx={{ flexGrow: 1, position: 'relative', zIndex: 1, minHeight: 280 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="55%"
                                  data={[
                                    { subject: 'Answer Correctness', ...leaderboardData.slice(0, 3).reduce((acc, m) => ({ ...acc, [m.id]: Number((m.gt_alignment * 100).toFixed(1)) }), {}) },
                                    { subject: 'Answer Faithfulness', ...leaderboardData.slice(0, 3).reduce((acc, m) => ({ ...acc, [m.id]: Number((m.avg_faithfulness * 100).toFixed(1)) }), {}) },
                                    { subject: 'Answer Relevancy', ...leaderboardData.slice(0, 3).reduce((acc, m) => ({ ...acc, [m.id]: Number((m.avg_relevancy * 100).toFixed(1)) }), {}) },
                                    { subject: 'Context Precision', ...leaderboardData.slice(0, 3).reduce((acc, m) => ({ ...acc, [m.id]: Number((m.avg_context_precision * 100).toFixed(1)) }), {}) },
                                    { subject: 'Context Recall', ...leaderboardData.slice(0, 3).reduce((acc, m) => ({ ...acc, [m.id]: Number((m.retrieval_success * 100).toFixed(1)) }), {}) },
                                  ]}
                                >
                                  <PolarGrid stroke={themeMode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'} strokeWidth={1.5} />
                                  <PolarAngleAxis dataKey="subject" tick={{ fill: theme.palette.text.secondary, fontSize: 10, fontWeight: 700 }} />
                                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                  <ChartTooltip content={<CustomTooltip />} />
                                  {leaderboardData.slice(0, 3).map((model, idx) => (
                                    <Radar
                                      key={model.id}
                                      name={model.id}
                                      dataKey={model.id}
                                      stroke={['#2563eb', '#fbbf24', '#f472b6'][idx]}
                                      fill={['#2563eb', '#fbbf24', '#f472b6'][idx]}
                                      fillOpacity={0.25}
                                      strokeWidth={3}
                                    />
                                  ))}
                                </RadarChart>
                              </ResponsiveContainer>
                            </Box>

                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                              {leaderboardData.slice(0, 3).map((model, idx) => (
                                <Box key={model.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: ['#2563eb', '#fbbf24', '#f472b6'][idx],
                                    boxShadow: `0 0 10px ${['#2563eb', '#fbbf24', '#f472b6'][idx]}`
                                  }} />
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem' }}>{model.id}</Typography>
                                </Box>
                              ))}
                            </Box>
                          </MotionPaper>
                        </Grid>


                        {/* Leaderboard Table */}
                        <Grid size={{ xs: 12 }}>
                          <TableContainer component={Paper} sx={{ borderRadius: 2, bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 0 30px rgba(14, 165, 233, 0.35)' : '0 10px 30px rgba(0,0,0,0.05)' }}>
                            <Box sx={{ px: 3, py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', lineHeight: 1.2 }}>Leaderboard</Typography>
                              <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
                                <Button
                                  variant="contained"
                                  size="small"
                                  endIcon={<ArrowUpRight size={16} />}
                                  onClick={() => handleViewChange('drilldown')}
                                  sx={{
                                    height: 36,
                                    px: 2.5,
                                    borderRadius: 99,
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    background: '#2563eb',
                                    color: '#fff',
                                    textTransform: 'none',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                      background: '#1d4ed8',
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
                                      color: '#fff',
                                    }
                                  }}
                                >
                                  Analysis
                                </Button>
                                <Button
                                  variant="contained"
                                  size="small"
                                  endIcon={<ChevronRight size={16} />}
                                  onClick={() => handleViewChange('history')}
                                  sx={{
                                    height: 36,
                                    px: 2.5,
                                    borderRadius: 99,
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    background: '#2563eb',
                                    color: '#fff',
                                    textTransform: 'none',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                      background: '#1d4ed8',
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
                                      color: '#fff',
                                    }
                                  }}
                                >
                                  View All Historical Runs
                                </Button>
                              </Box>
                            </Box>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>Rank</TableCell>
                                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>Model Architecture</TableCell>
                                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>Master RQS Score</TableCell>
                                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>Answer Correctness</TableCell>
                                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>Faithfulness Score</TableCell>
                                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>Answer Relevancy</TableCell>
                                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>Context Precision</TableCell>
                                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>Context Recall</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {leaderboardData.map((row) => {
                                  const isWinnerRow = row.rank === 1;
                                  return (
                                  <TableRow
                                    key={row.id}
                                    hover
                                    sx={
                                      isWinnerRow
                                        ? {
                                            bgcolor: (theme) =>
                                              theme.palette.mode === 'dark'
                                                ? 'rgba(245, 158, 11, 0.12)'
                                                : 'rgba(245, 158, 11, 0.14)',
                                            '&:hover': {
                                              bgcolor: (theme) =>
                                                theme.palette.mode === 'dark'
                                                  ? 'rgba(245, 158, 11, 0.18)'
                                                  : 'rgba(245, 158, 11, 0.2)',
                                            },
                                          }
                                        : undefined
                                    }
                                  >
                                    <TableCell sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
                                      <Box sx={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        bgcolor: row.rank === 1 ? 'rgba(245, 158, 11, 0.1)' : (themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                                        color: row.rank === 1 ? '#f59e0b' : 'inherit',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 800,
                                        fontSize: '0.75rem'
                                      }}>
                                        {row.rank}
                                      </Box>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                        {isWinnerRow && <Trophy size={14} color="#f59e0b" />}
                                        <span>{row.id}</span>
                                      </Box>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
                                      <Typography sx={{ color: 'primary.main', fontWeight: 900 }}>{(row.avg_rqs || 0).toFixed(3)}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
                                      <Stack direction="row" alignItems="center" spacing={1.5}>
                                        <LinearProgress
                                          variant="determinate"
                                          value={row.gt_alignment * 100}
                                          sx={{ width: 80, height: 6, borderRadius: 3, bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                                        />
                                        <Typography variant="caption">{(row.gt_alignment * 100).toFixed(0)}%</Typography>
                                      </Stack>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>{(row.avg_faithfulness * 100).toFixed(1)}%</TableCell>
                                    <TableCell sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>{(row.avg_relevancy * 100).toFixed(1)}%</TableCell>
                                    <TableCell sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>{(row.avg_context_precision * 100).toFixed(1)}%</TableCell>
                                    <TableCell sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>{(row.retrieval_success * 100).toFixed(1)}%</TableCell>
                                  </TableRow>
                                )})}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                      </Grid>
                    )}

                    {activeView === 'history' && (
                      <HistoryView
                        filteredHistory={filteredHistory}
                        history={history}
                        historyPage={historyPage}
                        itemsPerPage={ITEMS_PER_PAGE}
                        isLoadingHistory={isLoadingHistory}
                        onLoadReport={handleLoadReport}
                      />
                    )}

                    {activeView === 'drilldown' && data && (
                      <ExperimentsView
                        data={data}
                        filteredTestCases={filteredTestCases}
                        drilldownPage={drilldownPage}
                        itemsPerPage={ITEMS_PER_PAGE}
                        effectiveConfig={effectiveConfig}
                        recommendationByKey={recommendationByKey}
                        recommendationLoadingByKey={recommendationLoadingByKey}
                        requestRecommendationForRow={requestRecommendationForRow}
                        openRecommendationDetail={openRecommendationDetail}
                      />
                    )}

                    {activeView === 'confusion' && data && (
                      <ConfusionMatrixView data={data} themeMode={themeMode} />
                    )}

                    {activeView === 'about' && <AboutView />}

                    {activeView === 'config' && (
                      <ConfigurationView
                        config={config}
                        setConfig={setConfig}
                        themeMode={themeMode}
                        thresholdItems={thresholdItems}
                        weightItems={weightItems}
                      />
                    )}


                  </Box>
                </motion.div>
              </AnimatePresence>
            </Box>
          </Box>

          <EvaluationProgressBackdrop open={isEvaluating} statusLogs={statusLogs} logEndRef={logEndRef} />
          <ReportLoadingBackdrop open={isLoadingReport} />
        </Box>

        <PrintOnlyReport data={data} leaderboardData={leaderboardData} />

        <CompareEvaluationsDialog
          open={compareDialogOpen}
          onDialogClose={() => setCompareDialogOpen(false)}
          onResetAndClose={() => {
            setCompareDialogOpen(false);
            setShowComparisonResults(false);
            setCompareEval1('');
            setCompareEval2('');
          }}
          history={history}
          showComparisonResults={showComparisonResults}
          compareEval1={compareEval1}
          compareEval2={compareEval2}
          setCompareEval1={setCompareEval1}
          setCompareEval2={setCompareEval2}
          onCompare={() => {
            setShowComparisonResults(true);
          }}
        />

        <RecommendationDetailDialog
          open={recommendationDetailOpen}
          rowLabel={recommendationDetailRow}
          text={recommendationDetailText}
          onClose={() => setRecommendationDetailOpen(false)}
        />

        <Snackbar open={saveSuccess} autoHideDuration={3000} onClose={() => setSaveSuccess(false)}>
          <Alert
            onClose={() => setSaveSuccess(false)}
            icon={snackbarMsg.includes('Report') ? <Download size={18} /> : <CheckCircle2 size={18} />}
            sx={{
              width: '100%',
              borderRadius: 3,
              bgcolor: 'rgba(15, 23, 42, 0.95)',
              color: '#38bdf8',
              fontWeight: 800,
              boxShadow: '0 0 40px rgba(56, 189, 248, 0.4)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              backdropFilter: 'blur(10px)',
              '.MuiAlert-icon': { color: '#38bdf8' }
            }}
          >
            {snackbarMsg}
          </Alert>
        </Snackbar>

        <style jsx global>{`
          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: hidden !important;
          }
          @keyframes blink { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
          @keyframes shine {
            from { background-position: 200% 0; }
            to { background-position: -200% 0; }
          }
          @keyframes fadeInLogs { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes fadeInScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(120,120,128,0.3);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(120,120,128,0.5); }
          @media print {
            body { background: ${themeMode === 'dark' ? '#1C1C1E' : '#ffffff'} !important; color: ${themeMode === 'dark' ? '#ffffff' : '#000000'} !important; }
            /* Hide the entire web UI */
            .main-ui-container { display: none !important; }
            /* Show only the print-ready report */
            .print-only-report {
              display: block !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              z-index: 99999 !important;
            }
          }
        `}</style>
      </>
    </ThemeProvider >
  );
}

// Component to handle search params (wrapped in Suspense)
function SearchParamsHandler({ onViewChange }: { onViewChange: (view: string) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const viewFromUrl = searchParams.get('view');
    if (viewFromUrl && ['insights', 'drilldown', 'history', 'about', 'config'].includes(viewFromUrl)) {
      onViewChange(viewFromUrl);
    }
  }, [searchParams, onViewChange]);

  return null;
}

// Wrapper component with Suspense boundary
export default function EnterpriseDashboard() {
  return (
    <ErrorBoundary label="Dashboard">
      <Suspense fallback={
        <Box sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#000000'
        }}>
          <CircularProgress size={60} sx={{ color: '#0A84FF' }} />
        </Box>
      }>
        <EnterpriseDashboardContent />
      </Suspense>
    </ErrorBoundary>
  );
}

