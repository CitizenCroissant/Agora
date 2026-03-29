/**
 * Design tokens aligned with web app (apps/web/app/globals.css).
 * Civic Warmth palette -- use these instead of hardcoded values.
 */

export const colors = {
  // Brand
  primary: '#1E3A5F',
  primaryDark: '#142A47',
  accentCoral: '#E85D3A',
  accentCoralDark: '#C44827',
  accentCoralTint: 'rgba(232, 93, 58, 0.12)',
  accentTeal: '#2BA89E',
  accentTealDark: '#1F7D75',
  accentTealTint: 'rgba(43, 168, 158, 0.12)',
  accentAmber: '#F0A030',
  accentAmberDark: '#B07510',
  accentAmberTint: 'rgba(240, 160, 48, 0.1)',
  accentAmberBorder: 'rgba(240, 160, 48, 0.3)',

  // Backwards-compat alias (used by many screens)
  secondary: '#E85D3A',

  // Text
  text: '#2A2A2A',
  textLight: '#7A7A7A',
  textMuted: '#A0A0A0',
  textInverse: '#FFFFFF',

  // Backgrounds -- warm, paper-like
  background: '#FAFAF7',
  backgroundAlt: '#F4F2EE',
  backgroundCard: '#FFFFFF',
  backgroundInput: '#F4F2EE',
  backgroundHover: 'rgba(30, 58, 95, 0.05)',

  // Border
  border: '#E8E4DC',
  borderLight: '#F0EDE8',

  // Semantic status
  success: '#2E8B57',
  successDark: '#1E6B3F',
  successBg: 'rgba(46, 139, 87, 0.12)',
  error: '#C0392B',
  errorDark: '#962D22',
  errorBg: 'rgba(232, 93, 58, 0.12)',
  errorBgLight: '#FFF8F6',
  warning: '#D4870A',

  // Primary tints (links, pills, focus)
  primaryTintLight: 'rgba(30, 58, 95, 0.06)',
  primaryTint: 'rgba(30, 58, 95, 0.1)',
  primaryTintMedium: 'rgba(30, 58, 95, 0.15)',
  primaryTintStrong: 'rgba(30, 58, 95, 0.2)'
} as const

/** Section accent colors (Guardian-inspired per-section identity) */
export const sectionColors = {
  aujourdhui: '#E85D3A',
  votes: '#F0A030',
  calendrier: '#2BA89E',
  explorer: '#1E3A5F',
  comprendre: '#7B5EA7'
} as const

/** Spacing scale (px). Aligns with web rem: 8≈0.5rem, 16≈1rem, 24≈1.5rem, 32≈2rem, 48≈3rem */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48
} as const

/** Border radius (px) */
export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  pill: 999
} as const

/** Loaded via expo-font in app/_layout.tsx — names match useAppFonts map keys */
export const fonts = {
  heading: "Sora_600SemiBold",
  headingBold: "Sora_700Bold",
  body: "Figtree_400Regular",
  bodyMedium: "Figtree_500Medium",
  bodySemibold: "Figtree_600SemiBold",
  bodyBold: "Figtree_700Bold"
} as const;

/** Typography: font sizes and weights */
export const typography = {
  fontSize: {
    xs: 11,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const
  }
} as const

/** Shadow presets for React Native -- warm-tinted (shadowColor uses primary navy) */
export const shadows = {
  sm: {
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  md: {
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  elevated: {
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6
  }
} as const

/** Animation presets for use with react-native-reanimated or Animated API */
export const animation = {
  duration: {
    fast: 120,
    normal: 220,
    slow: 380
  },
  easing: {
    // Approximate JS easing functions matching CSS counterparts
    outExpo: [0.16, 1, 0.3, 1] as [number, number, number, number],
    inOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
    spring: [0.34, 1.56, 0.64, 1] as [number, number, number, number]
  }
} as const

/** Common style presets using theme tokens (for use in StyleSheet.create or as reference) */
export const commonStyles = {
  screenContainer: {
    flex: 1,
    backgroundColor: colors.backgroundAlt
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.md
  },
  controlBar: {
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: spacing.lg,
    paddingBottom: spacing.md,
    ...shadows.sm
  },
  loadingContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: spacing.xxxl
  },
  loadingText: {
    marginTop: spacing.lg,
    color: colors.textLight,
    fontSize: typography.fontSize.base
  },
  errorContainer: {
    padding: spacing.xl,
    alignItems: 'center' as const
  },
  errorText: {
    color: colors.accentCoral,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.sm
  },
  errorHint: {
    color: colors.textLight,
    fontSize: typography.fontSize.md,
    textAlign: 'center' as const
  },
  emptyContainer: {
    padding: spacing.xxxl,
    alignItems: 'center' as const
  },
  emptyText: {
    color: colors.textLight,
    fontSize: typography.fontSize.base,
    textAlign: 'center' as const
  }
}

export const theme = {
  colors,
  fonts,
  sectionColors,
  spacing,
  radius,
  typography,
  shadows,
  animation,
  commonStyles
} as const
