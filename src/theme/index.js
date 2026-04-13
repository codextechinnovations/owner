import { createTheme } from '@mui/material/styles';

export const colors = {
  primary: {
    50: '#f0f4ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#1a1a4e',
    800: '#2d2d7e',
    900: '#1e3a8a',
  },
  accent: {
    orange: '#f97316',
    green: '#10B981',
    red: '#EF4444',
    purple: '#8B5CF6',
    amber: '#F59E0B',
    blue: '#3B82F6',
  },
  background: {
    default: '#F8F9FF',
    paper: '#FFFFFF',
    dark: '#1a1a4e',
  },
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    disabled: '#9CA3AF',
    white: '#FFFFFF',
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  border: {
    light: '#E6E6F0',
    main: '#F3F4F6',
  },
  gradients: {
    primary: ['#1a1a4e', '#2d2d7e', '#1e3a8a'],
    hero: ['#1a1a4e', '#2d2d7e', '#1e3a8a'],
    accent: ['#f97316', '#ea580c'],
    success: ['#10B981', '#059669'],
  },
};

export const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  palette: {
    mode: 'light',
    common: {
      white: '#FFFFFF',
      black: '#000000',
    },
    primary: {
      main: colors.primary[700],
      light: colors.primary[400],
      dark: colors.primary[900],
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: colors.accent.orange,
      contrastText: '#FFFFFF',
    },
    success: {
      main: colors.success,
    },
    error: {
      main: colors.error,
    },
    warning: {
      main: colors.warning,
    },
    info: {
      main: colors.info,
    },
    background: {
      default: colors.background.default,
      paper: colors.background.paper,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
      disabled: colors.text.disabled,
    },
    divider: colors.border.light,
    action: {
      hover: `${colors.primary[700]}10`,
      selected: `${colors.primary[700]}15`,
    },
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    h1: { fontWeight: 800, fontSize: '2.5rem', '@media (max-width:600px)': { fontSize: '2rem' } },
    h2: { fontWeight: 700, fontSize: '2rem', '@media (max-width:600px)': { fontSize: '1.5rem' } },
    h3: { fontWeight: 700, fontSize: '1.5rem', '@media (max-width:600px)': { fontSize: '1.25rem' } },
    h4: { fontWeight: 600, fontSize: '1.25rem', '@media (max-width:600px)': { fontSize: '1.1rem' } },
    h5: { fontWeight: 600, fontSize: '1rem', '@media (max-width:600px)': { fontSize: '0.9rem' } },
    h6: { fontWeight: 600, fontSize: '0.875rem', '@media (max-width:600px)': { fontSize: '0.8rem' } },
    body1: { fontSize: '1rem', '@media (max-width:600px)': { fontSize: '0.875rem' } },
    body2: { fontSize: '0.875rem', '@media (max-width:600px)': { fontSize: '0.8rem' } },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 20px',
          '@media (max-width:600px)': {
            padding: '8px 16px',
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 8px',
          '@media (max-width:600px)': {
            padding: '8px 4px',
            fontSize: '0.75rem',
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.75rem',
            '@media (max-width:600px)': {
              fontSize: '0.7rem',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          '@media (max-width:600px)': {
            margin: 8,
            maxHeight: 'calc(100% - 16px)',
          },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: '16px',
          '@media (max-width:600px)': {
            padding: '12px 16px',
            fontSize: '1rem',
          },
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '16px',
          '@media (max-width:600px)': {
            padding: '12px 16px',
          },
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          '@media (max-width:600px)': {
            padding: '8px 16px',
            '& .MuiButton-root': {
              flex: 1,
            },
          },
        },
      },
    },
  },
});
