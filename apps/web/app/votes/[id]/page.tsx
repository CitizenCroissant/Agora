"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ScrutinDetailResponse, slugify } from "@agora/shared";
import { formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./scrutin.module.css";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";

const POSITION_LABELS: Record<string, string> = {
  pour: "Pour",
  contre: "Contre",
  abstention: "Abstention",
  non_votant: "Non votant",
};

export default function ScrutinPage() {
  const params = useParams();
  const id = params.id as string;

  const [scrutin, setScrutin] = useState<ScrutinDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadScrutin(id);
    }
  }, [id]);

  const loadScrutin = async (scrutinId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getScrutin(scrutinId);
      setScrutin(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scrutin");
      setScrutin(null);
    } finally {
      setLoading(false);
    }
  };

  const byPosition =
    scrutin?.votes?.reduce(
      (acc, v) => {
        if (!acc[v.position]) acc[v.position] = [];
        acc[v.position].push(v);
        return acc;
      },
      {} as Record<string, typeof scrutin.votes>,
    ) ?? {};

  // Optional linked bill (dossier législatif) when available.
  // Cast via any so this file remains compatible even if some compiled type definitions lag behind.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkedBill = (scrutin as any)?.bill as
    | ScrutinDetailResponse["bill"]
    | undefined;

  const hasGroupVotes = Array.isArray(scrutin?.group_votes) && scrutin.group_votes.length > 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <Link href="/votes" className={styles.backLink}>
            ← Retour aux scrutins
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <div className="container">
          {loading && (
            <div className={styles.loading}>Chargement du scrutin...</div>
          )}

          {error && (
            <div className={styles.error}>
              <p>Erreur: {error}</p>
            </div>
          )}

          {!loading && !error && scrutin && (
            <>
              <div className={styles.scrutinHeader}>
                <div>
                  <span
                    className={
                      scrutin.sort_code === "adopté"
                        ? styles.badgeAdopte
                        : styles.badgeRejete
                    }
                  >
                    {scrutin.sort_code === "adopté" ? "Adopté" : "Rejeté"}
                  </span>
                  {scrutin.type_vote_libelle && (
                    <span className={styles.typeVote}>
                      <GlossaryTooltip term={scrutin.type_vote_libelle} />
                    </span>
                  )}
                  {linkedBill && (
                    <div className={styles.billLink}>
                      <Link href={`/bills/${linkedBill.id}`}>
                        Texte concerné :{" "}
                        {linkedBill.short_title || linkedBill.title} →
                      </Link>
                    </div>
                  )}
                  <h1 className={styles.title}>{scrutin.titre}</h1>
                  <p className={styles.date}>
                    {formatDate(scrutin.date_scrutin)} · Scrutin n°
                    {scrutin.numero}
                  </p>
                  {scrutin.tags && scrutin.tags.length > 0 && (
                    <div className={styles.tagsSection}>
                      <h3 className={styles.tagsTitle}>Thèmes</h3>
                      <div className={styles.tags}>
                        {scrutin.tags.map((tag) => (
                          <Link
                            key={tag.id}
                            href={`/votes?tag=${encodeURIComponent(tag.slug)}`}
                            className={styles.tag}
                            title={`Filtrer par ${tag.label}`}
                          >
                            {tag.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.synthese}>
                <h2>Résultat</h2>
                <div className={styles.syntheseGrid}>
                  <div className={styles.syntheseItem}>
                    <span className={styles.syntheseValue}>
                      {scrutin.synthese_pour}
                    </span>
                    <span className={styles.syntheseLabel}>Pour</span>
                  </div>
                  <div className={styles.syntheseItem}>
                    <span className={styles.syntheseValue}>
                      {scrutin.synthese_contre}
                    </span>
                    <span className={styles.syntheseLabel}>Contre</span>
                  </div>
                  <div className={styles.syntheseItem}>
                    <span className={styles.syntheseValue}>
                      {scrutin.synthese_abstentions}
                    </span>
                    <span className={styles.syntheseLabel}>Abstentions</span>
                  </div>
                  <div className={styles.syntheseItem}>
                    <span className={styles.syntheseValue}>
                      {scrutin.synthese_non_votants}
                    </span>
                    <span className={styles.syntheseLabel}>Non votants</span>
                  </div>
                </div>
              </div>

              {hasGroupVotes && (
                <section className={styles.groupVotesSection}>
                  <h2>Comment chaque groupe a voté</h2>
                  <p className={styles.groupVotesHint}>
                    Répartition des votes par groupe politique, à partir des votes nominatifs.
                  </p>
                  <div className={styles.groupVotesTableWrapper}>
                    <table className={styles.groupVotesTable}>
                      <thead>
                        <tr>
                          <th>Groupe</th>
                          <th>Pour</th>
                          <th>Contre</th>
                          <th>Abstention</th>
                          <th>Non votants</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scrutin.group_votes!.map((g) => {
                          const slug = slugify(g.groupe_politique);
                          const formatCell = (count: number, pct: number) =>
                            count === 0 ? "—" : `${count} (${pct.toFixed(1)} %)`;
                          return (
                            <tr key={g.groupe_politique}>
                              <td>
                                <Link
                                  href={`/groupes/${encodeURIComponent(slug)}`}
                                  className={styles.groupLink}
                                >
                                  {g.groupe_politique}
                                </Link>
                              </td>
                              <td>{formatCell(g.pour, g.pour_pct)}</td>
                              <td>{formatCell(g.contre, g.contre_pct)}</td>
                              <td>{formatCell(g.abstention, g.abstention_pct)}</td>
                              <td>{formatCell(g.non_votant, g.non_votant_pct)}</td>
                              <td>{g.total}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {scrutin.sitting_id && (
                <div className={styles.sittingLink}>
                  <Link href={`/sitting/${scrutin.sitting_id}`}>
                    Voir la séance associée →
                  </Link>
                </div>
              )}

              {scrutin.votes && scrutin.votes.length > 0 && (
                <div className={styles.votesSection}>
                  <h2>Vote des députés</h2>
                  {(
                    ["pour", "contre", "abstention", "non_votant"] as const
                  ).map((pos) => {
                    const list = byPosition[pos] ?? [];
                    if (list.length === 0) return null;
                    return (
                      <div key={pos} className={styles.positionBlock}>
                        <h3>
                          {POSITION_LABELS[pos]} ({list.length})
                        </h3>
                        <ul className={styles.voteList}>
                          {list.map((v) => (
                            <li key={v.id}>
                              <Link
                                href={`/deputy/${encodeURIComponent(v.acteur_ref)}`}
                                className={styles.deputyLink}
                              >
                                {v.acteur_nom ?? v.acteur_ref}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}

              {scrutin.official_url && (
                <div className={styles.source}>
                  <h3>Source</h3>
                  <a
                    href={scrutin.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sourceLink}
                  >
                    Voir le scrutin sur assemblee-nationale.fr →
                  </a>
                </div>
              )}
            </>
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
