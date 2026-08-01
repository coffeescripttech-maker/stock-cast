// SafeHaven Color Palette (From Logo Design)

export const colors = {
  // Primary colors from SafeHaven brand
  primary: '#1F4E79',      // Safe Blue - Trust, safety, reliability
  secondary: '#C62828',    // Emergency Red - Urgency, danger, warnings
  accent: '#FBC02D',       // Electric Yellow - Power, electricity, highlights
  
  // Disaster-specific colors
  disaster: {
    fire: '#F57C00',       // Fire Orange - Fire, heat, caution
    storm: '#1976D2',      // Storm Blue - Floods, storms, water
    electric: '#FBC02D',   // Electric Yellow - Power outage, lightning
  },
  
  // Severity colors for disaster alerts
  severity: {
    critical: '#D32F2F',   // Red - Immediate danger
    high: '#FFA000',      // Amber - High risk
    moderate: '#0288D1',  // Blue - Moderate risk
    low: '#2E7D32',       // Green - Low risk
  },
  
  // Alert type colors
  alertTypes: {
    typhoon: '#1976D2',    // Storm Blue
    earthquake: '#8B5CF6',
    flood: '#0288D1',      // Info Blue
    storm_surge: '#1976D2',
    volcanic: '#D32F2F',   // Error Red
    tsunami: '#0891B2',
    landslide: '#92400E',
    fire: '#F57C00',       // Fire Orange
  },
  
  // UI colors
  background: '#ECEFF1',   // Cool Gray
  surface: '#FFFFFF',      // White
  card: '#FFFFFF',
  
  // Text colors
  text: {
    primary: '#1E2A38',    // Dark Navy
    secondary: '#6B7280',
    disabled: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  
  // Border colors
  border: {
    light: '#E5E7EB',
    default: '#D1D5DB',
    dark: '#9CA3AF',
  },
  
  // Status colors (matching web app)
  status: {
    success: '#2E7D32',    // SafeHaven Success Green
    warning: '#FFA000',    // SafeHaven Warning Amber
    error: '#D32F2F',      // SafeHaven Error Red
    info: '#0288D1',       // SafeHaven Info Blue
  },
  
  // Functional colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',
  
  // Map colors
  map: {
    marker: '#C62828',         // Emergency Red
    userLocation: '#1F4E79',   // Safe Blue
    radius: 'rgba(31, 78, 121, 0.2)',
  },
};

export default colors;

// Flat export for easier imports
export const COLORS = {
  // Primary
  primary: colors.primary,
  secondary: colors.secondary,
  accent: colors.accent,
  
  // Background
  background: colors.background,
  white: colors.surface,
  
  // Text
  text: colors.text.primary,
  textSecondary: colors.text.secondary,
  
  // Status
  success: colors.status.success,
  warning: colors.status.warning,
  error: colors.status.error,
  info: colors.status.info,
  
  // Border
  border: colors.border.default,
  
  // Other
  shadow: colors.shadow,
};
