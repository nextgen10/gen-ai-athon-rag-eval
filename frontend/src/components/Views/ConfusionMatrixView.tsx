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

// ─── Quadrant config ──────────────────────────────────────────────────────────

const Q = {
  TP: {
    label: 'True Positive',  short: 'TP',
    analogy: 'Great waiter, great chef',
    action: 'Pipeline healthy end-to-end',
    icon: CheckCircle2,
    accent: { light: '#059669', dark: '#34d399' },
    bg:     { light: 'linear-gradient(145deg,#d1fae5,#a7f3d0)', dark: 'linear-gradient(145deg,rgba(6,95,70,.55),rgba(4,120,87,.35))' },
    border: { light: '#6ee7b7', dark: 'rgba(52,211,153,.4)' },
    text:   { light: '#065f46', dark: '#6ee7b7' },
  },
  FN: {
    label: 'False Negative', short: 'FN',
    analogy: 'Great waiter, bad chef',
    action: 'Fix LLM prompt or model',
    icon: ChefHat,
    accent: { light: '#d97706', dark: '#fbbf24' },
    bg:     { light: 'linear-gradient(145deg,#fef3c7,#fde68a)', dark: 'linear-gradient(145deg,rgba(120,53,15,.55),rgba(146,64,14,.35))' },
    border: { light: '#fcd34d', dark: 'rgba(251,191,36,.4)' },
    text:   { light: '#78350f', dark: '#fde68a' },
  },
  FP: {
    label: 'False Positive', short: 'FP',
    analogy: 'Bad waiter, somehow tasty',
    action: 'Hallucination risk — fix retrieval',
    icon: AlertTriangle,
    accent: { light: '#ea580c', dark: '#fb923c' },
    bg:     { light: 'linear-gradient(145deg,#ffedd5,#fed7aa)', dark: 'linear-gradient(145deg,rgba(124,45,18,.55),rgba(154,52,18,.35))' },
    border: { light: '#fdba74', dark: 'rgba(251,146,60,.4)' },
    text:   { light: '#7c2d12', dark: '#fed7aa' },
  },
  TN: {
    label: 'True Negative',  short: 'TN',
    analogy: 'Bad waiter, bad chef',
    action: 'Fix chunking or index',
    icon: UtensilsCrossed,
    accent: { light: '#dc2626', dark: '#f87171' },
    bg:     { light: 'linear-gradient(145deg,#fee2e2,#fecaca)', dark: 'linear-gradient(145deg,rgba(127,29,29,.55),rgba(153,27,27,.35))' },
    border: { light: '#fca5a5', dark: 'rgba(248,113,113,.4)' },
    text:   { light: '#7f1d1d', dark: '#fecaca' },
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

// Sizes — tweak here to scale everything proportionally
const CELL = 158;   // quadrant cell px
const LABEL = 60;   // axis label card px (square)
const GAP = 3;      // gap between all cells px

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      sx={{
        width: CELL, height: CELL, flexShrink: 0,
        background: cfg.bg[mode],
        border: `1.5px solid ${cfg.border[mode]}`,
        borderRadius: 2.5,
        display: 'flex', flexDirection: 'column',
        p: 1.5, position: 'relative', overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* Watermark */}
      <Box sx={{ position: 'absolute', bottom: -10, right: -8, opacity: 0.07, pointerEvents: 'none' }}>
        <Icon size={72} />
      </Box>

      {/* Badge + pct */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.5,
          bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
          borderRadius: 99, px: 0.9, py: 0.25,
        }}>
          <Icon size={10} color={cfg.text[mode]} />
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: cfg.text[mode], letterSpacing: 0.8, textTransform: 'uppercase' }}>
            {cfg.short}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: cfg.accent[mode] }}>
          {pct}%
        </Typography>
      </Box>

      {/* Count */}
      <Typography sx={{ fontSize: '2.6rem', fontWeight: 900, color: cfg.accent[mode], lineHeight: 1, letterSpacing: '-0.05em', my: 'auto', pt: 0.5 }}>
        <AnimatedCount target={count} />
      </Typography>

      {/* Footer */}
      <Box>
        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: cfg.text[mode], lineHeight: 1.2 }}>
          {cfg.label}
        </Typography>
        <Typography sx={{ fontSize: '0.58rem', color: cfg.text[mode], opacity: 0.65, mt: 0.2 }}>
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 500 }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: barColor }}>{pct}%</Typography>
      </Box>
      <Box sx={{
        height: 5, borderRadius: 99,
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

// ─── AxisCard ─────────────────────────────────────────────────────────────────

function AxisCard({ children, bg, border }: { children: React.ReactNode; bg: string; border: string }) {
  return (
    <Box sx={{
      width: LABEL, height: LABEL, flexShrink: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      bgcolor: bg, border: `1px solid ${border}`, borderRadius: 2,
      overflow: 'hidden', textAlign: 'center',
    }}>
      {children}
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
  const surf = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)';
  const surfBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const statItems = [
    { label: 'Precision', value: fmt(e.precision), color: '#AF52DE' },
    { label: 'Recall',    value: fmt(e.recall),    color: '#5AC8FA' },
    { label: 'F1 Score',  value: fmt(e.f1),        color: '#BF5AF2' },
    { label: 'Accuracy',  value: fmt(e.accuracy),  color: '#34C759' },
  ];

  // Axis card styles
  const goodBg    = dark ? 'rgba(5,150,105,0.1)'  : 'rgba(5,150,105,0.07)';
  const goodBord  = dark ? 'rgba(52,211,153,0.3)' : 'rgba(5,150,105,0.2)';
  const poorBg    = dark ? 'rgba(220,38,38,0.1)'  : 'rgba(220,38,38,0.07)';
  const poorBord  = dark ? 'rgba(248,113,113,0.3)': 'rgba(220,38,38,0.2)';
  const corrBg    = dark ? 'rgba(5,150,105,0.1)'  : 'rgba(5,150,105,0.07)';
  const corrBord  = dark ? 'rgba(52,211,153,0.3)' : 'rgba(5,150,105,0.2)';
  const wrongBg   = dark ? 'rgba(220,38,38,0.1)'  : 'rgba(220,38,38,0.07)';
  const wrongBord = dark ? 'rgba(248,113,113,0.3)': 'rgba(220,38,38,0.2)';

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', p: 2, gap: 1.5 }}>

      {/* ── Controls: bot selector + info chips ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 1, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          {bots.map((bid, i) => {
            const isSelected = selectedBot === i;
            const isWinner = data.winner && bid === data.winner;
            return (
              <Chip
                key={bid}
                label={isWinner ? `🏆 ${bid}` : bid}
                onClick={() => setSelectedBot(i)}
                clickable size="small"
                variant={isSelected ? 'filled' : 'outlined'}
                sx={{
                  fontWeight: 700, fontSize: '0.72rem',
                  bgcolor: isSelected ? '#007AFF' : undefined,
                  color: isSelected ? '#fff' : 'text.secondary',
                  borderColor: isSelected ? '#007AFF' : (isWinner ? 'warning.main' : undefined),
                  '&:hover': { borderColor: '#007AFF', color: isSelected ? '#fff' : '#007AFF' },
                }}
              />
            );
          })}
        </Box>
        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip label={`${e.total_cases} total`} size="small"
            sx={{ fontSize: '0.65rem', height: 22, bgcolor: dark ? 'rgba(0,122,255,0.15)' : 'rgba(0,122,255,0.08)', color: '#007AFF', fontWeight: 700 }} />
          <Chip label={`${e.measured_cases} measured`} size="small" sx={{ fontSize: '0.65rem', height: 22 }} />
          <Chip label={`recall ≥ ${fmt(e.thresholds.context_recall)}`} size="small" variant="outlined" sx={{ fontSize: '0.62rem', height: 22 }} />
          <Chip label={`correctness ≥ ${fmt(e.thresholds.answer_correctness)}`} size="small" variant="outlined" sx={{ fontSize: '0.62rem', height: 22 }} />
          {e.skipped_no_gt > 0 && (
            <Tooltip title={`${e.skipped_no_gt} skipped — no ground truth`} arrow>
              <Chip icon={<Info size={11} />} label={`${e.skipped_no_gt} skipped`}
                size="small" color="warning" variant="outlined" sx={{ fontSize: '0.62rem', height: 22 }} />
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* ── Body: matrix | sidebar ── */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 204px', gap: 2 }}>

        {/* ── Matrix (centered) ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
          <Box sx={{ display: 'inline-flex', flexDirection: 'column', gap: `${GAP}px` }}>

            {/* Col headers row */}
            <Box sx={{ display: 'flex', gap: `${GAP}px`, ml: `${LABEL + GAP}px` }}>
              {/* Answer Correct */}
              <Box sx={{ width: CELL, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                <AxisCard bg={corrBg} border={corrBord}>
                  <CheckCircle2 size={13} color="#059669" style={{ marginBottom: 2 }} />
                  <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 1.25 }}>
                    Answer<br />Correct
                  </Typography>
                  <Typography sx={{ fontSize: '0.46rem', color: 'text.disabled', mt: 0.4, lineHeight: 1.2 }}>
                    ≥ {fmt(e.thresholds.answer_correctness)}
                  </Typography>
                </AxisCard>
              </Box>

              {/* Answer Wrong */}
              <Box sx={{ width: CELL, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                <AxisCard bg={wrongBg} border={wrongBord}>
                  <XCircle size={13} color="#dc2626" style={{ marginBottom: 2 }} />
                  <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 1.25 }}>
                    Answer<br />Wrong
                  </Typography>
                  <Typography sx={{ fontSize: '0.46rem', color: 'text.disabled', mt: 0.4, lineHeight: 1.2 }}>
                    {'< '}{fmt(e.thresholds.answer_correctness)}
                  </Typography>
                </AxisCard>
              </Box>
            </Box>

            {/* Row 1: Good retrieval */}
            <Box sx={{ display: 'flex', gap: `${GAP}px`, alignItems: 'center' }}>
              <Box sx={{ width: LABEL, height: CELL, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AxisCard bg={goodBg} border={goodBord}>
                  <Box sx={{ transform: 'rotate(-90deg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4 }}>
                    <TrendingUp size={11} color="#059669" />
                    <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap' }}>
                      Good
                    </Typography>
                    <Typography sx={{ fontSize: '0.46rem', color: 'text.disabled', whiteSpace: 'nowrap' }}>
                      recall ≥ {fmt(e.thresholds.context_recall)}
                    </Typography>
                  </Box>
                </AxisCard>
              </Box>
              <QuadrantCell q="TP" count={e.matrix.TP} pct={pct(e.matrix.TP)} themeMode={themeMode} delay={0.05} />
              <QuadrantCell q="FN" count={e.matrix.FN} pct={pct(e.matrix.FN)} themeMode={themeMode} delay={0.1} />
            </Box>

            {/* Row 2: Poor retrieval */}
            <Box sx={{ display: 'flex', gap: `${GAP}px`, alignItems: 'center' }}>
              <Box sx={{ width: LABEL, height: CELL, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AxisCard bg={poorBg} border={poorBord}>
                  <Box sx={{ transform: 'rotate(-90deg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4 }}>
                    <TrendingDown size={11} color="#dc2626" />
                    <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap' }}>
                      Poor
                    </Typography>
                    <Typography sx={{ fontSize: '0.46rem', color: 'text.disabled', whiteSpace: 'nowrap' }}>
                      recall {'< '}{fmt(e.thresholds.context_recall)}
                    </Typography>
                  </Box>
                </AxisCard>
              </Box>
              <QuadrantCell q="FP" count={e.matrix.FP} pct={pct(e.matrix.FP)} themeMode={themeMode} delay={0.15} />
              <QuadrantCell q="TN" count={e.matrix.TN} pct={pct(e.matrix.TN)} themeMode={themeMode} delay={0.2} />
            </Box>

          </Box>
        </Box>

        {/* ── Sidebar ── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minHeight: 0, overflow: 'hidden' }}>

          {/* Stats */}
          <Box sx={{ bgcolor: surf, border: `1px solid ${surfBorder}`, borderRadius: 2.5, p: 1.25, flexShrink: 0 }}>
            <Typography variant="overline" sx={{ fontSize: '0.55rem', color: 'text.disabled', display: 'block', mb: 0.75, letterSpacing: '0.07em' }}>
              Classification Stats
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75 }}>
              {statItems.map(({ label, value, color }) => (
                <Box key={label} sx={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', py: 0.75,
                  bgcolor: dark ? alpha(color, 0.1) : alpha(color, 0.07),
                  border: `1px solid ${alpha(color, dark ? 0.25 : 0.18)}`,
                  borderRadius: 1.5,
                }}>
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: 900, color, lineHeight: 1, letterSpacing: '-0.03em' }}>
                    {value}
                  </Typography>
                  <Typography sx={{ fontSize: '0.52rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.7, mt: 0.25 }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Pass rates */}
          <Box sx={{ bgcolor: surf, border: `1px solid ${surfBorder}`, borderRadius: 2.5, p: 1.25, flexShrink: 0 }}>
            <Typography variant="overline" sx={{ fontSize: '0.55rem', color: 'text.disabled', display: 'block', mb: 0.75, letterSpacing: '0.07em' }}>
              Pass Rate by Metric
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {METRICS.map(({ key, label, color }, i) => (
                <MetricBar key={key} label={label} rate={e.pass_rates[key] ?? 0} color={color} themeMode={themeMode} delay={0.1 + i * 0.04} />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1.25, mt: 1, pt: 0.75, borderTop: `1px solid ${surfBorder}` }}>
              {[{ c: '#34C759', l: '≥ 80%' }, { c: '#FF9500', l: '60–79%' }, { c: '#FF3B30', l: '< 60%' }].map(({ c, l }) => (
                <Box key={l} sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                  <Box sx={{ width: 5, height: 5, borderRadius: 99, bgcolor: c }} />
                  <Typography sx={{ fontSize: '0.52rem', color: 'text.secondary' }}>{l}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Restaurant Analogy */}
          <Box sx={{ bgcolor: surf, border: `1px solid ${surfBorder}`, borderRadius: 2.5, p: 1.25, flexShrink: 0 }}>
            <Typography variant="overline" sx={{ fontSize: '0.55rem', color: '#AF52DE', display: 'block', mb: 0.5, letterSpacing: '0.07em' }}>
              🍽️ Restaurant Analogy
            </Typography>
            <Typography sx={{ fontSize: '0.58rem', color: 'text.secondary', mb: 0.75 }}>
              <b style={{ color: '#8E8E93' }}>Waiter</b> = retrieval &nbsp;·&nbsp; <b style={{ color: '#8E8E93' }}>Chef</b> = LLM
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
              {(Object.keys(Q) as Array<keyof typeof Q>).map((k) => {
                const cfg = Q[k];
                const Icon = cfg.icon;
                const accent = cfg.accent[themeMode];
                return (
                  <Box key={k} sx={{ display: 'flex', gap: 0.6, alignItems: 'flex-start' }}>
                    <Box sx={{
                      width: 18, height: 18, borderRadius: 1, flexShrink: 0, mt: 0.1,
                      bgcolor: alpha(accent, dark ? 0.15 : 0.1),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={10} color={accent} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: accent, lineHeight: 1.2 }}>
                        {cfg.short} · {cfg.analogy}
                      </Typography>
                      <Typography sx={{ fontSize: '0.53rem', color: 'text.secondary', lineHeight: 1.3 }}>
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
