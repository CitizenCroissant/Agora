"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BillSummary, formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";
import styles from "./bills.module.css";
import { PageHelp } from "@/components/PageHelp";
import { Breadcrumb } from "@/components/Breadcrumb";

// Available thematic tags (could be fetched from API in the future)
const THEMATIC_TAGS = [
  { slug: "sante", label: "Santé" },
  { slug: "economie", label: "Économie" },
  { slug: "education", label: "Éducation" },
  { slug: "environnement", label: "Environnement" },
  { slug: "justice", label: "Justice" },
  { slug: "interieur", label: "Intérieur" },
  { slug: "europe", label: "Europe" },
  { slug: "culture", label: "Culture" },
  { slug: "travail", label: "Travail" },
  { slug: "transport", label: "Transports" },
  { slug: "logement", label: "Logement" },
  { slug: "agriculture", label: "Agriculture" },
  { slug: "autonomie", label: "Autonomie" },
  { slug: "commerce", label: "Commerce" },
  { slug: "amenagement", label: "Aménagement" },
  { slug: "action-publique", label: "Action publique" },
];

export default function BillsPageClient() {
  const searchParams = useSearchParams();
  const initialTag = searchParams.get("tag");

  const [bills, setBills] = useState<BillSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [onlyWithVotes, setOnlyWithVotes] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(initialTag);

  const loadBills = useCallback(
    async (options?: { search?: string; hasVotes?: boolean; tag?: string | null }) => {
      setLoading(true);
      setError(null);
      try {
        const params: { q?: string; tag?: string } = {};
        const search = options?.search;
        if (search && search.trim().length >= 2) {
          params.q = search.trim();
        }
        const tagParam = options?.tag !== undefined ? options.tag : selectedTag;
        if (tagParam) {
          params.tag = tagParam;
        }
        const results = await apiClient.getBills(
          Object.keys(params).length > 0 ? params : undefined,
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
    },
    [selectedTag],
  );

  // Re-fetch from API whenever the votes toggle or tag changes
  useEffect(() => {
    void loadBills({ search: query, hasVotes: onlyWithVotes });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyWithVotes, selectedTag]);

  // Initial load
  useEffect(() => {
    void loadBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void loadBills({ search: query, hasVotes: onlyWithVotes });
  };

  const resetFilters = () => {
    setQuery("");
    setTypeFilter("all");
    setOnlyWithVotes(false);
    setSelectedTag(null);
    void loadBills({ tag: null });
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
        if (typeFilter !== "all" && bill.type !== typeFilter) {
          return false;
        }
        return true;
      }),
    [bills, typeFilter],
  );

  const billsWithVotes = useMemo(
    () =>
      filteredBills
        .filter((b) => b.scrutins_count && b.scrutins_count > 0)
        .sort((a, b) => {
          // Sort by latest scrutin date descending (most recent vote first)
          const da = a.latest_scrutin_date ?? "";
          const db = b.latest_scrutin_date ?? "";
          if (da !== db) return db.localeCompare(da);
          // Tie-break: more scrutins first
          return (b.scrutins_count ?? 0) - (a.scrutins_count ?? 0);
        }),
    [filteredBills],
  );

  const billsWithoutVotes = useMemo(
    () =>
      filteredBills
        .filter((b) => !b.scrutins_count || b.scrutins_count <= 0),
    [filteredBills],
  );

  // Stats derived from the current (filtered) result set
  const totalDisplayed = filteredBills.length;
  const totalWithVotes = billsWithVotes.length;
  const latestScrutinDate = filteredBills
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
          "Le filtre « Avec votes uniquement » permet d'afficher seulement les textes qui ont donné lieu à au moins un scrutin.",
        ]}
      />

      <section className="controlBar">
        <form className={styles.searchForm} onSubmit={handleSubmit}>
          <input
            type="search"
            className="searchInput"
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

        <div className={styles.tagFilter}>
          <select
            className={styles.tagSelect}
            value={selectedTag || ""}
            onChange={(e) => {
              const newTag = e.target.value || null;
              setSelectedTag(newTag);
            }}
            aria-label="Filtrer par thème"
          >
            <option value="">Tous les thèmes</option>
            {THEMATIC_TAGS.map((tag) => (
              <option key={tag.slug} value={tag.slug}>
                {tag.label}
              </option>
            ))}
          </select>
          {selectedTag && (
            <button
              type="button"
              className={styles.clearTagButton}
              onClick={() => setSelectedTag(null)}
              aria-label="Effacer le filtre thématique"
              title="Effacer le filtre thématique"
            >
              ×
            </button>
          )}
        </div>
      </section>

      {!loading && !error && totalDisplayed > 0 && (
        <section className={styles.statsBar} aria-label="Statistiques des textes">
          <span>
            <strong>{totalDisplayed}</strong> texte(s)
          </span>
          {totalWithVotes > 0 && (
            <span>
              <strong>{totalWithVotes}</strong> avec au moins un scrutin
            </span>
          )}
          {latestScrutinDate && (
            <span>
              Dernier scrutin le <strong>{formatDate(latestScrutinDate)}</strong>
            </span>
          )}
        </section>
      )}

      {loading && (
        <div className="stateLoading">Chargement des textes...</div>
      )}

      {error && !loading && (
        <div className="stateError">
          <p>Erreur: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {filteredBills.length === 0 ? (
            <section className={styles.list}>
              <div className="stateEmpty">
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
                      {bill.tags && bill.tags.length > 0 && (
                        <div className={styles.billTags}>
                          {bill.tags.map((tag) => (
                            <span key={tag.id} className={styles.tag} title={tag.label}>
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      )}
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
                      {bill.tags && bill.tags.length > 0 && (
                        <div className={styles.billTags}>
                          {bill.tags.map((tag) => (
                            <span key={tag.id} className={styles.tag} title={tag.label}>
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      )}
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

