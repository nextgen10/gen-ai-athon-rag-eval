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

// ─── Layout constants ─────────────────────────────────────────────────────────
const CELL   = 154;  // quadrant cell px
const COL_H  =  44;  // column header height px
const ROW_W  =  52;  // row label width px
const GAP    =   4;  // gap between all grid items px
const SIDEBAR = 212; // right panel width px

// ─── Quadrant config ──────────────────────────────────────────────────────────
const Q = {
  TP: {
    label: 'True Positive',  short: 'TP',
    action: 'Pipeline healthy end-to-end',
    analogy: 'Great waiter · great chef',
    icon: CheckCircle2,
    color: { light: '#34C759', dark: '#30D158' },
    bg: {
      light: 'linear-gradient(145deg,rgba(52,199,89,0.14),rgba(48,209,88,0.06))',
      dark:  'linear-gradient(145deg,rgba(52,199,89,0.22),rgba(48,209,88,0.10))',
    },
    border: { light: 'rgba(52,199,89,0.35)', dark: 'rgba(48,209,88,0.40)' },
  },
  FN: {
    label: 'False Negative', short: 'FN',
    action: 'Fix LLM prompt or model',
    analogy: 'Great waiter · bad chef',
    icon: ChefHat,
    color: { light: '#FF9500', dark: '#FF9F0A' },
    bg: {
      light: 'linear-gradient(145deg,rgba(255,149,0,0.14),rgba(255,159,10,0.06))',
      dark:  'linear-gradient(145deg,rgba(255,149,0,0.22),rgba(255,159,10,0.10))',
    },
    border: { light: 'rgba(255,149,0,0.35)', dark: 'rgba(255,159,10,0.40)' },
  },
  FP: {
    label: 'False Positive', short: 'FP',
    action: 'Hallucination risk — fix retrieval',
    analogy: 'Bad waiter · somehow tasty',
    icon: AlertTriangle,
    color: { light: '#FF3B30', dark: '#FF453A' },
    bg: {
      light: 'linear-gradient(145deg,rgba(255,59,48,0.14),rgba(255,69,58,0.06))',
      dark:  'linear-gradient(145deg,rgba(255,59,48,0.22),rgba(255,69,58,0.10))',
    },
    border: { light: 'rgba(255,59,48,0.35)', dark: 'rgba(255,69,58,0.40)' },
  },
  TN: {
    label: 'True Negative',  short: 'TN',
    action: 'Fix chunking or index',
    analogy: 'Bad waiter · bad chef',
    icon: UtensilsCrossed,
    color: { light: '#AF52DE', dark: '#BF5AF2' },
    bg: {
      light: 'linear-gradient(145deg,rgba(175,82,222,0.14),rgba(191,90,242,0.06))',
      dark:  'linear-gradient(145deg,rgba(175,82,222,0.22),rgba(191,90,242,0.10))',
    },
    border: { light: 'rgba(175,82,222,0.35)', dark: 'rgba(191,90,242,0.40)' },
  },
} as const;

const METRICS = [
  { key: 'rqs',                label: 'RQS',          color: '#007AFF' },
  { key: 'faithfulness',       label: 'Faithfulness', color: '#AF52DE' },
  { key: 'answer_correctness', label: 'Correctness',  color: '#34C759' },
  { key: 'answer_relevancy',   label: 'Relevancy',    color: '#5AC8FA' },
  { key: 'context_recall',     label: 'Ctx Recall',   color: '#FF9500' },
  { key: 'context_precision',  label: 'Ctx Precision',color: '#FF2D55' },
];

const STAT_COLORS = ['#007AFF', '#34C759', '#FF9500', '#BF5AF2'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number | undefined) =>
  Number.isFinite(v) ? Number(v).toFixed(2) : '0.00';

// ─── AnimatedCount ────────────────────────────────────────────────────────────
function AnimatedCount({ target }: { target: number }) {
  const val = useMotionValue(0);
  const rounded = useTransform(val, v => Math.round(v));
  useEffect(() => {
    const c = animate(val, target, { duration: 0.9, ease: 'easeOut' });
    return c.stop;
  }, [target]);
  return <motion.span>{rounded}</motion.span>;
}

// ─── QuadrantCell ─────────────────────────────────────────────────────────────
function QuadrantCell({
  q, count, pct, mode, delay,
}: {
  q: keyof typeof Q; count: number; pct: number; mode: 'light' | 'dark'; delay: number;
}) {
  const cfg = Q[q];
  const Icon = cfg.icon;
  const color = cfg.color[mode];

  return (
    <MotionBox
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      sx={{
        width: CELL, height: CELL, flexShrink: 0,
        background: cfg.bg[mode],
        border: `1.5px solid ${cfg.border[mode]}`,
        borderRadius: '14px',
        display: 'flex', flexDirection: 'column',
        p: '14px',
        position: 'relative', overflow: 'hidden',
        cursor: 'default',
        transition: 'box-shadow 0.2s',
        '&:hover': {
          boxShadow: `0 8px 24px ${alpha(color, 0.25)}`,
        },
      }}
    >
      {/* Watermark icon */}
      <Box sx={{
        position: 'absolute', bottom: -14, right: -10,
        opacity: mode === 'dark' ? 0.09 : 0.07,
        pointerEvents: 'none',
      }}>
        <Icon size={80} />
      </Box>

      {/* Top row: badge + pct */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)',
          borderRadius: 99, px: '8px', py: '2px',
        }}>
          <Icon size={10} color={color} />
          <Typography sx={{ fontSize: '0.58rem', fontWeight: 900, color, letterSpacing: 0.8, textTransform: 'uppercase' }}>
            {cfg.short}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color, opacity: 0.85 }}>
          {pct}%
        </Typography>
      </Box>

      {/* Big count */}
      <Typography sx={{
        fontSize: '2.8rem', fontWeight: 900, color,
        lineHeight: 1, letterSpacing: '-0.05em',
        mt: 'auto', mb: 0.5,
      }}>
        <AnimatedCount target={count} />
      </Typography>

      {/* Label + action */}
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color, lineHeight: 1.25 }}>
        {cfg.label}
      </Typography>
      <Typography sx={{ fontSize: '0.56rem', color, opacity: 0.6, mt: '2px' }}>
        {cfg.action}
      </Typography>
    </MotionBox>
  );
}

// ─── MetricRow ────────────────────────────────────────────────────────────────
function MetricRow({ label, rate, color, dark, delay }: {
  label: string; rate: number; color: string; dark: boolean; delay: number;
}) {
  const pct = Math.round(rate * 100);
  const barColor = pct >= 80 ? color : pct >= 60 ? '#FF9500' : '#FF3B30';
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '3px' }}>
        <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary', fontWeight: 600 }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.62rem', fontWeight: 900, color: barColor }}>{pct}%</Typography>
      </Box>
      <Box sx={{
        height: 5, borderRadius: 99,
        bgcolor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
        overflow: 'hidden',
      }}>
        <MotionBox
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.65, delay, ease: 'easeOut' }}
          sx={{ height: '100%', borderRadius: 99, bgcolor: barColor }}
        />
      </Box>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function ConfusionMatrixView({ data, themeMode }: Props) {
  const cm = data.confusion_matrix;
  const rankedBots = (data.leaderboard || [])
    .map(r => r.bot_id)
    .filter((b): b is string => typeof b === 'string')
    .filter(b => Boolean(cm?.[b]));
  const bots = cm ? (rankedBots.length > 0 ? rankedBots : Object.keys(cm)) : [];
  const [sel, setSel] = useState(0);
  useEffect(() => { setSel(0); }, [data.id]);

  const dark = themeMode === 'dark';
  const mode = themeMode;

  if (!cm || bots.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1.5 }}>
        <XCircle size={40} color={dark ? '#48484A' : '#C7C7CC'} />
        <Typography sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.9rem' }}>
          No data — run an evaluation first.
        </Typography>
      </Box>
    );
  }

  const botId = bots[Math.min(sel, bots.length - 1)];
  const e: ConfusionMatrixEntry = cm[botId];
  const total = e.matrix.TP + e.matrix.FP + e.matrix.FN + e.matrix.TN;
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  const divider = dark ? 'rgba(84,84,88,0.55)' : 'rgba(60,60,67,0.12)';
  const cardBg  = dark ? 'rgba(28,28,30,0.7)'  : 'rgba(255,255,255,0.7)';
  const cardBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';

  const statItems = [
    { label: 'Precision', value: fmt(e.precision), color: STAT_COLORS[0] },
    { label: 'Recall',    value: fmt(e.recall),    color: STAT_COLORS[1] },
    { label: 'F1 Score',  value: fmt(e.f1),        color: STAT_COLORS[2] },
    { label: 'Accuracy',  value: fmt(e.accuracy),  color: STAT_COLORS[3] },
  ];

  // Axis card shared style helper
  const axisStyle = (color: string) => ({
    bgcolor: dark ? alpha(color, 0.12) : alpha(color, 0.07),
    border: `1px solid ${dark ? alpha(color, 0.35) : alpha(color, 0.25)}`,
    borderRadius: '10px',
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', px: 2, pt: 1.5, pb: 2, gap: 1.5 }}>

      {/* ── Controls bar ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 1, flexWrap: 'wrap' }}>

        {/* Bot selector */}
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mr: 0.25 }}>
            Bot
          </Typography>
          {bots.map((bid, i) => {
            const isSelected = sel === i;
            return (
              <Chip
                key={bid}
                label={data.winner === bid ? `🏆 ${bid}` : bid}
                onClick={() => setSel(i)}
                clickable size="small"
                variant={isSelected ? 'filled' : 'outlined'}
                sx={{
                  height: 26, fontWeight: 700, fontSize: '0.68rem',
                  bgcolor: isSelected ? '#007AFF' : undefined,
                  color: isSelected ? '#fff' : 'text.secondary',
                  borderColor: isSelected ? '#007AFF' : undefined,
                  '&:hover': { borderColor: '#007AFF', color: isSelected ? '#fff' : '#007AFF' },
                }}
              />
            );
          })}
        </Box>

        {/* Info chips */}
        <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip label={`${e.total_cases} cases`} size="small"
            sx={{ height: 24, fontSize: '0.62rem', fontWeight: 700, bgcolor: dark ? 'rgba(0,122,255,0.15)' : 'rgba(0,122,255,0.08)', color: '#007AFF' }} />
          <Chip label={`${e.measured_cases} measured`} size="small" sx={{ height: 24, fontSize: '0.62rem' }} />
          <Chip label={`retrieval ≥ ${fmt(e.thresholds.context_recall)}`} size="small" variant="outlined" sx={{ height: 24, fontSize: '0.6rem' }} />
          <Chip label={`correctness ≥ ${fmt(e.thresholds.answer_correctness)}`} size="small" variant="outlined" sx={{ height: 24, fontSize: '0.6rem' }} />
          {e.skipped_no_gt > 0 && (
            <Tooltip title={`${e.skipped_no_gt} excluded — no ground truth`} arrow>
              <Chip icon={<Info size={10} />} label={`${e.skipped_no_gt} skipped`}
                size="small" color="warning" variant="outlined" sx={{ height: 24, fontSize: '0.6rem' }} />
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* ── Body ── */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: `1fr ${SIDEBAR}px`, gap: 2.5 }}>

        {/* ── Matrix panel (centered) ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
          <Box sx={{ display: 'inline-flex', flexDirection: 'column', gap: `${GAP}px` }}>

            {/* Column headers */}
            <Box sx={{ display: 'flex', gap: `${GAP}px`, pl: `${ROW_W + GAP}px` }}>
              {([
                { label: 'Answer Correct', sub: `correctness ≥ ${fmt(e.thresholds.answer_correctness)}`, color: '#34C759', Icon: CheckCircle2 },
                { label: 'Answer Wrong',   sub: `correctness < ${fmt(e.thresholds.answer_correctness)}`, color: '#FF3B30', Icon: XCircle },
              ] as const).map(({ label, sub, color, Icon }) => (
                <Box key={label} sx={{
                  width: CELL, height: COL_H, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '6px',
                  ...axisStyle(color),
                }}>
                  <Icon size={13} color={color} />
                  <Box>
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: 0.4, lineHeight: 1.2 }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.5rem', color: 'text.disabled', lineHeight: 1.2 }}>
                      {sub}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Data rows */}
            {([
              {
                label: 'Good', sub: `recall ≥ ${fmt(e.thresholds.context_recall)}`,
                color: '#34C759', Icon: TrendingUp,
                cells: [
                  { q: 'TP' as const, count: e.matrix.TP, delay: 0.05 },
                  { q: 'FN' as const, count: e.matrix.FN, delay: 0.1 },
                ],
              },
              {
                label: 'Poor', sub: `recall < ${fmt(e.thresholds.context_recall)}`,
                color: '#FF3B30', Icon: TrendingDown,
                cells: [
                  { q: 'FP' as const, count: e.matrix.FP, delay: 0.15 },
                  { q: 'TN' as const, count: e.matrix.TN, delay: 0.2 },
                ],
              },
            ]).map(({ label, sub, color, Icon, cells }) => (
              <Box key={label} sx={{ display: 'flex', gap: `${GAP}px`, alignItems: 'center' }}>
                {/* Row label */}
                <Box sx={{
                  width: ROW_W, height: CELL, flexShrink: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '6px',
                  ...axisStyle(color),
                }}>
                  <Box sx={{ transform: 'rotate(-90deg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <Icon size={12} color={color} />
                    <Typography sx={{ fontSize: '0.58rem', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.48rem', color: 'text.disabled', whiteSpace: 'nowrap' }}>
                      {sub}
                    </Typography>
                  </Box>
                </Box>
                {/* Cells */}
                {cells.map(({ q, count, delay }) => (
                  <QuadrantCell key={q} q={q} count={count} pct={pct(count)} mode={mode} delay={delay} />
                ))}
              </Box>
            ))}

          </Box>
        </Box>

        {/* ── Right sidebar ── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, minHeight: 0, overflow: 'hidden' }}>

          {/* Stats */}
          <Box sx={{ bgcolor: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '14px', p: 1.5, flexShrink: 0, backdropFilter: 'blur(12px)' }}>
            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>
              Classification Stats
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75 }}>
              {statItems.map(({ label, value, color }) => (
                <Box key={label} sx={{
                  borderRadius: '10px', py: '10px', px: 1,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  bgcolor: dark ? alpha(color, 0.12) : alpha(color, 0.07),
                  border: `1px solid ${dark ? alpha(color, 0.28) : alpha(color, 0.18)}`,
                }}>
                  <Typography sx={{ fontSize: '1.15rem', fontWeight: 900, color, lineHeight: 1, letterSpacing: '-0.03em' }}>
                    {value}
                  </Typography>
                  <Typography sx={{ fontSize: '0.5rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', mt: 0.4 }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Pass rates */}
          <Box sx={{ bgcolor: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '14px', p: 1.5, flexShrink: 0, backdropFilter: 'blur(12px)' }}>
            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>
              Pass Rate by Metric
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {METRICS.map(({ key, label, color }, i) => (
                <MetricRow
                  key={key} label={label}
                  rate={e.pass_rates[key] ?? 0}
                  color={color} dark={dark}
                  delay={0.1 + i * 0.04}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1.25, mt: 1.25, pt: 1, borderTop: `1px solid ${divider}` }}>
              {[{ c: '#34C759', l: '≥ 80%' }, { c: '#FF9500', l: '60–79%' }, { c: '#FF3B30', l: '< 60%' }].map(({ c, l }) => (
                <Box key={l} sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: 99, bgcolor: c, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.52rem', color: 'text.secondary' }}>{l}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Restaurant analogy */}
          <Box sx={{ bgcolor: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '14px', p: 1.5, flexShrink: 0, backdropFilter: 'blur(12px)' }}>
            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#AF52DE', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.75 }}>
              🍽️ Restaurant Analogy
            </Typography>
            <Typography sx={{ fontSize: '0.58rem', color: 'text.secondary', mb: 1 }}>
              <b style={{ color: dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)' }}>Waiter</b> = retrieval &nbsp;·&nbsp;
              <b style={{ color: dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)' }}>Chef</b> = LLM
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(Object.keys(Q) as Array<keyof typeof Q>).map((k) => {
                const cfg = Q[k];
                const Icon = cfg.icon;
                const color = cfg.color[mode];
                return (
                  <Box key={k} sx={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <Box sx={{
                      width: 20, height: 20, borderRadius: '6px', flexShrink: 0,
                      bgcolor: dark ? alpha(color, 0.18) : alpha(color, 0.1),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={11} color={color} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color, lineHeight: 1.25 }}>
                        {cfg.short} · {cfg.analogy}
                      </Typography>
                      <Typography sx={{ fontSize: '0.54rem', color: 'text.secondary', lineHeight: 1.3 }}>
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
    </Box>
  );
}
