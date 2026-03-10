"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { DeputyVotesResponse, DeputyVoteRecord } from "@agora/shared";
import { formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";
import styles from "./embed.module.css";

const APP_BASE =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
    : typeof window !== "undefined"
      ? window.location.origin
      : "https://agora.gouv.fm";

function parseLimit(s: string | null): number {
  if (s == null) return 5;
  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || n < 1) return 5;
  return Math.min(n, 20);
}

const POSITION_LABELS: Record<string, string> = {
  pour: "Pour",
  contre: "Contre",
  abstention: "Abstention",
  non_votant: "Non votant"
};

export default function EmbedDeputyVotesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const acteurRef = params.acteurRef as string;
  const limit = parseLimit(searchParams.get("limit"));
  const [data, setData] = useState<DeputyVotesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (acteurRef) {
      setLoading(true);
      setError(null);
      apiClient
        .getEmbedDeputyVotes(acteurRef, { limit })
        .then(setData)
        .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
        .finally(() => setLoading(false));
    }
  }, [acteurRef, limit]);

  const displayName = data?.acteur_nom ?? data?.acteur_ref ?? acteurRef;

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          Derniers votes · {displayName || "Député"}
        </h2>
        <a
          href={`${APP_BASE}/deputy/${encodeURIComponent(acteurRef)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.brand}
        >
          Voir sur Agora
        </a>
      </div>
      {loading && <p className={styles.loading}>Chargement…</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && !error && data && (
        <>
          {data.votes.length === 0 ? (
            <p className={styles.empty}>Aucun vote enregistré.</p>
          ) : (
            <ul className={styles.list}>
              {(data.votes as DeputyVoteRecord[]).map((v) => (
                <li key={v.scrutin_id} className={styles.item}>
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
                  <span className={styles.date}>{formatDate(v.date_scrutin)}</span>
                  <a
                    href={`${APP_BASE}/votes/${v.scrutin_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    {v.scrutin_titre}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
