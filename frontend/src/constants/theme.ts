export const Colors = {
  // Primary
  navyDeep: '#1B2A4A',
  tealSoft: '#4A9B8E',

  // Secondary
  sandWarm: '#C8A97E',
  greenMuted: '#6B9E7C',

  // Accent
  amberGentle: '#D4956A',

  // Backgrounds
  creamLight: '#F7F4EF',
  cardWhite: '#FFFFFF',
  backgroundAlt: '#EEF2F7',

  // Text
  textPrimary: '#1B2A4A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnDark: '#FFFFFF',

  // Semantic
  success: '#6B9E7C',
  warning: '#D4956A',
  crisis: '#C0392B',
  crisisLight: '#FDECEA',
  info: '#4A9B8E',

  // Borders
  border: '#E5E7EB',
  borderFocus: '#4A9B8E',

  // Overlays
  overlay: 'rgba(27, 42, 74, 0.85)',
  overlayLight: 'rgba(27, 42, 74, 0.4)',
} as const;

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 34,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
