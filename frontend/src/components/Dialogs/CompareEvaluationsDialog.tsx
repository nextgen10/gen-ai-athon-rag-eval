import React from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { Trophy } from 'lucide-react';
import { toNumber } from '../../lib/number';
import type { EvaluationHistoryEntry } from '../../types/evaluation';

interface CompareEvaluationsDialogProps {
  open: boolean;
  onDialogClose: () => void;
  onResetAndClose: () => void;
  history: EvaluationHistoryEntry[];
  showComparisonResults: boolean;
  compareEval1: string;
  compareEval2: string;
  setCompareEval1: React.Dispatch<React.SetStateAction<string>>;
  setCompareEval2: React.Dispatch<React.SetStateAction<string>>;
  onCompare: () => void;
}

export function CompareEvaluationsDialog({
  open,
  onDialogClose,
  onResetAndClose,
  history,
  showComparisonResults,
  compareEval1,
  compareEval2,
  setCompareEval1,
  setCompareEval2,
  onCompare,
}: CompareEvaluationsDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onDialogClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          boxShadow: (theme) => (theme.palette.mode === 'dark' ? '0 0 40px rgba(14, 165, 233, 0.4)' : '0 10px 40px rgba(0,0,0,0.1)'),
          minHeight: '80vh',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
        Compare Evaluations
      </DialogTitle>
      <DialogContent
        sx={{
          pt: 3,
          maxHeight: 'calc(90vh - 180px)',
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { background: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.03)') },
          '&::-webkit-scrollbar-thumb': {
            background: (theme) => (theme.palette.mode === 'dark' ? 'rgba(120,120,128,0.3)' : 'rgba(120,120,128,0.3)'),
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: (theme) => (theme.palette.mode === 'dark' ? 'rgba(120,120,128,0.5)' : 'rgba(120,120,128,0.5)'),
          },
        }}
      >
        {!showComparisonResults ? (
          <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'text.secondary' }}>First Evaluation</InputLabel>
                <Select
                  value={compareEval1}
                  onChange={(e) => setCompareEval1(e.target.value)}
                  label="First Evaluation"
                  sx={{
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'),
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: (theme) => theme.palette.divider },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                  }}
                >
                  {history.map((run) => (
                    <MenuItem key={run.id} value={run.id} disabled={run.id === compareEval2}>
                      {run.name} - {run.timestamp ? new Date(run.timestamp).toLocaleDateString() : 'N/A'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel sx={{ color: 'text.secondary' }}>Second Evaluation</InputLabel>
                <Select
                  value={compareEval2}
                  onChange={(e) => setCompareEval2(e.target.value)}
                  label="Second Evaluation"
                  sx={{
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'),
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: (theme) => theme.palette.divider },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                  }}
                >
                  {history.map((run) => (
                    <MenuItem key={run.id} value={run.id} disabled={run.id === compareEval1}>
                      {run.name} - {run.timestamp ? new Date(run.timestamp).toLocaleDateString() : 'N/A'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>
        ) : (
          (() => {
            const eval1 = history.find((h) => h.id === compareEval1);
            const eval2 = history.find((h) => h.id === compareEval2);
            if (!eval1 || !eval2) return null;

            const metrics = [
              { label: 'Master RQS Score', key: 'avg_rqs', format: (v: number) => v?.toFixed(3) || 'N/A' },
              { label: 'Answer Correctness', key: 'gt_alignment', format: (v: number) => `${(v * 100).toFixed(1)}%` },
              { label: 'Faithfulness', key: 'avg_faithfulness', format: (v: number) => `${(v * 100).toFixed(1)}%` },
              { label: 'Relevancy', key: 'avg_relevancy', format: (v: number) => `${(v * 100).toFixed(1)}%` },
              { label: 'Context Precision', key: 'avg_context_precision', format: (v: number) => `${(v * 100).toFixed(1)}%` },
              { label: 'Context Recall', key: 'retrieval_success', format: (v: number) => `${(v * 100).toFixed(1)}%` },
            ] as const;

            return (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 6 }}>
                    <Paper sx={{ p: 2.5, bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5, textTransform: 'uppercase', fontWeight: 700 }}>
                        Evaluation 1
                      </Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', mb: 1 }}>{eval1.name}</Typography>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          <strong>Date:</strong> {eval1.timestamp ? new Date(eval1.timestamp).toLocaleString() : 'N/A'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          <strong>Winner:</strong> <span style={{ color: '#34C759', fontWeight: 700 }}>{eval1.winner}</span>
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          <strong>Models:</strong> {Object.keys(eval1.summaries || {}).join(', ')}
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Paper sx={{ p: 2.5, bgcolor: 'rgba(255,45,85,0.08)', border: '1px solid rgba(255,45,85,0.25)', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5, textTransform: 'uppercase', fontWeight: 700 }}>
                        Evaluation 2
                      </Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', mb: 1 }}>{eval2.name}</Typography>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          <strong>Date:</strong> {eval2.timestamp ? new Date(eval2.timestamp).toLocaleString() : 'N/A'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          <strong>Winner:</strong> <span style={{ color: '#34C759', fontWeight: 700 }}>{eval2.winner}</span>
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          <strong>Models:</strong> {Object.keys(eval2.summaries || {}).join(', ')}
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>

                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', mb: 2, color: 'primary.light' }}>Winner Metrics Comparison</Typography>
                <TableContainer
                  component={Paper}
                  sx={{
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'),
                    borderRadius: 2,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    mb: 3,
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase' }}>Metric</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800, color: '#007AFF', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                          Eval 1
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800, color: '#FF2D55', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                          Eval 2
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                          Difference
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {metrics.map((metric) => {
                        const eval1WinnerId = eval1.winner || Object.keys(eval1.summaries || {})[0];
                        const eval2WinnerId = eval2.winner || Object.keys(eval2.summaries || {})[0];
                        const val1 = toNumber(eval1WinnerId ? eval1.summaries?.[eval1WinnerId]?.[metric.key] : 0);
                        const val2 = toNumber(eval2WinnerId ? eval2.summaries?.[eval2WinnerId]?.[metric.key] : 0);
                        const diff = val1 - val2;
                        const diffPercent = (diff * 100).toFixed(1);
                        const isPositive = diff > 0;

                        return (
                          <TableRow key={metric.key} hover>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{metric.label}</TableCell>
                            <TableCell
                              align="center"
                              sx={{ fontWeight: 700, color: isPositive ? '#34C759' : 'text.primary', bgcolor: isPositive ? 'rgba(52,199,89,0.1)' : 'transparent' }}
                            >
                              {metric.format(val1)}
                              {isPositive && <Trophy size={14} style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                fontWeight: 700,
                                color: !isPositive && diff !== 0 ? '#34C759' : 'text.primary',
                                bgcolor: !isPositive && diff !== 0 ? 'rgba(52,199,89,0.1)' : 'transparent',
                              }}
                            >
                              {metric.format(val2)}
                              {!isPositive && diff !== 0 && <Trophy size={14} style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={`${diff > 0 ? '+' : ''}${diffPercent}${metric.key === 'avg_rqs' ? '' : '%'}`}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.7rem',
                                  bgcolor: diff > 0 ? 'rgba(52,199,89,0.15)' : diff < 0 ? 'rgba(255,59,48,0.15)' : 'rgba(142,142,147,0.15)',
                                  color: diff > 0 ? '#34C759' : diff < 0 ? '#FF3B30' : '#8E8E93',
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })()
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Button
          variant="contained"
          onClick={onResetAndClose}
          sx={{
            borderRadius: 99,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.85rem',
            background: '#FF3B30',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            border: 'none',
            boxShadow: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: '#FF453A',
              boxShadow: 'none',
              color: '#fff',
            },
          }}
        >
          {showComparisonResults ? 'Close' : 'Cancel'}
        </Button>
        {!showComparisonResults && (
          <Tooltip title={!compareEval1 || !compareEval2 ? 'Please select two evaluations to compare' : ''} arrow>
            <span>
              <Button
                variant="contained"
                disabled={!compareEval1 || !compareEval2}
                onClick={onCompare}
                sx={{
                  borderRadius: 99,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  background: '#007AFF',
                  backdropFilter: 'blur(10px)',
                  color: '#fff',
                  border: 'none',
                  boxShadow: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: '#0056B3',
                    boxShadow: 'none',
                    color: '#fff',
                  },
                  '&.Mui-disabled': {
                    background: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                    color: (theme) => theme.palette.text.disabled,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    boxShadow: 'none',
                  },
                }}
              >
                Compare
              </Button>
            </span>
          </Tooltip>
        )}
      </DialogActions>
    </Dialog>
  );
}
