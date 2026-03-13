import React from 'react';
import { Box, Paper, Slider, Switch, Typography } from '@mui/material';
import type { ConfigState } from '../../types/evaluation';

type ThresholdKey =
  | 'faithfulnessThreshold'
  | 'answerRelevancyThreshold'
  | 'answerCorrectnessThreshold'
  | 'contextRecallThreshold'
  | 'contextPrecisionThreshold'
  | 'rqsThreshold';

type WeightKey = 'alpha' | 'beta' | 'gamma';

interface ConfigurationViewProps {
  config: ConfigState;
  setConfig: React.Dispatch<React.SetStateAction<ConfigState>>;
  themeMode: 'light' | 'dark';
  thresholdItems: Array<{ key: ThresholdKey; label: string }>;
  weightItems: Array<{ key: WeightKey; label: string }>;
}

export function ConfigurationView({
  config,
  setConfig,
  themeMode,
  thresholdItems,
  weightItems,
}: ConfigurationViewProps) {
  const thresholdToggleMap: Partial<Record<ThresholdKey, keyof ConfigState>> = {
    faithfulnessThreshold: 'faithfulnessEnabled',
    answerRelevancyThreshold: 'answerRelevancyEnabled',
    answerCorrectnessThreshold: 'answerCorrectnessEnabled',
    contextRecallThreshold: 'contextRecallEnabled',
    contextPrecisionThreshold: 'contextPrecisionEnabled',
  };
  const totalRqsWeight = config.alpha + config.beta + config.gamma;
  const isWeightConfigValid = totalRqsWeight <= 1;

  const updateWeight = (key: WeightKey, value: number) => {
    setConfig((prev) => {
      const clamped = Math.max(0, Math.min(1, value));
      const candidate = { ...prev, [key]: clamped };
      const total = candidate.alpha + candidate.beta + candidate.gamma;
      // Hard guard: block increases beyond 1, but allow decreases to recover from invalid states.
      if (total > 1 && clamped > prev[key]) return prev;
      return candidate;
    });
  };

  const panelSx = {
    px: 2.2,
    py: 1.8,
    borderRadius: 2.5,
    bgcolor: 'background.paper',
    border: (theme: { palette: { divider: string } }) => `1px solid ${theme.palette.divider}`,
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1.75, overflow: 'hidden' }}>
      <Box sx={{ flex: 1, minHeight: 0, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', lg: '0.95fr 1.45fr' }, overflow: 'hidden' }}>
        <Paper sx={panelSx}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', mb: 1.2 }}>RQS Weights</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Evaluation model is picked from backend .env default deployment.
          </Typography>

          <Box sx={{ mt: 1.3 }}>
            {weightItems.map((weight) => (
              <Box key={weight.key} sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{weight.label}</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                    {config[weight.key].toFixed(2)}
                  </Typography>
                </Box>
                <Slider size="small" min={0} max={1} step={0.01} value={config[weight.key]} onChange={(_, v) => updateWeight(weight.key, v as number)} />
              </Box>
            ))}

            <Box sx={{ mt: 0.3, p: 1, borderRadius: 1.5, bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)' }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: isWeightConfigValid ? 'text.secondary' : 'error.main',
                  fontWeight: isWeightConfigValid ? 600 : 800,
                }}
              >
                Total configured weight (alpha + beta + gamma): {totalRqsWeight.toFixed(2)} / 1.00
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Remaining RQS weight is auto-distributed across context precision and context recall.
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper sx={panelSx}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', mb: 1 }}>Metric Thresholds</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1.1fr 1.6fr auto', gap: 1, alignItems: 'center', mb: 0.6 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>metric</Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>threshold</Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>enable</Typography>
          </Box>

          {thresholdItems.map((metric) => (
            <Box key={metric.key} sx={{ display: 'grid', gridTemplateColumns: '1.1fr 1.6fr auto', gap: 1, alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>{metric.label}</Typography>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.15 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                    {config[metric.key].toFixed(2)}
                  </Typography>
                </Box>
                <Slider
                  size="small"
                  min={0}
                  max={1}
                  step={0.01}
                  value={config[metric.key]}
                  disabled={
                    (metric.key === 'faithfulnessThreshold' && !config.faithfulnessEnabled) ||
                    (metric.key === 'answerRelevancyThreshold' && !config.answerRelevancyEnabled) ||
                    (metric.key === 'answerCorrectnessThreshold' && !config.answerCorrectnessEnabled) ||
                    (metric.key === 'contextRecallThreshold' && !config.contextRecallEnabled) ||
                    (metric.key === 'contextPrecisionThreshold' && !config.contextPrecisionEnabled)
                  }
                  onChange={(_, v) => setConfig({ ...config, [metric.key]: v as number })}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                {thresholdToggleMap[metric.key] ? (
                  <Switch
                    size="small"
                    checked={Boolean(config[thresholdToggleMap[metric.key] as keyof ConfigState])}
                    onChange={(_, checked) => setConfig({ ...config, [thresholdToggleMap[metric.key] as keyof ConfigState]: checked })}
                  />
                ) : (
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>-</Typography>
                )}
              </Box>
            </Box>
          ))}

          <Box sx={{ mt: 1.3, p: 1, borderRadius: 1.5, bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontWeight: 800 }}>
                Toxicity Metric
              </Typography>
              <Switch
                size="small"
                checked={config.toxicityEnabled}
                onChange={(_, checked) => setConfig({ ...config, toxicityEnabled: checked })}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              This metric has no threshold and is displayed in experiments for safety visibility.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
