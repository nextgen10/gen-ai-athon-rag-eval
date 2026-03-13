import React from 'react';
import {
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { Eye } from 'lucide-react';
import { toNumber } from '../../lib/number';
import type { EvaluationHistoryEntry } from '../../types/evaluation';

interface HistoryViewProps {
  filteredHistory: EvaluationHistoryEntry[];
  history: EvaluationHistoryEntry[];
  historyPage: number;
  itemsPerPage: number;
  isLoadingHistory: boolean;
  onLoadReport: (runId: string) => void;
}

export function HistoryView({
  filteredHistory,
  history,
  historyPage,
  itemsPerPage,
  isLoadingHistory,
  onLoadReport,
}: HistoryViewProps) {
  return (
    <Grid container spacing={3} sx={{ height: '100%' }}>
      <Grid size={{ xs: 12 }} sx={{ height: '100%' }}>
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 2,
            bgcolor: 'background.paper',
            border: (theme) => `1px solid ${theme.palette.divider}`,
            boxShadow: (theme) =>
              theme.palette.mode === 'dark' ? '0 0 30px rgba(14, 165, 233, 0.35)' : '0 10px 30px rgba(0,0,0,0.05)',
            height: '100%',
            overflowY: 'auto !important',
            mb: 0,
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-track': {
              background: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.03)'),
            },
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
          <Table sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 800,
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    width: '200px',
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'background.paper',
                    zIndex: 10,
                    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  Date
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 800,
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    width: '250px',
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'background.paper',
                    zIndex: 10,
                    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  Name
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 800,
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    width: '180px',
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'background.paper',
                    zIndex: 10,
                    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  Winner
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 800,
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    width: '120px',
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'background.paper',
                    zIndex: 10,
                    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  Max RQS
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 800,
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    width: '80px',
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'background.paper',
                    zIndex: 10,
                    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredHistory
                .slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage)
                .map((run) => {
                  const winnerId = run.winner || Object.keys(run.summaries || {})[0];
                  const maxRqs = winnerId ? toNumber(run.summaries?.[winnerId]?.avg_rqs) : 0;
                  return (
                    <TableRow key={run.id} hover>
                      <TableCell sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
                        {run.timestamp ? new Date(run.timestamp).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>{run.name}</TableCell>
                      <TableCell sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
                        <Chip
                          label={run.winner || 'N/A'}
                          size="small"
                          sx={{ bgcolor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
                        <Typography sx={{ fontWeight: 700, color: 'primary.light' }}>{winnerId ? maxRqs.toFixed(3) : 'N/A'}</Typography>
                      </TableCell>
                      <TableCell sx={{ width: '80px', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
                        <Tooltip title="Load Report" arrow>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => onLoadReport(run.id)}
                            sx={{ borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)' } }}
                          >
                            <Eye size={18} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              {history.length === 0 && !isLoadingHistory && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">No historical evaluations found.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {isLoadingHistory && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={32} />
                    <Typography color="text.secondary" sx={{ mt: 2 }}>
                      Loading evaluation history...
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
}
