"use client";

import { useEffect, useState } from "react";
import { AgendaRangeResponse, AgendaItem } from "@agora/shared";
import {
  getTodayDate,
  formatDate,
  addDays,
  isVoteLikeAgendaItem,
} from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./upcoming.module.css";
import { Breadcrumb } from "@/components/Breadcrumb";

const DAYS_AHEAD = 14;

function filterVoteLikeItems(items: AgendaItem[]): AgendaItem[] {
  return items.filter((item) =>
    isVoteLikeAgendaItem(item.title, item.description, item.category),
  );
}

export default function UpcomingVotesPage() {
  const [agendaRange, setAgendaRange] = useState<AgendaRangeResponse | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUpcoming();
  }, []);

  const loadUpcoming = async () => {
    setLoading(true);
    setError(null);
    try {
      const from = getTodayDate();
      const to = addDays(from, DAYS_AHEAD);
      const data = await apiClient.getAgendaRange(from, to);
      setAgendaRange(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load upcoming agenda",
      );
      setAgendaRange(null);
    } finally {
      setLoading(false);
    }
  };

  const today = getTodayDate();
  const sittingsWithVotes: Array<{
    date: string;
    sitting: { id: string; title: string; time_range?: string };
    voteLikeItems: AgendaItem[];
  }> = [];

  if (agendaRange) {
    for (const agenda of agendaRange.agendas) {
      for (const sitting of agenda.sittings) {
        const voteLikeItems = filterVoteLikeItems(sitting.agenda_items ?? []);
        if (voteLikeItems.length > 0) {
          sittingsWithVotes.push({
            date: agenda.date,
            sitting: {
              id: sitting.id,
              title: sitting.title,
              time_range: sitting.time_range,
            },
            voteLikeItems,
          });
        }
      }
    }
  }

  return (
    <div className="container">
      <Breadcrumb items={[{ label: "Scrutins", href: "/votes" }, { label: "Prochains votes" }]} />

      {loading && <div className="stateLoading">Chargement...</div>}

      {error && (
        <div className="stateError">
          <p>Erreur: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className={styles.content}>
          {sittingsWithVotes.length === 0 ? (
            <div className="stateEmpty">
              <p>
                Aucune séance avec point de vote identifié pour les{" "}
                {DAYS_AHEAD} prochains jours.
              </p>
              <p className={styles.emptyHint}>
                Consultez le <Link href="/timeline">calendrier</Link> pour
                voir toutes les séances.
              </p>
            </div>
          ) : (
            <div className={styles.sittings}>
              {sittingsWithVotes.map(({ date, sitting, voteLikeItems }) => (
                <div key={`${date}-${sitting.id}`} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.date}>
                      {formatDate(date)}
                      {date === today && (
                        <span className={styles.todayBadge}>
                          Aujourd&apos;hui
                        </span>
                      )}
                    </h2>
                    <Link
                      href={`/sitting/${sitting.id}`}
                      className={styles.sittingTitle}
                    >
                      {sitting.title}
                    </Link>
                    {sitting.time_range && (
                      <span className={styles.timeRange}>
                        {sitting.time_range}
                      </span>
                    )}
                  </div>
                  <ul className={styles.voteItems}>
                    {voteLikeItems.map((item) => (
                      <li key={item.id} className={styles.voteItem}>
                        <span className={styles.voteBadge}>Vote</span>
                        <span className={styles.voteItemTitle}>
                          {item.title}
                        </span>
                        {item.category && (
                          <span className={styles.voteCategory}>
                            {item.category}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
