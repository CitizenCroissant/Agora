import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { AgendaResponse } from '@agora/shared'
import { createApiClient, getTodayDate, formatDate, addDays, subtractDays } from '@agora/shared'

// TODO: Replace with your actual API URL
const API_URL = 'https://your-api.vercel.app/api'
const apiClient = createApiClient(API_URL)

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
      <View style={styles.dateNav}>
        <TouchableOpacity style={styles.navButton} onPress={goToPreviousDay}>
          <Text style={styles.navButtonText}>← Précédent</Text>
        </TouchableOpacity>
        <View style={styles.dateDisplay}>
          <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
          {currentDate !== getTodayDate() && (
            <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
              <Text style={styles.todayButtonText}>Aujourd'hui</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.navButton} onPress={goToNextDay}>
          <Text style={styles.navButtonText}>Suivant →</Text>
        </TouchableOpacity>
      </View>

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
                        {sitting.agenda_items.length} point(s) à l'ordre du jour
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
  dateNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navButton: {
    padding: 8,
  },
  navButtonText: {
    color: '#0055a4',
    fontSize: 14,
    fontWeight: '500',
  },
  dateDisplay: {
    alignItems: 'center',
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  todayButton: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#ef4135',
    borderRadius: 12,
  },
  todayButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
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
