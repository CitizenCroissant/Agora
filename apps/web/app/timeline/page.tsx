"use client";

import { useEffect, useState } from "react";
import { AgendaRangeResponse } from "@agora/shared";
import {
  getTodayDate,
  formatDate,
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
  addWeeks,
  addMonths,
  formatDateRange,
  formatMonth,
  isVoteLikeAgendaItem,
} from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./timeline.module.css";

type ViewMode = "week" | "month";

export default function TimelinePage() {
  const [agendaRange, setAgendaRange] = useState<AgendaRangeResponse | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState<string>(getTodayDate());
  const [dateInput, setDateInput] = useState<string>(getTodayDate());

  useEffect(() => {
    loadTimeline();
  }, [viewMode, currentDate]);

  const loadTimeline = async () => {
    setLoading(true);
    setError(null);
    try {
      let from: string;
      let to: string;

      if (viewMode === "week") {
        from = getWeekStart(currentDate);
        to = getWeekEnd(currentDate);
      } else {
        from = getMonthStart(currentDate);
        to = getMonthEnd(currentDate);
      }

      const data = await apiClient.getAgendaRange(from, to);
      setAgendaRange(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timeline");
      setAgendaRange(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, -1));
    } else {
      setCurrentDate(addMonths(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    const today = getTodayDate();
    setCurrentDate(today);
    setDateInput(today);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDateInput(newDate);
    if (newDate && newDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setCurrentDate(newDate);
    }
  };

  const getPeriodLabel = () => {
    if (viewMode === "week") {
      const from = getWeekStart(currentDate);
      const to = getWeekEnd(currentDate);
      return formatDateRange(from, to);
    } else {
      return formatMonth(currentDate);
    }
  };

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
          <div className={styles.controlBar}>
            <div className={styles.leftControls}>
              <button
                className={styles.iconButton}
                onClick={handlePrevious}
                aria-label="Période précédente"
                title="Période précédente"
              >
                ‹
              </button>
              <button
                className={styles.iconButton}
                onClick={handleNext}
                aria-label="Période suivante"
                title="Période suivante"
              >
                ›
              </button>
              <button className={styles.todayButton} onClick={handleToday}>
                Aujourd'hui
              </button>
            </div>

            <div className={styles.centerControls}>
              <h2 className={styles.periodTitle}>{getPeriodLabel()}</h2>
            </div>

            <div className={styles.rightControls}>
              <div className={styles.datePickerWrapper}>
                <span className={styles.calendarIcon}>📅</span>
                <input
                  type="date"
                  className={styles.datePicker}
                  value={dateInput}
                  onChange={handleDateChange}
                  aria-label="Sélectionner une date"
                  title="Choisir une date"
                />
              </div>
              <div className={styles.viewToggle}>
                <button
                  className={`${styles.viewButton} ${viewMode === "week" ? styles.activeView : ""}`}
                  onClick={() => setViewMode("week")}
                  title="Vue semaine"
                >
                  S
                </button>
                <button
                  className={`${styles.viewButton} ${viewMode === "month" ? styles.activeView : ""}`}
                  onClick={() => setViewMode("month")}
                  title="Vue mois"
                >
                  M
                </button>
              </div>
            </div>
          </div>

          {loading && (
            <div className={styles.loading}>Chargement du calendrier...</div>
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
                  const isToday = agenda.date === getTodayDate();
                  return (
                    <div
                      key={agenda.date}
                      className={`${styles.dateSection} ${
                        isToday ? styles.today : ""
                      }`}
                    >
                      <div className={styles.dateHeader}>
                        <h2>{formatDate(agenda.date)}</h2>
                        {isToday && (
                          <span className={styles.todayBadge}>Aujourd'hui</span>
                        )}
                        <Link
                          href={`/?date=${agenda.date}`}
                          className={styles.viewDay}
                        >
                          Voir cette journée →
                        </Link>
                      </div>

                      {agenda.sittings.length === 0 ? (
                        <p className={styles.noSittings}>
                          Aucune séance prévue
                        </p>
                      ) : (
                        <div className={styles.sittings}>
                          {agenda.sittings.map((sitting) => {
                            const hasVoteLike = (
                              sitting.agenda_items ?? []
                            ).some((item) =>
                              isVoteLikeAgendaItem(
                                item.title,
                                item.description,
                                item.category,
                              ),
                            );
                            return (
                              <Link
                                key={sitting.id}
                                href={`/sitting/${sitting.id}`}
                                className={`${styles.sittingCard} ${hasVoteLike ? styles.sittingCardVote : ""}`}
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
                                  {sitting.agenda_items.length} point(s) à
                                  l&apos;ordre du jour
                                  {hasVoteLike && (
                                    <span
                                      className={styles.voteBadge}
                                      title="Points susceptibles de donner lieu à un vote"
                                    >
                                      · Scrutin possible
                                    </span>
                                  )}
                                </p>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
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
  );
}
