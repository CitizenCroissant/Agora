import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, typography, fonts } from '@/theme'
import { SkeletonListPlaceholder } from '@/app/components/Skeleton'

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
        <SkeletonListPlaceholder rows={3} />
        {message != null && message.length > 0 && (
          <Text style={styles.loadingText}>{message}</Text>
        )}
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
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl
  },
  loadingText: {
    marginTop: spacing.lg,
    color: colors.textLight,
    fontSize: typography.fontSize.base,
    fontFamily: fonts.body,
    textAlign: 'center'
  },
  errorContainer: {
    padding: spacing.xl,
    alignItems: 'center'
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.base,
    fontFamily: fonts.bodyMedium,
    marginBottom: spacing.sm
  },
  errorHint: {
    color: colors.textLight,
    fontSize: typography.fontSize.md,
    fontFamily: fonts.body,
    textAlign: 'center'
  },
  emptyContainer: {
    padding: spacing.xxxl,
    alignItems: 'center'
  },
  emptyText: {
    color: colors.textLight,
    fontSize: typography.fontSize.base,
    fontFamily: fonts.body,
    textAlign: 'center'
  }
})
