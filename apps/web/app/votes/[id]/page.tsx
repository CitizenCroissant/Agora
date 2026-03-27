"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ScrutinDetailResponse, slugify } from "@agora/shared";
import { formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";
import { recordScrutinView } from "@/lib/streaks";
import Link from "next/link";
import styles from "./scrutin.module.css";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ShareBar } from "@/components/ShareBar";
import { VoteResultBar } from "@/components/VoteResultBar";
import { Skeleton } from "@/components/Skeleton";
import skeletonStyles from "@/components/Skeleton.module.css";

const POSITION_LABELS: Record<string, string> = {
  pour: "Pour",
  contre: "Contre",
  abstention: "Abstention",
  non_votant: "Non votant"
};

function ScrutinSkeleton() {
  return (
    <div aria-busy="true" aria-label="Chargement du scrutin">
      {/* Header */}
      <div className={styles.scrutinHeader}>
        <div className={styles.metaRow}>
          <Skeleton shape="pill" width={80} height={26} />
          <Skeleton shape="pill" width={120} height={26} />
        </div>
        <Skeleton shape="heading" width="75%" height={32} style={{ marginBottom: 8 }} />
        <Skeleton shape="text" width="40%" height={16} style={{ marginBottom: 16 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className={skeletonStyles.card} style={{ padding: "12px 16px" }}>
            <Skeleton shape="text" width="30%" height={13} style={{ marginBottom: 6 }} />
            <Skeleton shape="text" width="90%" height={15} />
            <Skeleton shape="text" width="65%" height={15} />
          </div>
          <div className={skeletonStyles.card} style={{ padding: "12px 16px" }}>
            <Skeleton shape="text" width="25%" height={13} style={{ marginBottom: 6 }} />
            <Skeleton shape="text" width="55%" height={15} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {[70, 90, 80].map((w, i) => (
            <Skeleton key={i} shape="pill" width={w} height={24} />
          ))}
        </div>
      </div>
      {/* Result bar */}
      <section style={{ marginBottom: "var(--spacing-xl)" }}>
        <Skeleton shape="heading" width={180} height={22} style={{ marginBottom: 12 }} />
        <Skeleton shape="rect" width="100%" height={40} style={{ borderRadius: 8 }} />
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          {[65, 75, 55, 70].map((w, i) => (
            <Skeleton key={i} shape="text" width={w} height={14} />
          ))}
        </div>
      </section>
      {/* Group votes grid */}
      <section style={{ marginBottom: "var(--spacing-xl)" }}>
        <Skeleton shape="heading" width={220} height={22} style={{ marginBottom: 6 }} />
        <Skeleton shape="text" width="55%" height={14} style={{ marginBottom: 16 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={skeletonStyles.card}>
              <Skeleton shape="text" width="70%" height={15} style={{ marginBottom: 8 }} />
              <Skeleton shape="rect" width="100%" height={10} style={{ borderRadius: 4, marginBottom: 6 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <Skeleton shape="text" width={50} height={13} />
                <Skeleton shape="text" width={55} height={13} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function ScrutinPage() {
  const params = useParams();
  const id = params.id as string;

  const [scrutin, setScrutin] = useState<ScrutinDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadScrutin(id);
  }, [id]);

  useEffect(() => {
    if (id) recordScrutinView(id);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkedBill = (scrutin as any)?.bill as ScrutinDetailResponse["bill"] | undefined;
  const billSuggestion = (scrutin as any)?.bill_suggestion as
    | ScrutinDetailResponse["bill_suggestion"]
    | undefined;

  const hasGroupVotes = Array.isArray(scrutin?.group_votes) && scrutin.group_votes.length > 0;
  const isAdopte = scrutin?.sort_code === "adopté";

  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Scrutins", href: "/votes" },
          { label: scrutin?.titre ?? "Scrutin" }
        ]}
      />

      {loading && <ScrutinSkeleton />}

      {error && (
        <div className="stateError">
          <p>Erreur : {error}</p>
        </div>
      )}

      {!loading && !error && scrutin && (
        <>
          <ShareBar title={scrutin.titre} />

          {/* Header */}
          <div className={styles.scrutinHeader}>
            <div className={styles.metaRow}>
              <span className={isAdopte ? styles.badgeAdopte : styles.badgeRejete}>
                {isAdopte ? "✓ Adopté" : "✕ Rejeté"}
              </span>
              {scrutin.type_vote_libelle && (
                <span className={styles.typeVote}>
                  <GlossaryTooltip term={scrutin.type_vote_libelle} />
                </span>
              )}
            </div>

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
            {!linkedBill && billSuggestion?.title && (
              <div className={styles.billLink}>
                <Link href={`/bills?q=${encodeURIComponent(billSuggestion.title)}`}>
                  Amendement au texte : {billSuggestion.title} (rechercher) →
                </Link>
              </div>
            )}

            <h1 className={styles.title}>{scrutin.titre}</h1>
            <p className={styles.date}>
              {formatDate(scrutin.date_scrutin)} · Scrutin n°{scrutin.numero}
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

          {/* Result visualization */}
          <section className={styles.resultSection}>
            <h2>Résultat du vote</h2>
            <VoteResultBar
              pour={scrutin.synthese_pour}
              contre={scrutin.synthese_contre}
              abstentions={scrutin.synthese_abstentions}
              nonVotants={scrutin.synthese_non_votants}
              size="lg"
              showStats
              showLegend={false}
            />
          </section>

          {/* Group votes as visual cards */}
          {hasGroupVotes && (
            <section className={styles.groupVotesSection}>
              <h2>Comment chaque groupe a voté</h2>
              <p className={styles.groupVotesHint}>
                Répartition des votes par groupe politique, à partir des votes nominatifs.
              </p>
              <div className={styles.groupCardsGrid}>
                {scrutin.group_votes!.map((g) => {
                  const slug = slugify(g.groupe_politique);
                  const total = g.total || 1;
                  const pctLike =
                    typeof g.pct_voted_like_assembly === "number"
                      ? g.pct_voted_like_assembly
                      : null;
                  return (
                    <div key={g.groupe_politique} className={styles.groupCard}>
                      <div className={styles.groupCardHeader}>
                        <Link
                          href={`/groupes/${encodeURIComponent(slug)}`}
                          className={styles.groupName}
                          title={g.groupe_politique}
                        >
                          {g.groupe_politique}
                        </Link>
                        <span className={styles.groupTotal}>{g.total} députés</span>
                      </div>

                      <div className={styles.groupBar} role="img" aria-label={`${g.pour_pct.toFixed(0)}% pour, ${g.contre_pct.toFixed(0)}% contre`}>
                        <span className={styles.groupBarPour} style={{ width: `${g.pour_pct}%` }} />
                        <span className={styles.groupBarContre} style={{ width: `${g.contre_pct}%` }} />
                        <span className={styles.groupBarAbstention} style={{ width: `${(g.abstention / total) * 100}%` }} />
                      </div>

                      <div className={styles.groupCounts}>
                        {g.pour > 0 && (
                          <span className={styles.countPour}>
                            ✓ {g.pour} pour
                          </span>
                        )}
                        {g.contre > 0 && (
                          <span className={styles.countContre}>
                            ✕ {g.contre} contre
                          </span>
                        )}
                        {g.abstention > 0 && (
                          <span className={styles.countAbstention}>
                            ◦ {g.abstention} abstention{g.abstention > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {pctLike !== null && (
                        <div className={styles.likeAssemblyRow}>
                          <span className={styles.likeAssemblyLabel}>Comme l&apos;Assemblée</span>
                          <span className={styles.likeAssemblyBar}>
                            <span
                              className={styles.likeAssemblyFill}
                              style={{ width: `${pctLike}%` }}
                            />
                          </span>
                          <span className={styles.likeAssemblyPct}>{pctLike.toFixed(0)} %</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {scrutin.sitting_id && (
            <div className={styles.sittingLink}>
              <Link href={`/sitting/${scrutin.sitting_id}`}>
                📋 Voir la séance associée →
              </Link>
            </div>
          )}

          {/* Deputy votes by position */}
          {scrutin.votes && scrutin.votes.length > 0 && (
            <div className={styles.votesSection}>
              <h2>Vote des députés</h2>
              <p className={styles.votesSectionHint}>
                Par groupe politique — répartition du groupe et liste des députés.
              </p>
              {(["pour", "contre", "abstention", "non_votant"] as const).map((pos) => {
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
                    const key = v.groupe_politique ?? "\uFFFF";
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
                        groupKey !== "\uFFFF" && scrutin.group_votes
                          ? scrutin.group_votes.find((g) => g.groupe_politique === groupKey)
                          : undefined;
                      return (
                        <details key={groupKey} className={styles.positionGroupSubsection}>
                          <summary className={styles.positionGroupHeading}>
                            <span className={styles.positionGroupChevron} aria-hidden>▼</span>
                            <span className={styles.positionGroupBadge}>{groupLabel}</span>
                            {groupForSection && (
                              <span
                                className={styles.groupBarWrap}
                                title={`${groupForSection.pour_pct.toFixed(0)}% pour, ${groupForSection.contre_pct.toFixed(0)}% contre`}
                              >
                                <span
                                  className={styles.groupBarWrapPour}
                                  style={{ width: `${groupForSection.pour_pct}%` }}
                                />
                                <span
                                  className={styles.groupBarWrapContre}
                                  style={{ width: `${groupForSection.contre_pct}%` }}
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
              <h3>Source officielle</h3>
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
