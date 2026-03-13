import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { toNumber } from '../../lib/number';

interface ChartTooltipItem {
  name?: string;
  color?: string;
  value?: string | number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: ChartTooltipItem[];
  label?: string;
}

export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 3,
        boxShadow: (theme) =>
          theme.palette.mode === 'dark' ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.1)',
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
        {label}
      </Typography>
      {payload.map((p, idx) => (
        <Box key={`${p.name || 'metric'}-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color || '#2563eb' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {p.name || 'metric'}:
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, ml: 'auto' }}>
            {toNumber(p.value).toFixed(1)}%
          </Typography>
        </Box>
      ))}
    </Paper>
  );
}
