"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BillDetailResponse } from "@agora/shared";
import { formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";
import styles from "./bill.module.css";
import { PageHelp } from "@/components/PageHelp";
import { Breadcrumb } from "@/components/Breadcrumb";

function formatTypeLabel(type?: string | null): string | null {
  if (!type) return null;
  if (type === "projet_de_loi") return "Projet de loi";
  if (type === "proposition_de_loi") return "Proposition de loi";
  if (type === "resolution") return "Résolution";
  return type;
}

function formatOriginLabel(origin?: string | null): string | null {
  if (!origin) return null;
  if (origin === "gouvernement") return "Gouvernement";
  if (origin === "parlementaire") return "Parlementaire";
  return origin;
}

export default function BillPage() {
  const params = useParams();
  const id = params.id as string;

  const [bill, setBill] = useState<BillDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      void loadBill(id);
    }
  }, [id]);

  const loadBill = async (billId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getBill(billId);
      setBill(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger le texte",
      );
      setBill(null);
    } finally {
      setLoading(false);
    }
  };

  const typeLabel = formatTypeLabel(bill?.type);
  const originLabel = formatOriginLabel(bill?.origin);
  const totalVotants =
    bill?.scrutins.reduce(
      (sum, s) =>
        sum + s.synthese_pour + s.synthese_contre + s.synthese_abstentions,
      0,
    ) ?? 0;

  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Textes", href: "/bills" },
          { label: bill?.short_title || bill?.title || "Texte" },
        ]}
      />
      <PageHelp
        title="Comment lire cette page ?"
        points={[
          "Le bandeau en haut présente le titre officiel du texte et, lorsque disponible, son type (projet/proposition) et son origine.",
          "La section « Scrutins associés » liste les votes de l\u2019Assemblée nationale concernant ce texte.",
          "Vous pouvez ouvrir chaque scrutin pour voir le détail des résultats et le vote des députés.",
        ]}
      />

      {loading && <div className={styles.loading}>Chargement du texte...</div>}

      {error && !loading && (
        <div className={styles.error}>
          <p>Erreur: {error}</p>
        </div>
      )}

      {!loading && !error && bill && (
        <>
          {/* ── Bill header ── */}
          <section className={styles.billHeader}>
            <h1 className={styles.billTitle}>
              {bill.short_title || bill.title}
            </h1>
            {bill.short_title && bill.title !== bill.short_title && (
              <p className={styles.billFullTitle}>{bill.title}</p>
            )}

            <div className={styles.pillRow}>
              {typeLabel && <span className={styles.pill}>{typeLabel}</span>}
              {originLabel && (
                <span className={styles.pill}>{originLabel}</span>
              )}
              <span className={styles.pillMuted}>Réf. {bill.official_id}</span>
            </div>
          </section>

          {/* ── Tags section ── */}
          {bill.tags && bill.tags.length > 0 && (
            <div className={styles.tagsSection}>
              <h3 className={styles.tagsTitle}>Thèmes</h3>
              <div className={styles.tags}>
                {bill.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/bills?tag=${encodeURIComponent(tag.slug)}`}
                    className={styles.tag}
                  >
                    {tag.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Key facts summary ── */}
          <section className={styles.factsGrid}>
            <div className={styles.factCard}>
              <span className={styles.factValue}>{bill.scrutins.length}</span>
              <span className={styles.factLabel}>
                {bill.scrutins.length <= 1 ? "Scrutin" : "Scrutins"}
              </span>
            </div>
            <div className={styles.factCard}>
              <span className={styles.factValue}>
                {bill.scrutins.filter((s) => s.sort_code === "adopté").length}
              </span>
              <span className={styles.factLabel}>
                {bill.scrutins.filter((s) => s.sort_code === "adopté").length <=
                1
                  ? "Adopté"
                  : "Adoptés"}
              </span>
            </div>
            <div className={styles.factCard}>
              <span className={styles.factValue}>
                {bill.scrutins.filter((s) => s.sort_code !== "adopté").length}
              </span>
              <span className={styles.factLabel}>
                {bill.scrutins.filter((s) => s.sort_code !== "adopté").length <=
                1
                  ? "Rejeté"
                  : "Rejetés"}
              </span>
            </div>
            {totalVotants > 0 && (
              <div className={styles.factCard}>
                <span className={styles.factValue}>{totalVotants}</span>
                <span className={styles.factLabel}>Votes exprimés</span>
              </div>
            )}
          </section>

          {/* ── Official source ── */}
          {bill.official_url && (
            <section className={styles.sourceSection}>
              <a
                href={bill.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.sourceLink}
              >
                <span className={styles.sourceLinkIcon}>📄</span>
                Consulter le dossier sur assemblee-nationale.fr
                <span className={styles.sourceLinkArrow}>→</span>
              </a>
            </section>
          )}

          {/* ── Scrutins section ── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Scrutins associés</h2>
            {bill.scrutins.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🗳️</div>
                <p className={styles.emptyTitle}>
                  Aucun scrutin pour le moment
                </p>
                <p className={styles.emptyDescription}>
                  Ce texte législatif n&apos;a pas encore fait l&apos;objet
                  d&apos;un vote en séance publique à l&apos;Assemblée
                  nationale. Les scrutins apparaîtront ici dès qu&apos;un vote
                  sera organisé.
                </p>
                <div className={styles.emptyHints}>
                  <div className={styles.emptyHint}>
                    <span className={styles.emptyHintIcon}>📋</span>
                    <span>
                      Le texte peut être en cours d&apos;examen en commission
                    </span>
                  </div>
                  <div className={styles.emptyHint}>
                    <span className={styles.emptyHintIcon}>🔄</span>
                    <span>Les données sont mises à jour quotidiennement</span>
                  </div>
                  {bill.official_url && (
                    <div className={styles.emptyHint}>
                      <span className={styles.emptyHintIcon}>🔗</span>
                      <a
                        href={bill.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.emptyHintLink}
                      >
                        Suivre l&apos;avancement sur assemblee-nationale.fr
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.scrutinsList}>
                {bill.scrutins.map((scrutin) => (
                  <Link
                    key={scrutin.id}
                    href={`/votes/${scrutin.id}`}
                    className={styles.scrutinItem}
                  >
                    <div className={styles.scrutinHeader}>
                      <span
                        className={
                          scrutin.sort_code === "adopté"
                            ? styles.badgeAdopte
                            : styles.badgeRejete
                        }
                      >
                        {scrutin.sort_code === "adopté" ? "Adopté" : "Rejeté"}
                      </span>
                      <span className={styles.scrutinMeta}>
                        {formatDate(scrutin.date_scrutin)} · Scrutin n°
                        {scrutin.numero}
                      </span>
                    </div>
                    <div className={styles.scrutinTitle}>{scrutin.titre}</div>
                    <div className={styles.scrutinStats}>
                      <span className={styles.statPour}>
                        {scrutin.synthese_pour} pour
                      </span>
                      <span className={styles.statContre}>
                        {scrutin.synthese_contre} contre
                      </span>
                      <span className={styles.statAbstention}>
                        {scrutin.synthese_abstentions} abst.
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
