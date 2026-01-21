'use client'

import { useEffect, useState } from 'react'
import { AgendaRangeResponse } from '@agora/shared'
import { createApiClient, getTodayDate, formatDate, addDays, subtractDays } from '@agora/shared'
import Link from 'next/link'
import styles from './timeline.module.css'

const apiClient = createApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
)

export default function TimelinePage() {
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
    <div className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <Link href="/" className={styles.backLink}>
            ← Retour
          </Link>
          <h1 className={styles.title}>Calendrier</h1>
          <p className={styles.subtitle}>
            Vue d'ensemble de l'agenda parlementaire
          </p>
        </div>
      </header>

      <main className={styles.main}>
        <div className="container">
          {loading && (
            <div className={styles.loading}>
              Chargement du calendrier...
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>Erreur: {error}</p>
            </div>
          )}

          {!loading && !error && agendaRange && (
            <div className={styles.timeline}>
              {agendaRange.agendas.length === 0 ? (
                <div className={styles.empty}>
                  <p>Aucune séance prévue pour cette période.</p>
                </div>
              ) : (
                agendaRange.agendas.map((agenda) => {
                  const isToday = agenda.date === getTodayDate()
                  return (
                    <div
                      key={agenda.date}
                      className={`${styles.dateSection} ${
                        isToday ? styles.today : ''
                      }`}
                    >
                      <div className={styles.dateHeader}>
                        <h2>{formatDate(agenda.date)}</h2>
                        {isToday && <span className={styles.todayBadge}>Aujourd'hui</span>}
                        <Link href={`/?date=${agenda.date}`} className={styles.viewDay}>
                          Voir cette journée →
                        </Link>
                      </div>

                      {agenda.sittings.length === 0 ? (
                        <p className={styles.noSittings}>Aucune séance prévue</p>
                      ) : (
                        <div className={styles.sittings}>
                          {agenda.sittings.map((sitting) => (
                            <Link
                              key={sitting.id}
                              href={`/sitting/${sitting.id}`}
                              className={styles.sittingCard}
                            >
                              <div className={styles.sittingHeader}>
                                <h3>{sitting.title}</h3>
                                {sitting.time_range && (
                                  <span className={styles.timeRange}>
                                    {sitting.time_range}
                                  </span>
                                )}
                              </div>
                              <p className={styles.itemCount}>
                                {sitting.agenda_items.length} point(s) à l'ordre du jour
                              </p>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className="container">
          <p>Agora - Données officielles de l'Assemblée nationale</p>
        </div>
      </footer>
    </div>
  )
}
