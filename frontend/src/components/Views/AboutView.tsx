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
import { AlertTriangle, CheckCircle2, Compass, Layers, Mail, ShieldCheck, Target } from 'lucide-react';
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
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)'),
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
                border: '2px solid #2563eb',
                boxShadow: '0 0 20px rgba(37, 99, 235, 0.3)',
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
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
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
                borderColor: '#2563eb',
                background: 'rgba(37, 99, 235, 0.1)',
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
            background: (theme) => (theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.3)'),
            borderRadius: '10px',
            border: (theme) => (theme.palette.mode === 'dark' ? 'none' : '2px solid transparent'),
            backgroundClip: 'padding-box',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: (theme) => (theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.4)' : 'rgba(37, 99, 235, 0.5)'),
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
            color="#2563eb"
            icon={<Target size={24} />}
          />

          <MetricExplanationCard
            title="Faithfulness (Groundedness)"
            description="RAGAS metric that measures whether answer claims are supported by retrieved context."
            details="RAGAS formula (faithfulness): F = N_supported_claims / N_total_claims. High F means the answer stays grounded in retrieved evidence."
            example="If 4 claims are made and 3 are supported by context, faithfulness = 3/4 = 0.75."
            color="#10b981"
            icon={<ShieldCheck size={24} />}
          />

          <MetricExplanationCard
            title="Answer Relevancy"
            description="LLM-judge metric in this app that scores how directly the answer addresses the question."
            details="Implemented as deterministic LLM scoring (temperature=0) with normalized output in [0,1]. This replaces embedding-based relevancy in the current pipeline."
            example="Question asks for a direct policy value, but the answer is mostly unrelated narrative -> low answer relevancy."
            color="#3b82f6"
            icon={<Target size={24} />}
          />

          <MetricExplanationCard
            title="Context Precision vs. Recall"
            description="RAGAS retrieval diagnostics: precision = signal quality, recall = evidence coverage."
            details="RAGAS context recall: CR = |RelevantClaims_retrieved| / |RelevantClaims_reference|. RAGAS context precision@K: CP = (1/R) * sum_{k=1..K}(Precision@k * rel_k), where rel_k in {0,1} and R = sum rel_k."
            example="High recall + low precision means you retrieved needed evidence but mixed it with noise. Low recall means required evidence was missing."
            color="#f59e0b"
            icon={<Compass size={24} />}
          />

          <MetricExplanationCard
            title="Answer Correctness (GT Alignment)"
            description="LLM-judge metric in this app for factual and semantic alignment with ground truth."
            details="Implemented as deterministic LLM scoring (temperature=0) with normalized output in [0,1]. This score is used directly in RQS as AnswerCorrectness."
            example="Ground truth says '$40M' and answer says '$40 million in Q3' -> high correctness even with paraphrasing."
            color="#8b5cf6"
            icon={<Layers size={24} />}
          />

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
                <TableHead sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc') }}>
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
