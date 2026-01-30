"use client";

import { useEffect, useState } from "react";
import { AgendaResponse } from "@agora/shared";
import {
  getTodayDate,
  formatDate,
  addDays,
  subtractDays,
} from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  const [currentDate, setCurrentDate] = useState<string>(getTodayDate());
  const [agenda, setAgenda] = useState<AgendaResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAgenda(currentDate);
  }, [currentDate]);

  const loadAgenda = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getAgenda(date);
      setAgenda(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agenda");
      setAgenda(null);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousDay = () => {
    setCurrentDate(subtractDays(currentDate, 1));
  };

  const goToNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(getTodayDate());
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (newDate && newDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setCurrentDate(newDate);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <h1 className={styles.title}>Agora</h1>
          <p className={styles.subtitle}>Agenda de l'Assemblée nationale</p>
        </div>
      </header>

      <nav className={styles.nav}>
        <div className="container">
          <div className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>
              Aujourd'hui
            </Link>
            <Link href="/timeline" className={styles.navLink}>
              Calendrier
            </Link>
            <Link href="/votes" className={styles.navLink}>
              Scrutins
            </Link>
            <Link href="/groupes" className={styles.navLink}>
              Groupes politiques
            </Link>
            <Link href="/search" className={styles.navLink}>
              Recherche
            </Link>
            <Link href="/about" className={styles.navLink}>
              À propos
            </Link>
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        <div className="container">
          <div className={styles.controlBar}>
            <div className={styles.leftControls}>
              <button
                className={styles.iconButton}
                onClick={goToPreviousDay}
                aria-label="Jour précédent"
                title="Jour précédent"
              >
                ‹
              </button>
              <button
                className={styles.iconButton}
                onClick={goToNextDay}
                aria-label="Jour suivant"
                title="Jour suivant"
              >
                ›
              </button>
              {currentDate !== getTodayDate() && (
                <button className={styles.todayButton} onClick={goToToday}>
                  Aujourd'hui
                </button>
              )}
            </div>

            <div className={styles.centerControls}>
              <h2 className={styles.dateTitle}>{formatDate(currentDate)}</h2>
            </div>

            <div className={styles.rightControls}>
              <div className={styles.datePickerWrapper}>
                <span className={styles.calendarIcon}>📅</span>
                <input
                  type="date"
                  className={styles.datePicker}
                  value={currentDate}
                  onChange={handleDateChange}
                  aria-label="Sélectionner une date"
                  title="Choisir une date"
                />
              </div>
            </div>
          </div>

          {loading && (
            <div className={styles.loading}>Chargement de l'agenda...</div>
          )}

          {error && (
            <div className={styles.error}>
              <p>Erreur: {error}</p>
              <p className={styles.errorHint}>
                Assurez-vous que l'API est démarrée et accessible.
              </p>
            </div>
          )}

          {!loading && !error && agenda && (
            <>
              {agenda.sittings.length === 0 ? (
                <div className={styles.empty}>
                  <p>Aucune séance prévue pour cette date.</p>
                </div>
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

                      {sitting.location && (
                        <p className={styles.location}>📍 {sitting.location}</p>
                      )}

                      <p className={styles.description}>
                        {sitting.description}
                      </p>

                      {sitting.agenda_items.length > 0 && (
                        <div className={styles.agendaItems}>
                          <h4>Ordre du jour ({sitting.agenda_items.length})</h4>
                          <ul>
                            {sitting.agenda_items.slice(0, 3).map((item) => (
                              <li key={item.id}>
                                {item.scheduled_time && (
                                  <span className={styles.itemTime}>
                                    {item.scheduled_time.substring(0, 5)}
                                  </span>
                                )}
                                {item.title}
                              </li>
                            ))}
                            {sitting.agenda_items.length > 3 && (
                              <li className={styles.moreItems}>
                                ... et {sitting.agenda_items.length - 3}{" "}
                                autre(s)
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      <div className={styles.sittingFooter}>
                        <span className={styles.viewDetails}>
                          Voir les détails →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <div className={styles.source}>
                <p>
                  <strong>{agenda.source.label}</strong>
                </p>
                <p className={styles.sourceDate}>
                  Dernière mise à jour :{" "}
                  {new Date(agenda.source.last_updated_at).toLocaleString(
                    "fr-FR",
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className="container">
          <p>Agora - Données officielles de l'Assemblée nationale</p>
          <p>
            <Link href="/about">En savoir plus</Link> |{" "}
            <Link href="/sources">Sources</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
