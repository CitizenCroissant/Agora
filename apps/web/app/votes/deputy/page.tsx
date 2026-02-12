"use client";

import { useState, useRef, useCallback } from "react";
import { Deputy } from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./deputy.module.css";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function DeputyVotesPage() {
  const [query, setQuery] = useState("");
  const [deputies, setDeputies] = useState<Deputy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchDeputies = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setDeputies([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const result = await apiClient.search(trimmed, "deputies");
      setDeputies(result.deputies);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la recherche"
      );
      setDeputies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchDeputies(value);
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    searchDeputies(query);
  };

  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Scrutins", href: "/votes" },
          { label: "Vote d'un député" }
        ]}
      />
      <form onSubmit={handleSubmit} className={styles.form}>
        <label htmlFor="deputy-search" className={styles.label}>
          Rechercher un député par nom
        </label>
        <div className={styles.inputRow}>
          <input
            id="deputy-search"
            type="text"
            className={styles.input}
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Ex : Dupont, Marie..."
            autoComplete="off"
          />
          <button
            type="submit"
            className={styles.button}
            disabled={loading || query.trim().length < 2}
          >
            {loading ? "Recherche\u2026" : "Rechercher"}
          </button>
        </div>
        <p className={styles.hint}>
          Saisissez au moins 2 caractères pour lancer la recherche.
        </p>
      </form>

      {error && (
        <div className="stateError">
          <p>Erreur : {error}</p>
        </div>
      )}

      {searched && !loading && deputies.length === 0 && !error && (
        <p className="stateEmpty">
          Aucun député trouvé pour &laquo;&nbsp;{query.trim()}&nbsp;&raquo;.
        </p>
      )}

      {deputies.length > 0 && (
        <div className={styles.result}>
          <h2 className={styles.resultTitle}>
            {deputies.length} député{deputies.length > 1 ? "s" : ""} trouvé
            {deputies.length > 1 ? "s" : ""}
          </h2>
          <ul className={styles.deputyList}>
            {deputies.map((d) => (
              <li key={d.acteur_ref} className={styles.deputyItem}>
                <Link
                  href={`/votes/deputy/${encodeURIComponent(d.acteur_ref)}`}
                  className={styles.deputyLink}
                >
                  <span className={styles.deputyName}>
                    {d.civil_prenom} {d.civil_nom}
                  </span>
                  {d.groupe_politique && (
                    <span className={styles.deputyGroup}>
                      {d.groupe_politique}
                    </span>
                  )}
                  {d.circonscription && (
                    <span className={styles.deputyCirco}>
                      {d.circonscription}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
