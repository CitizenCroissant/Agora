import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { AgendaResponse } from '@agora/shared'
import { getTodayDate, formatDate, addDays, subtractDays } from '@agora/shared'
import { apiClient } from '@/lib/api'

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
    <View style={styles.container}>
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
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#0055a4" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Erreur: {error}</Text>
            <Text style={styles.errorHint}>
              Vérifiez votre connexion internet et réessayez.
            </Text>
          </View>
        )}

        {!loading && !error && agenda && (
          <>
            {agenda.sittings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucune séance prévue pour cette date.</Text>
              </View>
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  controlBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 85, 164, 0.1)',
    padding: 16,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    marginBottom: 12,
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
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  iconButtonText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#333',
    lineHeight: 32,
  },
  todayButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#0055a4',
    borderRadius: 8,
    marginLeft: 6,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  voteCta: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    backgroundColor: 'rgba(0, 85, 164, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 85, 164, 0.2)',
  },
  voteCtaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0055a4',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4135',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  errorHint: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  sittingCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sittingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sittingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0055a4',
    flex: 1,
    marginRight: 8,
  },
  timeRange: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 8,
  },
  itemsCount: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  itemsCountText: {
    fontSize: 12,
    color: '#666',
  },
  source: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  sourceLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  sourceDate: {
    fontSize: 11,
    color: '#666',
  },
})
