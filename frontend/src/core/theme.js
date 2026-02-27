/**
 * FRACTAL PLATFORM V2 — LIGHT THEME
 * 
 * Design Rules:
 * - No dark mode
 * - All blocks white or light gray
 * - Charts white
 * - No heavy gradients
 * - No black backgrounds
 * - No shadow overuse
 */

export const theme = {
  // Backgrounds
  background: '#FFFFFF',
  section: '#F4F6F8',
  card: '#FFFFFF',
  
  // Borders
  border: '#E5E9EF',
  borderLight: '#F1F3F5',
  
  // Text
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  
  // Accents
  positive: '#16A34A',
  positiveLight: '#DCFCE7',
  negative: '#DC2626',
  negativeLight: '#FEE2E2',
  accent: '#2563EB',
  accentLight: '#DBEAFE',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  
  // Status colors
  statusSuccess: '#10B981',
  statusWarning: '#F59E0B',
  statusError: '#EF4444',
  statusInfo: '#3B82F6',
  
  // Chart colors
  chartCandle: {
    up: '#16A34A',
    down: '#DC2626',
    wick: '#9CA3AF',
  },
  chartBands: {
    p10: 'rgba(220, 38, 38, 0.15)', // red
    p50: 'rgba(37, 99, 235, 0.20)', // blue
    p90: 'rgba(22, 163, 74, 0.15)', // green
  },
  
  // Shadows (minimal)
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.07)',
  
  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  
  // Border radius
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
};

// Tailwind-compatible CSS variables
export const themeVars = `
  :root {
    --bg-primary: ${theme.background};
    --bg-secondary: ${theme.section};
    --bg-card: ${theme.card};
    
    --border: ${theme.border};
    --border-light: ${theme.borderLight};
    
    --text-primary: ${theme.textPrimary};
    --text-secondary: ${theme.textSecondary};
    --text-muted: ${theme.textMuted};
    
    --positive: ${theme.positive};
    --negative: ${theme.negative};
    --accent: ${theme.accent};
    --warning: ${theme.warning};
  }
`;

export default theme;
