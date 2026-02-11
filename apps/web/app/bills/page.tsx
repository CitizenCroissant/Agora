"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BillSummary, formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";
import styles from "./bills.module.css";
import { PageHelp } from "@/components/PageHelp";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function BillsPage() {
  const [bills, setBills] = useState<BillSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [onlyWithVotes, setOnlyWithVotes] = useState<boolean>(false);

  useEffect(() => {
    void loadBills();
  }, []);

  const loadBills = async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = await apiClient.getBills(
        search && search.trim().length >= 2 ? { q: search.trim() } : undefined,
      );
      setBills(results);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger les textes",
      );
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void loadBills(query);
  };

  const resetFilters = () => {
    setQuery("");
    setTypeFilter("all");
    setOnlyWithVotes(false);
    void loadBills();
  };

  const availableTypes = useMemo(
    () =>
      Array.from(
        new Set(
          bills
            .map((b) => b.type)
            .filter((t): t is string => typeof t === "string" && t.length > 0),
        ),
      ),
    [bills],
  );

  const filteredBills = useMemo(
    () =>
      bills.filter((bill) => {
        if (onlyWithVotes && (!bill.scrutins_count || bill.scrutins_count <= 0)) {
          return false;
        }
        if (typeFilter !== "all" && bill.type !== typeFilter) {
          return false;
        }
        return true;
      }),
    [bills, onlyWithVotes, typeFilter],
  );

  const billsWithVotes = useMemo(
    () => filteredBills.filter((b) => b.scrutins_count && b.scrutins_count > 0),
    [filteredBills],
  );

  const billsWithoutVotes = useMemo(
    () => filteredBills.filter((b) => !b.scrutins_count || b.scrutins_count <= 0),
    [filteredBills],
  );

  const totalBills = bills.length;
  const totalWithVotes = bills.filter(
    (b) => b.scrutins_count && b.scrutins_count > 0,
  ).length;
  const latestScrutinDate = bills
    .map((b) => b.latest_scrutin_date)
    .filter((d): d is string => typeof d === "string")
    .sort()
    .at(-1);

  const formatTypeLabel = (type?: string | null) => {
    if (!type) return null;
    if (type === "projet_de_loi") return "Projet de loi";
    if (type === "proposition_de_loi") return "Proposition de loi";
    if (type === "resolution") return "Résolution";
    return type;
  };

  const formatOriginLabel = (origin?: string | null) => {
    if (!origin) return null;
    if (origin === "gouvernement") return "Gouvernement";
    if (origin === "parlementaire") return "Parlementaire";
    return origin;
  };

  return (
    <div className="container">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Textes législatifs" }]} />
          <PageHelp
            title="Comment lire cette page ?"
            points={[
              "Chaque carte correspond à un texte législatif (projet ou proposition de loi).",
              "Vous pouvez filtrer la liste en recherchant par mots-clés dans le titre du texte.",
              "Le filtre “Avec votes uniquement” permet d’afficher seulement les textes qui ont donné lieu à au moins un scrutin.",
            ]}
          />

          <section className={styles.controlBar}>
            <form className={styles.searchForm} onSubmit={handleSubmit}>
              <input
                type="search"
                className={styles.searchInput}
                placeholder="Rechercher un texte (min. 2 caractères)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Rechercher un texte législatif"
              />
            </form>

            {availableTypes.length > 0 && (
              <div className={styles.typeFilter}>
                <select
                  className={styles.typeSelect}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  aria-label="Filtrer par type de texte"
                >
                  <option value="all">Tous les types</option>
                  {availableTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              className={`${styles.votesToggle} ${
                onlyWithVotes ? styles.votesToggleActive : ""
              }`}
              onClick={() => setOnlyWithVotes((v) => !v)}
            >
              {onlyWithVotes ? "Avec votes uniquement" : "Inclure les textes sans vote"}
            </button>
          </section>

          {!loading && !error && totalBills > 0 && (
            <section className={styles.statsBar} aria-label="Statistiques des textes">
              <span>
                <strong>{totalBills}</strong> texte(s)
              </span>
              <span>
                <strong>{totalWithVotes}</strong> avec au moins un scrutin
              </span>
              {latestScrutinDate && (
                <span>
                  Dernier scrutin le <strong>{formatDate(latestScrutinDate)}</strong>
                </span>
              )}
            </section>
          )}

          {loading && (
            <div className={styles.loading}>Chargement des textes...</div>
          )}

          {error && !loading && (
            <div className={styles.error}>
              <p>Erreur: {error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {filteredBills.length === 0 ? (
                <section className={styles.list}>
                  <div className={styles.empty}>
                    <p>Aucun texte trouvé pour ces critères.</p>
                    <button
                      type="button"
                      className={styles.resetButton}
                      onClick={resetFilters}
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                </section>
              ) : (
                <>
                  {billsWithVotes.length > 0 && (
                    <section className={styles.list}>
                      <h2 className={styles.sectionTitle}>Textes avec votes récents</h2>
                      {billsWithVotes.map((bill) => (
                        <Link
                          key={bill.id}
                          href={`/bills/${bill.id}`}
                          className={styles.card}
                        >
                          <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>
                              {bill.short_title || bill.title}
                            </h2>
                          </div>
                          <div className={styles.pillRow}>
                            {formatTypeLabel(bill.type) && (
                              <span className={styles.typePill}>
                                {formatTypeLabel(bill.type)}
                              </span>
                            )}
                            {formatOriginLabel(bill.origin) && (
                              <span className={styles.typePill}>
                                {formatOriginLabel(bill.origin)}
                              </span>
                            )}
                            {bill.scrutins_count && bill.scrutins_count > 0 && (
                              <span className={styles.typePill}>
                                {bill.scrutins_count} scrutin(s)
                              </span>
                            )}
                          </div>
                          <p className={styles.meta}>
                            {bill.latest_scrutin_date ? (
                              <>
                                Dernier scrutin le{" "}
                                {formatDate(bill.latest_scrutin_date)}
                              </>
                            ) : (
                              "Au moins un scrutin associé"
                            )}
                          </p>
                        </Link>
                      ))}
                    </section>
                  )}

                  {billsWithoutVotes.length > 0 && !onlyWithVotes && (
                    <section className={styles.list}>
                      <h2 className={styles.sectionTitle}>Textes sans scrutin</h2>
                      {billsWithoutVotes.map((bill) => (
                        <Link
                          key={bill.id}
                          href={`/bills/${bill.id}`}
                          className={styles.card}
                        >
                          <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>
                              {bill.short_title || bill.title}
                            </h2>
                          </div>
                          <div className={styles.pillRow}>
                            {formatTypeLabel(bill.type) && (
                              <span className={styles.typePill}>
                                {formatTypeLabel(bill.type)}
                              </span>
                            )}
                            {formatOriginLabel(bill.origin) && (
                              <span className={styles.typePill}>
                                {formatOriginLabel(bill.origin)}
                              </span>
                            )}
                          </div>
                          <p className={styles.meta}>
                            Aucun scrutin associé pour le moment
                          </p>
                        </Link>
                      ))}
                    </section>
                  )}
                </>
              )}
            </>
          )}
    </div>
  );
}

