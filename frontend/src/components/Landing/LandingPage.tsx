"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { alpha, Avatar, Box, Button, Container, Typography, useTheme } from '@mui/material';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { CognizantIcon } from '../Common/CognizantIcon';

interface LandingPageProps {
  onEnter: () => void;
}

// Apple HIG colours
const APPLE_BLUE  = '#0A84FF';
const APPLE_BLUE2 = '#409CFF';

export function LandingPage({ onEnter }: LandingPageProps) {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const starLayers = useMemo(() => {
    // Apple-toned star palette — whites, light grays, Apple blue highlights
    const spectralColors = ['#ffffff', '#f2f2f7', '#e5e5ea', '#c7c7cc', APPLE_BLUE];
    return Array.from({ length: 5 }).map((_, layerIdx) => {
      const density = [220, 120, 60, 30, 14][layerIdx];
      return Array.from({ length: density }).map((__, i) => {
        const size = Math.random() * (layerIdx + 1) * 0.9 + 0.5;
        return {
          id: `layer-${layerIdx}-star-${i}`,
          top: Math.random() * 100,
          left: Math.random() * 100,
          size,
          duration: Math.random() * 2 + 1.5,
          delay: Math.random() * 6,
          color: spectralColors[Math.floor(Math.random() * spectralColors.length)],
          parallax: (layerIdx + 1) * 0.15,
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
      Array.from({ length: 10 }, (_, idx) => ({
        id: idx + 1,
        initialTop: `${(idx * 13.7) % 50}%`,
        initialLeft: `${110 + ((idx * 17.9) % 20)}%`,
        animateTop: `${80 + ((idx * 11.3) % 40)}%`,
        animateLeft: `${-20 + ((idx * 19.1) % 20)}%`,
        duration: 0.8 + (((idx * 7) % 5) / 10),
        repeatDelay: 1.5 + ((idx * 3.5) % 8),
      })),
    []
  );

  const cx = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
  const cy = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;

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
        bgcolor: dark ? '#000000' : '#F2F2F7',
        backgroundImage: dark
          ? `radial-gradient(ellipse at 50% 0%, rgba(10,132,255,0.12) 0%, transparent 60%),
             radial-gradient(ellipse at 85% 80%, rgba(94,92,230,0.08) 0%, transparent 50%)`
          : `radial-gradient(ellipse at 50% 0%, rgba(0,122,255,0.08) 0%, transparent 60%)`,
      }}
    >
      {/* Ambient glow blobs */}
      <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
        <motion.div
          animate={{ opacity: dark ? [0.25, 0.45, 0.25] : [0.08, 0.16, 0.08], scale: [1, 1.08, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute', top: '5%', left: '5%', width: '90%', height: '90%',
            background: `radial-gradient(ellipse at center, ${alpha(APPLE_BLUE, 0.06)} 0%, transparent 60%)`,
            filter: 'blur(80px)',
          }}
        />
        <motion.div
          animate={{ opacity: dark ? [0.15, 0.3, 0.15] : [0.05, 0.12, 0.05], scale: [1.1, 1, 1.1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute', bottom: '5%', right: '5%', width: '70%', height: '70%',
            background: `radial-gradient(ellipse at center, rgba(94,92,230,0.06) 0%, transparent 60%)`,
            filter: 'blur(80px)',
          }}
        />
      </Box>

      {/* Parallax orb (top-right) */}
      <Box
        sx={{
          position: 'absolute', top: '10%', right: '15%', zIndex: 5, pointerEvents: 'none',
          transform: `translate(${(mousePos.x - cx) * -0.018}px, ${(mousePos.y - cy) * -0.018}px)`,
        }}
      >
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 220, height: 220, borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(APPLE_BLUE, 0.12)} 0%, transparent 70%)`,
          filter: 'blur(24px)',
        }} />
        <Box sx={{
          width: 96, height: 96, borderRadius: '50%',
          background: dark
            ? 'linear-gradient(135deg, #e5e5ea 0%, #8e8e93 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #d1d1d6 100%)',
          boxShadow: dark
            ? `inset -18px -18px 36px rgba(0,0,0,0.6), 0 0 48px ${alpha(APPLE_BLUE, 0.25)}`
            : `inset -5px -5px 12px rgba(0,0,0,0.06), 0 8px 28px rgba(0,122,255,0.12)`,
          position: 'relative',
        }}>
          <Box sx={{ position: 'absolute', top: '18%', left: '28%', width: 14, height: 14, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.06)', boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1)' }} />
          <Box sx={{ position: 'absolute', top: '52%', left: '60%', width: 9, height: 9, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.05)', boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.08)' }} />
        </Box>
      </Box>

      {/* Star layers */}
      {starLayers.map((layer, layerIdx) => (
        <motion.div
          key={`layer-${layerIdx}`}
          style={{
            position: 'absolute', inset: -200, zIndex: 10 + layerIdx,
            x: (mousePos.x - cx) * layer[0].parallax * -0.1,
            y: (mousePos.y - cy) * layer[0].parallax * -0.1,
          }}
        >
          {layer.map((star) => (
            <Box key={star.id} sx={{ position: 'absolute', top: `${star.top}%`, left: `${star.left}%`, pointerEvents: 'none' }}>
              <motion.div
                animate={{
                  opacity: star.twinkleType === 'rapid' ? [0.5, 1, 0.35, 1, 0.5] : [0.8, 1, 0.8],
                  scale:   star.twinkleType === 'rapid' ? [1, 1.3, 1, 1.35, 1]   : [1, 1.15, 1],
                }}
                transition={{ duration: star.duration, repeat: Infinity, delay: star.delay, ease: 'easeInOut' }}
                style={{
                  width: star.size, height: star.size, borderRadius: '50%',
                  backgroundColor: star.color,
                  boxShadow: `0 0 ${star.size * 4}px ${star.color}`,
                }}
              />
            </Box>
          ))}
        </motion.div>
      ))}

      {/* Meteor trails */}
      <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 15 }}>
        {meteorConfigs.map((meteor) => (
          <motion.div
            key={`meteor-${meteor.id}`}
            initial={{ top: meteor.initialTop, left: meteor.initialLeft, opacity: 0, scaleX: 0 }}
            animate={{ top: meteor.animateTop, left: meteor.animateLeft, opacity: [0, 0.9, 0.7, 0], scaleX: [0, 1.4, 0] }}
            transition={{ duration: meteor.duration, repeat: Infinity, repeatDelay: meteor.repeatDelay, delay: meteor.id * 2, ease: 'easeOut' }}
            style={{
              position: 'absolute', width: 130, height: 1,
              background: `linear-gradient(90deg, rgba(255,255,255,0.9), transparent)`,
              boxShadow: `0 0 6px rgba(255,255,255,0.6)`,
              transformOrigin: 'right center',
              transform: 'rotate(-35deg)',
            }}
          />
        ))}
      </Box>

      {/* ── Hero content ── */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 100, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo */}
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 5 }}>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.28, 0, 0.28] }}
              transition={{ duration: 3.2, repeat: Infinity }}
              style={{
                position: 'absolute', inset: -14, borderRadius: '50%',
                border: `1.5px solid ${alpha(APPLE_BLUE, 0.35)}`,
                pointerEvents: 'none',
              }}
            />
            <motion.div
              animate={{
                scale: [1, 1.03, 1],
                boxShadow: [
                  `0 0 24px ${alpha(APPLE_BLUE, 0.18)}`,
                  `0 0 48px ${alpha(APPLE_BLUE, 0.32)}`,
                  `0 0 24px ${alpha(APPLE_BLUE, 0.18)}`,
                ],
              }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{
                padding: '24px',
                borderRadius: '50%',
                background: dark ? 'rgba(28,28,30,0.88)' : 'rgba(255,255,255,0.92)',
                border: `1px solid ${dark ? alpha(APPLE_BLUE, 0.45) : alpha(APPLE_BLUE, 0.25)}`,
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                position: 'relative', zIndex: 2,
              }}
            >
              <CognizantIcon size={72} color={APPLE_BLUE} strokeWidth={1.5} />
            </motion.div>
          </Box>

          {/* Badge */}
          <Typography
            variant="overline"
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 'fit-content', mx: 'auto', mb: 1.5,
              px: 3, py: 1, borderRadius: 99,
              letterSpacing: '0.08em', fontWeight: 700, fontSize: '0.72rem',
              textTransform: 'none', zIndex: 3, position: 'relative',
              color: 'text.secondary',
              border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
              bgcolor: dark ? 'rgba(28,28,30,0.7)' : 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.06)',
            }}
          >
            🏆 Gen-AI-athon 2026
          </Typography>

          {/* Headline */}
          <Box sx={{ mt: 0, mb: 3.5 }}>
            {/* Multi-bot — italic, serif accent */}
            <Typography
              sx={{
                fontSize: { xs: '1.6rem', md: '2.2rem' },
                fontWeight: 300,
                fontStyle: 'normal',
                fontFamily: '"Helvetica Neue", Arial, system-ui, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.3em',
                lineHeight: 1.1,
                mb: 0.5,
                color: dark ? 'rgba(235,235,245,0.55)' : 'rgba(60,60,67,0.55)',
              }}
            >
              Multi-bot
            </Typography>

            {/* RAG EVAL FRAMEWORK — main display headline */}
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '3.2rem', md: '6.5rem' },
                fontWeight: 900,
                lineHeight: 0.88,
                letterSpacing: '-0.05em',
                background: dark
                  ? `linear-gradient(to bottom, #ffffff 30%, rgba(255,255,255,0.15) 110%)`
                  : `linear-gradient(to bottom, #1c1c1e 30%, rgba(28,28,30,0.35) 110%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: `drop-shadow(0 0 24px ${alpha(APPLE_BLUE, 0.28)})`,
              }}
            >
              RAG{' '}
              <span style={{ WebkitTextFillColor: APPLE_BLUE }}>EVAL</span>
            </Typography>
          </Box>

          {/* Sub-heading */}
          <Typography
            variant="h4"
            sx={{
              mb: 2.5, fontWeight: 600, letterSpacing: '-0.025em',
              background: dark
                ? `linear-gradient(to right, rgba(235,235,245,0.5), rgba(255,255,255,0.9), rgba(235,235,245,0.5))`
                : `linear-gradient(to right, rgba(60,60,67,0.6), rgba(28,28,30,0.95), rgba(60,60,67,0.6))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            High-Fidelity Observatory for RAG Diagnostics
          </Typography>

          {/* Description */}
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary', mb: 4, fontWeight: 400,
              lineHeight: 1.75, fontSize: '1.1rem',
              maxWidth: '600px', mx: 'auto',
              letterSpacing: '-0.01em',
            }}
          >
            High-precision evaluation framework for RAG systems.
            <br />
            Architected for enterprise-grade benchmarking and insight.
          </Typography>

          {/* Author pill */}
          <Box sx={{ mb: 5 }}>
            <Box
              sx={{
                display: 'inline-flex', alignItems: 'center', gap: 1.5,
                px: 2.5, py: 1, borderRadius: 99,
                bgcolor: dark ? 'rgba(28,28,30,0.7)' : 'rgba(255,255,255,0.7)',
                border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.06)',
              }}
            >
              <Avatar
                src="/Aniket.jpeg"
                sx={{ width: 30, height: 30, border: `1.5px solid ${APPLE_BLUE}` }}
              />
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.65rem' }}
              >
                Design Architect:{' '}
                <span style={{ color: dark ? '#ffffff' : '#1c1c1e', fontWeight: 700 }}>
                  Aniket Marwadi
                </span>
              </Typography>
            </Box>
          </Box>

          {/* CTA button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.65, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Button
              onClick={onEnter}
              variant="contained"
              size="large"
              endIcon={<ChevronRight />}
              sx={{
                height: 50, px: 4.5,
                borderRadius: 99,
                fontSize: '1rem', fontWeight: 700,
                textTransform: 'none',
                letterSpacing: '-0.01em',
                background: APPLE_BLUE,
                color: '#ffffff',
                border: 'none',
                boxShadow: `0 8px 28px ${alpha(APPLE_BLUE, dark ? 0.45 : 0.32)}`,
                transition: 'all 0.22s ease',
                '&:hover': {
                  background: APPLE_BLUE2,
                  boxShadow: `0 12px 36px ${alpha(APPLE_BLUE, 0.5)}`,
                  transform: 'translateY(-2px)',
                },
                '&:active': { transform: 'scale(0.97)' },
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
