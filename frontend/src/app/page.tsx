"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  IconButton,
  ThemeProvider,
  CssBaseline,
  CircularProgress,
  Avatar,
  Stack,
  Tooltip,
  alpha,
  Snackbar,
  Alert,
  useTheme,
} from '@mui/material';
import {
  LayoutDashboard,
  History,
  Layers,
  Settings,
  UploadCloud,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ChevronRight,
  Search,
  ArrowUpRight,
  Cpu,
  ShieldCheck,
  AlignLeft,
  Target,
  Download,
  Info,
  Sun,
  Moon
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { getCustomTheme } from '../theme/dashboardTheme';
import { toNumber } from '../lib/number';
import type {
  ConfigState,
  DrilldownRow,
  TestCaseData,
} from '../types/evaluation';
import { CustomTooltip } from '../components/Common/CustomTooltip';
import { useEvaluationData } from '../hooks/useEvaluationData';
import { useRecommendations } from '../hooks/useRecommendations';

// --- Helper Components ---
import { GlassCard } from '../components/Dashboard/GlassCard';
import { PrintOnlyReport } from '../components/Reports/PrintOnlyReport';
import { PaginationControl } from '../components/Common/PaginationControl';
import { LandingPage as LandingPageView } from '../components/Landing/LandingPage';
import { HistoryView } from '../components/Views/HistoryView';
import { ExperimentsView } from '../components/Views/ExperimentsView';
import { ConfigurationView } from '../components/Views/ConfigurationView';
import { AboutView } from '../components/Views/AboutView';
import { CompareEvaluationsDialog } from '../components/Dialogs/CompareEvaluationsDialog';
import { EvaluationProgressBackdrop } from '../components/Dialogs/EvaluationProgressBackdrop';
import { ReportLoadingBackdrop } from '../components/Dialogs/ReportLoadingBackdrop';
import { RecommendationDetailDialog } from '../components/Dialogs/RecommendationDetailDialog';
import { CognizantIcon } from '../components/Common/CognizantIcon';
// --- Components ---
const MotionPaper = motion(Paper);



// --- Main Pages ---


// --- Landing Page ---
function LandingPage({ onEnter }: { onEnter: () => void }) {
  return <LandingPageView onEnter={onEnter} />;

  const theme = useTheme();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Generate 5 layers of stars for hyper-parallax depth - Increased density & intensity
  const starLayers = useMemo(() => {
    const spectralColors = [
      '#ffffff', // Bright white
      '#dbeafe', // Light Royal Blue
      '#eff6ff', // Pale Blue
      '#bfdbfe', // Soft Blue
      '#2563eb', // Royal Blue (Accented)
    ];

    return Array.from({ length: 5 }).map((_, layerIdx) => {
      const density = [250, 150, 80, 40, 20][layerIdx];
      return Array.from({ length: density }).map((__, i) => {
        const size = Math.random() * (layerIdx + 1) * 0.9 + 0.6;
        return {
          id: `layer-${layerIdx}-star-${i}`,
          top: Math.random() * 100,
          left: Math.random() * 100,
          size: size,
          duration: Math.random() * 2 + 1,
          delay: Math.random() * 5,
          color: spectralColors[Math.floor(Math.random() * spectralColors.length)],
          parallax: (layerIdx + 1) * 0.15,
          hasSpikes: layerIdx >= 3 && size > 3.0 && Math.random() > 0.4,
          twinkleType: Math.random() > 0.5 ? 'classic' : 'rapid'
        };
      });
    });
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
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
    <Box sx={{
      height: '100vh',
      width: '100vw',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: (theme) => theme.palette.mode === 'dark' ? '#000' : '#f0f4f8',
      backgroundImage: (theme) => theme.palette.mode === 'dark'
        ? `
          radial-gradient(circle at 50% 100%, #172554 0%, #020617 60%, #000 100%),
          radial-gradient(circle at 10% 10%, rgba(56, 189, 248, 0.05) 0%, transparent 40%)
        `
        : `
          radial-gradient(circle at 50% 10%, #ffffff 0%, #f1f5f9 100%)
        `,
    }}>
      {/* 1. Aurora & Nebula Dust Layers */}
      <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
        {/* Nebula Dust 1 */}
        <motion.div
          animate={{
            opacity: theme.palette.mode === 'dark' ? [0.3, 0.5, 0.3] : [0.1, 0.2, 0.1],
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
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
        {/* Nebula Dust 2 */}
        <motion.div
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1.1, 1, 1.1],
            rotate: [0, -5, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
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
        {/* Aurora Borealis Effect - Waving Silk */}
        <Box sx={{ opacity: 0.6 }}>
          <motion.div
            animate={{
              x: [-100, 100, -100],
              skewX: [5, -5, 5],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: 'absolute',
              top: '-20%',
              left: '-10%',
              width: '150%',
              height: '60%',
              background: theme.palette.mode === 'dark'
                ? 'radial-gradient(ellipse at center, rgba(34, 197, 94, 0.08) 0%, rgba(20, 184, 166, 0.05) 30%, transparent 70%)'
                : 'radial-gradient(ellipse at center, rgba(37, 99, 235, 0.05) 0%, rgba(37, 99, 235, 0.02) 40%, transparent 75%)',
              filter: 'blur(100px)',
              transform: 'rotate(-5deg)',
            }}
          />
          <motion.div
            animate={{
              x: [100, -100, 100],
              skewX: [-10, 10, -10],
            }}
            transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: 'absolute',
              top: '-10%',
              right: '-10%',
              width: '140%',
              height: '50%',
              background: theme.palette.mode === 'dark'
                ? 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.08) 0%, rgba(168, 85, 247, 0.05) 40%, transparent 80%)'
                : 'radial-gradient(ellipse at center, rgba(37, 99, 235, 0.04) 0%, rgba(37, 99, 235, 0.01) 50%, transparent 80%)',
              filter: 'blur(120px)',
              transform: 'rotate(5deg)',
            }}
          />
        </Box>
      </Box>

      {/* 2. Lunar Presence - Glowing Moon with Atmospheric Halo */}
      <Box sx={{
        position: 'absolute',
        top: '10%',
        right: '15%',
        zIndex: 5,
        pointerEvents: 'none',
        transform: `translate(${(mousePos.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * -0.02}px, ${(mousePos.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * -0.02}px)`
      }}>
        {/* Atmosphere / Glow */}
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 250,
          height: 250,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)',
          filter: 'blur(20px)'
        }} />
        {/* Moon Disk */}
        <Box sx={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
          boxShadow: theme.palette.mode === 'dark'
            ? 'inset -20px -20px 40px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.4)'
            : 'inset -5px -5px 15px rgba(0,0,0,0.05), 0 10px 30px rgba(37, 99, 235, 0.1)',
          position: 'relative'
        }}>
          {/* Subtle Craters */}
          <Box sx={{ position: 'absolute', top: '20%', left: '30%', width: 15, height: 15, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.05)', boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1)' }} />
          <Box sx={{ position: 'absolute', top: '50%', left: '60%', width: 10, height: 10, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.05)', boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.1)' }} />
        </Box>
      </Box>

      {/* 2.1 Mars - The Red Planet */}
      <Box sx={{
        position: 'absolute',
        top: '25%',
        left: '10%',
        zIndex: 4,
        pointerEvents: 'none',
        transform: `translate(${(mousePos.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * -0.03}px, ${(mousePos.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * -0.03}px)`
      }}>
        <Box sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at 30% 30%, #fca5a5 0%, #b91c1c 100%)'
            : 'radial-gradient(circle at 30% 30%, #fca5a5 0%, #ef4444 100%)',
          boxShadow: theme.palette.mode === 'dark'
            ? 'inset -8px -8px 15px rgba(0,0,0,0.6), 0 0 20px rgba(185, 28, 28, 0.3)'
            : 'inset -2px -2px 10px rgba(0,0,0,0.1), 0 5px 15px rgba(239, 68, 68, 0.15)'
        }} />
      </Box>

      {/* 2.2 Saturn - The Ringed Giant */}
      <Box sx={{
        position: 'absolute',
        bottom: '25%',
        right: '10%',
        zIndex: 4,
        pointerEvents: 'none',
        transform: `translate(${(mousePos.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * -0.015}px, ${(mousePos.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * -0.015}px)`
      }}>
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Saturn's Rings */}
          <Box sx={{
            position: 'absolute',
            width: 140,
            height: 40,
            borderRadius: '50%',
            border: '8px solid rgba(214, 211, 209, 0.4)',
            transform: 'rotateX(75deg) rotateY(-15deg)',
            boxShadow: '0 0 10px rgba(0,0,0,0.2)',
            zIndex: 1
          }} />
          <Box sx={{
            position: 'absolute',
            width: 120,
            height: 30,
            borderRadius: '50%',
            border: '4px solid rgba(168, 162, 158, 0.3)',
            transform: 'rotateX(75deg) rotateY(-15deg)',
            zIndex: 1
          }} />
          {/* Saturn Body */}
          <Box sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #fef3c7 0%, #d97706 100%)',
            boxShadow: 'inset -12px -12px 25px rgba(0,0,0,0.6), 0 0 30px rgba(217, 119, 6, 0.2)',
            zIndex: 2
          }} />
        </Box>
      </Box>

      {/* 2.3 Jupiter - The Gas Giant */}
      <Box sx={{
        position: 'absolute',
        bottom: '15%',
        left: '5%',
        zIndex: 3,
        pointerEvents: 'none',
        transform: `translate(${(mousePos.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * -0.01}px, ${(mousePos.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * -0.01}px)`
      }}>
        <Box sx={{
          width: 110,
          height: 110,
          borderRadius: '50%',
          background: 'linear-gradient(180deg, #d4a373 0%, #e9c46a 20%, #d4a373 40%, #faedcd 60%, #d4a373 80%, #bc6c25 100%)',
          boxShadow: 'inset -25px -25px 50px rgba(0,0,0,0.7), 0 0 40px rgba(212, 163, 115, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Jupiter's Great Red Spot */}
          <Box sx={{
            position: 'absolute',
            bottom: '30%',
            right: '25%',
            width: 25,
            height: 15,
            borderRadius: '50%',
            bgcolor: '#9b2226',
            opacity: 0.6,
            filter: 'blur(2px)',
            boxShadow: '0 0 10px #9b2226'
          }} />
        </Box>
      </Box>

      {/* 2.4 Neptune - The Blue Giant */}
      <Box sx={{
        position: 'absolute',
        top: '40%',
        right: '5%',
        zIndex: 3,
        pointerEvents: 'none',
        transform: `translate(${(mousePos.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * -0.025}px, ${(mousePos.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * -0.025}px)`
      }}>
        <Box sx={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #60a5fa 0%, #1e40af 100%)',
          boxShadow: 'inset -10px -10px 20px rgba(0,0,0,0.6), 0 0 25px rgba(30, 64, 175, 0.4)'
        }} />
      </Box>

      {/* 2.5 Mercury - The Swift Planet */}
      <Box sx={{
        position: 'absolute',
        top: '8%',
        left: '18%',
        zIndex: 2,
        pointerEvents: 'none',
        transform: `translate(${(mousePos.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * -0.04}px, ${(mousePos.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * -0.04}px)`
      }}>
        <Box sx={{
          width: 25,
          height: 25,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #94a3b8 0%, #475569 100%)',
          boxShadow: 'inset -5px -5px 10px rgba(0,0,0,0.6)'
        }} />
      </Box>

      {/* 2.6 Venus - The Morning Star */}
      <Box sx={{
        position: 'absolute',
        top: '18%',
        right: '25%',
        zIndex: 2,
        pointerEvents: 'none',
        transform: `translate(${(mousePos.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * -0.035}px, ${(mousePos.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * -0.035}px)`
      }}>
        <Box sx={{
          width: 45,
          height: 45,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #fde68a 0%, #d97706 100%)',
          boxShadow: 'inset -10px -10px 20px rgba(0,0,0,0.6), 0 0 20px rgba(253, 230, 138, 0.2)'
        }} />
      </Box>

      {/* 2.7 Uranus - The Tilted Giant */}
      <Box sx={{
        position: 'absolute',
        bottom: '40%',
        left: '12%',
        zIndex: 2,
        pointerEvents: 'none',
        transform: `translate(${(mousePos.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * -0.02}px, ${(mousePos.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * -0.02}px)`
      }}>
        <Box sx={{
          width: 55,
          height: 55,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #a5f3fc 0%, #0891b2 100%)',
          boxShadow: 'inset -12px -12px 25px rgba(0,0,0,0.6), 0 0 20px rgba(165, 243, 252, 0.3)'
        }} />
      </Box>

      {/* 2.8 Pluto - The Outcast (Icy Gray) */}
      <Box sx={{
        position: 'absolute',
        bottom: '10%',
        right: '25%',
        zIndex: 1,
        pointerEvents: 'none',
        transform: `translate(${(mousePos.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * -0.005}px, ${(mousePos.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * -0.005}px)`
      }}>
        <Box sx={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #e2e8f0 0%, #475569 100%)',
          boxShadow: 'inset -4px -4px 8px rgba(0,0,0,0.6)'
        }} />
      </Box>

      {/* 3. Parallax Star Fields */}
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
            <Box
              key={star.id}
              sx={{
                position: 'absolute',
                top: `${star.top}%`,
                left: `${star.left}%`,
                pointerEvents: 'none',
              }}
            >
              {/* Diffraction Spikes for bright stars */}
              {star.hasSpikes && (
                <motion.div
                  animate={{ opacity: [0.2, 0.5, 0.2], rotate: [0, 90] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: -1
                  }}
                >
                  <Box sx={{ position: 'absolute', width: star.size * 8, height: 1, background: `radial-gradient(circle, ${star.color}, transparent)`, left: -star.size * 4 }} />
                  <Box sx={{ position: 'absolute', height: star.size * 8, width: 1, background: `radial-gradient(circle, ${star.color}, transparent)`, top: -star.size * 4 }} />
                </motion.div>
              )}

              <motion.div
                animate={{
                  opacity: star.twinkleType === 'rapid' ? [0.6, 1, 0.4, 1, 0.6] : [1, 1.2, 1],
                  scale: star.twinkleType === 'rapid' ? [1, 1.3, 1, 1.4, 1] : [1, 1.2, 1],
                }}
                transition={{
                  duration: star.duration,
                  repeat: Infinity,
                  delay: star.delay,
                  ease: "easeInOut"
                }}
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

      {/* 4. Realistic Comets - Dual Tail (Dust + Ion) */}
      <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 20 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <motion.div
            key={`pro-comet-${i}`}
            initial={{ top: `${-20 - (i * 10)}%`, left: `${110 + (i * 10)}%`, opacity: 0 }}
            animate={{
              top: [`${-10 - (i * 5)}%`, '120%'],
              left: [`${100 + (i * 5)}%`, '-20%'],
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: 4 + i * 1.5,
              repeat: Infinity,
              repeatDelay: 2 + i * 3,
              delay: i * 4,
              ease: "linear"
            }}
            style={{
              position: 'absolute',
              width: 600,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              transform: 'rotate(-40deg)'
            }}
          >
            {/* Nucleus */}
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#fff',
              boxShadow: '0 0 30px #fff, 0 0 60px #38bdf8',
              zIndex: 5
            }} />
            {/* Ion Tail (Blue/Thin) */}
            <Box sx={{
              position: 'absolute',
              height: 2,
              width: 500,
              left: 8,
              background: 'linear-gradient(90deg, #38bdf8, transparent)',
              filter: 'blur(2px)',
              transform: 'rotate(-2deg)',
              transformOrigin: 'left center'
            }} />
            {/* Dust Tail (Broad/Curve) */}
            <Box sx={{
              position: 'absolute',
              height: 15,
              width: 450,
              left: 5,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.4), transparent)',
              borderRadius: '0 100% 100% 0',
              filter: 'blur(8px)',
              transform: 'rotate(3deg)',
              transformOrigin: 'left center'
            }} />
          </motion.div>
        ))}
      </Box>

      {/* 4.1 Fast Meteor Streaks (Shooting stars) */}
      <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 15 }}>
        {meteorConfigs.map((meteor) => (
          <motion.div
            key={`meteor-${meteor.id}`}
            initial={{
              top: meteor.initialTop,
              left: meteor.initialLeft,
              opacity: 0,
              scaleX: 0
            }}
            animate={{
              top: meteor.animateTop,
              left: meteor.animateLeft,
              opacity: [0, 1, 0.8, 0],
              scaleX: [0, 1.5, 0]
            }}
            transition={{
              duration: meteor.duration,
              repeat: Infinity,
              repeatDelay: meteor.repeatDelay,
              delay: meteor.id * 2,
              ease: "easeOut"
            }}
            style={{
              position: 'absolute',
              width: 150,
              height: 1,
              background: 'linear-gradient(90deg, #fff, transparent)',
              boxShadow: '0 0 10px #fff',
              transformOrigin: 'right center',
              transform: 'rotate(-35deg)'
            }}
          />
        ))}
      </Box>

      {/* 5. Horizon Elements: Mountains & Fog */}
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', zIndex: 60, pointerEvents: 'none' }}>
        {/* Layered Fog */}
        <motion.div
          animate={{ x: [-200, 200, -200] }}
          transition={{ duration: 40, repeat: Infinity }}
          style={{
            position: 'absolute',
            bottom: 0,
            width: '200%',
            height: '100%',
            background: 'linear-gradient(to top, rgba(15, 23, 42, 0.4), transparent)',
            filter: 'blur(50px)',
          }}
        />
        {/* Mountain Silhouette (SVG) */}
        <svg viewBox="0 0 1440 320" style={{ position: 'absolute', bottom: -10, width: '100%', height: 'auto', fill: '#010409' }}>
          <path d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,149.3C672,149,768,203,864,224C960,245,1056,235,1152,202.7C1248,171,1344,117,1392,90.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          <path d="M0,224L60,208C120,192,240,160,360,165.3C480,171,600,213,720,202.7C840,192,960,128,1080,122.7C1200,117,1320,171,1380,197.3L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" opacity="0.5"></path>
        </svg>
      </Box>

      {/* 6. Main Content with Cinematic Lighting */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 100, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Central Pulsar Icon */}
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 6 }}>
            {/* Pulsing rings */}
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                position: 'absolute',
                inset: -20,
                borderRadius: '50%',
                border: '2px solid rgba(56, 189, 248, 0.3)',
                pointerEvents: 'none'
              }}
            />
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: [
                  '0 0 40px rgba(56, 189, 248, 0.2)',
                  '0 0 80px rgba(56, 189, 248, 0.4)',
                  '0 0 40px rgba(56, 189, 248, 0.2)'
                ]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{
                padding: '32px',
                borderRadius: '50%',
                background: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                border: theme.palette.mode === 'dark' ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(56, 189, 248, 0.3)',
                backdropFilter: 'blur(20px)',
                position: 'relative',
                zIndex: 2
              }}
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 15, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <CognizantIcon size={72} color="#38bdf8" strokeWidth={1.5} />
              </motion.div>
            </motion.div>
          </Box>

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '4rem', md: '7.5rem' },
              fontWeight: 900,
              lineHeight: 0.85,
              mb: 4,
              letterSpacing: '-0.06em',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(to bottom, #ffffff 40%, rgba(255,255,255,0.1) 120%)'
                : 'linear-gradient(to bottom, #0f172a 40%, rgba(15, 23, 42, 0.5) 120%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: `drop-shadow(0 0 20px ${alpha('#38bdf8', 0.3)})`
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
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(to right, #94a3b8, #fff, #94a3b8)'
                : 'linear-gradient(to right, #475569, #0f172a, #475569)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              opacity: 0.9
            }}
          >
            High-Fidelity Observatory for RAG Diagnostics
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              mb: 4,
              fontWeight: 400,
              lineHeight: 1.8,
              fontSize: '1.2rem',
              maxWidth: '700px',
              mx: 'auto'
            }}
          >
            High-precision evaluation framework for RAG systems<br />
            Architected for enterprise-grade benchmarking and insight.
          </Typography>

          {/* Designer Credit with Premium Badge */}
          <Box sx={{ mb: 6 }}>
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              px: 3,
              py: 1,
              borderRadius: '99px',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.05)',
              backdropFilter: 'blur(10px)'
            }}>
              <Avatar src="/Aniket.jpeg" sx={{ width: 32, height: 32, border: '1.5px solid #38bdf8' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Design Architect: <span style={{ color: theme.palette.text.primary }}>Aniket Marwadi</span>
              </Typography>
            </Box>
          </Box>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
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
                border: (theme) => `1px solid ${theme.palette.divider}`,
                boxShadow: (theme) => theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(37, 99, 235, 0.5)'
                  : '0 8px 20px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: '#1d4ed8',
                  transform: 'translateY(-2px) scale(1.02)'
                }
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

function EnterpriseDashboardContent() {
  type ThresholdKey =
    | 'faithfulnessThreshold'
    | 'answerRelevancyThreshold'
    | 'answerCorrectnessThreshold'
    | 'contextRecallThreshold'
    | 'contextPrecisionThreshold'
    | 'rqsThreshold';
  type WeightKey = 'alpha' | 'beta' | 'gamma';
  const thresholdItems: Array<{ key: ThresholdKey; label: string }> = [
    { key: 'faithfulnessThreshold', label: 'Faithfulness' },
    { key: 'answerRelevancyThreshold', label: 'Answer Relevancy' },
    { key: 'answerCorrectnessThreshold', label: 'Answer Correctness' },
    { key: 'contextRecallThreshold', label: 'Context Recall' },
    { key: 'contextPrecisionThreshold', label: 'Context Precision' },
    { key: 'rqsThreshold', label: 'RQS' },
  ];
  const weightItems: Array<{ key: WeightKey; label: string }> = [
    { key: 'alpha', label: 'Alpha (Answer Correctness)' },
    { key: 'beta', label: 'Beta (Faithfulness)' },
    { key: 'gamma', label: 'Gamma (Answer Relevancy)' },
  ];

  // Initialize showLanding from localStorage, default to true for first-time visitors
  const [showLanding, setShowLanding] = useState(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('landingDismissed');
      return dismissed !== 'true';
    }
    return true;
  });
  const [config, setConfig] = useState<ConfigState>({
    faithfulnessEnabled: true,
    answerRelevancyEnabled: true,
    answerCorrectnessEnabled: true,
    contextRecallEnabled: true,
    contextPrecisionEnabled: true,
    toxicityEnabled: true,
    faithfulnessThreshold: 0.8,
    answerRelevancyThreshold: 0.8,
    answerCorrectnessThreshold: 0.8,
    contextRecallThreshold: 0.75,
    contextPrecisionThreshold: 0.75,
    rqsThreshold: 0.75,
    exportFormat: 'PDF',
    alpha: 0.4,
    beta: 0.3,
    gamma: 0.3,
    temperature: 0.0,
    maxRows: 200
  });
  const [isExporting, setIsExporting] = useState(false);
  const router = useRouter();
  const [activeView, setActiveView] = useState(() => {
    // Initialize from URL if available
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const viewFromUrl = params.get('view');
      if (viewFromUrl && ['insights', 'drilldown', 'history', 'about', 'config'].includes(viewFromUrl)) {
        return viewFromUrl;
      }
    }
    return 'insights';
  });
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  // Callback for SearchParamsHandler to update activeView
  const handleViewChangeFromUrl = useCallback((view: string) => {
    setActiveView(view);
  }, []);

  // Update URL when activeView changes
  const handleViewChange = (view: string) => {
    setActiveView(view);
    router.push(`/?view=${view}`, { scroll: false });
  };

  const theme = useMemo(() => getCustomTheme(themeMode), [themeMode]);

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };
  const [mounted, setMounted] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false); // Used for generic notifications
  const [snackbarMsg, setSnackbarMsg] = useState('');

  const {
    data,
    setData,
    history,
    setHistory,
    isLoadingHistory,
    isLoadingReport,
    loadReport,
  } = useEvaluationData({
    activeView,
    onReportLoaded: () => {
      setDrilldownPage(1);
      handleViewChange('insights');
    },
    onError: (message) => {
      setSnackbarMsg(message);
      setSaveSuccess(true);
    },
  });

  const effectiveConfig = useMemo(() => ({
    ...(data?.config || {}),
    ...config
  }), [config, data]);
  const isWeightConfigValid = useMemo(
    () => config.alpha + config.beta + config.gamma <= 1,
    [config.alpha, config.beta, config.gamma]
  );
  const handleApplySettings = useCallback(() => {
    if (!isWeightConfigValid) {
      setSnackbarMsg(`Invalid RQS weights: alpha + beta + gamma = ${(config.alpha + config.beta + config.gamma).toFixed(2)} (must be <= 1.00).`);
      setSaveSuccess(true);
      return;
    }
    setSnackbarMsg('Configuration updated (thresholds + RQS weights).');
    setSaveSuccess(true);
  }, [config.alpha, config.beta, config.gamma, isWeightConfigValid]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [statusLogs, setStatusLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEvaluating && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [statusLogs, isEvaluating]);

  // Pagination State
  const [historyPage, setHistoryPage] = useState(1);
  const [drilldownPage, setDrilldownPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Search State
  const [historySearch, setHistorySearch] = useState('');
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [showComparisonResults, setShowComparisonResults] = useState(false);
  const [compareEval1, setCompareEval1] = useState('');
  const [compareEval2, setCompareEval2] = useState('');
  const [drilldownSearch, setDrilldownSearch] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (data?.config) {
      setConfig((prev) => ({ ...prev, ...data.config }));
    }
  }, [data?.id, data?.config]);

  useEffect(() => {
    if (!data?.id) return;
    // Ensure latest run is shown without stale drilldown filters.
    setDrilldownSearch('');
    setDrilldownPage(1);
  }, [data?.id]);

  const filteredHistory = useMemo(() => {
    if (!historySearch) return history;
    const s = historySearch.toLowerCase();
    return history.filter(run =>
      run.name?.toLowerCase().includes(s) ||
      run.id?.toLowerCase().includes(s) ||
      run.winner?.toLowerCase().includes(s)
    );
  }, [history, historySearch]);

  const handleLoadReport = loadReport;

  const filteredTestCases = useMemo(() => {
    if (!data?.test_cases) return [];
    if (!drilldownSearch) return data.test_cases;
    const s = drilldownSearch.toLowerCase();
    return data.test_cases.filter((tc: TestCaseData) =>
      tc.query?.toLowerCase().includes(s) ||
      tc.ground_truth?.toLowerCase().includes(s) ||
      tc.id?.toString().toLowerCase().includes(s)
    );
  }, [data, drilldownSearch]);

  const drilldownRows = useMemo(() => {
    if (!data?.summaries) return [];
    const bots = Object.keys(data.summaries);
    const pageData = filteredTestCases.slice((drilldownPage - 1) * ITEMS_PER_PAGE, drilldownPage * ITEMS_PER_PAGE);
    return pageData.flatMap((testCase: TestCaseData) =>
      bots.map((bot) => ({
        key: `${testCase.id}-${bot}`,
        testCase,
        bot,
        metrics: data.bot_metrics?.[bot]?.[testCase.id] || {}
      }))
    ) as DrilldownRow[];
  }, [data, filteredTestCases, drilldownPage]);

  const {
    recommendationByKey,
    recommendationLoadingByKey,
    recommendationDetailOpen,
    recommendationDetailText,
    recommendationDetailRow,
    setRecommendationDetailOpen,
    requestRecommendationForRow,
    openRecommendationDetail,
  } = useRecommendations({
    activeView,
    dataId: data?.id,
    drilldownRows,
    thresholds: {
      faithfulnessEnabled: effectiveConfig.faithfulnessEnabled,
      answerRelevancyEnabled: effectiveConfig.answerRelevancyEnabled,
      answerCorrectnessEnabled: effectiveConfig.answerCorrectnessEnabled,
      contextRecallEnabled: effectiveConfig.contextRecallEnabled,
      contextPrecisionEnabled: effectiveConfig.contextPrecisionEnabled,
      faithfulnessThreshold: effectiveConfig.faithfulnessThreshold,
      answerRelevancyThreshold: effectiveConfig.answerRelevancyThreshold,
      answerCorrectnessThreshold: effectiveConfig.answerCorrectnessThreshold,
      contextRecallThreshold: effectiveConfig.contextRecallThreshold,
      contextPrecisionThreshold: effectiveConfig.contextPrecisionThreshold,
      rqsThreshold: effectiveConfig.rqsThreshold,
    },
  });

  const handleExport = async () => {
    if (!data) return;
    setIsExporting(true);
    setStatusLogs(prev => [...prev, `Initiating ${config.exportFormat} report generation...`]);

    // Simulate report collation
    await new Promise(resolve => setTimeout(resolve, 1500));
    setStatusLogs(prev => [...prev, `Collating metrics for ${leaderboardData.length} agents...`]);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const timestamp = new Date().toLocaleString('en-GB', { hour12: false }).replace(/[/, :]/g, '_');
    const fileName = `RAGEval_Report_${timestamp}`;

    if (config.exportFormat === 'JSON') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.json`;
      link.click();
    } else if (config.exportFormat === 'Excel') {
      const s = (v: unknown) => toNumber(v);

      // 0. Production Intelligence Sheet (Top Insights)
      const insightHeaders = ['METRIC', 'VALUE', 'CONTEXT'];
      const winner = leaderboardData[0] || {};
      const insightRows = [
        ['TOP_ARCHITECT', winner.id, `MASTER_RQS: ${s(winner.avg_rqs).toFixed(3)}`],
        ['MAX_ANSWER_CORRECTNESS', `${(s(winner.gt_alignment) * 100).toFixed(1)}%`, 'Ground Truth Match'],
        ['TOP_FAITHFULNESS', `${(s(winner.avg_faithfulness) * 100).toFixed(1)}%`, 'Logical Integrity'],
        ['CONTEXT_PRECISION', `${(s(winner.avg_context_precision) * 100).toFixed(1)}%`, 'Information S/N'],
        ['RETRIEVAL_COVERAGE', `${(s(winner.retrieval_success) * 100).toFixed(1)}%`, 'Knowledge Recall'],
        ['HALLUCINATION_RATE', `${((1 - s(winner.avg_faithfulness)) * 100).toFixed(1)}%`, 'Safety Risk'],
        ['TOTAL_TEST_CASES', data.test_cases.length, 'Evaluation Volume']
      ];

      // 1. Summary Sheet (Flattened)
      const summaryHeaders = ['RANK', 'BOT_ID', 'MASTER_RQS', 'ANSWER_CORRECTNESS', 'FAITHFULNESS', 'RELEVANCY', 'CONTEXT_PRECISION', 'RETRIEVAL_SUCCESS'];
      const summaryRows = leaderboardData.map(row => {
        const s = (v: unknown) => toNumber(v);
        return [
          row.rank,
          row.id,
          s(row.avg_rqs).toFixed(3),
          (s(row.gt_alignment) * 100).toFixed(1),
          (s(row.avg_faithfulness) * 100).toFixed(1),
          (s(row.avg_relevancy) * 100).toFixed(1),
          (s(row.avg_context_precision) * 100).toFixed(1),
          (s(row.retrieval_success) * 100).toFixed(1)
        ];
      });

      // 2. Detailed Metrics Sheet (Flattened for analysis)
      const detailHeaders = ['TEST_CASE_ID', 'QUERY', 'GROUND_TRUTH', 'BOT_ID', 'RESPONSE', 'FAITHFULNESS', 'RELEVANCY', 'CONTEXT_PRECISION', 'CONTEXT_RECALL', 'ANSWER_CORRECTNESS', 'RQS'];
      const detailRows: Array<Array<string | number>> = [];

      data.test_cases.forEach((tc: TestCaseData) => {
        Object.keys(data.summaries).forEach(botId => {
          const m = data.bot_metrics[botId]?.[tc.id] || {};
          const response = (tc.bot_responses?.[botId] || "").replace(/"/g, '""');
          const gt = (tc.ground_truth || "").replace(/"/g, '""');
          const s = (v: unknown) => toNumber(v);
          detailRows.push([
            tc.id,
            `"${(tc.query || '').replace(/"/g, '""')}"`,
            `"${gt}"`,
            botId,
            `"${response}"`,
            s(m.faithfulness).toFixed(3),
            s(m.answer_relevancy).toFixed(3),
            s(m.context_precision).toFixed(3),
            s(m.context_recall).toFixed(3),
            s(m.semantic_similarity).toFixed(3),
            s(m.rqs).toFixed(3)
          ]);
        });
      });

      const csvContent =
        "--- PRODUCTION INTELLIGENCE (TOP INSIGHTS) ---\n" +
        insightHeaders.join(",") + "\n" +
        insightRows.map(e => e.join(",")).join("\n") +
        "\n\n--- COMPARISON LEADERBOARD (SUMMARY) ---\n" +
        summaryHeaders.join(",") + "\n" +
        summaryRows.map(e => e.join(",")).join("\n") +
        "\n\n--- DETAILED TRANSACTIONAL METRICS ---\n" +
        detailHeaders.join(",") + "\n" +
        detailRows.map(e => e.join(",")).join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.csv`;
      link.click();
    } else if (config.exportFormat === 'PDF') {
      const originalTitle = document.title;
      document.title = fileName;
      window.print();
      document.title = originalTitle;
    }

    setIsExporting(false);
    setSnackbarMsg(`${config.exportFormat} Report successfully generated.`);
    setSaveSuccess(true);
  };



  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const totalWeight = config.alpha + config.beta + config.gamma;
    if (totalWeight > 1) {
      e.target.value = '';
      setSnackbarMsg(`Invalid RQS weights: alpha + beta + gamma = ${totalWeight.toFixed(2)} (must be <= 1.00).`);
      setSaveSuccess(true);
      return;
    }

    // Reset input value so the same file can be uploaded again without refresh
    e.target.value = '';

    setIsEvaluating(true);
    setStatusLogs([
      `⚡ [ENGINE] Initializing Parallel Inference Pipeline...`,
      `📁 [FS] Mounting dataset: ${file.name}`,
      `[LLM] Default deployment from .env active. Warming up scoring engine...`
    ]);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("alpha", config.alpha.toString());
    formData.append("beta", config.beta.toString());
    formData.append("gamma", config.gamma.toString());
    formData.append("temperature", config.temperature.toString());
    formData.append("max_rows", config.maxRows.toString());
    formData.append("faithfulness_enabled", String(config.faithfulnessEnabled));
    formData.append("answer_relevancy_enabled", String(config.answerRelevancyEnabled));
    formData.append("answer_correctness_enabled", String(config.answerCorrectnessEnabled));
    formData.append("context_recall_enabled", String(config.contextRecallEnabled));
    formData.append("context_precision_enabled", String(config.contextPrecisionEnabled));
    formData.append("toxicity_enabled", String(config.toxicityEnabled));
    formData.append("faithfulness_threshold", config.faithfulnessThreshold.toString());
    formData.append("answer_relevancy_threshold", config.answerRelevancyThreshold.toString());
    formData.append("answer_correctness_threshold", config.answerCorrectnessThreshold.toString());
    formData.append("context_recall_threshold", config.contextRecallThreshold.toString());
    formData.append("context_precision_threshold", config.contextPrecisionThreshold.toString());
    formData.append("rqs_threshold", config.rqsThreshold.toString());

    let statusTicker: ReturnType<typeof setInterval> | null = null;
    try {
      const messages = [
        `[GPU] Computing metric scores in parallel...`,
        `[JUDGE] Cross-referencing latent space alignment...`,
        `[IO] Writing evaluation metrics to local buffer...`,
        `[SYSTEM] Optimization pass ${Math.floor(Math.random() * 5)} active...`,
        `[RAG] Recalculating Context Precision for Bot B...`,
        `[AUTH] Synchronizing cloud inference tokens...`
      ];

      statusTicker = setInterval(() => {
        const msg = messages[Math.floor(Math.random() * messages.length)];
        setStatusLogs(prev => [...prev, msg]);
      }, 1500);

      const response = await fetch("http://localhost:8000/evaluate-excel", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errDetail = await response.json().catch(() => ({ detail: "Backend Protocol Failure" }));
        throw new Error(errDetail.detail || "Evaluation Failed");
      }

      const sessionData = await response.json();
      setData(sessionData);
      setDrilldownPage(1);
      setStatusLogs(prev => [...prev, "✨ [SUCCESS] Full evaluation synchronized. Matrix data outputted to internal DB."]);

      // Refresh history to show the new evaluation
      fetch("http://localhost:8000/evaluations")
        .then(res => res.json())
        .then(data => setHistory(data))
        .catch(err => console.error("Failed to refresh history", err));

      setTimeout(() => setIsEvaluating(false), 1200);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setStatusLogs(prev => [...prev, `🛑 [CRITICAL] pipeline failed: ${errorMessage}`]);
      setTimeout(() => setIsEvaluating(false), 3000);
    } finally {
      if (statusTicker) {
        clearInterval(statusTicker);
      }
    }
  };

  const leaderboardData = useMemo(() => {
    if (!data?.summaries) return [];
    return Object.keys(data.summaries).map(id => {
      const s = data.summaries[id];
      const safe = (v: unknown) => toNumber(v);
      return {
        id,
        ...s,
        avg_rqs: safe(s.avg_rqs),
        gt_alignment: safe(s.gt_alignment),
        avg_faithfulness: safe(s.avg_faithfulness),
        avg_relevancy: safe(s.avg_relevancy),
        avg_context_precision: safe(s.avg_context_precision),
        retrieval_success: safe(s.retrieval_success),
        rank: 0
      };
    }).sort((a, b) => b.avg_rqs - a.avg_rqs).map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [data]);

  const winner = leaderboardData.length > 0 ? leaderboardData[0] : null;

  const chartData = useMemo(() => {
    if (!data?.summaries || leaderboardData.length === 0) return [];
    return leaderboardData.map(d => ({
      name: d.id,
      RQS: Number(((d.avg_rqs || 0) * 100).toFixed(1)),
      AnswerCorrectness: Number(((d.gt_alignment || 0) * 100).toFixed(1)),
      Faithfulness: Number(((d.avg_faithfulness || 0) * 100).toFixed(1)),
      Relevancy: Number(((d.avg_relevancy || 0) * 100).toFixed(1)),
      Precision: Number(((d.avg_context_precision || 0) * 100).toFixed(1)),
      Recall: Number(((d.retrieval_success || 0) * 100).toFixed(1))
    }));
  }, [leaderboardData, data]);

  const trends = useMemo(() => {
    // Early return if no winner or insufficient history
    if (!winner || !history || history.length < 1) return {};

    // Find the most recent run that isn't the current one
    const prevRun = history.find(h => h.id !== data?.id);
    if (!prevRun || !prevRun.summaries) return {};

    const prevWinnerId = prevRun.winner || Object.keys(prevRun.summaries)[0];
    const p = prevRun.summaries[prevWinnerId];
    if (!p) return {};

    const calc = (curr: number, prev: number) => {
      // Handle undefined, null, or zero values
      if (prev === 0) return null;
      const diff = ((curr - prev) / prev) * 100;
      return (diff >= 0 ? "+" : "") + diff.toFixed(1) + "%";
    };

    return {
      rqs: calc(toNumber(winner.avg_rqs), toNumber(p.avg_rqs)),
      correctness: calc(toNumber(winner.gt_alignment), toNumber(p.gt_alignment)),
      faithfulness: calc(toNumber(winner.avg_faithfulness), toNumber(p.avg_faithfulness)),
      relevancy: calc(toNumber(winner.avg_relevancy), toNumber(p.avg_relevancy)),
      precision: calc(toNumber(winner.avg_context_precision), toNumber(p.avg_context_precision)),
      recall: calc(toNumber(winner.retrieval_success), toNumber(p.retrieval_success)),
    };
  }, [history, data, winner]);

  if (!mounted) return null;
  if (showLanding) return (
    <ThemeProvider theme={getCustomTheme('dark')}>
      <LandingPage onEnter={() => {
        setShowLanding(false);
        localStorage.setItem('landingDismissed', 'true');
      }} />
    </ThemeProvider>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <>
        {/* Search params handler wrapped in Suspense */}
        <Suspense fallback={null}>
          <SearchParamsHandler onViewChange={handleViewChangeFromUrl} />
        </Suspense>
        <Box className="main-ui-container" sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', bgcolor: 'background.default', color: 'text.primary' }}>

          {/* Top Navigation Bar */}
          <Box sx={{
            flexShrink: 0,
            mx: { xs: 1, md: 3 },
            mt: { xs: 1, md: 3 },
            mb: 1,
            zIndex: 1200,
            px: { xs: 2, md: 3 },
            py: { xs: 1.5, md: 0 },
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 2, lg: 0 },
            backdropFilter: 'blur(24px)',
            background: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(15, 23, 42, 0.8)'
              : 'rgba(255, 255, 255, 0.9)',
            borderRadius: { xs: 4, md: 6 },
            border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(0, 0, 0, 0.18)',
            boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 8px 32px rgba(0, 0, 0, 0.5)' : '0 8px 32px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            minHeight: { xs: 'auto', md: 80 },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: { xs: 4, md: 6 },
              padding: '1px',
              background: (theme) => theme.palette.mode === 'dark'
                ? 'linear-gradient(90deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.05))'
                : 'linear-gradient(90deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.05))',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              WebkitMaskComposite: 'destination-out',
              pointerEvents: 'none'
            }
          }}>
            {/* Brand Logo (Left Sector) */}
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <Box
                onClick={() => setShowLanding(true)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(15, 23, 42, 0.3))',
                  border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(15, 23, 42, 0.4))',
                    border: '1px solid rgba(37, 99, 235, 0.4)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                  }
                }}
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <CognizantIcon size={24} color="#2563eb" strokeWidth={2} />
                </motion.div>
                <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em', color: 'text.primary' }}>
                  RAG <span style={{ color: '#2563eb' }}>EVAL</span>
                </Typography>
              </Box>
            </Box>

            {/* Center Navigation */}
            <Box className="nav-container" sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 0.5,
              p: 0.75,
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : '#f1f5f9',
              borderRadius: { xs: 4, md: 99 },
              border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(37, 99, 235, 0.25)' : '1px solid rgba(37, 99, 235, 0.15)',
              boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 0 10px rgba(37, 99, 235, 0.1), inset 0 0 10px rgba(37, 99, 235, 0.05)' : 'none'
            }}>
              {[
                { id: 'insights', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
                { id: 'drilldown', label: 'Experiments', icon: <Activity size={16} /> },
                { id: 'history', label: 'History', icon: <History size={16} /> },
                { id: 'config', label: 'Configuration', icon: <Settings size={16} /> },
                { id: 'about', label: 'About', icon: <Info size={16} /> },
              ].map((item) => (
                <Button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  startIcon={item.icon}
                  sx={{
                    px: { xs: 1, sm: 1.5, md: 2.2 },
                    py: 0.7,
                    borderRadius: 99,
                    fontSize: { xs: '0.7rem', md: '0.8rem' },
                    color: activeView === item.id
                      ? (themeMode === 'dark' ? '#fff' : '#2563eb')
                      : (themeMode === 'dark' ? '#94a3b8' : '#334155'),
                    bgcolor: activeView === item.id
                      ? (themeMode === 'dark' ? 'rgba(37, 99, 235, 0.25)' : 'rgba(37, 99, 235, 0.15)')
                      : 'transparent',
                    border: activeView === item.id
                      ? (themeMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(0, 0, 0, 0.2)')
                      : '1px solid transparent',
                    fontWeight: activeView === item.id ? 900 : 600,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      color: themeMode === 'dark' ? '#fff' : '#1e40af',
                      bgcolor: activeView === item.id
                        ? (themeMode === 'dark' ? 'rgba(37, 99, 235, 0.25)' : 'rgba(37, 99, 235, 0.2)')
                        : (themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                    }
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>

            {/* Right Actions (Right Sector) */}
            <Box sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, md: 2 },
              width: { xs: '100%', lg: 'auto' },
              justifyContent: { xs: 'center', lg: 'flex-end' }
            }}>

              {activeView === 'insights' && (
                <Tooltip title={`Export current view as ${config.exportFormat}`}>
                  <IconButton
                    onClick={handleExport}
                    disabled={!data || isExporting}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 99,
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(6, 182, 212, 0.08)' : 'rgba(6, 182, 212, 0.1)',
                      backdropFilter: 'blur(16px)',
                      border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(6, 182, 212, 0.4)',
                      color: '#06b6d4',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.2)',
                        border: '1px solid rgba(6, 182, 212, 0.8)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 32px rgba(6, 182, 212, 0.25)',
                        color: (theme) => theme.palette.mode === 'dark' ? '#22d3ee' : '#0891b2',
                      },
                      '&.Mui-disabled': {
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        color: (theme) => theme.palette.text.disabled,
                        background: 'none'
                      }
                    }}
                  >
                    {isExporting ? <CircularProgress size={18} color="inherit" /> : <Download size={18} />}
                  </IconButton>
                </Tooltip>
              )}

              {activeView === 'insights' && (
                <Button
                  variant="contained"
                  startIcon={<UploadCloud size={16} />}
                  component="label"
                  sx={{
                    height: 'auto', // Adjusted to auto to let py control height
                    px: 3,
                    py: 1,
                    borderRadius: 99,
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    background: '#2563eb',
                    backdropFilter: 'blur(10px)',
                    color: '#fff',
                    textTransform: 'none',
                    border: (theme) => theme.palette.mode === 'dark'
                      ? '1px solid rgba(255, 255, 255, 0.2)'
                      : '1px solid rgba(0, 0, 0, 0.2)',
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                      ? '0 4px 20px rgba(37, 99, 235, 0.3)'
                      : '0 4px 12px rgba(37, 99, 235, 0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: '#1d4ed8',
                      transform: 'translateY(-2px)',
                      boxShadow: (theme) => theme.palette.mode === 'dark'
                        ? '0 8px 30px rgba(37, 99, 235, 0.45)'
                        : '0 6px 20px rgba(37, 99, 235, 0.3)',
                      color: '#fff',
                    }
                  }}
                >
                  Evaluate
                  <input type="file" accept=".xlsx,.xls" hidden onChange={handleFileUpload} />
                </Button>
              )}

              <Tooltip title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}>
                <IconButton
                  onClick={toggleTheme}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 99,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.08)' : 'rgba(148, 163, 184, 0.12)',
                    backdropFilter: 'blur(16px)',
                    border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(148, 163, 184, 0.3)' : '1px solid rgba(148, 163, 184, 0.4)',
                    color: (theme) => theme.palette.mode === 'dark' ? '#cbd5e1' : '#64748b',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.15)' : 'rgba(148, 163, 184, 0.2)',
                      color: (theme) => theme.palette.mode === 'dark' ? '#f8fafc' : '#334155',
                      transform: 'rotate(15deg) scale(1.1)',
                      boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.2)' : '0 8px 32px rgba(0,0,0,0.05)',
                      border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(148, 163, 184, 0.6)' : '1px solid rgba(148, 163, 184, 0.6)',
                    }
                  }}
                >
                  {themeMode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </IconButton>
              </Tooltip>
            </Box>

          </Box>

          {/* Main Content Area */}
          <Box component="main" sx={{
            width: '100%',
            flexGrow: 1,
            px: { xs: 2, md: 3 },
            pb: 2,
            pt: 2,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 1 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', md: '1.1rem' }, letterSpacing: '-0.02em', mb: 0.5, color: 'text.primary' }}>
                  {activeView === 'insights' ? 'Production Intelligence' :
                    activeView === 'history' ? 'Historical Evaluations' :
                      activeView === 'drilldown' ? 'Experiments' :
                        activeView === 'about' ? 'Methodology & Framework' : 'Configuration'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}>
                  {activeView === 'insights' ? `Multimodal evaluation across ${leaderboardData.length} active agent architectures.` :
                    activeView === 'history' ? 'Archive of past evaluation runs and performance benchmarks.' :
                      activeView === 'drilldown' ? 'Deep dive into specific model metrics and granular analysis.' :
                        activeView === 'about' ? 'Detailed breakdown of organizational RAG scoring benchmarks.' : 'System settings and preferences.'}
                </Typography>
              </Box>

              {activeView === 'history' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {filteredHistory.length > ITEMS_PER_PAGE && (
                    <PaginationControl
                      count={Math.ceil(filteredHistory.length / ITEMS_PER_PAGE)}
                      page={historyPage}
                      onChange={(_, v) => setHistoryPage(v)}
                      sx={{ m: 0, scale: '0.9' }}
                    />
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {historySearch && (
                      <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1 }}>
                        FOUND: {filteredHistory.length}
                      </Typography>
                    )}
                    <Box sx={{ position: 'relative', width: 300 }}>
                      <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', width: 16, height: 16 }} />
                      <input
                        placeholder="Search history..."
                        value={historySearch}
                        onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                        style={{
                          width: '100%',
                          backgroundColor: themeMode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: '10px',
                          padding: '10px 12px 10px 38px',
                          color: theme.palette.text.primary,
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      />
                    </Box>
                    <Button
                      variant="contained"
                      onClick={() => setCompareDialogOpen(true)}
                      sx={{
                        px: 2.5,
                        py: 0.8,
                        borderRadius: 99,
                        textTransform: 'none',
                        fontWeight: 900,
                        fontSize: '0.8rem',
                        background: '#2563eb',
                        backdropFilter: 'blur(10px)',
                        color: '#fff',
                        border: (theme) => theme.palette.mode === 'dark'
                          ? '1px solid rgba(255, 255, 255, 0.2)'
                          : '1px solid rgba(0, 0, 0, 0.15)',
                        boxShadow: (theme) => theme.palette.mode === 'dark'
                          ? '0 4px 20px rgba(37, 99, 235, 0.3)'
                          : '0 4px 12px rgba(37, 99, 235, 0.2)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          background: '#1d4ed8',
                          transform: 'translateY(-2px)',
                          boxShadow: (theme) => theme.palette.mode === 'dark'
                            ? '0 8px 30px rgba(37, 99, 235, 0.45)'
                            : '0 6px 20px rgba(37, 99, 235, 0.3)',
                          color: '#fff',
                        }
                      }}
                    >
                      Compare
                    </Button>
                  </Box>
                </Box>
              )}

              {activeView === 'drilldown' && data && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {filteredTestCases.length > ITEMS_PER_PAGE && (
                    <PaginationControl
                      count={Math.ceil(filteredTestCases.length / ITEMS_PER_PAGE)}
                      page={drilldownPage}
                      onChange={(_, v) => {
                        setDrilldownPage(v);
                        contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      sx={{ m: 0, scale: '0.9' }}
                    />
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label={`BATCH LOAD: ${data?.test_cases?.length || 0} QUESTIONS`}
                      sx={{
                        bgcolor: 'rgba(56, 189, 248, 0.1)',
                        color: '#38bdf8',
                        fontWeight: 800,
                        fontSize: '0.65rem',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        '& .MuiChip-icon': { color: 'inherit' }
                      }}
                    />
                    {drilldownSearch && (
                      <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 800, letterSpacing: 1 }}>
                        FILTERED: {filteredTestCases.length} / {data.test_cases.length}
                      </Typography>
                    )}
                    <Box sx={{ position: 'relative', width: 350 }}>
                      <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', width: 16, height: 16 }} />
                      <input
                        placeholder="Search cases..."
                        value={drilldownSearch}
                        onChange={(e) => { setDrilldownSearch(e.target.value); setDrilldownPage(1); }}
                        style={{
                          width: '100%',
                          backgroundColor: themeMode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(0, 0, 0, 0.02)',
                          border: (themeMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : `1px solid ${theme.palette.divider}`),
                          borderRadius: '10px', padding: '10px 12px 10px 38px', color: theme.palette.text.primary, fontSize: '0.85rem', outline: 'none'
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              )}

              {activeView === 'config' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleApplySettings}
                    disabled={!isWeightConfigValid}
                    disableElevation
                    sx={{
                      height: 36,
                      px: 2.5,
                      borderRadius: 99,
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'none',
                      boxShadow: 'none',
                      '&:hover': { boxShadow: 'none' },
                    }}
                  >
                    Apply Settings
                  </Button>
                </Box>
              )}
            </Box>

            {/* Scrollable Content Area (Freeze Pan) */}
            <Box sx={{
              flexGrow: 1,
              overflowY: (activeView === 'about' || activeView === 'history' || activeView === 'config') ? 'hidden' : 'auto',
              overflowX: 'hidden',
              width: '100%',
              maxWidth: '100vw',
              maxHeight: 'none',
              pt: 0,
              pb: 0,
              pr: 1, // room for scrollbar
              '&::-webkit-scrollbar': { width: '8px' },
              '&::-webkit-scrollbar-track': { background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.03)' },
              '&::-webkit-scrollbar-thumb': {
                background: (theme) => theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.3)',
                borderRadius: '10px',
                border: (theme) => theme.palette.mode === 'dark' ? 'none' : '2px solid transparent',
                backgroundClip: 'padding-box'
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: (theme) => theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.4)' : 'rgba(37, 99, 235, 0.5)',
                backgroundClip: 'padding-box'
              }
            }} ref={contentScrollRef}>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  style={{ height: ['about', 'history', 'config'].includes(activeView) ? '100%' : 'auto' }}
                >
                  <Box sx={{ height: ['about', 'history', 'config'].includes(activeView) ? '100%' : 'auto' }}>
                    {/* Dashboard View */}
                    {activeView === 'insights' && data && (
                      <Grid container spacing={2} columns={12}>
                        {/* Score Cards - Row 1 */}
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <GlassCard
                            title="Highest RQS"
                            value={winner?.id}
                            color="#ffffff"
                            icon={<Trophy size={24} />}
                            subtitle={`Master Score: ${(winner?.avg_rqs || 0).toFixed(2)}`}
                            trend={trends.rqs}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <GlassCard
                            title="Best Answer Correctness"
                            value={`${((winner?.gt_alignment || 0) * 100).toFixed(0)}%`}
                            color="#22c55e"
                            icon={<CheckCircle2 size={24} />}
                            subtitle="Peak GT consistency"
                            trend={trends.correctness}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <GlassCard
                            title="Best Faithfulness"
                            value={`${((winner?.avg_faithfulness || 0) * 100).toFixed(0)}%`}
                            color="#e879f9"
                            icon={<ShieldCheck size={24} />}
                            subtitle="Grounded logic (Top Model)"
                            trend={trends.faithfulness}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <GlassCard
                            title="Best Relevancy"
                            value={`${((winner?.avg_relevancy || 0) * 100).toFixed(0)}%`}
                            color="#f59e0b"
                            icon={<AlignLeft size={24} />}
                            subtitle="Intent accuracy (Top Model)"
                            trend={trends.relevancy}
                          />
                        </Grid>

                        {/* Score Cards - Row 2 */}
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <GlassCard
                            title="Max Context Prec."
                            value={`${((winner?.avg_context_precision || 0) * 100).toFixed(0)}%`}
                            color="#06b6d4"
                            icon={<Cpu size={24} />}
                            subtitle="Retrieval Signal-to-Noise"
                            trend={trends.precision}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <GlassCard
                            title="Max Context Recall"
                            value={`${((winner?.retrieval_success || 0) * 100).toFixed(0)}%`}
                            color="#6366f1"
                            icon={<Layers size={24} />}
                            subtitle="Information Coverage"
                            trend={trends.recall}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <GlassCard
                            title="Hallucination Rate"
                            value={`${((1 - (winner?.avg_faithfulness || 0)) * 100).toFixed(0)}%`}
                            color="#ef4444"
                            icon={<AlertTriangle size={24} />}
                            subtitle="Safety Risk Assessment"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <GlassCard
                            title="Total Questions"
                            value={data?.test_cases?.length || 0}
                            color="#64748b"
                            icon={<Target size={24} />}
                            subtitle="Total Evaluation Volume"
                          />
                        </Grid>

                        {/* Main Visualization */}
                        <Grid size={{ xs: 12, md: 8 }} className="no-print">
                          <Paper sx={{ px: 3, py: 2.5, height: 440, borderRadius: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.6)', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 0 30px rgba(14, 165, 233, 0.35)' : '0 10px 30px rgba(0,0,0,0.05)' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                              <Box>
                                <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', lineHeight: 1.2 }}>Performance Trajectory</Typography>
                                <Typography variant="caption" color="text.secondary">Multidimensional scoring across top architectures</Typography>
                              </Box>
                            </Box>
                            <Box sx={{ height: 320 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="4 4" vertical={true} stroke={theme.palette.divider} strokeWidth={1.5} />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 10, fontWeight: 700 }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 10, fontWeight: 700 }} />
                                  <ChartTooltip content={<CustomTooltip />} />
                                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 600, top: -10 }} />
                                  <Area name="Master RQS Score" type="monotone" dataKey="RQS" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorPrimary)" />
                                  <Area name="Answer Correctness" type="monotone" dataKey="AnswerCorrectness" stroke="#22c55e" strokeWidth={2} fillOpacity={0} />
                                  <Area name="Answer Faithfulness" type="monotone" dataKey="Faithfulness" stroke="#e879f9" strokeWidth={2} fillOpacity={0} />
                                  <Area name="Answer Relevancy" type="monotone" dataKey="Relevancy" stroke="#f59e0b" strokeWidth={2} fillOpacity={0} />
                                  <Area name="Context Precision" type="monotone" dataKey="Precision" stroke="#06b6d4" strokeWidth={2} fillOpacity={0} />
                                  <Area name="Context Recall" type="monotone" dataKey="Recall" stroke="#6366f1" strokeWidth={2} fillOpacity={0} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </Box>
                          </Paper>
                        </Grid>

                        {/* Neural Profile HUD */}
                        <Grid size={{ xs: 12, md: 4 }} className="no-print">
                          <MotionPaper
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            sx={{
                              p: 2.5,
                              height: 440,
                              borderRadius: 2,
                              background: (theme) => theme.palette.mode === 'dark'
                                ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.6) 0%, rgba(2, 6, 23, 0.8) 100%)'
                                : 'linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.95) 100%)',
                              border: (theme) => `1px solid ${theme.palette.divider}`,
                              boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 0 30px rgba(255, 255, 255, 0.15)' : '0 10px 30px rgba(0,0,0,0.05)',
                              display: 'flex',
                              flexDirection: 'column',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            <Box sx={{ position: 'relative', zIndex: 1, mb: 2 }}>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', lineHeight: 1.2 }}>Neural Topology</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Architectural capability mapping (Top 3)
                              </Typography>
                            </Box>

                            <Box sx={{ flexGrow: 1, position: 'relative', zIndex: 1, minHeight: 280 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="55%"
                                  data={[
                                    { subject: 'Answer Correctness', ...leaderboardData.slice(0, 3).reduce((acc, m) => ({ ...acc, [m.id]: Number((m.gt_alignment * 100).toFixed(1)) }), {}) },
                                    { subject: 'Answer Faithfulness', ...leaderboardData.slice(0, 3).reduce((acc, m) => ({ ...acc, [m.id]: Number((m.avg_faithfulness * 100).toFixed(1)) }), {}) },
                                    { subject: 'Answer Relevancy', ...leaderboardData.slice(0, 3).reduce((acc, m) => ({ ...acc, [m.id]: Number((m.avg_relevancy * 100).toFixed(1)) }), {}) },
                                    { subject: 'Context Precision', ...leaderboardData.slice(0, 3).reduce((acc, m) => ({ ...acc, [m.id]: Number((m.avg_context_precision * 100).toFixed(1)) }), {}) },
                                    { subject: 'Context Recall', ...leaderboardData.slice(0, 3).reduce((acc, m) => ({ ...acc, [m.id]: Number((m.retrieval_success * 100).toFixed(1)) }), {}) },
                                  ]}
                                >
                                  <PolarGrid stroke={themeMode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'} strokeWidth={1.5} />
                                  <PolarAngleAxis dataKey="subject" tick={{ fill: theme.palette.text.secondary, fontSize: 10, fontWeight: 700 }} />
                                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                  <ChartTooltip content={<CustomTooltip />} />
                                  {leaderboardData.slice(0, 3).map((model, idx) => (
                                    <Radar
                                      key={model.id}
                                      name={model.id}
                                      dataKey={model.id}
                                      stroke={['#2563eb', '#fbbf24', '#f472b6'][idx]}
                                      fill={['#2563eb', '#fbbf24', '#f472b6'][idx]}
                                      fillOpacity={0.25}
                                      strokeWidth={3}
                                    />
                                  ))}
                                </RadarChart>
                              </ResponsiveContainer>
                            </Box>

                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                              {leaderboardData.slice(0, 3).map((model, idx) => (
                                <Box key={model.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: ['#2563eb', '#fbbf24', '#f472b6'][idx],
                                    boxShadow: `0 0 10px ${['#2563eb', '#fbbf24', '#f472b6'][idx]}`
                                  }} />
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem' }}>{model.id}</Typography>
                                </Box>
                              ))}
                            </Box>
                          </MotionPaper>
                        </Grid>


                        {/* Leaderboard Table */}
                        <Grid size={{ xs: 12 }}>
                          <TableContainer component={Paper} sx={{ borderRadius: 2, bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 0 30px rgba(14, 165, 233, 0.35)' : '0 10px 30px rgba(0,0,0,0.05)' }}>
                            <Box sx={{ px: 3, py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', lineHeight: 1.2 }}>Leaderboard</Typography>
                              <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
                                <Button
                                  variant="contained"
                                  size="small"
                                  endIcon={<ArrowUpRight size={16} />}
                                  onClick={() => handleViewChange('drilldown')}
                                  sx={{
                                    height: 36,
                                    px: 2.5,
                                    borderRadius: 99,
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    background: '#2563eb',
                                    color: '#fff',
                                    textTransform: 'none',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                      background: '#1d4ed8',
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
                                      color: '#fff',
                                    }
                                  }}
                                >
                                  Analysis
                                </Button>
                                <Button
                                  variant="contained"
                                  size="small"
                                  endIcon={<ChevronRight size={16} />}
                                  onClick={() => handleViewChange('history')}
                                  sx={{
                                    height: 36,
                                    px: 2.5,
                                    borderRadius: 99,
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    background: '#2563eb',
                                    color: '#fff',
                                    textTransform: 'none',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                      background: '#1d4ed8',
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
                                      color: '#fff',
                                    }
                                  }}
                                >
                                  View All Historical Runs
                                </Button>
                              </Box>
                            </Box>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>Rank</TableCell>
                                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>Model Architecture</TableCell>
                                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>Master RQS Score</TableCell>
                                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>Answer Correctness</TableCell>
                                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>Faithfulness Score</TableCell>
                                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>Answer Relevancy</TableCell>
                                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>Context Precision</TableCell>
                                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>Context Recall</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {leaderboardData.map((row) => {
                                  const isWinnerRow = row.rank === 1;
                                  return (
                                  <TableRow
                                    key={row.id}
                                    hover
                                    sx={
                                      isWinnerRow
                                        ? {
                                            bgcolor: (theme) =>
                                              theme.palette.mode === 'dark'
                                                ? 'rgba(245, 158, 11, 0.12)'
                                                : 'rgba(245, 158, 11, 0.14)',
                                            '&:hover': {
                                              bgcolor: (theme) =>
                                                theme.palette.mode === 'dark'
                                                  ? 'rgba(245, 158, 11, 0.18)'
                                                  : 'rgba(245, 158, 11, 0.2)',
                                            },
                                          }
                                        : undefined
                                    }
                                  >
                                    <TableCell sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
                                      <Box sx={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        bgcolor: row.rank === 1 ? 'rgba(245, 158, 11, 0.1)' : (themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                                        color: row.rank === 1 ? '#f59e0b' : 'inherit',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 800,
                                        fontSize: '0.75rem'
                                      }}>
                                        {row.rank}
                                      </Box>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                        {isWinnerRow && <Trophy size={14} color="#f59e0b" />}
                                        <span>{row.id}</span>
                                      </Box>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
                                      <Typography sx={{ color: 'primary.main', fontWeight: 900 }}>{(row.avg_rqs || 0).toFixed(3)}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
                                      <Stack direction="row" alignItems="center" spacing={1.5}>
                                        <LinearProgress
                                          variant="determinate"
                                          value={row.gt_alignment * 100}
                                          sx={{ width: 80, height: 6, borderRadius: 3, bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                                        />
                                        <Typography variant="caption">{(row.gt_alignment * 100).toFixed(0)}%</Typography>
                                      </Stack>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>{(row.avg_faithfulness * 100).toFixed(1)}%</TableCell>
                                    <TableCell sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>{(row.avg_relevancy * 100).toFixed(1)}%</TableCell>
                                    <TableCell sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>{(row.avg_context_precision * 100).toFixed(1)}%</TableCell>
                                    <TableCell sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>{(row.retrieval_success * 100).toFixed(1)}%</TableCell>
                                  </TableRow>
                                )})}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                      </Grid>
                    )}

                    {activeView === 'history' && (
                      <HistoryView
                        filteredHistory={filteredHistory}
                        history={history}
                        historyPage={historyPage}
                        itemsPerPage={ITEMS_PER_PAGE}
                        isLoadingHistory={isLoadingHistory}
                        onLoadReport={handleLoadReport}
                      />
                    )}

                    {activeView === 'drilldown' && data && (
                      <ExperimentsView
                        data={data}
                        filteredTestCases={filteredTestCases}
                        drilldownPage={drilldownPage}
                        itemsPerPage={ITEMS_PER_PAGE}
                        effectiveConfig={effectiveConfig}
                        recommendationByKey={recommendationByKey}
                        recommendationLoadingByKey={recommendationLoadingByKey}
                        requestRecommendationForRow={requestRecommendationForRow}
                        openRecommendationDetail={openRecommendationDetail}
                      />
                    )}

                    {activeView === 'about' && <AboutView />}

                    {activeView === 'config' && (
                      <ConfigurationView
                        config={config}
                        setConfig={setConfig}
                        themeMode={themeMode}
                        thresholdItems={thresholdItems}
                        weightItems={weightItems}
                      />
                    )}


                  </Box>
                </motion.div>
              </AnimatePresence>
            </Box>
          </Box>

          <EvaluationProgressBackdrop open={isEvaluating} statusLogs={statusLogs} logEndRef={logEndRef} />
          <ReportLoadingBackdrop open={isLoadingReport} />
        </Box>

        <PrintOnlyReport data={data} leaderboardData={leaderboardData} />

        <CompareEvaluationsDialog
          open={compareDialogOpen}
          onDialogClose={() => setCompareDialogOpen(false)}
          onResetAndClose={() => {
            setCompareDialogOpen(false);
            setShowComparisonResults(false);
            setCompareEval1('');
            setCompareEval2('');
          }}
          history={history}
          showComparisonResults={showComparisonResults}
          compareEval1={compareEval1}
          compareEval2={compareEval2}
          setCompareEval1={setCompareEval1}
          setCompareEval2={setCompareEval2}
          onCompare={() => {
            setShowComparisonResults(true);
          }}
        />

        <RecommendationDetailDialog
          open={recommendationDetailOpen}
          rowLabel={recommendationDetailRow}
          text={recommendationDetailText}
          onClose={() => setRecommendationDetailOpen(false)}
        />

        <Snackbar open={saveSuccess} autoHideDuration={3000} onClose={() => setSaveSuccess(false)}>
          <Alert
            onClose={() => setSaveSuccess(false)}
            icon={snackbarMsg.includes('Report') ? <Download size={18} /> : <CheckCircle2 size={18} />}
            sx={{
              width: '100%',
              borderRadius: 3,
              bgcolor: 'rgba(15, 23, 42, 0.95)',
              color: '#38bdf8',
              fontWeight: 800,
              boxShadow: '0 0 40px rgba(56, 189, 248, 0.4)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              backdropFilter: 'blur(10px)',
              '.MuiAlert-icon': { color: '#38bdf8' }
            }}
          >
            {snackbarMsg}
          </Alert>
        </Snackbar>

        <style jsx global>{`
          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: hidden !important;
          }
          @keyframes blink { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
          @keyframes shine {
            from { background-position: 200% 0; }
            to { background-position: -200% 0; }
          }
          @keyframes fadeInLogs { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes fadeInScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          .custom-scrollbar::-webkit-scrollbar { width: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: ${themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)'}; }
          .custom-scrollbar::-webkit-scrollbar-thumb { 
            background: ${themeMode === 'dark' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.3)'}; 
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${themeMode === 'dark' ? 'rgba(37, 99, 235, 0.4)' : 'rgba(37, 99, 235, 0.5)'}; }
          @media print {
            body { background: ${themeMode === 'dark' ? '#0f172a' : '#ffffff'} !important; color: ${themeMode === 'dark' ? '#ffffff' : '#000000'} !important; }
            /* Hide the entire web UI */
            .main-ui-container { display: none !important; }
            /* Show only the print-ready report */
            .print-only-report {
              display: block !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              z-index: 99999 !important;
            }
          }
        `}</style>
      </>
    </ThemeProvider >
  );
}

// Component to handle search params (wrapped in Suspense)
function SearchParamsHandler({ onViewChange }: { onViewChange: (view: string) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const viewFromUrl = searchParams.get('view');
    if (viewFromUrl && ['insights', 'drilldown', 'history', 'about', 'config'].includes(viewFromUrl)) {
      onViewChange(viewFromUrl);
    }
  }, [searchParams, onViewChange]);

  return null;
}

// Wrapper component with Suspense boundary
export default function EnterpriseDashboard() {
  return (
    <Suspense fallback={
      <Box sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#020617'
      }}>
        <CircularProgress size={60} sx={{ color: '#2563eb' }} />
      </Box>
    }>
      <EnterpriseDashboardContent />
    </Suspense>
  );
}

