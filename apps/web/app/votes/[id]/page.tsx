"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ScrutinDetailResponse, slugify } from "@agora/shared";
import { formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./scrutin.module.css";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ShareBar } from "@/components/ShareBar";

const POSITION_LABELS: Record<string, string> = {
  pour: "Pour",
  contre: "Contre",
  abstention: "Abstention",
  non_votant: "Non votant"
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
      {} as Record<string, typeof scrutin.votes>
    ) ?? {};

  // Optional linked bill (dossier législatif) when available.
  // Cast via any so this file remains compatible even if some compiled type definitions lag behind.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkedBill = (scrutin as any)?.bill as
    | ScrutinDetailResponse["bill"]
    | undefined;

  const hasGroupVotes = Array.isArray(scrutin?.group_votes) && scrutin.group_votes.length > 0;

  return (
    <div className="container">
      <Breadcrumb
            items={[
              { label: "Scrutins", href: "/votes" },
              { label: scrutin?.titre ?? "Scrutin" }
            ]}
          />
          {loading && (
            <div className="stateLoading">Chargement du scrutin...</div>
          )}

          {error && (
            <div className="stateError">
              <p>Erreur: {error}</p>
            </div>
          )}

          {!loading && !error && scrutin && (
            <>
              <ShareBar title={scrutin.titre} />
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
                        {scrutin.titre?.toLowerCase().includes("amendement")
                          ? "Amendement au texte : "
                          : "Texte concerné : "}
                        {linkedBill.short_title || linkedBill.title} →
                      </Link>
                    </div>
                  )}
                  <h1 className={styles.title}>{scrutin.titre}</h1>
                  <p className={styles.date}>
                    {formatDate(scrutin.date_scrutin)} · Scrutin n°
                    {scrutin.numero}
                  </p>
                  {(scrutin.objet_libelle || scrutin.demandeur_texte) && (
                    <div className={styles.contextSection}>
                      {scrutin.objet_libelle && (
                        <div className={styles.contextBlock}>
                          <h3 className={styles.contextLabel}>De quoi s&apos;agit-il ?</h3>
                          <p className={styles.contextText}>{scrutin.objet_libelle}</p>
                        </div>
                      )}
                      {scrutin.demandeur_texte && (
                        <div className={styles.contextBlock}>
                          <h3 className={styles.contextLabel}>Demandeur</h3>
                          <p className={styles.contextText}>{scrutin.demandeur_texte}</p>
                        </div>
                      )}
                    </div>
                  )}
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
                          <th className={styles.thLikeAssembly} title="Part du groupe ayant voté comme le résultat de l'Assemblée (pour si adopté, contre si rejeté)">
                            Comme l&apos;Assemblée
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {scrutin.group_votes!.map((g) => {
                          const slug = slugify(g.groupe_politique);
                          const formatCell = (count: number, pct: number) =>
                            count === 0 ? "—" : `${count} (${pct.toFixed(1)} %)`;
                          const pctLike =
                            typeof g.pct_voted_like_assembly === "number"
                              ? g.pct_voted_like_assembly
                              : null;
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
                              <td className={styles.tdLikeAssembly}>
                                {pctLike !== null ? (
                                  <span
                                    className={styles.likeAssemblyCell}
                                    title={`${pctLike.toFixed(0)} % des députés du groupe ont voté comme l'Assemblée`}
                                  >
                                    <span
                                      className={styles.likeAssemblyBarWrap}
                                      role="img"
                                      aria-label={`${pctLike.toFixed(0)} %`}
                                    >
                                      <span
                                        className={styles.likeAssemblyBar}
                                        style={{ width: `${pctLike}%` }}
                                      />
                                    </span>
                                    <span className={styles.likeAssemblyPct}>
                                      {pctLike.toFixed(0)} %
                                    </span>
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
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
                  <p className={styles.votesSectionHint}>
                    Par groupe politique : répartition du groupe (barre pour/contre) et liste des députés.
                  </p>
                  {(
                    ["pour", "contre", "abstention", "non_votant"] as const
                  ).map((pos) => {
                    const rawList = byPosition[pos] ?? [];
                    const sorted = [...rawList].sort((a, b) => {
                      const ga = a.groupe_politique ?? "";
                      const gb = b.groupe_politique ?? "";
                      if (!ga && !gb) return 0;
                      if (!ga) return 1;
                      if (!gb) return -1;
                      return ga.localeCompare(gb, "fr");
                    });
                    const byGroup = sorted.reduce(
                      (acc, v) => {
                        const key = v.groupe_politique ?? "\uFFFF"; // sort "Sans groupe" last
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(v);
                        return acc;
                      },
                      {} as Record<string, typeof sorted>
                    );
                    const groupKeys = Object.keys(byGroup).sort((a, b) =>
                      a === "\uFFFF" ? 1 : b === "\uFFFF" ? -1 : a.localeCompare(b, "fr")
                    );
                    if (sorted.length === 0) return null;
                    return (
                      <div
                        key={pos}
                        className={`${styles.positionBlock} ${
                          pos === "pour"
                            ? styles.positionBlockPour
                            : pos === "contre"
                              ? styles.positionBlockContre
                              : pos === "abstention"
                                ? styles.positionBlockAbstention
                                : styles.positionBlockNonVotant
                        }`}
                      >
                        <h3 className={styles.positionBlockTitle}>
                          <span
                            className={
                              pos === "pour"
                                ? styles.positionDotPour
                                : pos === "contre"
                                  ? styles.positionDotContre
                                  : pos === "abstention"
                                    ? styles.positionDotAbstention
                                    : styles.positionDotNonVotant
                            }
                          />
                          {POSITION_LABELS[pos]} ({sorted.length})
                        </h3>
                        {groupKeys.map((groupKey) => {
                          const groupVotes = byGroup[groupKey];
                          const groupLabel =
                            groupKey === "\uFFFF" ? "Sans groupe" : groupKey;
                          const groupForSection =
                            groupKey !== "\uFFFF" &&
                            scrutin.group_votes
                              ? scrutin.group_votes.find(
                                  (g) => g.groupe_politique === groupKey
                                )
                              : undefined;
                          return (
                            <details
                              key={groupKey}
                              className={styles.positionGroupSubsection}
                            >
                              <summary className={styles.positionGroupHeading}>
                                <span className={styles.positionGroupChevron} aria-hidden>
                                  ▼
                                </span>
                                <span className={styles.positionGroupBadge}>
                                  {groupLabel}
                                </span>
                                {groupForSection && (
                                  <span
                                    className={styles.groupBarWrap}
                                    title={`${groupForSection.pour_pct.toFixed(0)}% pour, ${groupForSection.contre_pct.toFixed(0)}% contre`}
                                  >
                                    <span
                                      className={styles.groupBarPour}
                                      style={{
                                        width: `${groupForSection.pour_pct}%`
                                      }}
                                    />
                                    <span
                                      className={styles.groupBarContre}
                                      style={{
                                        width: `${groupForSection.contre_pct}%`
                                      }}
                                    />
                                  </span>
                                )}
                                <span className={styles.positionGroupCount}>
                                  ({groupVotes.length})
                                </span>
                              </summary>
                              <ul className={styles.voteList}>
                                {groupVotes.map((v) => (
                                  <li key={v.id} className={styles.voteCard}>
                                    <Link
                                      href={`/deputy/${encodeURIComponent(v.acteur_ref)}`}
                                      className={styles.deputyName}
                                    >
                                      {v.acteur_nom ?? v.acteur_ref}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </details>
                          );
                        })}
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
  );
}
