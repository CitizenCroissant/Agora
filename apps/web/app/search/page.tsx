"use client";

import { useState, useCallback } from "react";
import type { SearchResponse } from "@agora/shared";
import { formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./search.module.css";
import { Breadcrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import skeletonStyles from "@/components/Skeleton.module.css";

function SearchSkeleton() {
  const sections = [
    { label: "Scrutins", cards: 4 },
    { label: "Députés", cards: 3 },
    { label: "Groupes politiques", cards: 2 }
  ];
  return (
    <div aria-busy="true" aria-label="Recherche en cours">
      {sections.map(({ label, cards }) => (
        <section key={label} style={{ marginBottom: "var(--spacing-xl)" }}>
          <Skeleton shape="heading" width={label === "Scrutins" ? 90 : label === "Députés" ? 75 : 170} height={20} style={{ marginBottom: 12 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Array.from({ length: cards }, (_, i) => (
              <div key={i} className={skeletonStyles.card}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  {label === "Scrutins" && <Skeleton shape="pill" width={60} height={22} />}
                  <Skeleton shape="heading" width={`${55 + i * 7}%`} height={16} />
                </div>
                <Skeleton shape="text" width="35%" height={13} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults(null);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await apiClient.search(trimmed, "all");
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recherche impossible");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (e.target.value.trim().length < 2) {
      setResults(null);
      setSearched(false);
    }
  };

  const hasResults =
    results &&
    (results.scrutins.length > 0 ||
      results.deputies.length > 0 ||
      results.groups.length > 0);
  const emptyAfterSearch = searched && !loading && results && !hasResults;

  return (
    <div className="container">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Recherche" }]} />

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          Recherche <span>globale</span>
        </h1>
        <p className={styles.pageSubtitle}>
          Recherchez des scrutins, des députés ou des groupes politiques.
        </p>
      </div>

          <form onSubmit={handleSubmit} className={styles.searchForm}>
            <input
              type="search"
              className="searchInput"
              placeholder="Rechercher (min. 2 caractères)..."
              value={query}
              onChange={handleInputChange}
              aria-label="Recherche"
              autoFocus
            />
            <button type="submit" className={styles.searchButton}>
              Rechercher
            </button>
          </form>

          {loading && <SearchSkeleton />}

          {error && (
            <div className="stateError">
              <p>Erreur : {error}</p>
            </div>
          )}

          {emptyAfterSearch && (
            <EmptyState
              variant="search"
              title={`Aucun résultat pour « ${results.q} »`}
              message="Essayez d'autres mots-clés ou vérifiez l'orthographe."
            />
          )}

          {!loading && hasResults && results && (
            <div className={styles.results}>
              {results.scrutins.length > 0 && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Scrutins</h2>
                  <ul className={`${styles.list} staggerChildren`}>
                    {results.scrutins.map((s) => (
                      <li key={s.id}>
                        <Link href={`/votes/${s.id}`} className={styles.card}>
                          <span
                            className={
                              s.sort_code === "adopté"
                                ? styles.badgeAdopte
                                : styles.badgeRejete
                            }
                          >
                            {s.sort_code === "adopté" ? "Adopté" : "Rejeté"}
                          </span>
                          <span className={styles.cardTitle}>{s.titre}</span>
                          <span className={styles.cardMeta}>
                            {formatDate(s.date_scrutin)} · n°{s.numero}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {results.deputies.length > 0 && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Députés</h2>
                  <ul className={`${styles.list} staggerChildren`}>
                    {results.deputies.map((d) => (
                      <li key={d.acteur_ref}>
                        <Link
                          href={`/deputy/${encodeURIComponent(d.acteur_ref)}`}
                          className={styles.card}
                        >
                          <span className={styles.cardTitle}>
                            {d.civil_prenom} {d.civil_nom}
                          </span>
                          {(d.groupe_politique || d.circonscription) && (
                            <span className={styles.cardMeta}>
                              {[d.groupe_politique, d.circonscription]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {results.groups.length > 0 && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Groupes politiques</h2>
                  <ul className={styles.list}>
                    {results.groups.map((g) => (
                      <li key={g.slug}>
                        <Link
                          href={`/groupes/${encodeURIComponent(g.slug)}`}
                          className={styles.card}
                        >
                          <span className={styles.cardTitle}>{g.label}</span>
                          <span className={styles.cardMeta}>
                            {g.deputy_count} député
                            {g.deputy_count !== 1 ? "s" : ""}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
    </div>
  );
}
