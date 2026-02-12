"use client";

import { useState, useCallback } from "react";
import type { SearchResponse } from "@agora/shared";
import { formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./search.module.css";
import { Breadcrumb } from "@/components/Breadcrumb";

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

          {loading && (
            <div className="stateLoading">Recherche en cours...</div>
          )}

          {error && (
            <div className="stateError">
              <p>Erreur : {error}</p>
            </div>
          )}

          {emptyAfterSearch && (
            <p className="stateEmpty">
              Aucun résultat pour &quot;{results.q}&quot;.
            </p>
          )}

          {!loading && hasResults && results && (
            <div className={styles.results}>
              {results.scrutins.length > 0 && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Scrutins</h2>
                  <ul className={styles.list}>
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
                  <ul className={styles.list}>
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
