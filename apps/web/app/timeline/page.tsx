"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  isVoteLikeAgendaItem
} from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./timeline.module.css";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SittingReminderButton } from "@/components/SittingReminderButton";

type ViewMode = "week" | "month";

export default function TimelinePage() {
  const router = useRouter();
  const [agendaRange, setAgendaRange] = useState<AgendaRangeResponse | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState<string>(getTodayDate());
  const [dateInput, setDateInput] = useState<string>(getTodayDate());

  const handleCommissionClick = (
    e: React.MouseEvent | React.KeyboardEvent,
    organeRef: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/commissions/${encodeURIComponent(organeRef)}`);
  };

  const loadTimeline = useCallback(async () => {
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
  }, [viewMode, currentDate]);

  useEffect(() => {
    void loadTimeline();
  }, [loadTimeline]);

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
    <div className="container">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Calendrier" }]} />
          <div className={`controlBar ${styles.controlBar}`}>
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
            <div className="stateLoading">Chargement du calendrier...</div>
          )}

          {error && (
            <div className="stateError">
              <p>Erreur: {error}</p>
            </div>
          )}

          {!loading && !error && agendaRange && (
            <div className={styles.timeline}>
              {agendaRange.agendas.length === 0 ? (
                <div className="stateEmpty">
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
                        <div className={styles.dateHeaderLinks}>
                          <Link
                            href={`/?date=${agenda.date}`}
                            className={styles.viewDay}
                          >
                            Voir cette journée →
                          </Link>
                          <Link
                            href={`/votes?date=${agenda.date}`}
                            className={styles.viewDay}
                          >
                            Voir les scrutins →
                          </Link>
                        </div>
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
                                item.category
                              )
                            );
                            return (
                              <Link
                                key={sitting.id}
                                href={`/sitting/${sitting.id}`}
                                className={`${styles.sittingCard} ${hasVoteLike ? styles.sittingCardVote : ""}`}
                              >
                                <div className={styles.sittingHeader}>
                                  <h3>{sitting.title}</h3>
                                  <div className={styles.sittingHeaderMeta}>
                                    {sitting.type === "reunionCommission_type" && (
                                      <span className={styles.typeBadgeCommission}>
                                        Commission
                                      </span>
                                    )}
                                    {sitting.type === "seance_type" && (
                                      <span className={styles.typeBadgeSeance}>
                                        Séance publique
                                      </span>
                                    )}
                                    {sitting.time_range && (
                                      <span className={styles.timeRange}>
                                        {sitting.time_range}
                                      </span>
                                    )}
                                    <span onClick={(e) => e.stopPropagation()} className={styles.reminderWrap}>
                                      <SittingReminderButton sitting={sitting} compact />
                                    </span>
                                  </div>
                                </div>
                                {(sitting.organe || sitting.organe_ref || sitting.type === "seance_type") && (
                                  <p className={styles.organeLine}>
                                    {sitting.type === "seance_type" ? (
                                      "Assemblée nationale"
                                    ) : sitting.organe ? (
                                      sitting.organe_ref ? (
                                        <span
                                          role="link"
                                          tabIndex={0}
                                          className={styles.organeLink}
                                          onClick={(e) =>
                                            handleCommissionClick(
                                              e,
                                              sitting.organe_ref!
                                            )
                                          }
                                          onKeyDown={(e) => {
                                            if (
                                              e.key === "Enter" ||
                                              e.key === " "
                                            ) {
                                              handleCommissionClick(
                                                e,
                                                sitting.organe_ref!
                                              );
                                            }
                                          }}
                                        >
                                          {sitting.organe.libelle_abrege ??
                                            sitting.organe.libelle ??
                                            "Commission"}
                                        </span>
                                      ) : (
                                        sitting.organe.libelle_abrege ??
                                          sitting.organe.libelle ??
                                          "Commission"
                                      )
                                    ) : sitting.organe_ref ? (
                                      <span
                                        role="link"
                                        tabIndex={0}
                                        className={styles.organeLink}
                                        onClick={(e) =>
                                          handleCommissionClick(
                                            e,
                                            sitting.organe_ref!
                                          )
                                        }
                                        onKeyDown={(e) => {
                                          if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                          ) {
                                            handleCommissionClick(
                                              e,
                                              sitting.organe_ref!
                                            );
                                          }
                                        }}
                                      >
                                        Commission
                                      </span>
                                    ) : null}
                                  </p>
                                )}
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
  );
}
