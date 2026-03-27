"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AgendaResponse, Scrutin } from "@agora/shared";
import { getTodayDate, formatDate, addDays, subtractDays } from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./page.module.css";
import { SittingReminderButton } from "@/components/SittingReminderButton";
import { StreakBadge } from "@/components/StreakBadge";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { VoteResultBar } from "@/components/VoteResultBar";

const VOTE_OF_THE_DAY_DAYS = 14;
const OPINION_STORAGE_KEY_PREFIX = "agora_vote_opinion_";

function getVoteOfTheDayIndex(scrutins: Scrutin[], dateStr: string): number {
  if (scrutins.length === 0) return 0;
  const seed = new Date(dateStr + "T12:00:00Z").getTime();
  return Math.abs(Math.floor(seed / 86400000) % scrutins.length);
}

function VoteDuJourSkeleton() {
  return (
    <div className={styles.voteDuJourCard}>
      <div className={styles.voteDuJourInner}>
        <div className={styles.skeletonStack}>
          <Skeleton shape="pill" width={100} height={24} />
          <Skeleton shape="heading" width="88%" height={30} />
          <Skeleton shape="text" width="52%" height={14} />
          <Skeleton shape="rect" width="100%" height={11} />
          <Skeleton shape="text" width="72%" height={14} />
          <Skeleton shape="rect" width="100%" height={52} />
        </div>
      </div>
    </div>
  );
}

function AgendaSkeleton() {
  return (
    <div className={styles.sittingGrid}>
      <div className={styles.featuredSittingCol}>
        <SkeletonCard lines={5} />
      </div>
      <div className={styles.compactSittingCol}>
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </div>
    </div>
  );
}

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
          setVoteOfTheDayError(
            err instanceof Error ? err.message : "Failed to load vote of the day"
          );
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

  useEffect(() => {
    if (!voteOfTheDay?.id) return;
    try {
      const stored = localStorage.getItem(
        OPINION_STORAGE_KEY_PREFIX + voteOfTheDay.id
      );
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

  const goToPreviousDay = () => setCurrentDate(subtractDays(currentDate, 1));
  const goToNextDay = () => setCurrentDate(addDays(currentDate, 1));
  const goToToday = () => setCurrentDate(getTodayDate());

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

  const isToday = currentDate === today;
  const sittings = agenda?.sittings ?? [];
  const [featuredSitting, ...otherSittings] = sittings;
  const SIDEBAR_MAX = 3;
  const sidebarSittings = otherSittings.slice(0, SIDEBAR_MAX);
  const overflowSittings = otherSittings.slice(SIDEBAR_MAX);

  return (
    <div className={styles.page}>
      {/* ── HERO ─────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroInner}>
            <div className={styles.heroLeft}>
              {isToday && (
                <span className={styles.heroTodayPill}>Aujourd'hui</span>
              )}
              <h1 className={styles.heroDate}>{formatDate(currentDate)}</h1>
              <p className={styles.heroTagline}>
                L'Assemblée nationale, en clair
              </p>
              <StreakBadge />
            </div>

            <div className={styles.heroRight}>
              <div className={styles.dateNav}>
                <button
                  className={styles.dateNavBtn}
                  onClick={goToPreviousDay}
                  aria-label="Jour précédent"
                  title="Jour précédent"
                >
                  ‹
                </button>
                <button
                  className={styles.dateNavBtn}
                  onClick={goToNextDay}
                  aria-label="Jour suivant"
                  title="Jour suivant"
                >
                  ›
                </button>
                {!isToday && (
                  <button className={styles.todayBtn} onClick={goToToday}>
                    Aujourd&apos;hui
                  </button>
                )}
              </div>
              <div className={styles.datePickerWrapper}>
                <span className={styles.calendarIcon} aria-hidden="true">
                  📅
                </span>
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
        </div>
      </section>

      <div className="container">
        {/* ── CTA STRIP ───────────────────────────────── */}
        <div className={styles.ctaStrip}>
          <Link href="/municipales-2026" className={styles.ctaChip}>
            Municipales 2026 →
          </Link>
          <Link
            href={`/votes?date=${getTodayDate()}`}
            className={styles.ctaChip}
          >
            Votes d&apos;aujourd&apos;hui →
          </Link>
          <Link href="/mon-depute" className={styles.ctaChipTeal}>
            Récap hebdo de mon député →
          </Link>
        </div>

        {/* ── VOTE DU JOUR ─────────────────────────────── */}
        <section
          className={styles.voteSection}
          aria-labelledby="vote-du-jour-heading"
        >
          <SectionHeader
            title="Vote du Jour"
            subtitle="Un scrutin récent mis en lumière chaque jour"
            sectionColor="var(--color-section-aujourdhui)"
            size="lg"
          />

          {voteOfTheDayLoading && <VoteDuJourSkeleton />}

          {!voteOfTheDayLoading && voteOfTheDayError && (
            <div className={styles.stateError} role="alert">
              {voteOfTheDayError}
            </div>
          )}

          {!voteOfTheDayLoading && !voteOfTheDayError && voteOfTheDay && (
            <div className={styles.voteDuJourCard}>
              <div className={styles.voteDuJourInner}>
                {/* Header row: badges + meta */}
                <div className={styles.voteDuJourHeader}>
                  <div className={styles.voteDuJourBadges}>
                    <span className={styles.defiDuJourBadge}>
                      Défi du jour
                    </span>
                    <span
                      className={
                        voteOfTheDay.sort_code === "adopté"
                          ? styles.badgeAdopte
                          : styles.badgeRejete
                      }
                    >
                      {voteOfTheDay.sort_code === "adopté"
                        ? "✓ Adopté"
                        : "✗ Rejeté"}
                    </span>
                  </div>
                  <p className={styles.voteMeta}>
                    {formatDate(voteOfTheDay.date_scrutin)} · Scrutin n°
                    {voteOfTheDay.numero}
                  </p>
                </div>

                <h2
                  id="vote-du-jour-heading"
                  className={styles.voteDuJourTitle}
                >
                  {voteOfTheDay.titre}
                </h2>

                {(voteOfTheDay.objet_libelle || voteOfTheDay.demandeur_texte) && (
                  <p className={styles.voteDuJourContext}>
                    {voteOfTheDay.objet_libelle ?? voteOfTheDay.demandeur_texte}
                  </p>
                )}

                <VoteResultBar
                  pour={voteOfTheDay.synthese_pour}
                  contre={voteOfTheDay.synthese_contre}
                  abstentions={voteOfTheDay.synthese_abstentions}
                  nonVotants={voteOfTheDay.synthese_non_votants}
                />

                <div className={styles.votePoll}>
                  <p className={styles.pollQuestion}>
                    Et vous, vous êtes d&apos;accord avec ce vote ?
                  </p>
                  {voteOpinion ? (
                    <p className={styles.pollThanks}>
                      Merci pour votre avis –{" "}
                      <strong>
                        {voteOpinion === "pour" ? "D'accord" : "Pas d'accord"}
                      </strong>
                    </p>
                  ) : (
                    <div className={styles.pollBtns}>
                      <button
                        type="button"
                        className={styles.pollBtnPour}
                        onClick={() => handleVoteOpinion("pour")}
                      >
                        D&apos;accord
                      </button>
                      <button
                        type="button"
                        className={styles.pollBtnContre}
                        onClick={() => handleVoteOpinion("contre")}
                      >
                        Pas d&apos;accord
                      </button>
                    </div>
                  )}
                </div>

                <Link
                  href={`/votes/${voteOfTheDay.id}`}
                  className={styles.voteDuJourCta}
                >
                  Voir le scrutin complet →
                </Link>
              </div>
            </div>
          )}

          {!voteOfTheDayLoading && !voteOfTheDayError && !voteOfTheDay && (
            <EmptyState
              variant="votes"
              title="Pas de vote du jour"
              message="Aucun scrutin récent à mettre en lumière pour l'instant."
            />
          )}
        </section>

        {/* ── AGENDA ──────────────────────────────────── */}
        <section className={styles.agendaSection} aria-label="Séances du jour">
          <SectionHeader
            title={`Séances du ${formatDate(currentDate)}`}
            sectionColor="var(--color-section-calendrier)"
            size="lg"
          />

          {loading && <AgendaSkeleton />}

          {error && (
            <div className={styles.stateError} role="alert">
              <p>{error}</p>
              <p className={styles.errorHint}>
                Assurez-vous que l'API est démarrée et accessible.
              </p>
            </div>
          )}

          {!loading && !error && agenda && (
            <>
              {sittings.length === 0 ? (
                <EmptyState
                  variant="agenda"
                  message="Aucune séance n'est programmée pour cette date. Essayez un autre jour de semaine."
                />
              ) : (
                <>
                  <div
                    className={`${styles.sittingGrid} ${
                      sidebarSittings.length === 0 ? styles.sittingGridSingle : ""
                    }`}
                  >
                    {/* Featured sitting (always first) */}
                    {featuredSitting && (
                      <div className={styles.featuredSittingCol}>
                        <Link
                          href={`/sitting/${featuredSitting.id}`}
                          className={`${styles.sittingCard} ${styles.sittingCardFeatured}`}
                        >
                          <div className={styles.sittingCardHeader}>
                            <div className={styles.sittingCardBadges}>
                              {featuredSitting.type === "seance_type" && (
                                <span className={styles.badgeSeance}>
                                  Séance publique
                                </span>
                              )}
                              {featuredSitting.type ===
                                "reunionCommission_type" && (
                                <span className={styles.badgeCommission}>
                                  Commission
                                </span>
                              )}
                              {featuredSitting.time_range && (
                                <span className={styles.timeRange}>
                                  {featuredSitting.time_range}
                                </span>
                              )}
                            </div>
                            <span
                              onClick={(e) => e.stopPropagation()}
                              className={styles.reminderWrap}
                            >
                              <SittingReminderButton
                                sitting={{
                                  id: featuredSitting.id,
                                  date: agenda.date,
                                  time_range: featuredSitting.time_range,
                                  title: featuredSitting.title
                                }}
                                compact
                              />
                            </span>
                          </div>

                          <h3 className={styles.sittingCardTitle}>
                            {featuredSitting.title}
                          </h3>

                          {featuredSitting.organe && (
                            <p className={styles.sittingCardOrg}>
                              {featuredSitting.organe_ref ? (
                                <span
                                  role="link"
                                  tabIndex={0}
                                  className={styles.organeLink}
                                  onClick={(e) =>
                                    handleCommissionClick(
                                      e,
                                      featuredSitting.organe_ref!
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ")
                                      handleCommissionClick(
                                        e,
                                        featuredSitting.organe_ref!
                                      );
                                  }}
                                >
                                  {featuredSitting.organe.libelle_abrege ??
                                    featuredSitting.organe.libelle ??
                                    "Commission"}
                                </span>
                              ) : (
                                featuredSitting.organe.libelle_abrege ??
                                featuredSitting.organe.libelle
                              )}
                            </p>
                          )}

                          {featuredSitting.location && (
                            <p className={styles.sittingCardLocation}>
                              📍 {featuredSitting.location}
                            </p>
                          )}

                          {featuredSitting.agenda_items.length > 0 && (
                            <div className={styles.agendaItems}>
                              <h4 className={styles.agendaItemsTitle}>
                                Ordre du jour (
                                {featuredSitting.agenda_items.length})
                              </h4>
                              <ul className={styles.agendaItemsList}>
                                {featuredSitting.agenda_items
                                  .slice(0, 5)
                                  .map((item) => (
                                    <li
                                      key={item.id}
                                      className={styles.agendaItem}
                                    >
                                      {item.scheduled_time && (
                                        <span className={styles.itemTime}>
                                          {item.scheduled_time.substring(0, 5)}
                                        </span>
                                      )}
                                      <span className={styles.itemTitle}>
                                        {item.title}
                                      </span>
                                      {item.campaign_topics &&
                                        item.campaign_topics.length > 0 && (
                                          <div
                                            className={styles.campaignTopics}
                                          >
                                            {item.campaign_topics.map(
                                              (topic) => (
                                                <span
                                                  key={topic.slug}
                                                  className={
                                                    styles.campaignBadge
                                                  }
                                                >
                                                  {topic.label}
                                                </span>
                                              )
                                            )}
                                          </div>
                                        )}
                                    </li>
                                  ))}
                                {featuredSitting.agenda_items.length > 5 && (
                                  <li className={styles.moreItems}>
                                    +
                                    {featuredSitting.agenda_items.length - 5}{" "}
                                    autre(s)
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}

                          <div className={styles.sittingCardFooter}>
                            <span className={styles.viewDetails}>
                              Voir les détails →
                            </span>
                          </div>
                        </Link>
                      </div>
                    )}

                    {/* Sidebar compact sittings (max 3 beside featured) */}
                    {sidebarSittings.length > 0 && (
                      <div className={styles.compactSittingCol}>
                        {sidebarSittings.map((sitting) => (
                          <Link
                            key={sitting.id}
                            href={`/sitting/${sitting.id}`}
                            className={`${styles.sittingCard} ${styles.sittingCardCompact}`}
                          >
                            <div className={styles.sittingCardHeader}>
                              <div className={styles.sittingCardBadges}>
                                {sitting.type === "seance_type" && (
                                  <span className={styles.badgeSeance}>
                                    Séance publique
                                  </span>
                                )}
                                {sitting.type ===
                                  "reunionCommission_type" && (
                                  <span className={styles.badgeCommission}>
                                    Commission
                                  </span>
                                )}
                                {sitting.time_range && (
                                  <span className={styles.timeRange}>
                                    {sitting.time_range}
                                  </span>
                                )}
                              </div>
                              <span
                                onClick={(e) => e.stopPropagation()}
                                className={styles.reminderWrap}
                              >
                                <SittingReminderButton
                                  sitting={{
                                    id: sitting.id,
                                    date: agenda.date,
                                    time_range: sitting.time_range,
                                    title: sitting.title
                                  }}
                                  compact
                                />
                              </span>
                            </div>

                            <h3 className={styles.sittingCardTitle}>
                              {sitting.title}
                            </h3>

                            {sitting.organe && (
                              <p className={styles.sittingCardOrg}>
                                {sitting.organe_ref ? (
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
                                      if (e.key === "Enter" || e.key === " ")
                                        handleCommissionClick(
                                          e,
                                          sitting.organe_ref!
                                        );
                                    }}
                                  >
                                    {sitting.organe.libelle_abrege ??
                                      sitting.organe.libelle ??
                                      "Commission"}
                                  </span>
                                ) : (
                                  sitting.organe.libelle_abrege ??
                                  sitting.organe.libelle
                                )}
                              </p>
                            )}

                            {sitting.agenda_items.length > 0 && (
                              <div className={styles.agendaItemsCompact}>
                                <ul className={styles.agendaItemsList}>
                                  {sitting.agenda_items
                                    .slice(0, 3)
                                    .map((item) => (
                                      <li
                                        key={item.id}
                                        className={styles.agendaItem}
                                      >
                                        {item.scheduled_time && (
                                          <span className={styles.itemTime}>
                                            {item.scheduled_time.substring(
                                              0,
                                              5
                                            )}
                                          </span>
                                        )}
                                        <span className={styles.itemTitle}>
                                          {item.title}
                                        </span>
                                      </li>
                                    ))}
                                  {sitting.agenda_items.length > 3 && (
                                    <li className={styles.moreItems}>
                                      +{sitting.agenda_items.length - 3}{" "}
                                      autre(s)
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}

                            <div className={styles.sittingCardFooter}>
                              <span className={styles.viewDetails}>
                                Voir →
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Overflow sittings in a responsive grid */}
                  {overflowSittings.length > 0 && (
                    <div className={styles.overflowGrid}>
                      {overflowSittings.map((sitting) => (
                        <Link
                          key={sitting.id}
                          href={`/sitting/${sitting.id}`}
                          className={`${styles.sittingCard} ${styles.sittingCardCompact}`}
                        >
                          <div className={styles.sittingCardHeader}>
                            <div className={styles.sittingCardBadges}>
                              {sitting.type === "seance_type" && (
                                <span className={styles.badgeSeance}>
                                  Séance publique
                                </span>
                              )}
                              {sitting.type ===
                                "reunionCommission_type" && (
                                <span className={styles.badgeCommission}>
                                  Commission
                                </span>
                              )}
                              {sitting.time_range && (
                                <span className={styles.timeRange}>
                                  {sitting.time_range}
                                </span>
                              )}
                            </div>
                            <span
                              onClick={(e) => e.stopPropagation()}
                              className={styles.reminderWrap}
                            >
                              <SittingReminderButton
                                sitting={{
                                  id: sitting.id,
                                  date: agenda.date,
                                  time_range: sitting.time_range,
                                  title: sitting.title
                                }}
                                compact
                              />
                            </span>
                          </div>

                          <h3 className={styles.sittingCardTitle}>
                            {sitting.title}
                          </h3>

                          {sitting.organe && (
                            <p className={styles.sittingCardOrg}>
                              {sitting.organe_ref ? (
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
                                    if (e.key === "Enter" || e.key === " ")
                                      handleCommissionClick(
                                        e,
                                        sitting.organe_ref!
                                      );
                                  }}
                                >
                                  {sitting.organe.libelle_abrege ??
                                    sitting.organe.libelle ??
                                    "Commission"}
                                </span>
                              ) : (
                                sitting.organe.libelle_abrege ??
                                sitting.organe.libelle
                              )}
                            </p>
                          )}

                          {sitting.agenda_items.length > 0 && (
                            <div className={styles.agendaItemsCompact}>
                              <ul className={styles.agendaItemsList}>
                                {sitting.agenda_items
                                  .slice(0, 3)
                                  .map((item) => (
                                    <li
                                      key={item.id}
                                      className={styles.agendaItem}
                                    >
                                      {item.scheduled_time && (
                                        <span className={styles.itemTime}>
                                          {item.scheduled_time.substring(0, 5)}
                                        </span>
                                      )}
                                      <span className={styles.itemTitle}>
                                        {item.title}
                                      </span>
                                    </li>
                                  ))}
                                {sitting.agenda_items.length > 3 && (
                                  <li className={styles.moreItems}>
                                    +{sitting.agenda_items.length - 3}{" "}
                                    autre(s)
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}

                          <div className={styles.sittingCardFooter}>
                            <span className={styles.viewDetails}>
                              Voir →
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className={styles.sourceNote}>
                    <strong>{agenda.source.label}</strong>
                    <span className={styles.sourceDate}>
                      {" "}
                      · Mis à jour le{" "}
                      {new Date(
                        agenda.source.last_updated_at
                      ).toLocaleString("fr-FR")}
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </section>

        {/* ── ACTION CARDS ────────────────────────────── */}
        <section className={styles.actionSection} aria-label="Explorer Agora">
          <div className={`${styles.actionGrid} staggerChildren`}>
            <Link
              href="/votes"
              className={`${styles.actionCard} ${styles.actionCardAmber}`}
            >
              <span className={styles.actionCardIcon} aria-hidden="true">
                📊
              </span>
              <div className={styles.actionCardContent}>
                <h3>Explorez les votes</h3>
                <p>Tous les scrutins depuis 2022</p>
              </div>
              <span className={styles.actionCardArrow} aria-hidden="true">
                →
              </span>
            </Link>

            <Link
              href="/mon-depute"
              className={`${styles.actionCard} ${styles.actionCardTeal}`}
            >
              <span className={styles.actionCardIcon} aria-hidden="true">
                👤
              </span>
              <div className={styles.actionCardContent}>
                <h3>Suivez votre député</h3>
                <p>Récapitulatif hebdomadaire personnalisé</p>
              </div>
              <span className={styles.actionCardArrow} aria-hidden="true">
                →
              </span>
            </Link>

            <Link
              href="/democratie"
              className={`${styles.actionCard} ${styles.actionCardPlum}`}
            >
              <span className={styles.actionCardIcon} aria-hidden="true">
                🏛️
              </span>
              <div className={styles.actionCardContent}>
                <h3>Comprendre la démocratie</h3>
                <p>Comment fonctionne l'Assemblée ?</p>
              </div>
              <span className={styles.actionCardArrow} aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
