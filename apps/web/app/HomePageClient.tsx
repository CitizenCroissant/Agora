"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AgendaResponse, Scrutin } from "@agora/shared";
import { getTodayDate, formatDate, addDays, subtractDays } from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./page.module.css";
import { PageHelp } from "@/components/PageHelp";
import { ShareBar } from "@/components/ShareBar";
import { SittingReminderButton } from "@/components/SittingReminderButton";
import { StreakBadge } from "@/components/StreakBadge";

const VOTE_OF_THE_DAY_DAYS = 14;
const OPINION_STORAGE_KEY_PREFIX = "agora_vote_opinion_";

/** Pick a deterministic scrutin index for "vote of the day" from the current date. */
function getVoteOfTheDayIndex(scrutins: Scrutin[], dateStr: string): number {
  if (scrutins.length === 0) return 0;
  const seed = new Date(dateStr + "T12:00:00Z").getTime();
  return Math.abs(Math.floor(seed / 86400000) % scrutins.length);
}

const AGENDA_SHARE_TITLE = "L'agenda du jour à l'Assemblée nationale";
const AGENDA_SHARE_MESSAGE =
  "Découvrez l'agenda du jour à l'Assemblée nationale sur Agora – transparence et simplicité.";

export default function HomePageClient() {
  const router = useRouter();
  const today = getTodayDate();
  const [currentDate, setCurrentDate] = useState<string>(today);
  const [agenda, setAgenda] = useState<AgendaResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [voteOfTheDay, setVoteOfTheDay] = useState<Scrutin | null>(null);
  const [voteOfTheDayLoading, setVoteOfTheDayLoading] = useState<boolean>(true);
  const [voteOfTheDayError, setVoteOfTheDayError] = useState<string | null>(null);
  const [voteOpinion, setVoteOpinion] = useState<"pour" | "contre" | null>(null);

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

  // Vote of the day: fetch recent scrutins and pick one deterministically by date
  useEffect(() => {
    let cancelled = false;
    setVoteOfTheDayLoading(true);
    setVoteOfTheDayError(null);
    const from = subtractDays(today, VOTE_OF_THE_DAY_DAYS);
    apiClient
      .getScrutins(from, today)
      .then((res) => {
        if (cancelled) return;
        const list = res.scrutins ?? [];
        if (list.length === 0) {
          setVoteOfTheDay(null);
        } else {
          const index = getVoteOfTheDayIndex(list, today);
          setVoteOfTheDay(list[index]);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setVoteOfTheDayError(err instanceof Error ? err.message : "Failed to load vote of the day");
          setVoteOfTheDay(null);
        }
      })
      .finally(() => {
        if (!cancelled) setVoteOfTheDayLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [today]);

  // Restore anonymous "agree/disagree" from localStorage when vote of the day is set
  useEffect(() => {
    if (!voteOfTheDay?.id) return;
    try {
      const stored = localStorage.getItem(OPINION_STORAGE_KEY_PREFIX + voteOfTheDay.id);
      setVoteOpinion(stored === "pour" || stored === "contre" ? stored : null);
    } catch {
      setVoteOpinion(null);
    }
  }, [voteOfTheDay?.id]);

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

  const handleVoteOpinion = (opinion: "pour" | "contre") => {
    if (!voteOfTheDay?.id) return;
    try {
      localStorage.setItem(OPINION_STORAGE_KEY_PREFIX + voteOfTheDay.id, opinion);
      setVoteOpinion(opinion);
    } catch {
      // ignore
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

      <div className={styles.ctaRow}>
        <Link href="/elections-2026" className={styles.voteCta}>
          Spécial élections 2026 : voir les prochaines séances clés →
        </Link>
        <Link
          href={`/votes?date=${getTodayDate()}`}
          className={styles.voteCta}
        >
          Comprendre les votes d&apos;aujourd&apos;hui →
        </Link>
        <Link href="/mon-depute" className={styles.digestCta}>
          Recevoir le récap hebdo des votes de mon député →
        </Link>
      </div>

      <StreakBadge />

      <section className={styles.voteOfTheDaySection} aria-labelledby="vote-du-jour-heading">
        <h2 id="vote-du-jour-heading" className={styles.voteOfTheDayHeading}>
          Vote du jour
        </h2>
        {voteOfTheDayLoading && (
          <div className={styles.voteOfTheDayLoading}>Chargement du vote du jour...</div>
        )}
        {!voteOfTheDayLoading && voteOfTheDayError && (
          <div className={styles.voteOfTheDayError} role="alert">
            {voteOfTheDayError}
          </div>
        )}
        {!voteOfTheDayLoading && !voteOfTheDayError && voteOfTheDay && (
          <div className={styles.voteOfTheDayCard}>
            <div className={styles.voteOfTheDayBadgeWrapper}>
              <span
                className={
                  voteOfTheDay.sort_code === "adopté"
                    ? styles.voteOfTheDayBadgeAdopte
                    : styles.voteOfTheDayBadgeRejete
                }
              >
                {voteOfTheDay.sort_code === "adopté" ? "Adopté" : "Rejeté"}
              </span>
            </div>
            <h3 className={styles.voteOfTheDayTitle}>{voteOfTheDay.titre}</h3>
            <p className={styles.voteOfTheDayMeta}>
              {formatDate(voteOfTheDay.date_scrutin)} · Scrutin n°{voteOfTheDay.numero}
            </p>
            {(voteOfTheDay.objet_libelle || voteOfTheDay.demandeur_texte) && (
              <p className={styles.voteOfTheDayContext}>
                {voteOfTheDay.objet_libelle ?? voteOfTheDay.demandeur_texte}
              </p>
            )}
            <div className={styles.voteOfTheDaySynthese}>
              <span>{voteOfTheDay.synthese_pour} pour</span>
              <span>{voteOfTheDay.synthese_contre} contre</span>
              <span>{voteOfTheDay.synthese_abstentions} abst.</span>
            </div>
            <div className={styles.voteOfTheDayPoll}>
              <p className={styles.voteOfTheDayPollQuestion}>
                Vous êtes plutôt d&apos;accord ou pas d&apos;accord avec ce vote ?
              </p>
              {voteOpinion ? (
                <p className={styles.voteOfTheDayPollThanks}>
                  Merci pour votre avis
                  {voteOpinion === "pour" ? " (d'accord)" : " (pas d'accord)"}.
                </p>
              ) : (
                <div className={styles.voteOfTheDayPollButtons}>
                  <button
                    type="button"
                    className={styles.voteOfTheDayPollBtn}
                    onClick={() => handleVoteOpinion("pour")}
                    aria-pressed={voteOpinion === "pour"}
                  >
                    D&apos;accord
                  </button>
                  <button
                    type="button"
                    className={styles.voteOfTheDayPollBtn}
                    onClick={() => handleVoteOpinion("contre")}
                    aria-pressed={voteOpinion === "contre"}
                  >
                    Pas d&apos;accord
                  </button>
                </div>
              )}
            </div>
            <Link
              href={`/votes/${voteOfTheDay.id}`}
              className={styles.voteOfTheDayCta}
            >
              Voir le scrutin →
            </Link>
          </div>
        )}
        {!voteOfTheDayLoading && !voteOfTheDayError && !voteOfTheDay && (
          <p className={styles.voteOfTheDayEmpty}>
            Aucun vote du jour pour le moment.
          </p>
        )}
      </section>

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
                        <span onClick={(e) => e.stopPropagation()} className={styles.reminderWrap}>
                          <SittingReminderButton sitting={{ id: sitting.id, date: agenda.date, time_range: sitting.time_range, title: sitting.title }} compact />
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
                              <span>{item.title}</span>
                              {item.campaign_topics &&
                                item.campaign_topics.length > 0 && (
                                  <div className={styles.campaignTopics}>
                                    <span className={styles.campaignLabel}>
                                      Sujet de campagne :
                                    </span>
                                    {item.campaign_topics.map((topic) => (
                                      <span
                                        key={topic.slug}
                                        className={styles.campaignBadge}
                                      >
                                        {topic.label}
                                      </span>
                                    ))}
                                  </div>
                                )}
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
