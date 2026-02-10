"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BillDetailResponse } from "@agora/shared";
import { formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";
import styles from "./bill.module.css";
import { PageHelp } from "@/components/PageHelp";

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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <Link href="/bills" className={styles.backLink}>
            ← Retour aux textes
          </Link>
          {bill && (
            <>
              <h1 className={styles.title}>
                {bill.short_title || bill.title}
              </h1>
              <p className={styles.subtitle}>{bill.title}</p>
              <div className={styles.metaRow}>
                {bill.type && <span className={styles.pill}>{bill.type}</span>}
                {bill.origin && (
                  <span className={styles.pill}>{bill.origin}</span>
                )}
                {bill.official_id && (
                  <span className={styles.pill}>
                    Référence {bill.official_id}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <div className="container">
          <PageHelp
            title="Comment lire cette page ?"
            points={[
              "Le bandeau en haut présente le titre officiel du texte et, lorsque disponible, son type (projet/proposition) et son origine.",
              "La section « Scrutins associés » liste les votes de l’Assemblée nationale concernant ce texte.",
              "Vous pouvez ouvrir chaque scrutin pour voir le détail des résultats et le vote des députés.",
            ]}
          />

          {loading && (
            <div className={styles.loading}>Chargement du texte...</div>
          )}

          {error && !loading && (
            <div className={styles.error}>
              <p>Erreur: {error}</p>
            </div>
          )}

          {!loading && !error && bill && (
            <>
              {bill.official_url && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Texte officiel</h2>
                  <a
                    href={bill.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sourceLink}
                  >
                    Consulter le texte sur assemblee-nationale.fr →
                  </a>
                </section>
              )}

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Scrutins associés</h2>
                {bill.scrutins.length === 0 ? (
                  <div className={styles.empty}>
                    <p>Aucun scrutin n&apos;est encore associé à ce texte.</p>
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
                            {scrutin.sort_code === "adopté"
                              ? "Adopté"
                              : "Rejeté"}
                          </span>
                          <span className={styles.scrutinMeta}>
                            {formatDate(scrutin.date_scrutin)} · Scrutin n°
                            {scrutin.numero}
                          </span>
                        </div>
                        <div className={styles.scrutinTitle}>
                          {scrutin.titre}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
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

