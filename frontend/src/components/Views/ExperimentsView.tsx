import React from 'react';
import { CircularProgress, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { Eye } from 'lucide-react';
import { toNumber } from '../../lib/number';
import type { ConfigState, DrilldownRow, EvaluationData, TestCaseData } from '../../types/evaluation';

interface ExperimentsViewProps {
  data: EvaluationData;
  filteredTestCases: TestCaseData[];
  drilldownPage: number;
  itemsPerPage: number;
  effectiveConfig: ConfigState;
  recommendationByKey: Record<string, string>;
  recommendationLoadingByKey: Record<string, boolean>;
  requestRecommendationForRow: (row: DrilldownRow) => Promise<string>;
  openRecommendationDetail: (text: string, rowLabel: string) => void;
}

export function ExperimentsView({
  data,
  filteredTestCases,
  drilldownPage,
  itemsPerPage,
  effectiveConfig,
  recommendationByKey,
  recommendationLoadingByKey,
  requestRecommendationForRow,
  openRecommendationDetail,
}: ExperimentsViewProps) {
  // Use leaderboard order (sorted by RQS desc) so the table always matches
  // the ranking view. Fall back to summaries keys if leaderboard is absent.
  const bots = (data.leaderboard?.map((l) => l.bot_id).filter(Boolean) as string[])
    .length > 0
    ? (data.leaderboard.map((l) => l.bot_id).filter(Boolean) as string[])
    : Object.keys(data.summaries || {});
  const metricColor = (v: number, threshold: number) => (v >= threshold ? '#10b981' : '#ef4444');
  const inverseMetricColor = (v: number, threshold: number) => {
    const inverseThreshold = Math.max(0, 1 - threshold);
    return v <= inverseThreshold ? '#10b981' : '#ef4444';
  };
  const toxicityColor = (v: number) => (v <= 0.1 ? '#10b981' : '#ef4444');
  const metricCellStyle = (enabled: boolean, activeColor: string, weight = 700) => ({
    color: enabled ? activeColor : 'text.disabled',
    fontWeight: enabled ? weight : 600,
    fontStyle: enabled ? 'normal' : 'italic',
  });
  const pageData = filteredTestCases.slice((drilldownPage - 1) * itemsPerPage, drilldownPage * itemsPerPage);
  const truncCell = {
    fontSize: '0.75rem',
    color: 'text.secondary',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as const;
  const tooltipSlotProps = {
    tooltip: {
      sx: {
        maxWidth: 560,
        whiteSpace: 'pre-wrap',
        lineHeight: 1.5,
        fontSize: '0.8rem',
      },
    },
  } as const;
  const stickyHead = {
    position: 'sticky' as const,
    top: 0,
    zIndex: 2,
    bgcolor: (t: Theme) => t.palette.background.paper,
    borderBottom: (t: Theme) => `1px solid ${t.palette.divider}`,
    fontWeight: 800,
    fontSize: '0.68rem',
    lineHeight: 1.2,
    whiteSpace: 'normal',
    overflow: 'visible',
    textOverflow: 'clip',
    py: 1,
  };

  return (
    <Paper sx={{ borderRadius: 2, bgcolor: 'background.paper', border: (t: Theme) => `1px solid ${t.palette.divider}`, overflow: 'hidden' }}>
      <TableContainer
        sx={{
          maxHeight: 'calc(100vh - 220px)',
          overflow: 'auto',
          '&::-webkit-scrollbar': { width: 8, height: 8 },
          '&::-webkit-scrollbar-track': {
            background: (t: Theme) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.06)'),
            borderRadius: 10,
          },
          '&::-webkit-scrollbar-thumb': {
            background: (t: Theme) => (t.palette.mode === 'dark' ? 'rgba(37,99,235,0.35)' : 'rgba(37,99,235,0.45)'),
            borderRadius: 10,
            border: (t: Theme) => (t.palette.mode === 'dark' ? 'none' : '2px solid rgba(255,255,255,0.75)'),
            backgroundClip: 'padding-box',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: (t: Theme) => (t.palette.mode === 'dark' ? 'rgba(37,99,235,0.55)' : 'rgba(37,99,235,0.65)'),
          },
        }}
      >
        <Table size="small" stickyHeader sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...stickyHead, width: '3%' }}>#</TableCell>
              <TableCell sx={{ ...stickyHead, width: '6%' }}>query</TableCell>
              <TableCell sx={{ ...stickyHead, width: '6%' }}>ground truth</TableCell>
              <TableCell sx={{ ...stickyHead, width: '7%' }}>ai response</TableCell>
              <TableCell sx={{ ...stickyHead, width: '7%' }}>context</TableCell>
              <TableCell sx={{ ...stickyHead, width: '6%' }}>bot</TableCell>
              <TableCell sx={{ ...stickyHead, width: '4%', textAlign: 'center' }}>faith.</TableCell>
              <TableCell sx={{ ...stickyHead, width: '5%', textAlign: 'center' }}>hallu.</TableCell>
              <TableCell sx={{ ...stickyHead, width: '7%', textAlign: 'center' }}>ans. rel.</TableCell>
              <TableCell sx={{ ...stickyHead, width: '7%', textAlign: 'center' }}>ans. corr.</TableCell>
              <TableCell sx={{ ...stickyHead, width: '7%', textAlign: 'center' }}>cont. rec.</TableCell>
              <TableCell sx={{ ...stickyHead, width: '7%', textAlign: 'center' }}>cont. prec.</TableCell>
              <TableCell sx={{ ...stickyHead, width: '7%', textAlign: 'center' }}>toxi.</TableCell>
              <TableCell sx={{ ...stickyHead, width: '4%', textAlign: 'center', color: 'primary.main' }}>rqs</TableCell>
              <TableCell sx={{ ...stickyHead, width: '6%' }}>recomm.</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageData.map((testCase, idx) =>
              bots.map((bot, botIdx) => {
                const m = data.bot_metrics?.[bot]?.[testCase.id] || {};
                const faithfulness = effectiveConfig.faithfulnessEnabled ? toNumber(m.faithfulness) : 0;
                const hallucination = effectiveConfig.faithfulnessEnabled ? 1 - faithfulness : 0;
                const answerRelevancy = effectiveConfig.answerRelevancyEnabled ? toNumber(m.answer_relevancy) : 0;
                const answerCorrectness = effectiveConfig.answerCorrectnessEnabled ? toNumber(m.semantic_similarity) : 0;
                const contextRecall = effectiveConfig.contextRecallEnabled ? toNumber(m.context_recall) : 0;
                const contextPrecision = effectiveConfig.contextPrecisionEnabled ? toNumber(m.context_precision) : 0;
                const toxicity = effectiveConfig.toxicityEnabled ? toNumber(m.toxicity) : 0;
                const rqs = toNumber(m.rqs);
                const isRecommendationEligible =
                  (effectiveConfig.faithfulnessEnabled && faithfulness < effectiveConfig.faithfulnessThreshold) ||
                  (effectiveConfig.answerRelevancyEnabled && answerRelevancy < effectiveConfig.answerRelevancyThreshold) ||
                  (effectiveConfig.answerCorrectnessEnabled && answerCorrectness < effectiveConfig.answerCorrectnessThreshold) ||
                  (effectiveConfig.contextRecallEnabled && contextRecall < effectiveConfig.contextRecallThreshold) ||
                  (effectiveConfig.contextPrecisionEnabled && contextPrecision < effectiveConfig.contextPrecisionThreshold) ||
                  rqs < effectiveConfig.rqsThreshold;

                const rowKey = `${testCase.id}-${bot}`;
                const contextRaw = testCase.bot_contexts?.[bot];
                const context = Array.isArray(contextRaw) ? contextRaw.join(' | ') : contextRaw || 'N/A';
                const recommendation = recommendationByKey[rowKey];
                const isRecommendationLoading = recommendationLoadingByKey[rowKey];
                const isFirstRowForCase = botIdx === 0;

                return (
                  <TableRow key={`${testCase.id}-${bot}`} hover>
                    {isFirstRowForCase && <TableCell rowSpan={bots.length}>{(drilldownPage - 1) * itemsPerPage + idx + 1}</TableCell>}
                    {isFirstRowForCase && (
                      <Tooltip title={testCase.query || 'N/A'} arrow slotProps={tooltipSlotProps}>
                        <TableCell rowSpan={bots.length} sx={truncCell}>
                          {testCase.query || 'N/A'}
                        </TableCell>
                      </Tooltip>
                    )}
                    {isFirstRowForCase && (
                      <Tooltip title={testCase.ground_truth || 'N/A'} arrow slotProps={tooltipSlotProps}>
                        <TableCell rowSpan={bots.length} sx={truncCell}>
                          {testCase.ground_truth || 'N/A'}
                        </TableCell>
                      </Tooltip>
                    )}
                    <Tooltip title={testCase.bot_responses?.[bot] || 'N/A'} arrow slotProps={tooltipSlotProps}>
                      <TableCell sx={truncCell}>{testCase.bot_responses?.[bot] || 'N/A'}</TableCell>
                    </Tooltip>
                    <Tooltip title={context} arrow slotProps={tooltipSlotProps}>
                      <TableCell sx={truncCell}>{context}</TableCell>
                    </Tooltip>
                    <TableCell sx={{ fontWeight: 700 }}>{bot}</TableCell>
                    <TableCell
                      align="center"
                      title={effectiveConfig.faithfulnessEnabled ? undefined : 'Disabled in configuration'}
                      sx={metricCellStyle(
                        effectiveConfig.faithfulnessEnabled,
                        metricColor(faithfulness, effectiveConfig.faithfulnessThreshold)
                      )}
                    >
                      {faithfulness.toFixed(2)}
                    </TableCell>
                    <TableCell
                      align="center"
                      title={effectiveConfig.faithfulnessEnabled ? undefined : 'Disabled in configuration'}
                      sx={metricCellStyle(
                        effectiveConfig.faithfulnessEnabled,
                        inverseMetricColor(hallucination, effectiveConfig.faithfulnessThreshold)
                      )}
                    >
                      {hallucination.toFixed(2)}
                    </TableCell>
                    <TableCell
                      align="center"
                      title={effectiveConfig.answerRelevancyEnabled ? undefined : 'Disabled in configuration'}
                      sx={metricCellStyle(
                        effectiveConfig.answerRelevancyEnabled,
                        metricColor(answerRelevancy, effectiveConfig.answerRelevancyThreshold)
                      )}
                    >
                      {answerRelevancy.toFixed(2)}
                    </TableCell>
                    <TableCell
                      align="center"
                      title={effectiveConfig.answerCorrectnessEnabled ? undefined : 'Disabled in configuration'}
                      sx={metricCellStyle(
                        effectiveConfig.answerCorrectnessEnabled,
                        metricColor(answerCorrectness, effectiveConfig.answerCorrectnessThreshold)
                      )}
                    >
                      {answerCorrectness.toFixed(2)}
                    </TableCell>
                    <TableCell
                      align="center"
                      title={effectiveConfig.contextRecallEnabled ? undefined : 'Disabled in configuration'}
                      sx={metricCellStyle(
                        effectiveConfig.contextRecallEnabled,
                        metricColor(contextRecall, effectiveConfig.contextRecallThreshold)
                      )}
                    >
                      {contextRecall.toFixed(2)}
                    </TableCell>
                    <TableCell
                      align="center"
                      title={effectiveConfig.contextPrecisionEnabled ? undefined : 'Disabled in configuration'}
                      sx={metricCellStyle(
                        effectiveConfig.contextPrecisionEnabled,
                        metricColor(contextPrecision, effectiveConfig.contextPrecisionThreshold)
                      )}
                    >
                      {contextPrecision.toFixed(2)}
                    </TableCell>
                    <TableCell
                      align="center"
                      title={effectiveConfig.toxicityEnabled ? undefined : 'Disabled in configuration'}
                      sx={metricCellStyle(effectiveConfig.toxicityEnabled, toxicityColor(toxicity))}
                    >
                      {toxicity.toFixed(2)}
                    </TableCell>
                    <TableCell align="center" sx={{ color: metricColor(rqs, effectiveConfig.rqsThreshold), fontWeight: 900 }}>
                      {rqs.toFixed(3)}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {isRecommendationLoading ? (
                        <CircularProgress size={14} />
                      ) : (
                        <Tooltip
                          title={
                            isRecommendationEligible
                              ? recommendation
                                ? 'View recommendation details'
                                : 'Generate and view recommendation'
                              : 'All scored metrics are above threshold'
                          }
                          arrow
                        >
                          <span>
                            <IconButton
                              size="small"
                              onClick={async () => {
                                if (!isRecommendationEligible) {
                                  return;
                                }
                                let text = recommendation;
                                if (!text) {
                                  text = await requestRecommendationForRow({
                                    key: rowKey,
                                    testCase,
                                    bot,
                                    metrics: m,
                                  });
                                }
                                openRecommendationDetail(text || 'Recommendation is not available yet.', `${testCase.id} • ${bot}`);
                              }}
                              disabled={!isRecommendationEligible}
                              sx={{ p: 0.4, color: recommendation ? 'primary.main' : 'text.secondary' }}
                            >
                              <Eye size={14} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
            {pageData.length === 0 && (
              <TableRow>
                <TableCell colSpan={15} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No rows match current search/filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
