import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { AgendaRangeResponse } from '@agora/shared'
import { createApiClient, getTodayDate, formatDate, addDays, subtractDays } from '@agora/shared'

// TODO: Replace with your actual API URL
const API_URL = 'https://your-api.vercel.app/api'
const apiClient = createApiClient(API_URL)

export default function TimelineScreen() {
  const router = useRouter()
  const [agendaRange, setAgendaRange] = useState<AgendaRangeResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTimeline()
  }, [])

  const loadTimeline = async () => {
    setLoading(true)
    setError(null)
    try {
      const today = getTodayDate()
      const from = subtractDays(today, 7)
      const to = addDays(today, 14)
      const data = await apiClient.getAgendaRange(from, to)
      setAgendaRange(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline')
      setAgendaRange(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
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
          </View>
        )}

        {!loading && !error && agendaRange && (
          <>
            {agendaRange.agendas.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucune séance prévue pour cette période.</Text>
              </View>
            ) : (
              agendaRange.agendas.map((agenda) => {
                const isToday = agenda.date === getTodayDate()
                return (
                  <View key={agenda.date} style={[styles.dateSection, isToday && styles.todaySection]}>
                    <View style={styles.dateHeader}>
                      <Text style={styles.dateText}>{formatDate(agenda.date)}</Text>
                      {isToday && <Text style={styles.todayBadge}>Aujourd'hui</Text>}
                    </View>

                    {agenda.sittings.length === 0 ? (
                      <Text style={styles.noSittings}>Aucune séance prévue</Text>
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
                          <Text style={styles.itemCount}>
                            {sitting.agenda_items.length} point(s) à l'ordre du jour
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )
              })
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
  dateSection: {
    marginBottom: 24,
    paddingLeft: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#e0e0e0',
  },
  todaySection: {
    borderLeftColor: '#ef4135',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingRight: 16,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'capitalize',
    flex: 1,
  },
  todayBadge: {
    backgroundColor: '#ef4135',
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  noSittings: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  sittingCard: {
    backgroundColor: '#fff',
    marginRight: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sittingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  sittingTitle: {
    fontSize: 16,
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
  itemCount: {
    fontSize: 12,
    color: '#666',
  },
})
