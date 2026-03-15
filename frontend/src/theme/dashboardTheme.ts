import { createTheme } from '@mui/material';

// Apple Human Interface Guidelines color system
// https://developer.apple.com/design/human-interface-guidelines/color

const apple = {
  blue:   { light: '#007AFF', dark: '#0A84FF' },
  green:  { light: '#34C759', dark: '#30D158' },
  red:    { light: '#FF3B30', dark: '#FF453A' },
  orange: { light: '#FF9500', dark: '#FF9F0A' },
  purple: { light: '#AF52DE', dark: '#BF5AF2' },
  teal:   { light: '#5AC8FA', dark: '#64D2FF' },
  indigo: { light: '#5856D6', dark: '#5E5CE6' },

  // System backgrounds
  bg: {
    light: { default: '#F2F2F7', paper: '#FFFFFF' },
    dark:  { default: '#000000', paper: '#1C1C1E' },
  },

  // Labels
  label: {
    light: { primary: '#000000', secondary: 'rgba(60,60,67,0.6)' },
    dark:  { primary: '#FFFFFF',  secondary: 'rgba(235,235,245,0.6)' },
  },

  // Separators
  separator: {
    light: 'rgba(60,60,67,0.12)',
    dark:  'rgba(84,84,88,0.55)',
  },

  // Fill (used for subtle backgrounds on surfaces)
  fill: {
    light: 'rgba(120,120,128,0.12)',
    dark:  'rgba(120,120,128,0.36)',
  },
};

export const getCustomTheme = (mode: 'light' | 'dark') => {
  const m = mode;
  const isD = m === 'dark';
  const blue = apple.blue[m];

  return createTheme({
    palette: {
      mode: m,
      primary: {
        main:  blue,
        light: isD ? '#409CFF' : '#409CFF',
        dark:  isD ? '#0071E3' : '#0056B3',
      },
      secondary: {
        main: apple.indigo[m],
      },
      background: {
        default: apple.bg[m].default,
        paper:   apple.bg[m].paper,
      },
      text: {
        primary:   apple.label[m].primary,
        secondary: apple.label[m].secondary,
      },
      divider: apple.separator[m],
      success: { main: apple.green[m] },
      warning: { main: apple.orange[m] },
      error:   { main: apple.red[m] },
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, "Helvetica Neue", Arial, sans-serif',
      h4:      { fontWeight: 700, letterSpacing: '-0.03em', fontSize: '1.75rem' },
      h5:      { fontWeight: 700, letterSpacing: '-0.02em' },
      h6:      { fontWeight: 600, letterSpacing: '-0.015em', fontSize: '1rem' },
      overline: { fontWeight: 600, letterSpacing: '0.06em', fontSize: '0.6rem' },
      body2:   { fontSize: '0.85rem' },
      caption: { fontSize: '0.7rem' },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            transition: 'all 0.2s ease',
            padding: '9px 22px',
          },
          containedPrimary: {
            background: blue,
            boxShadow: 'none',
            color: '#fff',
            '&:hover': {
              background: isD ? '#409CFF' : '#0056B3',
              boxShadow: `0 4px 16px ${isD ? 'rgba(10,132,255,0.35)' : 'rgba(0,122,255,0.28)'}`,
              transform: 'none',
            },
            '&:active': {
              transform: 'scale(0.98)',
            },
          },
          outlinedPrimary: {
            borderColor: blue,
            color: blue,
            '&:hover': {
              borderColor: blue,
              background: isD ? 'rgba(10,132,255,0.1)' : 'rgba(0,122,255,0.07)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isD ? 'rgba(28,28,30,0.88)' : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: `1px solid ${isD ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)'}`,
            boxShadow: isD
              ? '0 8px 32px rgba(0,0,0,0.5)'
              : '0 2px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${apple.separator[m]}`,
            padding: '14px 16px',
          },
          head: {
            fontWeight: 600,
            color: apple.label[m].secondary,
            textTransform: 'uppercase',
            fontSize: '0.65rem',
            letterSpacing: '0.04em',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 600,
          },
        },
      },
      MuiSlider: {
        styleOverrides: {
          root: { color: blue },
          thumb: {
            '&:hover, &.Mui-focusVisible': {
              boxShadow: `0 0 0 8px ${isD ? 'rgba(10,132,255,0.16)' : 'rgba(0,122,255,0.16)'}`,
            },
            '&:before': { boxShadow: 'none' },
          },
          rail: { opacity: 0.18 },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            '&.Mui-checked': {
              color: '#fff',
              '& + .MuiSwitch-track': { backgroundColor: blue, opacity: 1 },
            },
          },
          track: {
            backgroundColor: isD ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)',
            opacity: 1,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isD ? 'rgba(44,44,46,0.95)' : 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(8px)',
            borderRadius: 8,
            fontSize: '0.72rem',
            fontWeight: 500,
            padding: '6px 10px',
          },
          arrow: {
            color: isD ? 'rgba(44,44,46,0.95)' : 'rgba(0,0,0,0.82)',
          },
        },
      },
    },
  });
};
