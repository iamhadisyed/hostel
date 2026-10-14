// StayPilot design tokens — single source of truth for color, type, spacing,
// radius and elevation. Components reference these, never raw hex/px values,
// so the brand can be re-themed (including dark mode) from one place.

export const palette = {
  navy900: '#0C2138',
  navy: '#102A4C',
  navy700: '#1C3A61',
  teal: '#12AAA6',
  tealDark: '#0E8582',
  tealLight: '#D9F2F1',
  gold: '#F0B64D',
  goldDark: '#C78F2E',
  goldLight: '#FCEBCB',
  white: '#FFFFFF',
  slate50: '#F5F7FA',
  slate100: '#EBEEF3',
  slate200: '#DCE1EA',
  slate300: '#C2C9D6',
  slate500: '#7C8698',
  slate700: '#4A5468',
  slate900: '#1E2533',
  red: '#E5484D',
  redLight: '#FBE3E3',
  green: '#1E9E6D',
  greenLight: '#DEF4E9'
} as const

export const colors = {
  // Brand
  primary: palette.navy,
  primaryDark: palette.navy900,
  primarySurface: palette.navy700,
  accent: palette.teal,
  accentDark: palette.tealDark,
  accentSurface: palette.tealLight,
  gold: palette.gold,
  goldSurface: palette.goldLight,

  // Surfaces
  background: palette.slate50,
  surface: palette.white,
  surfaceAlt: palette.slate100,
  border: palette.slate200,
  borderStrong: palette.slate300,

  // Text
  textPrimary: palette.navy900,
  textSecondary: palette.slate700,
  textMuted: palette.slate500,
  textOnPrimary: palette.white,
  textOnAccent: palette.white,

  // Semantic / status
  success: palette.green,
  successSurface: palette.greenLight,
  warning: palette.gold,
  warningSurface: palette.goldLight,
  danger: palette.red,
  dangerSurface: palette.redLight,
  info: palette.teal,
  infoSurface: palette.tealLight,

  // Status badges (booking/expense/payment lifecycle)
  statusPending: palette.gold,
  statusPendingSurface: palette.goldLight,
  statusActive: palette.teal,
  statusActiveSurface: palette.tealLight,
  statusApproved: palette.green,
  statusApprovedSurface: palette.greenLight,
  statusRejected: palette.red,
  statusRejectedSurface: palette.redLight,
  statusNeutral: palette.slate500,
  statusNeutralSurface: palette.slate100
} as const

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40
} as const

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999
} as const

// Manrope for headings/display, Inter for body/UI text — loaded via
// src/theme/fonts.ts. Falls back to the system font until loaded.
export const fontFamily = {
  headingRegular: 'Manrope_500Medium',
  headingSemibold: 'Manrope_600SemiBold',
  headingBold: 'Manrope_700Bold',
  headingExtraBold: 'Manrope_800ExtraBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold'
} as const

export const type = {
  display: { fontFamily: fontFamily.headingExtraBold, fontSize: 32, lineHeight: 40 },
  h1: { fontFamily: fontFamily.headingBold, fontSize: 26, lineHeight: 33 },
  h2: { fontFamily: fontFamily.headingBold, fontSize: 20, lineHeight: 27 },
  h3: { fontFamily: fontFamily.headingSemibold, fontSize: 17, lineHeight: 23 },
  bodyLg: { fontFamily: fontFamily.body, fontSize: 16, lineHeight: 23 },
  body: { fontFamily: fontFamily.body, fontSize: 14, lineHeight: 20 },
  bodyMedium: { fontFamily: fontFamily.bodyMedium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fontFamily.body, fontSize: 12, lineHeight: 16 },
  label: { fontFamily: fontFamily.bodySemibold, fontSize: 12, lineHeight: 16 },
  button: { fontFamily: fontFamily.headingSemibold, fontSize: 15, lineHeight: 20 }
} as const

export const elevation = {
  none: {},
  sm: {
    shadowColor: palette.navy900,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  md: {
    shadowColor: palette.navy900,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  lg: {
    shadowColor: palette.navy900,
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  }
} as const

// Minimum touch target (Material 3 / WCAG 2.2): 48dp with >=8dp between targets.
export const touchTarget = {
  min: 48,
  gap: 8
} as const

export const motion = {
  fast: 140,
  base: 220,
  slow: 320
} as const

export const brand = {
  name: 'StayPilot',
  tagline: 'Manage every stay. Simplify every day.'
} as const
