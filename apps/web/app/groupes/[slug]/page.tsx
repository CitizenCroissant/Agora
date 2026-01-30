"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { PoliticalGroupDetail } from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./group.module.css";

export default function GroupPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [group, setGroup] = useState<PoliticalGroupDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadGroup(slug);
    }
  }, [slug]);

  const loadGroup = async (s: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getPoliticalGroup(s);
      setGroup(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Groupe introuvable");
      setGroup(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <Link href="/groupes" className={styles.backLink}>
            ← Retour aux groupes politiques
          </Link>
          <h1 className={styles.title}>
            {group ? group.label : loading ? "…" : slug || "Groupe"}
          </h1>
          <p className={styles.subtitle}>
            Groupe politique de l&apos;Assemblée nationale
          </p>
        </div>
      </header>

      <main className={styles.main}>
        <div className="container">
          {loading && (
            <div className={styles.loading}>Chargement du groupe...</div>
          )}

          {error && (
            <div className={styles.error}>
              <p>Erreur : {error}</p>
              <p className={styles.errorHint}>
                Ce groupe n&apos;existe peut-être pas ou l&apos;API est
                indisponible.
              </p>
            </div>
          )}

          {!loading && !error && group && (
            <>
              <div className={styles.summary}>
                <span className={styles.summaryCount}>
                  {group.deputy_count}
                </span>
                <span className={styles.summaryLabel}>
                  député{group.deputy_count !== 1 ? "s" : ""} dans ce groupe
                </span>
              </div>

              <h2 className={styles.sectionTitle}>Députés</h2>
              <ul className={styles.deputyList}>
                {group.deputies.map((d) => (
                  <li key={d.acteur_ref}>
                    <Link
                      href={`/deputy/${encodeURIComponent(d.acteur_ref)}`}
                      className={styles.deputyCard}
                    >
                      <span className={styles.deputyCardBody}>
                        <span className={styles.deputyName}>
                          {d.civil_prenom} {d.civil_nom}
                        </span>
                        {(d.circonscription || d.departement) && (
                          <span className={styles.deputyMeta}>
                            {[d.circonscription, d.departement]
                              .filter(Boolean)
                              .join(" — ")}
                          </span>
                        )}
                      </span>
                      <span
                        className={styles.deputyRef}
                        title="Référence acteur"
                      >
                        {d.acteur_ref}
                      </span>
                      <span className={styles.deputyCardArrow} aria-hidden>
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
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
