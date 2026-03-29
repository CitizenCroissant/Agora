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
import { FilterBar, PeriodControlRow } from "@/components/FilterBar";
import { SittingReminderButton } from "@/components/SittingReminderButton";
import { Skeleton } from "@/components/Skeleton";
import skeletonStyles from "@/components/Skeleton.module.css";

type ViewMode = "week" | "month";

function TimelineSkeleton() {
  const dateSectionWidths = ["55%", "45%", "60%"];
  const cardCounts = [3, 2, 3];
  return (
    <div className={styles.timeline} aria-busy="true" aria-label="Chargement du calendrier">
      {dateSectionWidths.map((dateW, si) => (
        <div key={si} className={styles.dateSection}>
          <div className={styles.dateHeader}>
            <Skeleton shape="heading" width={dateW} height={22} />
          </div>
          <div className={styles.sittings}>
            {Array.from({ length: cardCounts[si] }, (_, ci) => (
              <div key={ci} className={`${skeletonStyles.card} ${styles.sittingCard}`} style={{ display: "block" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Skeleton shape="heading" width={`${50 + ci * 12}%`} height={18} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <Skeleton shape="pill" width={80} height={20} />
                    <Skeleton shape="pill" width={55} height={20} />
                  </div>
                </div>
                <Skeleton shape="text" width="35%" height={13} style={{ marginBottom: 6 }} />
                <Skeleton shape="text" width="25%" height={12} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

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

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          Calendrier <span>parlementaire</span>
        </h1>
        <p className={styles.pageSubtitle}>Naviguez dans les séances de l&apos;Assemblée par semaine ou par mois.</p>
      </div>

          <FilterBar layout="inline" aria-label="Période du calendrier">
            <PeriodControlRow
              accent="timeline"
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              periodLabel={getPeriodLabel()}
              dateInput={dateInput}
              onDateInputChange={handleDateChange}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onToday={handleToday}
            />
          </FilterBar>

          {loading && <TimelineSkeleton />}

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
                        <div className={`${styles.sittings} staggerChildren`}>
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
