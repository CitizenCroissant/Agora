"use client";

import { useEffect, useState } from "react";
import { ScrutinsResponse, Scrutin } from "@agora/shared";
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
} from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./votes.module.css";

type ViewMode = "week" | "month";
type SortFilter = "all" | "adopté" | "rejeté";

function groupScrutinsByDate(scrutins: Scrutin[]): Map<string, Scrutin[]> {
  const map = new Map<string, Scrutin[]>();
  for (const s of scrutins) {
    const d = s.date_scrutin;
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(s);
  }
  return map;
}

export default function VotesPage() {
  const [data, setData] = useState<ScrutinsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [sortFilter, setSortFilter] = useState<SortFilter>("all");
  const [currentDate, setCurrentDate] = useState<string>(getTodayDate());
  const [dateInput, setDateInput] = useState<string>(getTodayDate());

  useEffect(() => {
    loadScrutins();
  }, [viewMode, currentDate]);

  const loadScrutins = async () => {
    setLoading(true);
    setError(null);
    try {
      const from =
        viewMode === "week"
          ? getWeekStart(currentDate)
          : getMonthStart(currentDate);
      const to =
        viewMode === "week"
          ? getWeekEnd(currentDate)
          : getMonthEnd(currentDate);
      const result = await apiClient.getScrutins(from, to);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scrutins");
      setData(null);
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
    }
    return formatMonth(currentDate);
  };

  const filteredScrutins =
    data?.scrutins.filter((s) => {
      if (sortFilter === "all") return true;
      return s.sort_code === sortFilter;
    }) ?? [];
  const byDate = data
    ? groupScrutinsByDate(filteredScrutins)
    : new Map<string, Scrutin[]>();
  const sortedDates = Array.from(byDate.keys()).sort((a, b) =>
    b.localeCompare(a),
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <Link href="/" className={styles.backLink}>
            ← Retour
          </Link>
          <h1 className={styles.title}>Scrutins</h1>
          <p className={styles.subtitle}>
            Votes en séance publique à l&apos;Assemblée nationale
          </p>
          <div className={styles.headerLinks}>
            <Link href="/votes/upcoming" className={styles.upcomingLink}>
              Prochains votes →
            </Link>
            <Link href="/votes/deputy" className={styles.deputyLink}>
              Vote d&apos;un député →
            </Link>
            <Link href="/groupes" className={styles.deputyLink}>
              Groupes politiques →
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className="container">
          <div className={styles.controlBar}>
            <div className={styles.leftControls}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={handlePrevious}
                aria-label="Période précédente"
                title="Période précédente"
              >
                ‹
              </button>
              <button
                type="button"
                className={styles.iconButton}
                onClick={handleNext}
                aria-label="Période suivante"
                title="Période suivante"
              >
                ›
              </button>
              <button
                type="button"
                className={styles.todayButton}
                onClick={handleToday}
              >
                Aujourd&apos;hui
              </button>
            </div>

            <div className={styles.centerControls}>
              <h2 className={styles.periodTitle}>{getPeriodLabel()}</h2>
            </div>

            <div className={styles.rightControls}>
              <div className={styles.sortFilterToggle}>
                <button
                  type="button"
                  className={`${styles.sortFilterButton} ${sortFilter === "all" ? styles.activeSortFilter : ""}`}
                  onClick={() => setSortFilter("all")}
                  title="Tous les scrutins"
                >
                  Tous
                </button>
                <button
                  type="button"
                  className={`${styles.sortFilterButton} ${styles.sortFilterAdopte} ${sortFilter === "adopté" ? styles.activeSortFilter : ""}`}
                  onClick={() => setSortFilter("adopté")}
                  title="Adoptés uniquement"
                >
                  Adoptés
                </button>
                <button
                  type="button"
                  className={`${styles.sortFilterButton} ${styles.sortFilterRejete} ${sortFilter === "rejeté" ? styles.activeSortFilter : ""}`}
                  onClick={() => setSortFilter("rejeté")}
                  title="Rejetés uniquement"
                >
                  Rejetés
                </button>
              </div>
              <div className={styles.datePickerWrapper}>
                <span className={styles.calendarIcon} aria-hidden>
                  📅
                </span>
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
                  type="button"
                  className={`${styles.viewButton} ${viewMode === "week" ? styles.activeView : ""}`}
                  onClick={() => setViewMode("week")}
                  title="Vue semaine"
                >
                  S
                </button>
                <button
                  type="button"
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
            <div className={styles.loading}>Chargement des scrutins...</div>
          )}

          {error && (
            <div className={styles.error}>
              <p>Erreur: {error}</p>
            </div>
          )}

          {!loading && !error && data && (
            <div className={styles.scrutinsList}>
              {sortedDates.length === 0 ? (
                <div className={styles.empty}>
                  <p>Aucun scrutin pour cette période.</p>
                </div>
              ) : (
                sortedDates.map((date) => {
                  const isToday = date === getTodayDate();
                  const scrutinsForDate = byDate.get(date) ?? [];
                  return (
                    <div
                      key={date}
                      className={`${styles.dateSection} ${isToday ? styles.today : ""}`}
                    >
                      <div className={styles.dateHeader}>
                        <h2>{formatDate(date)}</h2>
                        {isToday && (
                          <span className={styles.todayBadge}>
                            Aujourd&apos;hui
                          </span>
                        )}
                      </div>

                      <div className={styles.scrutinCards}>
                        {scrutinsForDate.map((scrutin) => (
                          <Link
                            key={scrutin.id}
                            href={`/votes/${scrutin.id}`}
                            className={styles.scrutinCard}
                          >
                            <div className={styles.scrutinHeader}>
                              <span
                                className={
                                  scrutin.sort_code === "adopté"
                                    ? styles.badgeAdopte
                                    : styles.badgeRejete
                                }
                              >
                                {scrutin.sort_code === "adopté"
                                  ? "Adopté"
                                  : "Rejeté"}
                              </span>
                              {scrutin.type_vote_libelle && (
                                <span className={styles.typeVote}>
                                  {scrutin.type_vote_libelle}
                                </span>
                              )}
                            </div>
                            <h3 className={styles.scrutinTitle}>
                              {scrutin.titre}
                            </h3>
                            <p className={styles.scrutinCounts}>
                              Pour: {scrutin.synthese_pour} · Contre:{" "}
                              {scrutin.synthese_contre}
                              {scrutin.synthese_abstentions > 0 &&
                                ` · Abstentions: ${scrutin.synthese_abstentions}`}
                            </p>
                          </Link>
                        ))}
                      </div>
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
          <p>Agora - Données officielles de l&apos;Assemblée nationale</p>
        </div>
      </footer>
    </div>
  );
}
