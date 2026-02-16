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
        err instanceof Error ? err.message : "Impossible de charger le texte"
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
          { label: "Textes", href: "/bills" },
          { label: bill?.short_title || bill?.title || "Texte" }
        ]}
      />
      <PageHelp
        title="Comment lire cette page ?"
        points={[
          "Le bandeau en haut présente le titre officiel du texte et, lorsque disponible, son type (projet/proposition) et son origine.",
          "« Parcours du texte » montre la vie du texte : séances et scrutins dans l'ordre, avec pour chaque scrutin le résultat (pour, contre, abst.) et un lien vers le détail du vote des députés."
        ]}
      />

      {loading && <div className="stateLoading">Chargement du texte...</div>}

      {error && !loading && (
        <div className="stateError">
          <p>Erreur: {error}</p>
        </div>
      )}

      {!loading && !error && bill && (
        <>
          <ShareBar title={bill.short_title || bill.title} />
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
                  title={`Voir le texte (réf. ${bill.official_id})`}
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

          {/* ── Lifecycle (parcours du texte) ── */}
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
