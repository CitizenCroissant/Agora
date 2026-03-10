"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BillDetailResponse } from "@agora/shared";
import { apiClient } from "@/lib/api";
import styles from "./bill.module.css";
import { PageHelp } from "@/components/PageHelp";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ShareBar } from "@/components/ShareBar";
import { FollowButton } from "@/components/FollowButton";
import { BillLifecycle } from "@/components/BillLifecycle";

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
        err instanceof Error ? err.message : "Impossible de charger le dossier"
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
      0
    ) ?? 0;

  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Dossiers législatifs", href: "/bills" },
          { label: bill?.short_title || bill?.title || "Dossier" }
        ]}
      />
      <PageHelp
        title="Comment lire cette page ?"
        points={[
          "Le bandeau en haut présente le titre officiel du dossier législatif et, lorsque disponible, son type (projet/proposition) et son origine.",
          "Les chiffres clés indiquent le nombre de scrutins, d’amendements déposés (par version de texte) et, le cas échéant, d’amendements mis aux voix.",
          "« Parcours du dossier » montre la vie du dossier : séances et scrutins dans l'ordre, avec pour chaque scrutin le résultat (pour, contre, abst.) et un lien vers le détail du vote des députés."
        ]}
      />

      {loading && <div className="stateLoading">Chargement du dossier...</div>}

      {error && !loading && (
        <div className="stateError">
          <p>Erreur: {error}</p>
        </div>
      )}

      {!loading && !error && bill && (
        <>
          <div className={styles.actionsRow}>
            <ShareBar title={bill.short_title || bill.title} />
            <FollowButton followType="bill" followId={bill.id} />
          </div>
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
              {encodeURIComponent(bill.official_id) !== encodeURIComponent(id) ? (
                <Link
                  href={`/bills/${encodeURIComponent(bill.official_id)}`}
                  className={styles.pillMutedLink}
                  title={`Voir le dossier (réf. ${bill.official_id})`}
                >
                  Réf. {bill.official_id}
                </Link>
              ) : (
                <span className={styles.pillMuted}>Réf. {bill.official_id}</span>
              )}
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
            {bill.amendments_summary &&
              bill.amendments_summary.total > 0 && (
                <Link
                  href={`/bills/${encodeURIComponent(bill.id)}/amendments`}
                  className={styles.factCardLink}
                >
                  <div className={styles.factCard}>
                    <span className={styles.factValue}>
                      {bill.amendments_summary.total}
                    </span>
                    <span className={styles.factLabel}>
                      {bill.amendments_summary.total <= 1
                        ? "Amendement"
                        : "Amendements"}
                    </span>
                    {bill.amendments_summary.with_scrutin_count != null &&
                      bill.amendments_summary.with_scrutin_count > 0 && (
                        <span className={styles.factSub}>
                          dont {bill.amendments_summary.with_scrutin_count} mis
                          aux voix
                        </span>
                      )}
                  </div>
                </Link>
              )}
          </section>

          {/* ── Amendments synthetic note ── */}
          {bill.amendments_summary &&
            bill.amendments_summary.total > 0 && (
              <section className={styles.amendmentsNote}>
                <p className={styles.amendmentsNoteText}>
                  Ce dossier compte{" "}
                  <strong>{bill.amendments_summary.total} amendement{bill.amendments_summary.total > 1 ? "s" : ""} déposé{bill.amendments_summary.total > 1 ? "s" : ""}</strong>
                  {bill.amendments_summary.with_scrutin_count != null &&
                  bill.amendments_summary.with_scrutin_count > 0
                    ? `, dont ${bill.amendments_summary.with_scrutin_count} ont été mis aux voix (voir les scrutins ci‑dessous).`
                    : "."}
                  {" "}
                  <Link
                    href={`/bills/${encodeURIComponent(bill.id)}/amendments`}
                    className={styles.amendmentsListLink}
                  >
                    Voir la liste des amendements
                  </Link>
                  {" · "}
                  La liste complète est également disponible sur le dossier
                  législatif de l’Assemblée (lien ci‑dessus).
                </p>
              </section>
            )}

          {/* ── Text versions (textes) with amendment count per version ── */}
          {bill.textes && bill.textes.length > 0 && (
            <section className={styles.textesSection}>
              <h3 className={styles.textesTitle}>Versions de texte</h3>
              <p className={styles.textesIntro}>
                Ce dossier comporte plusieurs versions de texte. Les amendements
                sont déposés sur une version donnée.
              </p>
              <ul className={styles.textesList}>
                {bill.textes.map((t) => (
                  <li key={t.id} className={styles.texteItem}>
                    <span className={styles.texteLabel}>
                      {t.label ?? t.numero ?? t.texte_ref}
                    </span>
                    <span className={styles.texteMeta}>
                      {t.amendments_count}{" "}
                      {t.amendments_count <= 1 ? "amendement" : "amendements"}
                    </span>
                    <Link
                      href={`/bills/${encodeURIComponent(bill.id)}/amendments?bill_text_id=${encodeURIComponent(t.id)}`}
                      className={styles.texteLink}
                    >
                      Voir la liste
                    </Link>
                  </li>
                ))}
              </ul>
              {bill.scrutins.length > 0 &&
                bill.textes.every((t) => t.amendments_count === 0) && (
                  <p className={styles.textesMissingNote}>
                    Les scrutins ci‑dessous peuvent concerner des votes sur des
                    amendements ; la liste des amendements déposés pour ce
                    dossier n’est pas encore disponible dans nos données (réindexation
                    ou source à compléter).
                  </p>
                )}
            </section>
          )}

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

          {/* ── Lifecycle (parcours du dossier) ── */}
          <BillLifecycle
            scrutins={bill.scrutins}
            sittings={bill.sittings}
            officialUrl={bill.official_url}
          />
        </>
      )}
    </div>
  );
}
