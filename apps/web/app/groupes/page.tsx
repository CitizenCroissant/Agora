"use client";

import { useEffect, useState } from "react";
import type { PoliticalGroupSummary } from "@agora/shared";
import { createApiClient } from "@agora/shared";
import { Config } from "@/lib/config";
import Link from "next/link";
import styles from "./groupes.module.css";

const apiClient = createApiClient(Config.API_URL);

/** Palette of accent colors for group cards (Assemblée-inspired) */
const ACCENT_COLORS = [
  "#0055a4" /* primary blue */,
  "#0d7377",
  "#7d4e57",
  "#2d6a4f",
  "#9b5de5",
  "#00b4d8",
  "#e63946",
  "#f4a261",
];

function accentForSlug(slug: string): string {
  let n = 0;
  for (let i = 0; i < slug.length; i++) n += slug.charCodeAt(i);
  return ACCENT_COLORS[n % ACCENT_COLORS.length];
}

export default function GroupesPage() {
  const [groups, setGroups] = useState<PoliticalGroupSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getPoliticalGroups();
      setGroups(data.groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <Link href="/" className={styles.backLink}>
            ← Retour à l&apos;accueil
          </Link>
          <h1 className={styles.title}>Groupes politiques</h1>
          <p className={styles.subtitle}>
            Liste des groupes politiques de l&apos;Assemblée nationale
          </p>
        </div>
      </header>

      <main className={styles.main}>
        <div className="container">
          {loading && (
            <div className={styles.loading}>
              Chargement des groupes politiques...
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>Erreur : {error}</p>
              <p className={styles.errorHint}>
                Vérifiez que l&apos;API est disponible et que les députés ont
                été ingérés (avec groupe_politique renseigné).
              </p>
            </div>
          )}

          {!loading && !error && (
            <>
              {groups.length === 0 ? (
                <p className={styles.loading}>
                  Aucun groupe politique trouvé. Réingérez les députés pour
                  remplir les groupes.
                </p>
              ) : (
                <ul className={styles.groupList}>
                  {groups.map((g) => (
                    <li key={g.slug}>
                      <Link
                        href={`/groupes/${encodeURIComponent(g.slug)}`}
                        className={styles.groupCard}
                        style={
                          {
                            "--group-accent": accentForSlug(g.slug),
                          } as React.CSSProperties
                        }
                      >
                        <span className={styles.groupCardAccent} aria-hidden />
                        <span className={styles.groupCardBody}>
                          <span className={styles.groupCardLabel}>
                            {g.label}
                          </span>
                          <span className={styles.groupCardCount}>
                            {g.deputy_count} député
                            {g.deputy_count !== 1 ? "s" : ""}
                          </span>
                        </span>
                        <span className={styles.groupCardArrow} aria-hidden>
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
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
