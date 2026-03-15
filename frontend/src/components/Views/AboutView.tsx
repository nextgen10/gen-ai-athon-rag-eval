import React from 'react';
import {
  Avatar,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { AlertTriangle, CheckCircle2, Compass, Grid, Layers, Mail, ShieldCheck, Target } from 'lucide-react';
import { MetricExplanationCard } from '../Common/MetricExplanationCard';
import { CognizantIcon } from '../Common/CognizantIcon';

export function AboutView() {
  return (
    <Box sx={{ height: '100%', overflow: 'hidden', width: '100%', display: 'flex', gap: 3 }}>
      <Box sx={{ width: 340, height: '100%', overflow: 'hidden', flexShrink: 0, pt: 2 }}>
        <Paper
          sx={{
            p: 4,
            borderRadius: 4,
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(28,28,30,0.7)' : 'rgba(255,255,255,0.9)'),
            border: (theme) => `1px solid ${theme.palette.divider}`,
            backdropFilter: 'blur(20px)',
            boxShadow: (theme) => (theme.palette.mode === 'dark' ? '0 8px 32px rgba(0, 0, 0, 0.2)' : '0 10px 30px rgba(0,0,0,0.05)'),
            height: 'calc(100% - 16px)',
            overflowY: 'hidden',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar
              src="/Aniket.jpeg"
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                border: '2px solid #007AFF',
                boxShadow: 'none',
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5, color: 'text.primary' }}>
              Aniket Marwadi
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1, color: 'text.secondary' }}>
              Cognizant | DIGITAL STRATEGY ARCHITECT
            </Typography>
          </Box>

          <Divider sx={{ my: 3, opacity: 0.6, borderColor: (theme) => theme.palette.divider }} />

          <Stack spacing={2.5}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(0,122,255,0.1)', color: '#007AFF' }}>
                <Mail size={18} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                aniket.marwadi@cognizant.com
              </Typography>
            </Box>
          </Stack>

          <Button
            fullWidth
            variant="outlined"
            sx={{
              mt: 4,
              py: 1.5,
              borderRadius: 3,
              borderColor: (theme) => theme.palette.divider,
              color: 'text.primary',
              textTransform: 'none',
              background: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: '#007AFF',
                background: 'rgba(0,122,255,0.08)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            Contact Me
          </Button>
        </Paper>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { background: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.03)') },
          '&::-webkit-scrollbar-thumb': {
            background: (theme) => (theme.palette.mode === 'dark' ? 'rgba(120,120,128,0.3)' : 'rgba(120,120,128,0.3)'),
            borderRadius: '10px',
            border: (theme) => (theme.palette.mode === 'dark' ? 'none' : '2px solid transparent'),
            backgroundClip: 'padding-box',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: (theme) => (theme.palette.mode === 'dark' ? 'rgba(120,120,128,0.5)' : 'rgba(120,120,128,0.5)'),
            backgroundClip: 'padding-box',
          },
        }}
      >
        <Stack spacing={4} sx={{ pb: 2, pt: 2 }}>
          <MetricExplanationCard
            title="RQS (Retrieval Quality Score)"
            description="A single production score used to rank bots in Multi RAG EVAL."
            details="Formula used in this app: RQS = (alpha * AnswerCorrectness) + (beta * Faithfulness) + (gamma * AnswerRelevancy) + (delta * ((ContextPrecision + ContextRecall) / 2)), where delta = max(0, 1 - alpha - beta - gamma)."
            example="If alpha+beta+gamma = 0.80, then delta = 0.20 and that 0.20 is applied to average retrieval health ((precision + recall)/2)."
            color="#007AFF"
            icon={<Target size={24} />}
          />

          <MetricExplanationCard
            title="Faithfulness (Groundedness)"
            description="RAGAS metric that measures whether answer claims are supported by retrieved context."
            details="RAGAS formula (faithfulness): F = N_supported_claims / N_total_claims. High F means the answer stays grounded in retrieved evidence."
            example="If 4 claims are made and 3 are supported by context, faithfulness = 3/4 = 0.75."
            color="#34C759"
            icon={<ShieldCheck size={24} />}
          />

          <MetricExplanationCard
            title="Answer Relevancy"
            description="LLM-judge metric in this app that scores how directly the answer addresses the question."
            details="Implemented as deterministic LLM scoring (temperature=0) with normalized output in [0,1]. This replaces embedding-based relevancy in the current pipeline."
            example="Question asks for a direct policy value, but the answer is mostly unrelated narrative -> low answer relevancy."
            color="#007AFF"
            icon={<Target size={24} />}
          />

          <MetricExplanationCard
            title="Context Precision vs. Recall"
            description="RAGAS retrieval diagnostics: precision = signal quality, recall = evidence coverage."
            details="RAGAS context recall: CR = |RelevantClaims_retrieved| / |RelevantClaims_reference|. RAGAS context precision@K: CP = (1/R) * sum_{k=1..K}(Precision@k * rel_k), where rel_k in {0,1} and R = sum rel_k."
            example="High recall + low precision means you retrieved needed evidence but mixed it with noise. Low recall means required evidence was missing."
            color="#FF9500"
            icon={<Compass size={24} />}
          />

          <MetricExplanationCard
            title="Answer Correctness (GT Alignment)"
            description="LLM-judge metric in this app for factual and semantic alignment with ground truth."
            details="Implemented as deterministic LLM scoring (temperature=0) with normalized output in [0,1]. This score is used directly in RQS as AnswerCorrectness."
            example="Ground truth says '$40M' and answer says '$40 million in Q3' -> high correctness even with paraphrasing."
            color="#AF52DE"
            icon={<Layers size={24} />}
          />

          <MetricExplanationCard
            title="Confusion Matrix"
            description="A per-bot diagnostic that cross-tabulates retrieval quality against generation quality across all test cases."
            details="Axes: Retrieval = context_recall ≥ threshold (good/poor). Generation = answer_correctness ≥ threshold (correct/wrong). Only cases with ground_truth are placed in the matrix; cases without are counted separately as skipped. Precision, Recall, F1, and Accuracy are derived from the four quadrant counts."
            example="10 cases: TP=6, FN=2, FP=1, TN=1 → Precision=6/(6+1)=0.86, Recall=6/(6+2)=0.75, F1=0.80. The 2 FN cases tell you retrieval is working but generation is the bottleneck."
            color="#5856D6"
            icon={<Grid size={24} />}
          />

          <Box sx={{ mt: 1, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 8, height: 24, bgcolor: '#5856D6', borderRadius: 1 }} />
              Confusion Matrix — Quadrant Reference
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 600 }}>
              Each test case is placed in one of four quadrants based on whether retrieval and generation both meet their configured thresholds.
              The <span style={{ fontWeight: 800, color: '#5856D6' }}>restaurant analogy</span> — waiter = retrieval, chef = LLM generation — maps directly onto each outcome.
            </Typography>

            <TableContainer
              component={Paper}
              sx={{
                borderRadius: 3,
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : '#ffffff'),
                border: (theme) => `1px solid ${theme.palette.divider}`,
                overflow: 'hidden',
              }}
            >
              <Table size="small">
                <TableHead sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(242,242,247,1)') }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: 'text.primary', py: 2, width: '10%' }}>QUADRANT</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'text.primary', width: '15%' }}>RETRIEVAL</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'text.primary', width: '15%' }}>GENERATION</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'text.primary', width: '25%' }}>RESTAURANT ANALOGY</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>WHAT TO DO</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    {
                      label: 'TP', color: '#047857', bg: (dark: boolean) => dark ? 'rgba(6,95,70,0.15)' : '#f0fdf4',
                      retrieval: 'Good (≥ threshold)', generation: 'Correct (≥ threshold)',
                      analogy: 'Great waiter, great chef — right ingredients, great dish',
                      action: 'Pipeline working end-to-end. No action needed.',
                    },
                    {
                      label: 'FN', color: '#b45309', bg: (dark: boolean) => dark ? 'rgba(120,53,15,0.15)' : '#fffbeb',
                      retrieval: 'Good (≥ threshold)', generation: 'Wrong (< threshold)',
                      analogy: 'Great waiter, bad chef — right ingredients, ruined dish',
                      action: 'Retrieval is fine. Fix LLM prompt, system message, or generation parameters.',
                    },
                    {
                      label: 'FP', color: '#c2410c', bg: (dark: boolean) => dark ? 'rgba(124,45,18,0.15)' : '#fff7ed',
                      retrieval: 'Poor (< threshold)', generation: 'Correct (≥ threshold)',
                      analogy: 'Bad waiter, somehow tasty — wrong ingredients, lucky dish',
                      action: 'Bot used prior knowledge or got lucky. Treat as hallucination risk even if correct.',
                    },
                    {
                      label: 'TN', color: '#dc2626', bg: (dark: boolean) => dark ? 'rgba(127,29,29,0.15)' : '#fef2f2',
                      retrieval: 'Poor (< threshold)', generation: 'Wrong (< threshold)',
                      analogy: 'Bad waiter, bad chef — wrong ingredients, bad dish',
                      action: 'Fix the retrieval layer first — improve chunking, embedding model, or index.',
                    },
                  ].map((row) => (
                    <TableRow key={row.label} sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ py: 2, bgcolor: (theme) => row.bg(theme.palette.mode === 'dark') }}>
                        <Typography sx={{ fontWeight: 900, color: row.color, fontSize: '1rem', letterSpacing: '-0.02em' }}>
                          {row.label}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.retrieval}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.generation}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.78rem', fontStyle: 'italic', color: 'text.secondary' }}>
                          {row.analogy}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.78rem', color: 'text.primary' }}>
                          {row.action}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* ── Derived metrics from confusion matrix ── */}
          <Box sx={{ mt: 1, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 8, height: 24, bgcolor: '#5856D6', borderRadius: 1 }} />
              Metrics Derived from Confusion Matrix
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 600 }}>
              Using TP, TN, FP, FN we calculate four standard evaluation metrics. Each answers a different question about the bot's performance.
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {[
                {
                  number: '1',
                  title: 'Accuracy',
                  subtitle: 'Overall correctness of the model.',
                  color: '#34C759',
                  numerator: 'TP + TN',
                  denominator: 'TP + TN + FP + FN',
                  note: 'Good baseline measure, but can be misleading on imbalanced datasets.',
                },
                {
                  number: '2',
                  title: 'Precision',
                  subtitle: 'How many predicted positives were actually correct.',
                  color: '#5856D6',
                  numerator: 'TP',
                  denominator: 'TP + FP',
                  note: 'Use when false positives are costly — e.g. confidently wrong answers erode user trust.',
                },
                {
                  number: '3',
                  title: 'Recall  (Sensitivity)',
                  subtitle: 'How many actual positives were detected.',
                  color: '#5AC8FA',
                  numerator: 'TP',
                  denominator: 'TP + FN',
                  note: 'Use when missing positives is dangerous — e.g. failing to surface a critical answer.',
                },
                {
                  number: '4',
                  title: 'F1 Score',
                  subtitle: 'Harmonic mean — balances precision and recall.',
                  color: '#AF52DE',
                  numeratorNode: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '0.95rem' }}>
                        Precision
                      </Typography>
                      <Typography sx={{ fontWeight: 900, fontSize: '1rem', mx: 0.25 }}>×</Typography>
                      <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '0.95rem' }}>
                        Recall
                      </Typography>
                    </Box>
                  ),
                  denominatorNode: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '0.95rem' }}>
                        Precision
                      </Typography>
                      <Typography sx={{ fontWeight: 900, fontSize: '1rem', mx: 0.25 }}>+</Typography>
                      <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '0.95rem' }}>
                        Recall
                      </Typography>
                    </Box>
                  ),
                  prefixNode: (
                    <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '0.95rem', mr: 0.5 }}>
                      2 ×
                    </Typography>
                  ),
                  note: 'Single number to compare models when both precision and recall matter.',
                },
              ].map((m) => (
                <Paper
                  key={m.title}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      borderColor: m.color,
                      boxShadow: `0 8px 30px -8px ${m.color}44`,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Box sx={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      bgcolor: `${m.color}20`, border: `1px solid ${m.color}55`,
                    }}>
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 900, color: m.color }}>{m.number}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'text.primary', lineHeight: 1.2 }}>
                        {m.title}
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>{m.subtitle}</Typography>
                    </Box>
                  </Box>

                  {/* Formula block */}
                  <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)',
                    borderLeft: `3px solid ${m.color}`,
                    borderRadius: '0 8px 8px 0',
                    py: 1.5, px: 2, mb: 1.5, gap: 0.5,
                  }}>
                    {'prefixNode' in m && m.prefixNode}
                    {/* Fraction */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                      {/* Numerator */}
                      <Box sx={{ pb: 0.4 }}>
                        {'numeratorNode' in m && m.numeratorNode ? m.numeratorNode : (
                          <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '0.95rem', color: m.color }}>
                            {(m as any).numerator}
                          </Typography>
                        )}
                      </Box>
                      {/* Dividing line */}
                      <Box sx={{ width: '100%', height: '2px', bgcolor: m.color, borderRadius: 1, opacity: 0.7 }} />
                      {/* Denominator */}
                      <Box sx={{ pt: 0.4 }}>
                        {'denominatorNode' in m && m.denominatorNode ? m.denominatorNode : (
                          <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '0.95rem', color: 'text.secondary' }}>
                            {(m as any).denominator}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  {/* Note */}
                  <Box sx={{
                    p: 1.25, borderRadius: 1.5,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                    border: (theme) => `1px dashed ${theme.palette.divider}`,
                  }}>
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', lineHeight: 1.5, fontStyle: 'italic' }}>
                      {m.note}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>

          <MetricExplanationCard
            title="Hallucination Risk"
            description="Derived safety metric shown in Experiments for quick red/green risk interpretation."
            details="Formula in this app: HallucinationRisk = 1 - Faithfulness. Since faithfulness is RAGAS-grounded, hallucination risk rises when unsupported claims increase."
            example="Faithfulness = 0.22 implies HallucinationRisk = 0.78 (high risk)."
            color="#ef4444"
            icon={<AlertTriangle size={24} />}
          />

          <Box sx={{ mt: 4, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 8, height: 24, bgcolor: '#2563eb', borderRadius: 1 }} />
              Metric Architecture Matrix
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 600 }}>
              A technical breakdown of the signals required to compute each benchmark. Note that{' '}
              <span style={{ fontWeight: 800, color: '#2563eb' }}>Retrieved Context</span> is the most critical element for RAG-specific diagnostics.
            </Typography>

            <TableContainer
              component={Paper}
              sx={{
                borderRadius: 3,
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : '#ffffff'),
                border: (theme) => `1px solid ${theme.palette.divider}`,
                overflow: 'hidden',
              }}
            >
              <Table size="small">
                <TableHead sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(242,242,247,1)') }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: 'text.primary', py: 2 }}>METRIC</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      QUESTION
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      CONTEXT
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      BOT ANSWER
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      GROUND TRUTH
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { name: 'Faithfulness', q: true, c: 'CRUCIAL', a: true, gt: false },
                    { name: 'Contextual Recall', q: true, c: 'CRUCIAL', a: false, gt: true },
                    { name: 'Contextual Precision', q: true, c: 'CRUCIAL', a: false, gt: true },
                    { name: 'Answer Relevancy (LLM)', q: true, c: false, a: true, gt: false },
                    { name: 'Answer Correctness (LLM)', q: true, c: false, a: true, gt: true },
                    { name: 'Toxicity (LLM)', q: true, c: false, a: true, gt: false },
                  ].map((row) => (
                    <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 700, py: 2 }}>
                        {row.name}
                      </TableCell>
                      <TableCell align="center">{row.q ? <Box sx={{ color: '#10b981', display: 'flex', justifyContent: 'center' }}><CheckCircle2 size={18} /></Box> : '—'}</TableCell>
                      <TableCell align="center">
                        {row.c === 'CRUCIAL' ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
                            <CheckCircle2 size={18} color="#2563eb" />
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 900, color: 'primary.main', border: '1px solid', borderColor: 'primary.main', px: 0.5, borderRadius: 0.5 }}>
                              REQUIRED
                            </Typography>
                          </Box>
                        ) : row.c ? (
                          <CheckCircle2 size={18} color="#10b981" />
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell align="center">{row.a ? <Box sx={{ color: '#10b981', display: 'flex', justifyContent: 'center' }}><CheckCircle2 size={18} /></Box> : '—'}</TableCell>
                      <TableCell align="center">{row.gt ? <Box sx={{ color: '#10b981', display: 'flex', justifyContent: 'center' }}><CheckCircle2 size={18} /></Box> : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
