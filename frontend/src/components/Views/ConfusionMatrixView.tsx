"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Tooltip, alpha } from '@mui/material';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  XCircle, Info, ChefHat, UtensilsCrossed, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2,
} from 'lucide-react';
import type { EvaluationData, ConfusionMatrixEntry } from '../../types/evaluation';

interface Props {
  data: EvaluationData;
  themeMode: 'light' | 'dark';
}

const MotionBox = motion(Box);

// ─── Config ───────────────────────────────────────────────────────────────────

const Q = {
  TP: {
    label: 'True Positive',   short: 'TP',
    analogy: 'Great waiter, great chef',
    action: 'Pipeline healthy end-to-end',
    icon: CheckCircle2,
    accent: { light: '#059669', dark: '#34d399' },
    bg:     { light: 'linear-gradient(145deg,#d1fae5,#a7f3d0)', dark: 'linear-gradient(145deg,rgba(6,95,70,.5),rgba(4,120,87,.3))' },
    border: { light: '#6ee7b7', dark: 'rgba(52,211,153,.35)' },
    text:   { light: '#065f46', dark: '#6ee7b7' },
  },
  FN: {
    label: 'False Negative',  short: 'FN',
    analogy: 'Great waiter, bad chef',
    action: 'Fix LLM prompt or model',
    icon: ChefHat,
    accent: { light: '#d97706', dark: '#fbbf24' },
    bg:     { light: 'linear-gradient(145deg,#fef3c7,#fde68a)', dark: 'linear-gradient(145deg,rgba(120,53,15,.5),rgba(146,64,14,.3))' },
    border: { light: '#fcd34d', dark: 'rgba(251,191,36,.35)' },
    text:   { light: '#78350f', dark: '#fde68a' },
  },
  FP: {
    label: 'False Positive',  short: 'FP',
    analogy: 'Bad waiter, somehow tasty',
    action: 'Hallucination risk — fix retrieval',
    icon: AlertTriangle,
    accent: { light: '#ea580c', dark: '#fb923c' },
    bg:     { light: 'linear-gradient(145deg,#ffedd5,#fed7aa)', dark: 'linear-gradient(145deg,rgba(124,45,18,.5),rgba(154,52,18,.3))' },
    border: { light: '#fdba74', dark: 'rgba(251,146,60,.35)' },
    text:   { light: '#7c2d12', dark: '#fed7aa' },
  },
  TN: {
    label: 'True Negative',   short: 'TN',
    analogy: 'Bad waiter, bad chef',
    action: 'Fix chunking or index',
    icon: UtensilsCrossed,
    accent: { light: '#dc2626', dark: '#f87171' },
    bg:     { light: 'linear-gradient(145deg,#fee2e2,#fecaca)', dark: 'linear-gradient(145deg,rgba(127,29,29,.5),rgba(153,27,27,.3))' },
    border: { light: '#fca5a5', dark: 'rgba(248,113,113,.35)' },
    text:   { light: '#7f1d1d', dark: '#fecaca' },
  },
} as const;

const METRICS = [
  { key: 'rqs',                label: 'RQS',             color: '#007AFF' },
  { key: 'faithfulness',       label: 'Faithfulness',    color: '#AF52DE' },
  { key: 'answer_correctness', label: 'Correctness',     color: '#34C759' },
  { key: 'answer_relevancy',   label: 'Relevancy',       color: '#5AC8FA' },
  { key: 'context_recall',     label: 'Ctx Recall',      color: '#FF9500' },
  { key: 'context_precision',  label: 'Ctx Precision',   color: '#FF2D55' },
];

// ─── AnimatedCount ────────────────────────────────────────────────────────────

function AnimatedCount({ target }: { target: number }) {
  const val = useMotionValue(0);
  const rounded = useTransform(val, v => Math.round(v));
  useEffect(() => {
    const c = animate(val, target, { duration: 0.8, ease: 'easeOut' });
    return c.stop;
  }, [target]);
  return <motion.span>{rounded}</motion.span>;
}

// ─── QuadrantCell ─────────────────────────────────────────────────────────────

function QuadrantCell({
  q, count, pct, themeMode, delay,
}: {
  q: keyof typeof Q; count: number; pct: number; themeMode: 'light' | 'dark'; delay: number;
}) {
  const cfg = Q[q];
  const mode = themeMode;
  const Icon = cfg.icon;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      sx={{
        aspectRatio: '1 / 1',
        height: '100%',
        width: 'auto',
        justifySelf: 'center',
        background: cfg.bg[mode],
        border: `1.5px solid ${cfg.border[mode]}`,
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        p: 1.5,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* Watermark */}
      <Box sx={{ position: 'absolute', bottom: -12, right: -10, opacity: 0.07, pointerEvents: 'none' }}>
        <Icon size={80} />
      </Box>

      {/* Header row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 'auto' }}>
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.5,
          bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          borderRadius: 99, px: 1, py: 0.3,
        }}>
          <Icon size={11} color={cfg.text[mode]} />
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: cfg.text[mode], letterSpacing: 0.8, textTransform: 'uppercase' }}>
            {cfg.short}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: cfg.accent[mode], opacity: 0.9 }}>
          {pct}%
        </Typography>
      </Box>

      {/* Count */}
      <Typography sx={{ fontSize: '3rem', fontWeight: 900, color: cfg.accent[mode], lineHeight: 1, letterSpacing: '-0.05em', my: 1 }}>
        <AnimatedCount target={count} />
      </Typography>

      {/* Footer */}
      <Box>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: cfg.text[mode], lineHeight: 1.2 }}>
          {cfg.label}
        </Typography>
        <Typography sx={{ fontSize: '0.62rem', color: cfg.text[mode], opacity: 0.65, mt: 0.25 }}>
          {cfg.action}
        </Typography>
      </Box>
    </MotionBox>
  );
}

// ─── MetricBar ────────────────────────────────────────────────────────────────

function MetricBar({ label, rate, color, themeMode, delay }: {
  label: string; rate: number; color: string; themeMode: 'light' | 'dark'; delay: number;
}) {
  const pct = Math.round(rate * 100);
  const barColor = pct >= 80 ? color : pct >= 60 ? '#FF9500' : '#FF3B30';
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 500 }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: barColor }}>{pct}%</Typography>
      </Box>
      <Box sx={{
        height: 6, borderRadius: 99,
        bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
        overflow: 'hidden',
      }}>
        <MotionBox
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay, ease: 'easeOut' }}
          sx={{ height: '100%', bgcolor: barColor, borderRadius: 99 }}
        />
      </Box>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ConfusionMatrixView({ data, themeMode }: Props) {
  const cm = data.confusion_matrix;
  const rankedBots = (data.leaderboard || [])
    .map((row) => row.bot_id)
    .filter((bid): bid is string => typeof bid === 'string')
    .filter((bid) => Boolean(cm && cm[bid]));
  const bots = cm ? (rankedBots.length > 0 ? rankedBots : Object.keys(cm)) : [];
  const [selectedBot, setSelectedBot] = useState(0);

  useEffect(() => { setSelectedBot(0); }, [data.id]);

  if (!cm || bots.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1.5 }}>
        <XCircle size={36} color="#9ca3af" />
        <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>No confusion matrix data. Run an evaluation first.</Typography>
      </Box>
    );
  }

  const activeBotId = bots[Math.min(selectedBot, bots.length - 1)];
  const e: ConfusionMatrixEntry = cm[activeBotId];
  const total = e.matrix.TP + e.matrix.FP + e.matrix.FN + e.matrix.TN;
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;
  const fmt = (v: number | undefined) => Number.isFinite(v) ? Number(v).toFixed(2) : '0.00';

  const dark = themeMode === 'dark';
  const surfBg = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const surfBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const statColors = ['#AF52DE', '#5AC8FA', '#BF5AF2', '#34C759'];
  const statItems = [
    { label: 'Precision', value: fmt(e.precision) },
    { label: 'Recall',    value: fmt(e.recall) },
    { label: 'F1',        value: fmt(e.f1) },
    { label: 'Accuracy',  value: fmt(e.accuracy) },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', p: 2, gap: 1.5 }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0, gap: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: '1.02rem', fontWeight: 800, lineHeight: 1.2 }}>
            Confusion Matrix
          </Typography>
          <Typography sx={{ mt: 0.35, color: 'text.secondary', fontSize: '0.78rem' }}>
            Retrieval quality (context recall) vs generation quality (answer correctness), grouped by bot.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
          <Chip label={`${e.total_cases} total`} size="small"
            sx={{ fontSize: '0.68rem', height: 22, bgcolor: dark ? 'rgba(0,122,255,0.15)' : 'rgba(0,122,255,0.08)', color: '#007AFF', fontWeight: 700 }} />
          <Chip label={`${e.measured_cases} measured`} size="small" sx={{ fontSize: '0.68rem', height: 22 }} />
          {e.skipped_no_gt > 0 && (
            <Tooltip title={`${e.skipped_no_gt} case(s) excluded — no ground truth.`} arrow>
              <Chip icon={<Info size={11} />} label={`${e.skipped_no_gt} skipped`}
                size="small" color="warning" variant="outlined" sx={{ fontSize: '0.68rem', height: 22 }} />
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* ── Bot selector + threshold legend ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          {bots.map((bid, i) => {
            const isSelected = selectedBot === i;
            const isWinner = data.winner && bid === data.winner;
            return (
              <Chip
                key={bid}
                label={isWinner ? `\uD83C\uDFC6 ${bid}` : bid}
                onClick={() => setSelectedBot(i)}
                clickable
                size="small"
                variant={isSelected ? 'filled' : 'outlined'}
                sx={{
                  fontWeight: 700,
                  bgcolor: isSelected ? '#007AFF' : undefined,
                  color: isSelected ? '#fff' : 'text.secondary',
                  borderColor: isSelected ? '#007AFF' : (isWinner ? 'warning.main' : undefined),
                  '&:hover': {
                    borderColor: '#007AFF',
                    color: isSelected ? '#fff' : '#007AFF',
                  },
                }}
              />
            );
          })}
        </Box>
        <Box sx={{ display: 'flex', gap: 0.65, flexWrap: 'wrap' }}>
          <Chip
            size="small"
            variant="outlined"
            label={`retrieval pass: recall \u2265 ${fmt(e.thresholds.context_recall)}`}
            sx={{ fontSize: '0.65rem', height: 22 }}
          />
          <Chip
            size="small"
            variant="outlined"
            label={`generation pass: correctness \u2265 ${fmt(e.thresholds.answer_correctness)}`}
            sx={{ fontSize: '0.65rem', height: 22 }}
          />
        </Box>
      </Box>

      {/* ── Body ── */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1fr) 240px' },
        }}
      >

        {/* ── Left: Matrix ── */}
        <Box sx={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 1, justifyContent: 'center' }}>

          {/* Column axis header */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '88px 1fr 1fr', gap: 1 }}>
            <Box />
            {([
              { label: 'Answer Correct', sub: `correctness ≥ ${fmt(e.thresholds.answer_correctness)}`, ok: true },
              { label: 'Answer Wrong',   sub: `correctness < ${fmt(e.thresholds.answer_correctness)}`, ok: false },
            ] as const).map(({ label, sub, ok }) => (
              <Box key={label} sx={{
                textAlign: 'center', py: 0.75,
                bgcolor: ok
                  ? (dark ? 'rgba(5,150,105,0.12)' : 'rgba(5,150,105,0.07)')
                  : (dark ? 'rgba(220,38,38,0.12)' : 'rgba(220,38,38,0.07)'),
                border: `1px solid ${ok
                  ? (dark ? 'rgba(52,211,153,0.25)' : 'rgba(5,150,105,0.2)')
                  : (dark ? 'rgba(248,113,113,0.25)' : 'rgba(220,38,38,0.2)')}`,
                borderRadius: 2,
              }}>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: ok ? '#059669' : '#dc2626', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {label}
                </Typography>
                <Typography sx={{ fontSize: '0.58rem', color: 'text.disabled', mt: 0.15 }}>{sub}</Typography>
              </Box>
            ))}
          </Box>

          {/* Row 1: Good retrieval */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '88px 1fr 1fr', gap: 1, height: '190px' }}>
            <Box sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: dark ? 'rgba(5,150,105,0.08)' : 'rgba(5,150,105,0.05)',
              border: `1px solid ${dark ? 'rgba(52,211,153,0.2)' : 'rgba(5,150,105,0.15)'}`,
              borderRadius: 2, overflow: 'hidden',
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, transform: 'rotate(-90deg)' }}>
                <TrendingUp size={12} color="#059669" />
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap' }}>
                  Good retrieval
                </Typography>
                <Typography sx={{ fontSize: '0.55rem', color: 'text.disabled', whiteSpace: 'nowrap' }}>
                  recall ≥ {fmt(e.thresholds.context_recall)}
                </Typography>
              </Box>
            </Box>
            <QuadrantCell q="TP" count={e.matrix.TP} pct={pct(e.matrix.TP)} themeMode={themeMode} delay={0.05} />
            <QuadrantCell q="FN" count={e.matrix.FN} pct={pct(e.matrix.FN)} themeMode={themeMode} delay={0.1} />
          </Box>

          {/* Row 2: Poor retrieval */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '88px 1fr 1fr', gap: 1, height: '190px' }}>
            <Box sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: dark ? 'rgba(220,38,38,0.08)' : 'rgba(220,38,38,0.05)',
              border: `1px solid ${dark ? 'rgba(248,113,113,0.2)' : 'rgba(220,38,38,0.15)'}`,
              borderRadius: 2, overflow: 'hidden',
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, transform: 'rotate(-90deg)' }}>
                <TrendingDown size={12} color="#dc2626" />
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap' }}>
                  Poor retrieval
                </Typography>
                <Typography sx={{ fontSize: '0.55rem', color: 'text.disabled', whiteSpace: 'nowrap' }}>
                  recall {'<'} {fmt(e.thresholds.context_recall)}
                </Typography>
              </Box>
            </Box>
            <QuadrantCell q="FP" count={e.matrix.FP} pct={pct(e.matrix.FP)} themeMode={themeMode} delay={0.15} />
            <QuadrantCell q="TN" count={e.matrix.TN} pct={pct(e.matrix.TN)} themeMode={themeMode} delay={0.2} />
          </Box>
        </Box>

        {/* ── Right: Sidebar ── */}
        <Box sx={{
          flex: '0 0 240px', display: 'flex', flexDirection: 'column', gap: 1.25,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          msOverflowStyle: 'none', scrollbarWidth: 'none',
        }}>

          {/* Stats */}
          <Box sx={{ bgcolor: surfBg, border: `1px solid ${surfBorder}`, borderRadius: 2.5, p: 1.5, flexShrink: 0 }}>
            <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.disabled', display: 'block', mb: 1 }}>
              Classification Stats
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75 }}>
              {statItems.map(({ label, value }, i) => (
                <Box key={label} sx={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  bgcolor: dark ? alpha(statColors[i], 0.1) : alpha(statColors[i], 0.07),
                  border: `1px solid ${alpha(statColors[i], dark ? 0.25 : 0.18)}`,
                  borderRadius: 2, py: 1,
                }}>
                  <Typography sx={{ fontSize: '1.35rem', fontWeight: 900, color: statColors[i], lineHeight: 1, letterSpacing: '-0.03em' }}>
                    {value}
                  </Typography>
                  <Typography sx={{ fontSize: '0.58rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, mt: 0.3 }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Pass rates */}
          <Box sx={{ bgcolor: surfBg, border: `1px solid ${surfBorder}`, borderRadius: 2.5, p: 1.5, flexShrink: 0 }}>
            <Typography variant="overline" sx={{ fontSize: '0.6rem', color: 'text.disabled', display: 'block', mb: 1.1 }}>
              Pass Rate by Metric
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {METRICS.map(({ key, label, color }, i) => (
                <MetricBar key={key} label={label} rate={e.pass_rates[key] ?? 0} color={color} themeMode={themeMode} delay={0.15 + i * 0.05} />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, mt: 1.25, pt: 1, borderTop: `1px solid ${surfBorder}` }}>
              {[{ c: '#34C759', l: '≥ 80%' }, { c: '#FF9500', l: '60–79%' }, { c: '#FF3B30', l: '< 60%' }].map(({ c, l }) => (
                <Box key={l} sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: 99, bgcolor: c }} />
                  <Typography sx={{ fontSize: '0.58rem', color: 'text.secondary' }}>{l}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Analogy */}
          <Box sx={{ bgcolor: surfBg, border: `1px solid ${surfBorder}`, borderRadius: 2.5, p: 1.5, flexShrink: 0 }}>
            <Typography variant="overline" sx={{ fontSize: '0.6rem', color: '#AF52DE', display: 'block', mb: 0.75 }}>
              🍽️ Restaurant Analogy
            </Typography>
            <Typography sx={{ fontSize: '0.63rem', color: 'text.secondary', mb: 1 }}>
              <b style={{ color: '#8E8E93' }}>Waiter</b> = retrieval &nbsp;·&nbsp;
              <b style={{ color: '#8E8E93' }}>Chef</b> = LLM generation
            </Typography>
            {(Object.keys(Q) as Array<keyof typeof Q>).map((k) => {
              const cfg = Q[k];
              const Icon = cfg.icon;
              const accent = cfg.accent[themeMode];
              return (
                <Box key={k} sx={{ display: 'flex', gap: 0.75, mb: 0.75, '&:last-child': { mb: 0 } }}>
                  <Box sx={{
                    width: 20, height: 20, borderRadius: 1, flexShrink: 0,
                    bgcolor: alpha(accent, dark ? 0.15 : 0.1),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={11} color={accent} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.63rem', fontWeight: 700, color: accent, lineHeight: 1.2 }}>
                      {cfg.short} · {cfg.analogy}
                    </Typography>
                    <Typography sx={{ fontSize: '0.58rem', color: 'text.secondary', lineHeight: 1.3 }}>
                      {cfg.action}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>

        </Box>
      </Box>
    </Box>
  );
}
