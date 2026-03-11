"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AgendaRangeResponse } from "@agora/shared";
import {
  getTodayDate,
  addDays,
  formatDate,
  isVoteLikeAgendaItem
} from "@agora/shared";
import { apiClient } from "@/lib/api";
import { SittingReminderButton } from "@/components/SittingReminderButton";
import styles from "./elections-2026.module.css";

const DAYS_AHEAD = 14;

export default function ElectionHubClient() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [agendaRange, setAgendaRange] = useState<AgendaRangeResponse | null>(
    null
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const today = getTodayDate();
        const to = addDays(today, DAYS_AHEAD);
        const data = await apiClient.getAgendaRange(today, to);
        setAgendaRange(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les prochaines séances"
        );
        setAgendaRange(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className={styles.wrapper}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Élections 2026</h1>
        <p className={styles.subtitle}>
          Pendant la campagne, suivez ce que fait concrètement l&apos;Assemblée
          nationale : les prochaines séances et les sujets débattus.
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Les prochaines séances clés</h2>
        <p className={styles.sectionIntro}>
          Voici les séances prévues pour les deux prochaines semaines. Cliquez
          sur une carte pour voir le détail de l&apos;ordre du jour.
        </p>

        {loading && (
          <div className="stateLoading">Chargement des prochaines séances...</div>
        )}

        {error && !loading && (
          <div className="stateError">
            <p>Erreur : {error}</p>
          </div>
        )}

        {!loading && !error && agendaRange && (
          <div className={styles.agendaList}>
            {agendaRange.agendas.length === 0 ? (
              <div className="stateEmpty">
                <p>
                  Aucune séance n&apos;est encore planifiée pour les prochains jours.
                </p>
              </div>
            ) : (
              agendaRange.agendas.map((agenda) => (
                <div key={agenda.date} className={styles.dateBlock}>
                  <div className={styles.dateHeader}>
                    <h3>{formatDate(agenda.date)}</h3>
                    <Link
                      href={`/?date=${agenda.date}`}
                      className={styles.viewDayLink}
                    >
                      Voir cette journée →
                    </Link>
                  </div>

                  {agenda.sittings.length === 0 ? (
                    <p className={styles.noSittings}>
                      Aucune séance pour cette date.
                    </p>
                  ) : (
                    <div className={styles.sittings}>
                      {agenda.sittings.map((sitting) => {
                        const hasVoteLike = (sitting.agenda_items ?? []).some(
                          (item) =>
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
                            className={`${styles.sittingCard} ${
                              hasVoteLike ? styles.sittingCardVote : ""
                            }`}
                          >
                            <div className={styles.sittingHeader}>
                              <h4>{sitting.title}</h4>
                              <div className={styles.sittingMeta}>
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
                            </div>

                            {sitting.location && (
                              <p className={styles.location}>
                                📍 {sitting.location}
                              </p>
                            )}

                            {hasVoteLike && (
                              <p className={styles.voteHint}>
                                Scrutin possible sur au moins un point à
                                l&apos;ordre du jour.
                              </p>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Comprendre les thèmes de campagne
        </h2>
        <p className={styles.sectionIntro}>
          Les séances portent souvent sur des sujets au cœur de la campagne :
          pouvoir d&apos;achat, climat, santé, éducation, sécurité, etc.
        </p>
        <div className={styles.themeGrid}>
          <div className={styles.themeCard}>
            <h3>Pouvoir d&apos;achat &amp; économie</h3>
            <p>
              Textes budgétaires, fiscalité, aides, réformes sociales... suivez
              les débats qui ont un impact sur votre quotidien.
            </p>
          </div>
          <div className={styles.themeCard}>
            <h3>Climat &amp; environnement</h3>
            <p>
              Lois sur la transition énergétique, l&apos;aménagement du
              territoire ou le transport : ce que prévoit réellement le
              Parlement.
            </p>
          </div>
          <div className={styles.themeCard}>
            <h3>Santé &amp; éducation</h3>
            <p>
              Organisation de l&apos;école, de l&apos;hôpital, de la
              prévention... voyez ce qui est discuté au-delà des slogans.
            </p>
          </div>
          <div className={styles.themeCard}>
            <h3>Sécurité &amp; institutions</h3>
            <p>
              Textes sur la justice, la police, les libertés publiques ou le
              fonctionnement de la démocratie.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Comment utiliser Agora pendant la campagne ?
        </h2>
        <ol className={styles.stepsList}>
          <li>
            <strong>Choisissez une date.</strong> Utilisez la page
            d&apos;accueil ou le calendrier pour voir ce qui se passe aujourd&apos;hui
            ou dans les prochains jours.
          </li>
          <li>
            <strong>Ouvrez une séance.</strong> Lisez l&apos;ordre du jour pour
            comprendre quels sujets précis seront débattus ou votés.
          </li>
          <li>
            <strong>Revenez vérifier.</strong> Après le vote, consultez la
            section &laquo; Scrutins &raquo; pour voir le résultat détaillé.
          </li>
        </ol>
        <p className={styles.moreLinks}>
          Pour aller plus loin, vous pouvez aussi{" "}
          <Link href="/democratie">comprendre comment la démocratie fonctionne</Link>{" "}
          ou{" "}
          <Link href="/votes">
            explorer les scrutins récents par thème
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

