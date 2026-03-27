import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, LayoutAnimation } from 'react-native'
import { useRouter } from 'expo-router'
import { AgendaResponse } from '@agora/shared'
import { getTodayDate, formatDate, addDays, subtractDays } from '@agora/shared'
import { apiClient } from '@/lib/api'
import { ScreenContainer } from '@/app/components/ScreenContainer'
import { StatusMessage } from '@/app/components/StatusMessage'
import { colors, spacing, radius, typography, shadows, sectionColors } from '@/theme'
import { layoutAnimationPresets } from '@/lib/animations'

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
      LayoutAnimation.configureNext(layoutAnimationPresets.normal)
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

  const isToday = currentDate === getTodayDate()

  return (
    <ScreenContainer>
      <View style={styles.heroBar}>
        <View style={styles.navigationRow}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={goToPreviousDay}
            accessibilityLabel="Jour précédent"
            accessibilityRole="button"
          >
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.heroDateArea}>
            <Text style={styles.heroDate}>{formatDate(currentDate)}</Text>
            {isToday && (
              <View style={styles.todayPill}>
                <Text style={styles.todayPillText}>Aujourd&apos;hui</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.navButton}
            onPress={goToNextDay}
            accessibilityLabel="Jour suivant"
            accessibilityRole="button"
          >
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </View>
        {!isToday && (
          <TouchableOpacity
            style={styles.backTodayBtn}
            onPress={goToToday}
            accessibilityLabel="Revenir à aujourd'hui"
            accessibilityRole="button"
          >
            <Text style={styles.backTodayText}>← Revenir à aujourd&apos;hui</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.voteCta}
        onPress={() => router.push(`/votes?date=${getTodayDate()}`)}
        accessibilityLabel="Scrutins du jour — voir les votes"
        accessibilityRole="button"
      >
        <View style={styles.voteCtaAccent} />
        <Text style={styles.voteCtaText}>
          🗳 Scrutins du jour — voir les votes →
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
                  accessibilityLabel={sitting.title}
                  accessibilityHint="Voir les détails de la séance"
                  accessibilityRole="button"
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
  heroBar: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundAlt
  },
  navButtonText: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.text,
    lineHeight: 32
  },
  heroDateArea: {
    alignItems: 'center',
    flex: 1,
    gap: 6
  },
  heroDate: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    textTransform: 'capitalize',
    textAlign: 'center'
  },
  todayPill: {
    backgroundColor: sectionColors.aujourdhui,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  todayPillText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  backTodayBtn: {
    marginTop: spacing.sm,
    alignSelf: 'center'
  },
  backTodayText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium
  },
  voteCta: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.accentAmberTint,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accentAmberBorder,
    flexDirection: 'row',
    alignItems: 'center'
  },
  voteCtaAccent: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: sectionColors.votes,
    borderRadius: 2,
    marginRight: spacing.md
  },
  voteCtaText: {
    fontSize: 14,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning,
    flex: 1
  },
  content: {
    flex: 1
  },
  sittingCard: {
    backgroundColor: colors.backgroundCard,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...shadows.md
  },
  sittingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm
  },
  sittingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    flex: 1,
    marginRight: spacing.sm
  },
  timeRange: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm
  },
  location: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.sm
  },
  description: {
    fontSize: typography.fontSize.md,
    lineHeight: 20,
    color: colors.text,
    marginBottom: spacing.sm
  },
  itemsCount: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  itemsCountText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight
  },
  source: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.md,
    alignItems: 'center'
  },
  sourceLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs
  },
  sourceDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight
  }
})
