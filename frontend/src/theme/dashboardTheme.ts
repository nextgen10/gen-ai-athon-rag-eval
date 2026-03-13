import { createTheme } from '@mui/material';

export const getCustomTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#2563eb',
        light: '#60a5fa',
        dark: '#1e40af',
      },
      secondary: {
        main: '#2dd4bf',
      },
      background: {
        default: mode === 'dark' ? '#020617' : '#f8fafc',
        paper: mode === 'dark' ? '#0f172a' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#f8fafc' : '#0f172a',
        secondary: mode === 'dark' ? '#64748b' : '#475569',
      },
      success: { main: '#059669' },
      warning: { main: '#d97706' },
      error: { main: '#e11d48' },
    },
    typography: {
      fontFamily:
        'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      h4: { fontWeight: 900, letterSpacing: '-0.04em', fontSize: '1.75rem' },
      h6: { fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1rem' },
      overline: { fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.6rem' },
      body2: { fontSize: '0.85rem' },
      caption: { fontSize: '0.7rem' },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none',
            fontWeight: 800,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            padding: '10px 24px',
          },
          containedPrimary: {
            background: '#2563eb',
            boxShadow: mode === 'dark' ? '0 4px 20px rgba(37, 99, 235, 0.3)' : '0 4px 14px rgba(37, 99, 235, 0.25)',
            color: '#fff',
            '&:hover': {
              background: '#1d4ed8',
              transform: 'translateY(-2px)',
              boxShadow: mode === 'dark' ? '0 8px 30px rgba(37, 99, 235, 0.5)' : '0 6px 20px rgba(37, 99, 235, 0.3)',
            },
          },
          outlinedPrimary: {
            borderColor: '#2563eb',
            color: '#2563eb',
            '&:hover': {
              borderColor: '#1d4ed8',
              background: mode === 'dark' ? 'rgba(37, 99, 235, 0.05)' : 'rgba(37, 99, 235, 0.04)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: mode === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(24px)',
            border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: mode === 'dark' ? '0 20px 50px rgba(0, 0, 0, 0.3)' : '0 10px 40px rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
            padding: '16px',
          },
          head: {
            fontWeight: 800,
            color: '#475569',
            textTransform: 'uppercase',
            fontSize: '0.65rem',
            letterSpacing: '0.05em',
          },
        },
      },
      MuiSlider: {
        styleOverrides: {
          root: { color: '#2563eb' },
          thumb: {
            '&:hover, &.Mui-focusVisible': { boxShadow: '0 0 0 8px rgba(37, 99, 235, 0.16)' },
            '&:before': { boxShadow: 'none' },
          },
          rail: { opacity: 0.1 },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            '&.Mui-checked': {
              color: '#2563eb',
              '& + .MuiSwitch-track': { backgroundColor: '#2563eb', opacity: 1 },
            },
          },
          track: { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', opacity: 1 },
        },
      },
    },
  });
