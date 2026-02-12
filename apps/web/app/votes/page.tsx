"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ScrutinsResponse, Scrutin } from "@agora/shared";
import type { PoliticalGroupSummary } from "@agora/shared";
import {
  getTodayDate,
  formatDate,
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
  addWeeks,
  addMonths,
  formatDateRange,
  formatMonth,
} from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./votes.module.css";
import { PageHelp } from "@/components/PageHelp";
import { Breadcrumb } from "@/components/Breadcrumb";

type GroupPosition = "pour" | "contre" | "abstention";

type ViewMode = "week" | "month";
type SortFilter = "all" | "adopté" | "rejeté";

// Available thematic tags (could be fetched from API in the future)
const THEMATIC_TAGS = [
  { slug: "sante", label: "Santé" },
  { slug: "economie", label: "Économie" },
  { slug: "education", label: "Éducation" },
  { slug: "environnement", label: "Environnement" },
  { slug: "travail", label: "Travail" },
  { slug: "logement", label: "Logement" },
  { slug: "justice", label: "Justice" },
  { slug: "agriculture", label: "Agriculture" },
  { slug: "transport", label: "Transports" },
  { slug: "culture", label: "Culture" },
  { slug: "interieur", label: "Intérieur" },
  { slug: "europe", label: "Europe" },
  { slug: "action-publique", label: "Action publique" },
  { slug: "amenagement", label: "Aménagement" },
  { slug: "autonomie", label: "Autonomie" },
  { slug: "commerce", label: "Commerce" },
];

function groupScrutinsByDate(scrutins: Scrutin[]): Map<string, Scrutin[]> {
  const map = new Map<string, Scrutin[]>();
  for (const s of scrutins) {
    const d = s.date_scrutin;
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(s);
  }
  return map;
}

function VotesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tagFromUrl = searchParams.get("tag");
  const groupFromUrl = searchParams.get("group");
  const groupPositionFromUrl = searchParams.get("group_position") as GroupPosition | null;

  const [data, setData] = useState<ScrutinsResponse | null>(null);
  const [searchResults, setSearchResults] = useState<Scrutin[] | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("q") ?? "",
  );
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [sortFilter, setSortFilter] = useState<SortFilter>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(tagFromUrl);
  const [groupSlug, setGroupSlug] = useState<string | null>(groupFromUrl);
  const [groupPosition, setGroupPosition] = useState<GroupPosition | "">(
    groupPositionFromUrl && ["pour", "contre", "abstention"].includes(groupPositionFromUrl)
      ? groupPositionFromUrl
      : "",
  );
  const [politicalGroups, setPoliticalGroups] = useState<PoliticalGroupSummary[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(getTodayDate());
  const [dateInput, setDateInput] = useState<string>(getTodayDate());

  // Fetch political groups once
  useEffect(() => {
    apiClient.getPoliticalGroups().then((r) => setPoliticalGroups(r.groups)).catch(() => {});
  }, []);

  // Keep state in sync with URL (e.g. back/forward, shared link, ?date=)
  useEffect(() => {
    setSelectedTag(searchParams.get("tag"));
    setGroupSlug(searchParams.get("group"));
    const pos = searchParams.get("group_position");
    setGroupPosition(
      pos && ["pour", "contre", "abstention"].includes(pos) ? (pos as GroupPosition) : ""
    );
    const dateParam = searchParams.get("date");
    if (dateParam && dateParam.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setCurrentDate(dateParam);
      setDateInput(dateParam);
    }
  }, [searchParams]);

  useEffect(() => {
    loadScrutins();
  }, [viewMode, currentDate, selectedTag, searchQuery, groupSlug, groupPosition]);

  const loadScrutins = async () => {
    setLoading(true);
    setError(null);
    try {
      const trimmedQuery = searchQuery.trim();

      if (trimmedQuery.length >= 2) {
        // Keyword search mode using /search endpoint
        const searchResponse = await apiClient.search(trimmedQuery, "scrutins", {
          group: groupSlug || undefined,
          group_position: groupPosition || undefined,
        });
        setSearchResults(searchResponse.scrutins);
        setData(null);
      } else {
        // Default mode: date range (week/month) + optional thematic tag + optional group filter
        const from =
          viewMode === "week"
            ? getWeekStart(currentDate)
            : getMonthStart(currentDate);
        const to =
          viewMode === "week"
            ? getWeekEnd(currentDate)
            : getMonthEnd(currentDate);
        const result = await apiClient.getScrutins(
          from,
          to,
          selectedTag || undefined,
          groupSlug || undefined,
          groupPosition || undefined,
        );
        setData(result);
        setSearchResults(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scrutins");
      setData(null);
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, -1));
    } else {
      setCurrentDate(addMonths(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    const today = getTodayDate();
    setCurrentDate(today);
    setDateInput(today);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDateInput(newDate);
    if (newDate && newDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setCurrentDate(newDate);
    }
  };

  const getPeriodLabel = () => {
    if (viewMode === "week") {
      const from = getWeekStart(currentDate);
      const to = getWeekEnd(currentDate);
      return formatDateRange(from, to);
    }
    return formatMonth(currentDate);
  };

  const baseScrutins =
    (searchResults ?? data?.scrutins) &&
    (searchResults ?? data?.scrutins)!.length > 0
      ? (searchResults ?? data?.scrutins)!
      : [];

  const availableTypes = Array.from(
    new Set(
      baseScrutins
        .map((s) => s.type_vote_libelle)
        .filter((t): t is string => Boolean(t)),
    ),
  );

  const filteredScrutins =
    baseScrutins.filter((s) => {
      if (sortFilter === "all") return true;
      if (s.sort_code !== sortFilter) return false;
      if (typeFilter !== "all") {
        return s.type_vote_libelle === typeFilter;
      }
      return true;
    }) ?? [];

  const byDate =
    filteredScrutins.length > 0
      ? groupScrutinsByDate(filteredScrutins)
      : new Map<string, Scrutin[]>();
  const sortedDates = Array.from(byDate.keys()).sort((a, b) =>
    b.localeCompare(a),
  );

  return (
    <div className="container">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Scrutins" }]} />
          <PageHelp
            title="Comment lire cette page ?"
            points={[
              "Chaque carte correspond à un scrutin (vote public) sur un texte ou un article.",
              "Utilisez la barre de recherche pour retrouver un scrutin par mots-clés (objet, texte, etc.).",
              "Les filtres permettent de restreindre la période, le type de vote, le résultat (adopté ou rejeté) et les thèmes.",
              "Filtre avancé : choisissez un groupe politique pour n'afficher que les scrutins où ce groupe a voté, et optionnellement où sa position majoritaire est « pour », « contre » ou « abstention ».",
            ]}
            collapsible
            defaultClosed
          />

          <div className={`controlBar ${styles.controlBar}`}>
            <div className={styles.controlBarTop}>
              <div className={styles.leftControls}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={handlePrevious}
                  aria-label="Période précédente"
                  title="Période précédente"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={handleNext}
                  aria-label="Période suivante"
                  title="Période suivante"
                >
                  ›
                </button>
                <button
                  type="button"
                  className={styles.todayButton}
                  onClick={handleToday}
                >
                  Aujourd&apos;hui
                </button>
              </div>

              <div className={styles.centerControls}>
                <h2 className={styles.periodTitle}>{getPeriodLabel()}</h2>
              </div>

              <div className={styles.topRightControls}>
                <div className={styles.datePickerWrapper}>
                  <span className={styles.calendarIcon} aria-hidden>
                    📅
                  </span>
                  <input
                    type="date"
                    className={styles.datePicker}
                    value={dateInput}
                    onChange={handleDateChange}
                    aria-label="Sélectionner une date"
                    title="Choisir une date"
                  />
                </div>
                <div className={styles.viewToggle}>
                  <button
                    type="button"
                    className={`${styles.viewButton} ${viewMode === "week" ? styles.activeView : ""}`}
                    onClick={() => setViewMode("week")}
                    title="Vue semaine"
                  >
                    S
                  </button>
                  <button
                    type="button"
                    className={`${styles.viewButton} ${viewMode === "month" ? styles.activeView : ""}`}
                    onClick={() => setViewMode("month")}
                    title="Vue mois"
                  >
                    M
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.controlBarBottom}>
              <form
                className={styles.searchForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  const params = new URLSearchParams(searchParams.toString());
                  const trimmed = searchQuery.trim();
                  if (trimmed.length >= 2) {
                    params.set("q", trimmed);
                  } else {
                    params.delete("q");
                  }
                  router.push(`/votes?${params.toString()}`, { scroll: false });
                }}
              >
                <input
                  type="search"
                  className="searchInput"
                  placeholder="Rechercher un scrutin (min. 2 caractères)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Rechercher un scrutin"
                />
              </form>

              <div className={styles.filtersRow}>
                {availableTypes.length > 0 && (
                  <div className={styles.typeFilter}>
                    <select
                      className={styles.typeSelect}
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      aria-label="Filtrer par type de vote"
                    >
                      <option value="all">Tous les types de vote</option>
                      {availableTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={styles.tagFilter}>
                  <select
                    className={styles.tagSelect}
                    value={selectedTag || ""}
                    onChange={(e) => {
                      const newTag = e.target.value || null;
                      setSelectedTag(newTag);
                      const params = new URLSearchParams(searchParams.toString());
                      if (newTag) params.set("tag", newTag);
                      else params.delete("tag");
                      router.push(`/votes?${params.toString()}`, { scroll: false });
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
                      onClick={() => {
                        setSelectedTag(null);
                        const params = new URLSearchParams(searchParams.toString());
                        params.delete("tag");
                        router.push(`/votes?${params.toString()}`, { scroll: false });
                      }}
                      aria-label="Effacer le filtre"
                      title="Effacer le filtre"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className={styles.groupFilter}>
                  <select
                    className={styles.typeSelect}
                    value={groupSlug || ""}
                    onChange={(e) => {
                      const slug = e.target.value || null;
                      setGroupSlug(slug);
                      const params = new URLSearchParams(searchParams.toString());
                      if (slug) params.set("group", slug);
                      else params.delete("group");
                      if (!slug) params.delete("group_position");
                      router.push(`/votes?${params.toString()}`, { scroll: false });
                    }}
                    aria-label="Filtrer par groupe politique"
                    title="Filtrer par groupe politique (position majoritaire du groupe)"
                  >
                    <option value="">Tous les groupes</option>
                    {politicalGroups.map((g) => (
                      <option key={g.slug} value={g.slug}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                  {groupSlug && (
                    <select
                      className={styles.typeSelect}
                      value={groupPosition}
                      onChange={(e) => {
                        const pos = (e.target.value || "") as GroupPosition | "";
                        setGroupPosition(pos);
                        const params = new URLSearchParams(searchParams.toString());
                        if (pos) params.set("group_position", pos);
                        else params.delete("group_position");
                        router.push(`/votes?${params.toString()}`, { scroll: false });
                      }}
                      aria-label="Position du groupe"
                      title="Position majoritaire du groupe (pour, contre, abstention)"
                    >
                      <option value="">Toute position</option>
                      <option value="pour">Pour</option>
                      <option value="contre">Contre</option>
                      <option value="abstention">Abstention</option>
                    </select>
                  )}
                </div>

                <div className={styles.sortFilterToggle}>
                  <button
                    type="button"
                    className={`${styles.sortFilterButton} ${sortFilter === "all" ? styles.activeSortFilter : ""}`}
                    onClick={() => setSortFilter("all")}
                    title="Tous les scrutins"
                  >
                    Tous
                  </button>
                  <button
                    type="button"
                    className={`${styles.sortFilterButton} ${styles.sortFilterAdopte} ${sortFilter === "adopté" ? styles.activeSortFilter : ""}`}
                    onClick={() => setSortFilter("adopté")}
                    title="Adoptés uniquement"
                  >
                    Adoptés
                  </button>
                  <button
                    type="button"
                    className={`${styles.sortFilterButton} ${styles.sortFilterRejete} ${sortFilter === "rejeté" ? styles.activeSortFilter : ""}`}
                    onClick={() => setSortFilter("rejeté")}
                    title="Rejetés uniquement"
                  >
                    Rejetés
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="stateLoading">Chargement des scrutins...</div>
          )}

          {error && (
            <div className="stateError">
              <p>Erreur: {error}</p>
            </div>
          )}

          {!loading && !error && data && (
            <div className={styles.scrutinsList}>
              {sortedDates.length === 0 ? (
                <div className="stateEmpty">
                  <p>Aucun scrutin pour cette période.</p>
                </div>
              ) : (
                sortedDates.map((date) => {
                  const isToday = date === getTodayDate();
                  const scrutinsForDate = byDate.get(date) ?? [];
                  return (
                    <div
                      key={date}
                      className={`${styles.dateSection} ${isToday ? styles.today : ""}`}
                    >
                      <div className={styles.dateHeader}>
                        <h2>{formatDate(date)}</h2>
                        {isToday && (
                          <span className={styles.todayBadge}>
                            Aujourd&apos;hui
                          </span>
                        )}
                      </div>

                      <div className={styles.scrutinCards}>
                        {scrutinsForDate.map((scrutin) => (
                          <Link
                            key={scrutin.id}
                            href={`/votes/${scrutin.id}`}
                            className={styles.scrutinCard}
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
                              {scrutin.type_vote_libelle && (
                                <span className={styles.typeVote}>
                                  {scrutin.type_vote_libelle}
                                </span>
                              )}
                            </div>
                            <h3 className={styles.scrutinTitle}>
                              {scrutin.titre}
                            </h3>
                            {scrutin.tags && scrutin.tags.length > 0 && (
                              <div className={styles.scrutinTags}>
                                {scrutin.tags.map((tag) => (
                                  <span
                                    key={tag.id}
                                    className={styles.tag}
                                    title={tag.label}
                                  >
                                    {tag.label}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className={styles.scrutinCounts}>
                              Pour: {scrutin.synthese_pour} · Contre:{" "}
                              {scrutin.synthese_contre}
                              {scrutin.synthese_abstentions > 0 &&
                                ` · Abstentions: ${scrutin.synthese_abstentions}`}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
    </div>
  );
}

export default function VotesPage() {
  return (
    <Suspense fallback={<div className="stateLoading">Chargement...</div>}>
      <VotesPageContent />
    </Suspense>
  );
}
