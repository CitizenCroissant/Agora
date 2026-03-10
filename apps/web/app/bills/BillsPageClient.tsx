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
const BILLS_PAGE_SIZE = 50;

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
  { slug: "action-publique", label: "Action publique" }
];

export default function BillsPageClient() {
  const searchParams = useSearchParams();
  const initialTag = searchParams.get("tag");
  const initialQuery = searchParams.get("q") ?? "";

  const [bills, setBills] = useState<BillSummary[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>(initialQuery);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [onlyWithVotes, setOnlyWithVotes] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(initialTag);

  const billsLength = (bills ?? []).length;
  const loadBills = useCallback(
    async (options?: {
      search?: string;
      hasVotes?: boolean;
      tag?: string | null;
      append?: boolean;
    }) => {
      const append = options?.append === true;
      if (!append) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      try {
        const params: {
          q?: string;
          tag?: string;
          has_votes?: boolean;
          limit?: number;
          offset?: number;
        } = { limit: BILLS_PAGE_SIZE };
        const search = options?.search;
        if (search && search.trim().length >= 2) {
          params.q = search.trim();
        }
        const tagParam = options?.tag !== undefined ? options.tag : selectedTag;
        if (tagParam) {
          params.tag = tagParam;
        }
        const hasVotes = options?.hasVotes ?? onlyWithVotes;
        if (hasVotes) {
          params.has_votes = true;
        }
        if (append) {
          params.offset = billsLength;
        } else {
          params.offset = 0;
        }
        const data = await apiClient.getBills(params);
        const nextBills = data.bills ?? [];
        if (append) {
          setBills((prev) => [...(prev ?? []), ...nextBills]);
        } else {
          setBills(nextBills);
        }
        setHasMore(data.has_more ?? false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Impossible de charger les dossiers"
        );
        if (!append) setBills([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedTag, onlyWithVotes, billsLength]
  );

  const loadMore = useCallback(() => {
    void loadBills({ search: query, hasVotes: onlyWithVotes, append: true });
  }, [loadBills, query, onlyWithVotes]);

  // Initial load and re-fetch when votes toggle or tag changes (single effect to avoid double fetch on mount)
  useEffect(() => {
    void loadBills({ search: query, hasVotes: onlyWithVotes });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyWithVotes, selectedTag]);

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
            .filter((t): t is string => typeof t === "string" && t.length > 0)
        )
      ),
    [bills]
  );

  const filteredBills = useMemo(
    () =>
      bills.filter((bill) => {
        if (typeFilter !== "all" && bill.type !== typeFilter) {
          return false;
        }
        return true;
      }),
    [bills, typeFilter]
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
    [filteredBills]
  );

  const billsWithoutVotes = useMemo(
    () =>
      filteredBills
        .filter((b) => !b.scrutins_count || b.scrutins_count <= 0),
    [filteredBills]
  );

  // Stats: when "only with votes" is on, displayed count is billsWithVotes only
  const totalDisplayed = onlyWithVotes ? billsWithVotes.length : filteredBills.length;
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
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Dossiers législatifs" }]} />
      <PageHelp
        title="Comment lire cette page ?"
        points={[
          "Chaque carte correspond à un dossier législatif (projet ou proposition de loi).",
          "Vous pouvez filtrer la liste en recherchant par mots-clés dans le titre du dossier.",
          "Le filtre « Avec votes uniquement » permet d'afficher seulement les dossiers qui ont donné lieu à au moins un scrutin."
        ]}
      />

      <section className="controlBar">
        <form className={styles.searchForm} onSubmit={handleSubmit}>
          <input
            type="search"
            className="searchInput"
            placeholder="Rechercher un dossier (min. 2 caractères)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Rechercher un dossier législatif"
          />
        </form>

        {availableTypes.length > 0 && (
          <div className={styles.typeFilter}>
            <select
              className={styles.typeSelect}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filtrer par type de dossier"
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
          {onlyWithVotes ? "Avec votes uniquement" : "Inclure les dossiers sans vote"}
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
        <section className={styles.statsBar} aria-label="Statistiques des dossiers">
          <span>
            <strong>{totalDisplayed}</strong> dossier(s)
          </span>
          {totalWithVotes > 0 && !onlyWithVotes && (
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
        <div className="stateLoading">Chargement des dossiers...</div>
      )}

      {error && !loading && (
        <div className="stateError">
          <p>Erreur: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {filteredBills.length === 0 || (onlyWithVotes && billsWithVotes.length === 0) ? (
            <section className={styles.list}>
              <div className="stateEmpty">
                <p>
                  {onlyWithVotes && filteredBills.length > 0
                    ? "Aucun dossier avec scrutin pour ces critères."
                    : "Aucun dossier trouvé pour ces critères."}
                </p>
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
                  <h2 className={styles.sectionTitle}>Dossiers avec votes récents</h2>
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
                  <h2 className={styles.sectionTitle}>Dossiers sans scrutin</h2>
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

              {hasMore && (
                <section className={styles.loadMoreSection}>
                  <button
                    type="button"
                    className={styles.loadMoreButton}
                    onClick={loadMore}
                    disabled={loadingMore}
                    aria-busy={loadingMore}
                  >
                    {loadingMore
                      ? "Chargement…"
                      : "Afficher plus de dossiers"}
                  </button>
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

