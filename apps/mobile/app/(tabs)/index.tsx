import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { AgendaResponse } from '@agora/shared'
import { getTodayDate, formatDate, addDays, subtractDays } from '@agora/shared'
import { apiClient } from '@/lib/api'
import { ScreenContainer } from '@/app/components/ScreenContainer'
import { StatusMessage } from '@/app/components/StatusMessage'
import { colors, spacing, radius, typography, shadows } from '@/theme'

export default function TodayScreen() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState<string>(getTodayDate())
  const [agenda, setAgenda] = useState<AgendaResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAgenda(currentDate)
  }, [currentDate])

  const loadAgenda = async (date: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.getAgenda(date)
      setAgenda(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agenda')
      setAgenda(null)
    } finally {
      setLoading(false)
    }
  }

  const goToPreviousDay = () => {
    setCurrentDate(subtractDays(currentDate, 1))
  }

  const goToNextDay = () => {
    setCurrentDate(addDays(currentDate, 1))
  }

  const goToToday = () => {
    setCurrentDate(getTodayDate())
  }

  return (
    <ScreenContainer>
      <View style={styles.controlBar}>
        <View style={styles.topRow}>
          <View style={styles.navigationControls}>
            <TouchableOpacity style={styles.iconButton} onPress={goToPreviousDay}>
              <Text style={styles.iconButtonText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={goToNextDay}>
              <Text style={styles.iconButtonText}>›</Text>
            </TouchableOpacity>
            {currentDate !== getTodayDate() && (
              <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
                <Text style={styles.todayButtonText}>Aujourd&apos;hui</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.dateTitle}>{formatDate(currentDate)}</Text>
      </View>

      <TouchableOpacity
        style={styles.voteCta}
        onPress={() => router.push(`/votes?date=${getTodayDate()}`)}
      >
        <Text style={styles.voteCtaText}>
          Comprendre les votes d&apos;aujourd&apos;hui →
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.content}>
        {loading && (
          <StatusMessage type="loading" message="Chargement..." />
        )}

        {error && (
          <StatusMessage
            type="error"
            message={`Erreur: ${error}`}
            hint="Vérifiez votre connexion internet et réessayez."
          />
        )}

        {!loading && !error && agenda && (
          <>
            {agenda.sittings.length === 0 ? (
              <StatusMessage type="empty" message="Aucune séance prévue pour cette date." />
            ) : (
              agenda.sittings.map((sitting) => (
                <TouchableOpacity
                  key={sitting.id}
                  style={styles.sittingCard}
                  onPress={() => router.push(`/sitting/${sitting.id}`)}
                >
                  <View style={styles.sittingHeader}>
                    <Text style={styles.sittingTitle}>{sitting.title}</Text>
                    {sitting.time_range && (
                      <Text style={styles.timeRange}>{sitting.time_range}</Text>
                    )}
                  </View>

                  {sitting.location && (
                    <Text style={styles.location}>📍 {sitting.location}</Text>
                  )}

                  <Text style={styles.description} numberOfLines={2}>
                    {sitting.description}
                  </Text>

                  {sitting.agenda_items.length > 0 && (
                    <View style={styles.itemsCount}>
                      <Text style={styles.itemsCountText}>
                        {sitting.agenda_items.length} point(s) à l&apos;ordre du jour
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}

            {agenda.sittings.length > 0 && (
              <View style={styles.source}>
                <Text style={styles.sourceLabel}>{agenda.source.label}</Text>
                <Text style={styles.sourceDate}>
                  Mise à jour: {new Date(agenda.source.last_updated_at).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  controlBar: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryTint,
    padding: spacing.lg,
    paddingBottom: spacing.md,
    ...shadows.sm,
  },
  topRow: {
    marginBottom: spacing.md,
  },
  navigationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  iconButtonText: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.text,
    lineHeight: 32,
  },
  todayButton: {
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    marginLeft: 6,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
  dateTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  voteCta: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.primaryTintLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryTintStrong,
  },
  voteCtaText: {
    fontSize: 15,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  sittingCard: {
    backgroundColor: colors.background,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  sittingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  sittingTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  timeRange: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  location: {
    fontSize: typography.fontSize.md,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.md,
    lineHeight: 20,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  itemsCount: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  itemsCountText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  source: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  sourceLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  sourceDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
})
