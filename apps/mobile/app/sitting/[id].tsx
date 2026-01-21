import { useState, useEffect } from 'react'
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Linking, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, Stack } from 'expo-router'
import { SittingDetailResponse } from '@agora/shared'
import { createApiClient, formatDate } from '@agora/shared'

// TODO: Replace with your actual API URL
const API_URL = 'https://your-api.vercel.app/api'
const apiClient = createApiClient(API_URL)

export default function SittingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [sitting, setSitting] = useState<SittingDetailResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadSitting(id)
    }
  }, [id])

  const loadSitting = async (sittingId: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.getSitting(sittingId)
      setSitting(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sitting')
      setSitting(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: sitting?.title || 'Détails',
          headerBackTitle: 'Retour',
        }}
      />
      <ScrollView style={styles.container}>
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

        {!loading && !error && sitting && (
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{sitting.title}</Text>
              <Text style={styles.date}>{formatDate(sitting.date)}</Text>
              {sitting.time_range && (
                <View style={styles.timeContainer}>
                  <Text style={styles.timeLabel}>Horaire</Text>
                  <Text style={styles.time}>{sitting.time_range}</Text>
                </View>
              )}
            </View>

            {sitting.location && (
              <View style={styles.locationContainer}>
                <Text style={styles.location}>📍 {sitting.location}</Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.description}>{sitting.description}</Text>
            </View>

            {sitting.agenda_items.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ordre du jour</Text>
                {sitting.agenda_items.map((item, index) => (
                  <View key={item.id} style={styles.agendaItem}>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemNumber}>
                        <Text style={styles.itemNumberText}>{index + 1}</Text>
                      </View>
                      {item.scheduled_time && (
                        <Text style={styles.itemTime}>
                          {item.scheduled_time.substring(0, 5)}
                        </Text>
                      )}
                      <Text style={styles.itemCategory}>{item.category}</Text>
                    </View>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {item.description !== item.title && (
                      <Text style={styles.itemDescription}>{item.description}</Text>
                    )}
                    {item.reference_code && (
                      <Text style={styles.itemReference}>
                        Référence: {item.reference_code}
                      </Text>
                    )}
                    {item.official_url && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(item.official_url!)}
                      >
                        <Text style={styles.itemLink}>
                          Consulter le document officiel →
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            {sitting.source_metadata && sitting.source_metadata.original_source_url && (
              <View style={styles.sourceContainer}>
                <Text style={styles.sourceTitle}>Source et provenance</Text>
                <Text style={styles.sourceLabel}>
                  Données officielles de l'Assemblée nationale
                </Text>
                <Text style={styles.sourceDate}>
                  Dernière synchronisation:{' '}
                  {new Date(sitting.source_metadata.last_synced_at).toLocaleDateString('fr-FR')}
                </Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL(sitting.source_metadata!.original_source_url)}
                >
                  <Text style={styles.sourceLink}>
                    Voir la source originale →
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0055a4',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: '#666',
    textTransform: 'capitalize',
    marginBottom: 12,
  },
  timeContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  time: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0055a4',
  },
  locationContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  location: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0055a4',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  agendaItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  itemNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0055a4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  itemNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  itemTime: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  itemCategory: {
    fontSize: 10,
    color: '#fff',
    backgroundColor: '#0055a4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  itemDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 4,
  },
  itemReference: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  itemLink: {
    fontSize: 14,
    color: '#0055a4',
    fontWeight: '500',
  },
  sourceContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 16,
  },
  sourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sourceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  sourceDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  sourceLink: {
    fontSize: 14,
    color: '#0055a4',
    fontWeight: '500',
  },
})
