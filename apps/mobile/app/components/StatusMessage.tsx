import React from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { colors, spacing, typography } from '@/theme'

type StatusMessageType = 'loading' | 'error' | 'empty'

interface StatusMessageProps {
  type: StatusMessageType
  message?: string
  hint?: string
}

export function StatusMessage({ type, message, hint }: StatusMessageProps) {
  if (type === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{message ?? 'Chargement...'}</Text>
      </View>
    )
  }

  if (type === 'error') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{message ?? 'Erreur'}</Text>
        {hint != null && <Text style={styles.errorHint}>{hint}</Text>}
      </View>
    )
  }

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{message ?? 'Aucun résultat.'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  loadingText: {
    marginTop: spacing.lg,
    color: colors.textLight,
    fontSize: typography.fontSize.base,
  },
  errorContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    color: colors.secondary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.sm,
  },
  errorHint: {
    color: colors.textLight,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textLight,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
  },
})
