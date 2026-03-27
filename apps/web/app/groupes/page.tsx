"use client";

import { useEffect, useState } from "react";
import type { PoliticalGroupSummary } from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./groupes.module.css";
import { Breadcrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";

/** Palette of accent colors for group cards (Civic Warmth) */
const ACCENT_COLORS = [
  "#1E3A5F" /* deep navy */,
  "#2BA89E" /* teal */,
  "#E85D3A" /* coral */,
  "#7B5EA7" /* plum */,
  "#F0A030" /* amber */,
  "#2E8B57" /* sea green */,
  "#4A7FA5" /* muted blue */,
  "#C0603A" /* burnt orange */
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
    <div className="container">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Groupes politiques" }]} />

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          Groupes <span>politiques</span>
        </h1>
        <p className={styles.pageSubtitle}>
          Les groupes politiques de l&apos;Assemblée nationale et leurs membres.
        </p>
      </div>

          {loading && (
            <div className="stateLoading">
              Chargement des groupes politiques...
            </div>
          )}

          {error && (
            <div className="stateError">
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
                <EmptyState
                  variant="groups"
                  message="Aucun groupe politique trouvé. Réingérez les députés pour remplir les groupes."
                />
              ) : (
                <ul className={`${styles.groupList} staggerChildren`}>
                  {groups.map((g) => (
                    <li key={g.slug}>
                      <Link
                        href={`/groupes/${encodeURIComponent(g.slug)}`}
                        className={styles.groupCard}
                        style={
                          {
                            "--group-accent": accentForSlug(g.slug)
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
  );
}
