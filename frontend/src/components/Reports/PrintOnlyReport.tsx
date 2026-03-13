import React from 'react';
import {
    Box,
    Typography,
    Avatar,
    Grid,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { CognizantIcon } from '../Common/CognizantIcon';

// Helper functions locally scoped to avoid dependency on main file
const safeVal = (val: any) => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
};

const formatPercent = (val: any) => `${(safeVal(val) * 100).toFixed(1)}%`;
const formatNum = (val: any, dec = 3) => safeVal(val).toFixed(dec);

interface PrintOnlyReportProps {
    data: any;
    leaderboardData: any[];
}

export const PrintOnlyReport: React.FC<PrintOnlyReportProps> = ({ data, leaderboardData }) => {
    if (!data) return null;

    const reportLeaderboard = (() => {
        // 1) Preferred source: summaries (most stable API contract)
        const summaryRows = Object.entries(data?.summaries || {}).map(([botId, s]: [string, any]) => ({
            id: botId,
            avg_rqs: safeVal(s?.avg_rqs),
            gt_alignment: safeVal(s?.gt_alignment),
            avg_faithfulness: safeVal(s?.avg_faithfulness),
            avg_relevancy: safeVal(s?.avg_relevancy),
            avg_context_precision: safeVal(s?.avg_context_precision),
            retrieval_success: safeVal(s?.retrieval_success),
        }));
        if (summaryRows.length > 0) {
            return summaryRows
                .sort((a, b) => b.avg_rqs - a.avg_rqs)
                .map((row, idx) => ({ ...row, rank: idx + 1 }));
        }

        // 2) Fallback source: backend leaderboard payload
        if (Array.isArray(data?.leaderboard) && data.leaderboard.length > 0) {
            return data.leaderboard
                .map((row: any, idx: number) => ({
                    rank: row.rank ?? idx + 1,
                    id: row.id ?? row.bot_id ?? `Bot ${idx + 1}`,
                    avg_rqs: safeVal(row.avg_rqs),
                    gt_alignment: safeVal(row.gt_alignment),
                    avg_faithfulness: safeVal(row.avg_faithfulness),
                    avg_relevancy: safeVal(row.avg_relevancy),
                    avg_context_precision: safeVal(row.avg_context_precision),
                    retrieval_success: safeVal(row.retrieval_success),
                }))
                .sort((a: any, b: any) => safeVal(b.avg_rqs) - safeVal(a.avg_rqs))
                .map((row: any, idx: number) => ({ ...row, rank: idx + 1 }));
        }

        // 3) Last-resort: derive directly from bot_metrics by averaging cases
        const derivedRows = Object.entries(data?.bot_metrics || {}).map(([botId, perCase]: [string, any]) => {
            const rows = Object.values(perCase || {}) as any[];
            const avg = (key: string) => (rows.length ? rows.reduce((sum, r) => sum + safeVal((r as any)?.[key]), 0) / rows.length : 0);
            return {
                id: botId,
                avg_rqs: avg('rqs'),
                gt_alignment: avg('semantic_similarity'),
                avg_faithfulness: avg('faithfulness'),
                avg_relevancy: avg('answer_relevancy'),
                avg_context_precision: avg('context_precision'),
                retrieval_success: avg('context_recall'),
            };
        });

        if (derivedRows.length > 0) {
            return derivedRows
                .sort((a, b) => b.avg_rqs - a.avg_rqs)
                .map((row, idx) => ({ ...row, rank: idx + 1 }));
        }

        // 4) Keep table visible even when truly unavailable
        return [];
    })();

    // Find the top performing model for the summary
    const topModel = reportLeaderboard[0] || {};

    return (
        <Box className="print-only-report" sx={{ display: 'none' }}>
            <Box sx={{ p: '40px', bgcolor: '#ffffff', color: '#1e293b', minHeight: '297mm' }}>

                {/* --- REPORT HEADER --- */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #2563eb', pb: 3, mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Avatar
                            src={process.env.NEXT_PUBLIC_REPORT_AVATAR || undefined}
                            sx={{
                                width: 64,
                                height: 64,
                                border: 'none',
                                boxShadow: 'none',
                                bgcolor: 'transparent !important',
                                color: '#2563eb !important',
                                printColorAdjust: 'exact',
                                WebkitPrintColorAdjust: 'exact'
                            }}
                        >
                            <CognizantIcon size={52} color="#2563eb" />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', mb: 0.5 }}>
                                RAG EVALUATION <span style={{ color: '#2563eb' }}>REPORT</span>
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Automated Benchmark System | Designed by <span style={{ color: '#0f172a' }}>Aniket Marwadi</span>
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, p: '4px 12px', bgcolor: '#f1f5f9', borderRadius: '4px', mb: 1, display: 'inline-block' }}>
                            CONFIDENTIAL
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            ID: {Math.random().toString(36).substr(2, 9).toUpperCase()} | {new Date().toLocaleDateString()}
                        </Typography>
                    </Box>
                </Box>

                {/* --- ALWAYS-VISIBLE LEADERBOARD SNAPSHOT --- */}
                <Box sx={{ mb: 4, p: 2.5, border: '2px solid #2563eb', borderRadius: '12px', bgcolor: '#f8fbff' }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>
                        Leaderboard
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#64748b', mb: 1.5 }}>
                        Ranked by Master RQS
                    </Typography>
                    {reportLeaderboard.length > 0 ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: '50px 1fr 120px', gap: 1, alignItems: 'center' }}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155' }}>RANK</Typography>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155' }}>BOT</Typography>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155' }}>RQS</Typography>
                            {reportLeaderboard.map((row: any) => (
                                <React.Fragment key={`snapshot-${row.id}`}>
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>{row.rank}</Typography>
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{row.id}</Typography>
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#2563eb' }}>{formatNum(row.avg_rqs, 3)}</Typography>
                                </React.Fragment>
                            ))}
                        </Box>
                    ) : (
                        <Typography sx={{ fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>
                            Leaderboard data unavailable for this report.
                        </Typography>
                    )}
                </Box>

                {/* --- PRODUCTION INTELLIGENCE SUMMARY --- */}
                <Box sx={{ mb: 6 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 8, height: 24, bgcolor: '#f59e0b', borderRadius: 1 }} />
                        EXECUTIVE INSIGHTS (PRODUCTION INTELLIGENCE)
                    </Typography>
                    <Grid container spacing={2}>
                        {[
                            { label: 'Top Architect', value: topModel?.id, color: '#2563eb', sub: `RQS: ${formatNum(topModel?.avg_rqs)}` },
                            { label: 'Max Correctness', value: formatPercent(topModel?.gt_alignment), color: '#22c55e', sub: 'Peak consistency' },
                            { label: 'Grounded Faithfulness', value: formatPercent(topModel?.avg_faithfulness), color: '#e879f9', sub: 'Zero-hallucination bias' },
                            { label: 'Contextual Signal', value: formatPercent(topModel?.avg_context_precision), color: '#06b6d4', sub: 'Retrieval precision' },
                            { label: 'Information Recall', value: formatPercent(topModel?.retrieval_success), color: '#6366f1', sub: 'Data coverage' },
                            { label: 'Hallucination Risk', value: formatPercent(1 - safeVal(topModel?.avg_faithfulness)), color: '#ef4444', sub: 'Safety threshold' },
                        ].map((item, i) => (
                            <Grid size={{ xs: 4 }} key={i}>
                                <Box sx={{ p: 2, border: `1px solid ${item.color}33`, bgcolor: `${item.color}05`, borderRadius: '12px' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: item.color, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                                        {item.label}
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>{item.value}</Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>{item.sub}</Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* --- GRANULAR TRANSACTIONAL LOGS --- */}
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 8, height: 24, bgcolor: '#ec4899', borderRadius: 1 }} />
                        02. GRANULAR DRILLDOWN (PER TEST CASE)
                    </Typography>

                    {data.test_cases.map((tc: any, index: number) => (
                        <Box key={tc.id} sx={{ mb: 5, breakInside: 'avoid' }}>
                            <Box sx={{ p: 2.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderBottom: 'none', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                                <Typography variant="caption" sx={{ fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    SCENARIO {index + 1} — ID: {tc.id}
                                </Typography>
                                <Typography sx={{ mt: 1.5, fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', lineHeight: 1.5 }}>
                                    <span style={{ color: '#ec4899', marginRight: '8px', fontWeight: 900 }}>QUERY:</span> {tc.query}
                                </Typography>
                                <Typography sx={{ mt: 1.5, fontWeight: 700, fontSize: '0.85rem', color: '#10b981', lineHeight: 1.5, p: 1.5, bgcolor: '#ecfdf5', borderRadius: 2, border: '1px dashed #10b981' }}>
                                    <span style={{ color: '#059669', marginRight: '8px', fontWeight: 900 }}>GROUND TRUTH:</span> {tc.ground_truth || 'No reference provided.'}
                                </Typography>
                            </Box>

                            <TableContainer sx={{ border: '1px solid #e2e8f0', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800, fontSize: '0.65rem', width: '15%' }}>BOT MODEL</TableCell>
                                            <TableCell sx={{ fontWeight: 800, fontSize: '0.65rem' }}>GENERATED RESPONSE</TableCell>
                                            <TableCell sx={{ fontWeight: 800, fontSize: '0.65rem', width: '8%' }}>FAITH</TableCell>
                                            <TableCell sx={{ fontWeight: 800, fontSize: '0.65rem', width: '8%' }}>REL</TableCell>
                                            <TableCell sx={{ fontWeight: 800, fontSize: '0.65rem', width: '8%' }}>PREC</TableCell>
                                            <TableCell sx={{ fontWeight: 800, fontSize: '0.65rem', width: '8%' }}>RECALL</TableCell>
                                            <TableCell sx={{ fontWeight: 800, fontSize: '0.65rem', width: '10%' }}>RQS</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {Object.keys(data.summaries).map((botId) => {
                                            const m = data.bot_metrics[botId]?.[tc.id] || {};
                                            const response = tc.bot_responses?.[botId] || 'No response captured.';
                                            return (
                                                <TableRow key={`${tc.id}-${botId}`}>
                                                    <TableCell sx={{ verticalAlign: 'top', fontWeight: 800, fontSize: '0.65rem', p: 1.5 }}>{botId}</TableCell>
                                                    <TableCell sx={{ verticalAlign: 'top', fontSize: '0.65rem', lineHeight: 1.5, color: '#475569', py: 1.5, wordBreak: 'break-word' }}>
                                                        {response}
                                                    </TableCell>
                                                    <TableCell sx={{ verticalAlign: 'top', fontWeight: 700, py: 1.5 }}>{formatNum(m.faithfulness, 2)}</TableCell>
                                                    <TableCell sx={{ verticalAlign: 'top', fontWeight: 700, py: 1.5 }}>{formatNum(m.answer_relevancy, 2)}</TableCell>
                                                    <TableCell sx={{ verticalAlign: 'top', fontWeight: 700, py: 1.5 }}>{formatNum(m.context_precision, 2)}</TableCell>
                                                    <TableCell sx={{ verticalAlign: 'top', fontWeight: 700, py: 1.5 }}>{formatNum(m.context_recall, 2)}</TableCell>
                                                    <TableCell sx={{ verticalAlign: 'top', fontWeight: 900, color: '#2563eb', fontSize: '0.75rem', py: 1.5 }}>
                                                        {formatNum(m.rqs, 3)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    ))}
                </Box>

                {/* --- FOOTER --- */}
                <Box sx={{ borderTop: '1px solid #e2e8f0', mt: 8, pt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>EXPORTED: {new Date().toLocaleTimeString()} / {new Date().toLocaleDateString()}</Typography>
                </Box>
            </Box>
        </Box>
    );
};
