import React from 'react';
import { Backdrop, Box, CircularProgress, Paper, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { CognizantIcon } from '../Common/CognizantIcon';

interface EvaluationProgressBackdropProps {
  open: boolean;
  statusLogs: string[];
  logEndRef: React.RefObject<HTMLDivElement | null>;
}

export function EvaluationProgressBackdrop({ open, statusLogs, logEndRef }: EvaluationProgressBackdropProps) {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 999,
        backdropFilter: 'blur(20px) saturate(180%)',
        bgcolor: 'rgba(0,0,0,0.85)',
      }}
      open={open}
    >
      <Box
        sx={{
          width: 860,
          textAlign: 'center',
          animation: 'fadeInScale 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 4 }}>
          <CircularProgress
            size={96}
            thickness={2}
            sx={{
              color: '#0A84FF',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <motion.div animate={{ rotate: [0, 15, -15, 15, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
              <CognizantIcon size={40} color="#0A84FF" />
            </motion.div>
          </Box>
        </Box>

        <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.04em', color: '#fff' }}>
          RAG Diagnostic Engine Processing
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 5, opacity: 0.8, fontWeight: 500 }}>
          Synchronizing tokens and calculating RAG metrics...
        </Typography>

        <Paper
          elevation={0}
          sx={{
            bgcolor: 'rgba(0, 0, 0, 0.65)',
            p: 0,
            borderRadius: 4,
            border: '1px solid rgba(0,122,255,0.25)',
            height: 480,
            overflow: 'hidden',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 50px rgba(0,0,0,0.5)',
          }}
        >
          <Box
            sx={{
              px: 3,
              py: 1.5,
              bgcolor: 'rgba(0,0,0,0.6)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FF3B30', opacity: 0.8 }} />
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FF9500', opacity: 0.8 }} />
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#34C759', opacity: 0.8 }} />
            <Typography sx={{ ml: 2, fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.1em', opacity: 0.6, color: 'rgba(235,235,245,0.5)' }}>
              RAG_METRICS_ENGINE_v1.0.0
            </Typography>
          </Box>

          <Box
            className="custom-scrollbar"
            sx={{
              flexGrow: 1,
              p: 4,
              overflow: 'auto',
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            }}
          >
            {statusLogs.map((log, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 3, mb: 1.5, animation: 'fadeInLogs 0.2s ease-out' }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'inherit',
                    color: 'rgba(235,235,245,0.4)',
                    opacity: 0.4,
                    whiteSpace: 'nowrap',
                    width: '90px',
                  }}
                >
                  [{new Date().toLocaleTimeString()}]
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    color: log.includes('SUCCESS') ? '#34C759' : log.includes('CRITICAL') ? '#FF3B30' : '#ffffff',
                    lineHeight: 1.6,
                  }}
                >
                  {log}
                </Typography>
              </Box>
            ))}
            <div ref={logEndRef} />
          </Box>

          <Box sx={{ px: 4, pb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ color: 'primary.main', fontWeight: 900, fontSize: '0.9rem' }}>$</Typography>
            <Box sx={{ width: 12, height: 20, bgcolor: 'primary.main', animation: 'blink 1s infinite' }} />
          </Box>
        </Paper>
      </Box>
    </Backdrop>
  );
}
