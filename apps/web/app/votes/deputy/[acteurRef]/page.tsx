"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  DeputyVotesResponse,
  DeputyVoteRecord,
  DeputyVoteRecordWithComparison
} from "@agora/shared";
import { formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "../deputy.module.css";
import { Breadcrumb } from "@/components/Breadcrumb";

const PAGE_SIZE = 20;

const POSITION_LABELS: Record<string, string> = {
  pour: "Pour",
  contre: "Contre",
  abstention: "Abstention",
  non_votant: "Non votant"
};

export default function DeputyVotesByRefPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const acteurRef = params.acteurRef as string;

  const [data, setData] = useState<DeputyVotesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const currentPage = Number(searchParams.get("page") ?? "1");

  useEffect(() => {
    if (acteurRef) {
      loadVotes(acteurRef);
    }
  }, [acteurRef]);

  const loadVotes = async (ref: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getDeputyVotes(ref, {
        enrich: "comparison"
      });
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger les votes"
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const totalVotes = data?.votes.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalVotes / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedVotes = useMemo(() => {
    if (!data) return [];
    const start = (safePage - 1) * PAGE_SIZE;
    return data.votes.slice(start, start + PAGE_SIZE);
  }, [data, safePage]);

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page === 1) {
        params.delete("page");
      } else {
        params.set("page", String(page));
      }
      const qs = params.toString();
      router.push(qs ? `?${qs}` : window.location.pathname, { scroll: false });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [router, searchParams]
  );

  const displayName = data?.acteur_nom ?? data?.acteur_ref ?? acteurRef;

  return (
    <div className="container">
      <Breadcrumb items={[{ label: "Scrutins", href: "/votes" }, { label: "Vote par député", href: "/votes/deputy" }, { label: displayName || "Député" }]} />
      {loading && (
        <div className="stateLoading">Chargement des votes...</div>
      )}

      {error && (
        <div className="stateError">
          <p>Erreur : {error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <div className={styles.result}>
          <div className={styles.resultHeader}>
            <h2 className={styles.resultTitle}>
              Historique des votes pour {displayName}
              {totalVotes > 0 && (
                <span className={styles.voteCount}>
                  {" "}({totalVotes} vote{totalVotes > 1 ? "s" : ""})
                </span>
              )}
            </h2>
            <Link
              href={`/deputy/${encodeURIComponent(data.acteur_ref)}`}
              className={styles.profileLink}
            >
              Voir la fiche député →
            </Link>
          </div>
          {data.votes.length === 0 ? (
            <p className="stateEmpty">
              Aucun vote enregistré pour cet identifiant.
            </p>
          ) : (
            <>
              <ul className={styles.voteList}>
                {paginatedVotes.map((v: DeputyVoteRecord | DeputyVoteRecordWithComparison) => {
                  const withComp = v as DeputyVoteRecordWithComparison;
                  const comp = withComp.comparison;
                  return (
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
                      {comp && (
                        <p className={styles.voteComparisonLine}>
                          Votre député : {POSITION_LABELS[v.position]} · Groupe (
                          {comp.group_label}) : {comp.group_pour_pct.toFixed(0)} %
                          pour · Assemblée :{" "}
                          {comp.assembly_result === "adopté" ? "Adopté" : "Rejeté"}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>

              {totalPages > 1 && (
                <Pagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = useMemo(() => {
    const items: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
      return items;
    }

    items.push(1);
    if (currentPage > 3) items.push("ellipsis");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) items.push(i);

    if (currentPage < totalPages - 2) items.push("ellipsis");
    items.push(totalPages);

    return items;
  }, [currentPage, totalPages]);

  return (
    <nav className={styles.pagination} aria-label="Pagination des votes">
      <button
        className={styles.paginationBtn}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Page précédente"
      >
        ←
      </button>

      {pages.map((item, idx) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${idx}`} className={styles.paginationEllipsis}>
            …
          </span>
        ) : (
          <button
            key={item}
            className={`${styles.paginationBtn} ${item === currentPage ? styles.paginationBtnActive : ""}`}
            onClick={() => onPageChange(item)}
            aria-current={item === currentPage ? "page" : undefined}
          >
            {item}
          </button>
        )
      )}

      <button
        className={styles.paginationBtn}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Page suivante"
      >
        →
      </button>
    </nav>
  );
}
