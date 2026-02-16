"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AgendaResponse } from "@agora/shared";
import { getTodayDate, formatDate, addDays, subtractDays } from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./page.module.css";
import { PageHelp } from "@/components/PageHelp";
import { ShareBar } from "@/components/ShareBar";

const AGENDA_SHARE_TITLE = "L'agenda du jour à l'Assemblée nationale";
const AGENDA_SHARE_MESSAGE =
  "Découvrez l'agenda du jour à l'Assemblée nationale sur Agora – transparence et simplicité.";

export default function HomePageClient() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState<string>(getTodayDate());
  const [agenda, setAgenda] = useState<AgendaResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleCommissionClick = (
    e: React.MouseEvent | React.KeyboardEvent,
    organeRef: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/commissions/${encodeURIComponent(organeRef)}`);
  };

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
    <div className="container">
      <ShareBar
        title={AGENDA_SHARE_TITLE}
        shareMessage={AGENDA_SHARE_MESSAGE}
      />
      <PageHelp
        title="Comment lire cette page ?"
        points={[
          "Chaque carte correspond à une séance publique ou réunion de l'Assemblée nationale.",
          "Utilisez les flèches ou le calendrier pour naviguer dans les jours passés et à venir.",
          "Dans chaque carte, l'« Ordre du jour » liste les principaux points qui seront examinés."
        ]}
      />

      <Link
        href={`/votes?date=${getTodayDate()}`}
        className={styles.voteCta}
      >
        Comprendre les votes d&apos;aujourd&apos;hui →
      </Link>

      <div className={`controlBar ${styles.controlBar}`}>
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
        <div className="stateLoading">Chargement de l'agenda...</div>
      )}

      {error && (
        <div className="stateError">
          <p>Erreur: {error}</p>
          <p className={styles.errorHint}>
            Assurez-vous que l'API est démarrée et accessible.
          </p>
        </div>
      )}

      {!loading && !error && agenda && (
        <>
          {agenda.sittings.length === 0 ? (
            <div className="stateEmpty">
              <p>Aucune séance prévue pour cette date.</p>
            </div>
          ) : (
            <>
              <div className={styles.sittings}>
                {agenda.sittings.map((sitting) => (
                  <Link
                    key={sitting.id}
                    href={`/sitting/${sitting.id}`}
                    className={styles.sittingCard}
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
                                handleCommissionClick(e, sitting.organe_ref!)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  handleCommissionClick(e, sitting.organe_ref!);
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
                              handleCommissionClick(e, sitting.organe_ref!)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                handleCommissionClick(e, sitting.organe_ref!);
                              }
                            }}
                          >
                            Commission
                          </span>
                        ) : null}
                      </p>
                    )}

                    {sitting.location && (
                      <p className={styles.location}>📍 {sitting.location}</p>
                    )}

                    {sitting.description &&
                      sitting.description.trim() !== sitting.title?.trim() && (
                        <p className={styles.description}>
                          {sitting.description}
                        </p>
                      )}

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

              <div className={styles.source}>
                <p>
                  <strong>{agenda.source.label}</strong>
                </p>
                <p className={styles.sourceDate}>
                  Dernière mise à jour :{" "}
                  {new Date(agenda.source.last_updated_at).toLocaleString(
                    "fr-FR"
                  )}
                </p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
