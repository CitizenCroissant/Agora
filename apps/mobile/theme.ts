/**
 * Design tokens aligned with web app (apps/web/app/globals.css).
 * Use these instead of hardcoded colors/spacing/radius across the mobile app.
 */

export const colors = {
  // Brand
  primary: '#0055a4',
  primaryDark: '#003d7a',
  secondary: '#ef4135',

  // Text
  text: '#1a1a1a',
  textLight: '#666666',
  textMuted: '#999999',

  // Backgrounds
  background: '#ffffff',
  backgroundAlt: '#f5f5f5',
  backgroundInput: '#f9fafb',

  // Border
  border: '#e0e0e0',
  borderLight: '#f0f0f0',

  // Semantic status
  success: '#15803d',
  successDark: '#14532d',
  successBg: 'rgba(0, 128, 0, 0.15)',
  error: '#b91c1c',
  errorDark: '#991b1b',
  errorBg: 'rgba(200, 0, 0, 0.15)',
  errorBgLight: '#fff5f5',
  warning: '#a16207',

  // Primary tints (links, pills, focus)
  primaryTintLight: 'rgba(0, 85, 164, 0.08)',
  primaryTint: 'rgba(0, 85, 164, 0.1)',
  primaryTintMedium: 'rgba(0, 85, 164, 0.15)',
  primaryTintStrong: 'rgba(0, 85, 164, 0.2)'
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

/** Shadow presets for React Native (shadowColor + shadowOffset + shadowOpacity + shadowRadius + elevation) */
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  }
} as const

/** Common style presets using theme tokens (for use in StyleSheet.create or as reference) */
export const commonStyles = {
  screenContainer: {
    flex: 1,
    backgroundColor: colors.backgroundAlt
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.md
  },
  controlBar: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryTint,
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
    color: colors.secondary,
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
  spacing,
  radius,
  typography,
  shadows,
  commonStyles
} as const
