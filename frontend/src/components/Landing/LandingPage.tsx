"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { alpha, Avatar, Box, Button, Container, Typography, useTheme } from '@mui/material';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { CognizantIcon } from '../Common/CognizantIcon';

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  const theme = useTheme();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const starLayers = useMemo(() => {
    const spectralColors = ['#ffffff', '#dbeafe', '#eff6ff', '#bfdbfe', '#2563eb'];
    return Array.from({ length: 5 }).map((_, layerIdx) => {
      const density = [250, 150, 80, 40, 20][layerIdx];
      return Array.from({ length: density }).map((__, i) => {
        const size = Math.random() * (layerIdx + 1) * 0.9 + 0.6;
        return {
          id: `layer-${layerIdx}-star-${i}`,
          top: Math.random() * 100,
          left: Math.random() * 100,
          size,
          duration: Math.random() * 2 + 1,
          delay: Math.random() * 5,
          color: spectralColors[Math.floor(Math.random() * spectralColors.length)],
          parallax: (layerIdx + 1) * 0.15,
          hasSpikes: layerIdx >= 3 && size > 3.0 && Math.random() > 0.4,
          twinkleType: Math.random() > 0.5 ? 'classic' : 'rapid',
        };
      });
    });
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const meteorConfigs = useMemo(
    () =>
      Array.from({ length: 12 }, (_, idx) => ({
        id: idx + 1,
        initialTop: `${(idx * 13.7) % 50}%`,
        initialLeft: `${110 + ((idx * 17.9) % 20)}%`,
        animateTop: `${80 + ((idx * 11.3) % 40)}%`,
        animateLeft: `${-20 + ((idx * 19.1) % 20)}%`,
        duration: 0.8 + (((idx * 7) % 5) / 10),
        repeatDelay: 1 + ((idx * 3.5) % 8),
      })),
    []
  );

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: (t) => (t.palette.mode === 'dark' ? '#000' : '#f0f4f8'),
        backgroundImage: (t) =>
          t.palette.mode === 'dark'
            ? `
          radial-gradient(circle at 50% 100%, #172554 0%, #020617 60%, #000 100%),
          radial-gradient(circle at 10% 10%, rgba(56, 189, 248, 0.05) 0%, transparent 40%)
        `
            : `
          radial-gradient(circle at 50% 10%, #ffffff 0%, #f1f5f9 100%)
        `,
      }}
    >
      <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
        <motion.div
          animate={{
            opacity: theme.palette.mode === 'dark' ? [0.3, 0.5, 0.3] : [0.1, 0.2, 0.1],
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '80%',
            height: '80%',
            background: 'radial-gradient(ellipse at center, rgba(56, 189, 248, 0.03) 0%, transparent 60%)',
            filter: 'blur(100px)',
          }}
        />
        <motion.div
          animate={{ opacity: [0.2, 0.4, 0.2], scale: [1.1, 1, 1.1], rotate: [0, -5, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '10%',
            width: '70%',
            height: '70%',
            background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.03) 0%, transparent 60%)',
            filter: 'blur(100px)',
          }}
        />
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          right: '15%',
          zIndex: 5,
          pointerEvents: 'none',
          transform: `translate(${(mousePos.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * -0.02}px, ${(mousePos.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * -0.02}px)`,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
        <Box
          sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
            boxShadow:
              theme.palette.mode === 'dark'
                ? 'inset -20px -20px 40px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.4)'
                : 'inset -5px -5px 15px rgba(0,0,0,0.05), 0 10px 30px rgba(37, 99, 235, 0.1)',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '20%',
              left: '30%',
              width: 15,
              height: 15,
              borderRadius: '50%',
              bgcolor: 'rgba(0,0,0,0.05)',
              boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '60%',
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: 'rgba(0,0,0,0.05)',
              boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.1)',
            }}
          />
        </Box>
      </Box>

      {starLayers.map((layer, layerIdx) => (
        <motion.div
          key={`layer-${layerIdx}`}
          style={{
            position: 'absolute',
            inset: -200,
            zIndex: 10 + layerIdx,
            x: (mousePos.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * layer[0].parallax * -0.1,
            y: (mousePos.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * layer[0].parallax * -0.1,
          }}
        >
          {layer.map((star) => (
            <Box key={star.id} sx={{ position: 'absolute', top: `${star.top}%`, left: `${star.left}%`, pointerEvents: 'none' }}>
              <motion.div
                animate={{
                  opacity: star.twinkleType === 'rapid' ? [0.6, 1, 0.4, 1, 0.6] : [1, 1.2, 1],
                  scale: star.twinkleType === 'rapid' ? [1, 1.3, 1, 1.4, 1] : [1, 1.2, 1],
                }}
                transition={{ duration: star.duration, repeat: Infinity, delay: star.delay, ease: 'easeInOut' }}
                style={{
                  width: star.size,
                  height: star.size,
                  borderRadius: '50%',
                  backgroundColor: star.color,
                  boxShadow: `0 0 ${star.size * 5}px ${star.color}, 0 0 ${star.size * 2}px #fff`,
                }}
              />
            </Box>
          ))}
        </motion.div>
      ))}

      <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 15 }}>
        {meteorConfigs.map((meteor) => (
          <motion.div
            key={`meteor-${meteor.id}`}
            initial={{ top: meteor.initialTop, left: meteor.initialLeft, opacity: 0, scaleX: 0 }}
            animate={{ top: meteor.animateTop, left: meteor.animateLeft, opacity: [0, 1, 0.8, 0], scaleX: [0, 1.5, 0] }}
            transition={{ duration: meteor.duration, repeat: Infinity, repeatDelay: meteor.repeatDelay, delay: meteor.id * 2, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: 150,
              height: 1,
              background: 'linear-gradient(90deg, #fff, transparent)',
              boxShadow: '0 0 10px #fff',
              transformOrigin: 'right center',
              transform: 'rotate(-35deg)',
            }}
          />
        ))}
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 100, textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 6 }}>
            <motion.div
              animate={{ scale: [1, 1.18, 1], opacity: [0.32, 0, 0.32] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: '1.5px solid rgba(56, 189, 248, 0.28)', pointerEvents: 'none' }}
            />
            <motion.div
              animate={{
                scale: [1, 1.03, 1],
                boxShadow: ['0 0 26px rgba(56, 189, 248, 0.16)', '0 0 52px rgba(56, 189, 248, 0.28)', '0 0 26px rgba(56, 189, 248, 0.16)'],
              }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{
                padding: '24px',
                borderRadius: '50%',
                background: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                border: theme.palette.mode === 'dark' ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(56, 189, 248, 0.3)',
                backdropFilter: 'blur(20px)',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <CognizantIcon size={72} color="#38bdf8" strokeWidth={1.5} />
            </motion.div>
          </Box>

          <Typography
            variant="overline"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 'fit-content',
              mx: 'auto',
              mb: 1.4,
              px: 3,
              py: 1,
              borderRadius: 99,
              letterSpacing: '0.1em',
              fontWeight: 700,
              fontSize: '0.72rem',
              position: 'relative',
              zIndex: 3,
              textTransform: 'none',
              color: 'text.secondary',
              border: (t) => `1px solid ${t.palette.divider}`,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.05)',
              backdropFilter: 'blur(10px)',
            }}
          >
            🏆 Gen-AI-athon 2026
          </Typography>

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '4rem', md: '7.5rem' },
              fontWeight: 900,
              lineHeight: 0.85,
              mt: 0,
              mb: 4,
              letterSpacing: '-0.06em',
              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(to bottom, #ffffff 40%, rgba(255,255,255,0.1) 120%)'
                  : 'linear-gradient(to bottom, #0f172a 40%, rgba(15, 23, 42, 0.5) 120%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: `drop-shadow(0 0 20px ${alpha('#38bdf8', 0.3)})`,
            }}
          >
             RAG <span style={{ color: '#38bdf8' }}>EVAL</span>
          </Typography>

          <Typography
            variant="h4"
            sx={{
              color: 'text.primary',
              mb: 3,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              background: theme.palette.mode === 'dark' ? 'linear-gradient(to right, #94a3b8, #fff, #94a3b8)' : 'linear-gradient(to right, #475569, #0f172a, #475569)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              opacity: 0.9,
            }}
          >
            High-Fidelity Observatory for RAG Diagnostics
          </Typography>

          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, fontWeight: 400, lineHeight: 1.8, fontSize: '1.2rem', maxWidth: '700px', mx: 'auto' }}>
            High-precision evaluation framework for RAG systems
            <br />
            Architected for enterprise-grade benchmarking and insight.
          </Typography>

          <Box sx={{ mb: 6 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                px: 3,
                py: 1,
                borderRadius: '99px',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                border: (t) => `1px solid ${t.palette.divider}`,
                boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.05)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Avatar src="/Aniket.jpeg" sx={{ width: 32, height: 32, border: '1.5px solid #38bdf8' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Design Architect: <span style={{ color: theme.palette.text.primary }}>Aniket Marwadi</span>
              </Typography>
            </Box>
          </Box>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7, duration: 0.5 }}>
            <Button
              onClick={onEnter}
              variant="contained"
              size="large"
              endIcon={<ChevronRight />}
              sx={{
                height: 48,
                px: 4,
                borderRadius: 99,
                fontSize: '1rem',
                fontWeight: 800,
                background: '#2563eb',
                color: '#fff',
                textTransform: 'none',
                border: (t) => `1px solid ${t.palette.divider}`,
                boxShadow: (t) => (t.palette.mode === 'dark' ? '0 8px 32px rgba(37, 99, 235, 0.5)' : '0 8px 20px rgba(37, 99, 235, 0.3)'),
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': { background: '#1d4ed8', transform: 'translateY(-2px) scale(1.02)' },
              }}
            >
              Get Started
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  );
}
