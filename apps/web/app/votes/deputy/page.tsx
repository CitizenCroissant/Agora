"use client";

import { useState } from "react";
import { DeputyVotesResponse, DeputyVoteRecord } from "@agora/shared";
import { formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./deputy.module.css";

const POSITION_LABELS: Record<string, string> = {
  pour: "Pour",
  contre: "Contre",
  abstention: "Abstention",
  non_votant: "Non votant",
};

export default function DeputyVotesPage() {
  const [acteurRef, setActeurRef] = useState("");
  const [data, setData] = useState<DeputyVotesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ref = acteurRef.trim();
    if (!ref) return;
    setLoading(true);
    setError(null);
    setData(null);
    setSearched(true);
    try {
      const result = await apiClient.getDeputyVotes(ref);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load voting record",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <Link href="/votes" className={styles.backLink}>
            ← Retour aux scrutins
          </Link>
          <h1 className={styles.title}>Vote d&apos;un député</h1>
          <p className={styles.subtitle}>
            Consulter les votes par identifiant acteur (ex. PA842279)
          </p>
        </div>
      </header>

      <main className={styles.main}>
        <div className="container">
          <form onSubmit={handleSubmit} className={styles.form}>
            <label htmlFor="acteur-ref" className={styles.label}>
              Identifiant acteur
            </label>
            <div className={styles.inputRow}>
              <input
                id="acteur-ref"
                type="text"
                className={styles.input}
                value={acteurRef}
                onChange={(e) => setActeurRef(e.target.value)}
                placeholder="PA842279"
                aria-describedby="acteur-ref-hint"
              />
              <button
                type="submit"
                className={styles.button}
                disabled={loading}
              >
                {loading ? "Recherche..." : "Rechercher"}
              </button>
            </div>
            <p id="acteur-ref-hint" className={styles.hint}>
              L&apos;identifiant acteur figure sur les pages scrutin de
              l&apos;Assemblée nationale.
            </p>
          </form>

          {error && (
            <div className={styles.error}>
              <p>Erreur: {error}</p>
            </div>
          )}

          {searched && !loading && data && (
            <div className={styles.result}>
              <div className={styles.resultHeader}>
                <h2 className={styles.resultTitle}>
                  Votes pour{" "}
                  {data.acteur_nom ? (
                    <>
                      <Link
                        href={`/deputy/${encodeURIComponent(data.acteur_ref)}`}
                        className={styles.profileLink}
                      >
                        {data.acteur_nom}
                      </Link>{" "}
                      ({data.acteur_ref})
                    </>
                  ) : (
                    data.acteur_ref
                  )}
                </h2>
                {data.acteur_nom && (
                  <Link
                    href={`/deputy/${encodeURIComponent(data.acteur_ref)}`}
                    className={styles.profileLink}
                  >
                    Voir la fiche député →
                  </Link>
                )}
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
