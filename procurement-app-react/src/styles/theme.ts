import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary:   { main: '#1F3A5F', light: '#2E75B6', dark: '#162b47' },
    secondary: { main: '#2E75B6', light: '#5a78a5', dark: '#162b47' },
    success:   { main: '#155724', light: '#d4edda' },
    warning:   { main: '#856404', light: '#fff3cd' },
    error:     { main: '#721C24', light: '#f8d7da' },
    background:{ default: '#F0F2F5', paper: '#ffffff' },
    text:      { primary: '#1F3A5F', secondary: '#6C757D' },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
    h1: { fontSize: 32, fontWeight: 700, color: '#1F3A5F' },
    h2: { fontSize: 24, fontWeight: 600, color: '#1F3A5F' },
    h3: { fontSize: 18, fontWeight: 600, color: '#1F3A5F' },
    h4: { fontSize: 16, fontWeight: 600, color: '#1F3A5F' },
    h5: { fontSize: 14, fontWeight: 600, color: '#1F3A5F' },
    body1: { fontSize: 14, color: '#1F3A5F' },
    body2: { fontSize: 12, color: '#6C757D' },
    caption: { fontSize: 11, color: '#6C757D' },
  },
  shape: { borderRadius: 8 },
  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.05)',
    '0 2px 8px rgba(31,58,95,0.08)',
    '0 4px 6px rgba(0,0,0,0.07)',
    '0 6px 20px rgba(31,58,95,0.12)',
    '0 10px 15px rgba(0,0,0,0.10)',
    '0 10px 15px rgba(0,0,0,0.10)',
    '0 10px 15px rgba(0,0,0,0.10)',
    '0 10px 15px rgba(0,0,0,0.10)',
    '0 10px 15px rgba(0,0,0,0.10)',
    '0 10px 15px rgba(0,0,0,0.10)',
    '0 10px 15px rgba(0,0,0,0.10)',
    '0 10px 15px rgba(0,0,0,0.10)',
    '0 10px 15px rgba(0,0,0,0.10)',
    '0 10px 15px rgba(0,0,0,0.10)',
    '0 10px 15px rgba(0,0,0,0.10)',
    '0 10px 15px rgba(0,0,0,0.10)',
    '0 10px 15px rgba(0,0,0,0.10)',
    '0 10px 15px rgba(0,0,0,0.10)',
    '0 10px 15px rgba(0,0,0,0.10)',
    '0 10px 15px rgba(0,0,0,0.10)',
    '0 10px 15px rgba(0,0,0,0.10)',
    '0 10px 15px rgba(0,0,0,0.10)',
    '0 10px 15px rgba(0,0,0,0.10)',
    '0 10px 15px rgba(0,0,0,0.10)',
  ] as unknown as import('@mui/material').Shadows,
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(31,58,95,0.08)',
          border: '1px solid #e8edf3',
          borderRadius: 12,
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          '&:hover': { boxShadow: '0 6px 20px rgba(31,58,95,0.14)' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
        },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: 11, height: 22 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, color: '#6C757D', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' },
        body: { fontSize: 13, color: '#1F3A5F' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1F3A5F',
          boxShadow: '0 1px 0 #e8edf3',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: '#1F3A5F', color: '#ffffff' },
      },
    },
  },
})
