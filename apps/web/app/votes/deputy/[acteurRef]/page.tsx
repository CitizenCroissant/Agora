"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DeputyVotesResponse, DeputyVoteRecord } from "@agora/shared";
import { formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "../deputy.module.css";

const POSITION_LABELS: Record<string, string> = {
  pour: "Pour",
  contre: "Contre",
  abstention: "Abstention",
  non_votant: "Non votant",
};

export default function DeputyVotesByRefPage() {
  const params = useParams();
  const acteurRef = params.acteurRef as string;

  const [data, setData] = useState<DeputyVotesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (acteurRef) {
      loadVotes(acteurRef);
    }
  }, [acteurRef]);

  const loadVotes = async (ref: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getDeputyVotes(ref);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger les votes",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const displayName = data?.acteur_nom ?? data?.acteur_ref ?? acteurRef;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <Link href="/votes" className={styles.backLink}>
            ← Retour aux scrutins
          </Link>
          <h1 className={styles.title}>Votes du député</h1>
          <p className={styles.subtitle}>
            {displayName}
            {data?.acteur_nom && (
              <span className={styles.acteurRefHint}> ({data.acteur_ref})</span>
            )}
          </p>
        </div>
      </header>

      <main className={styles.main}>
        <div className="container">
          {loading && (
            <div className={styles.loading}>Chargement des votes...</div>
          )}

          {error && (
            <div className={styles.error}>
              <p>Erreur : {error}</p>
            </div>
          )}

          {!loading && !error && data && (
            <div className={styles.result}>
              <div className={styles.resultHeader}>
                <h2 className={styles.resultTitle}>
                  Historique des votes pour {displayName}
                </h2>
                <Link
                  href={`/deputy/${encodeURIComponent(data.acteur_ref)}`}
                  className={styles.profileLink}
                >
                  Voir la fiche député →
                </Link>
              </div>
              {data.votes.length === 0 ? (
                <p className={styles.empty}>
                  Aucun vote enregistré pour cet identifiant.
                </p>
              ) : (
                <ul className={styles.voteList}>
                  {data.votes.map((v: DeputyVoteRecord) => (
                    <li key={v.scrutin_id} className={styles.voteItem}>
                      <span
                        className={
                          v.position === "pour"
                            ? styles.badgePour
                            : v.position === "contre"
                              ? styles.badgeContre
                              : v.position === "abstention"
                                ? styles.badgeAbstention
                                : styles.badgeNonVotant
                        }
                      >
                        {POSITION_LABELS[v.position]}
                      </span>
                      <span className={styles.voteDate}>
                        {formatDate(v.date_scrutin)}
                      </span>
                      <Link
                        href={`/votes/${v.scrutin_id}`}
                        className={styles.voteTitre}
                      >
                        {v.scrutin_titre}
                      </Link>
                    </li>
                  ))}
                </ul>
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
