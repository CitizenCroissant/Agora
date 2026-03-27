"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
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
  formatMonth
} from "@agora/shared";
import { apiClient } from "@/lib/api";
import { recordVotePageVisit } from "@/lib/streaks";
import Link from "next/link";
import styles from "./votes.module.css";
import { PageHelp } from "@/components/PageHelp";
import { Breadcrumb } from "@/components/Breadcrumb";
import { StreakBadge } from "@/components/StreakBadge";
import { VoteResultBar } from "@/components/VoteResultBar";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar, PeriodControlRow } from "@/components/FilterBar";

type GroupPosition = "pour" | "contre" | "abstention";
type ViewMode = "week" | "month";
type SortFilter = "all" | "adopté" | "rejeté";

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
  { slug: "commerce", label: "Commerce" }
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

function LoadingSkeleton() {
  return (
    <div className={styles.skeletonList}>
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className={styles.skeletonCard}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Skeleton shape="pill" width={70} height={22} />
            <Skeleton shape="text" width={120} height={14} />
          </div>
          <Skeleton shape="heading" width="80%" height={18} />
          <Skeleton shape="rect" width="100%" height={6} />
        </div>
      ))}
    </div>
  );
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
    searchParams.get("q") ?? ""
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
      : ""
  );
  const [politicalGroups, setPoliticalGroups] = useState<PoliticalGroupSummary[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(getTodayDate());
  const [dateInput, setDateInput] = useState<string>(getTodayDate());

  useEffect(() => {
    apiClient.getPoliticalGroups().then((r) => setPoliticalGroups(r.groups)).catch(() => {});
  }, []);

  useEffect(() => {
    recordVotePageVisit();
  }, []);

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

  const loadScrutins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const trimmedQuery = searchQuery.trim();
      if (trimmedQuery.length >= 2) {
        const searchResponse = await apiClient.search(trimmedQuery, "scrutins", {
          group: groupSlug || undefined,
          group_position: groupPosition || undefined
        });
        setSearchResults(searchResponse.scrutins);
        setData(null);
      } else {
        const from = viewMode === "week" ? getWeekStart(currentDate) : getMonthStart(currentDate);
        const to = viewMode === "week" ? getWeekEnd(currentDate) : getMonthEnd(currentDate);
        const result = await apiClient.getScrutins(
          from,
          to,
          selectedTag || undefined,
          groupSlug || undefined,
          groupPosition || undefined
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
  }, [viewMode, currentDate, selectedTag, searchQuery, groupSlug, groupPosition]);

  useEffect(() => {
    void loadScrutins();
  }, [loadScrutins]);

  const handlePrevious = () => {
    if (viewMode === "week") setCurrentDate(addWeeks(currentDate, -1));
    else setCurrentDate(addMonths(currentDate, -1));
  };

  const handleNext = () => {
    if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    const today = getTodayDate();
    setCurrentDate(today);
    setDateInput(today);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDateInput(newDate);
    if (newDate && newDate.match(/^\d{4}-\d{2}-\d{2}$/)) setCurrentDate(newDate);
  };

  const getPeriodLabel = () => {
    if (viewMode === "week") {
      return formatDateRange(getWeekStart(currentDate), getWeekEnd(currentDate));
    }
    return formatMonth(currentDate);
  };

  const handleTagSelect = (slug: string | null) => {
    setSelectedTag(slug);
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("tag", slug);
    else params.delete("tag");
    router.push(`/votes?${params.toString()}`, { scroll: false });
  };

  const baseScrutins =
    (searchResults ?? data?.scrutins) && (searchResults ?? data?.scrutins)!.length > 0
      ? (searchResults ?? data?.scrutins)!
      : [];

  const availableTypes = Array.from(
    new Set(baseScrutins.map((s) => s.type_vote_libelle).filter((t): t is string => Boolean(t)))
  );

  const filteredScrutins = baseScrutins.filter((s) => {
    if (sortFilter !== "all" && s.sort_code !== sortFilter) return false;
    if (typeFilter !== "all" && s.type_vote_libelle !== typeFilter) return false;
    return true;
  });

  const byDate =
    filteredScrutins.length > 0
      ? groupScrutinsByDate(filteredScrutins)
      : new Map<string, Scrutin[]>();
  const sortedDates = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a));

  const totalShown = filteredScrutins.length;

  return (
    <div className="container">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Scrutins" }]} />

      <div className={styles.pageIntro}>
        <div>
          <h1 className={styles.pageTitle}>
            Scrutins <span>publics</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Les votes nominatifs de l&apos;Assemblée nationale
          </p>
        </div>
        <StreakBadge />
      </div>

      <PageHelp
        title="Comment lire cette page ?"
        points={[
          "Chaque carte correspond à un scrutin (vote public) sur un texte ou un article.",
          "La barre colorée montre la répartition pour / contre / abstention.",
          "Utilisez les filtres thématiques (pilules amber) pour cibler un domaine.",
          "Filtrez par groupe politique pour voir comment votre groupe a voté."
        ]}
        collapsible
        defaultClosed
      />

      <FilterBar layout="stacked" aria-label="Filtres et période des scrutins">
        <PeriodControlRow
          accent="votes"
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          periodLabel={getPeriodLabel()}
          dateInput={dateInput}
          onDateInputChange={handleDateChange}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
        />

        <div className={styles.controlBarBottom}>
          <form
            className={styles.searchForm}
            onSubmit={(e) => {
              e.preventDefault();
              const params = new URLSearchParams(searchParams.toString());
              const trimmed = searchQuery.trim();
              if (trimmed.length >= 2) params.set("q", trimmed);
              else params.delete("q");
              router.push(`/votes?${params.toString()}`, { scroll: false });
            }}
          >
            <input
              type="search"
              className="searchInput"
              placeholder="Rechercher un scrutin…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Rechercher un scrutin"
            />
          </form>

          <div className={styles.filtersRow}>
            {/* Outcome filter pills */}
            <div className={styles.outcomeFilter}>
              <button
                type="button"
                className={`${styles.outcomePill} ${sortFilter === "all" ? `${styles.active} ${styles.activeAll}` : ""}`}
                onClick={() => setSortFilter("all")}
              >
                Tous{totalShown > 0 && sortFilter === "all" ? ` (${totalShown})` : ""}
              </button>
              <button
                type="button"
                className={`${styles.outcomePill} ${sortFilter === "adopté" ? `${styles.active} ${styles.activeAdopte}` : ""}`}
                onClick={() => setSortFilter("adopté")}
              >
                ✓ Adoptés
              </button>
              <button
                type="button"
                className={`${styles.outcomePill} ${sortFilter === "rejeté" ? `${styles.active} ${styles.activeRejete}` : ""}`}
                onClick={() => setSortFilter("rejeté")}
              >
                ✕ Rejetés
              </button>

              {/* Type select */}
              {availableTypes.length > 0 && (
                <select
                  className={styles.filterSelect}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  aria-label="Filtrer par type de vote"
                >
                  <option value="all">Tous types</option>
                  {availableTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              )}

              {/* Group select */}
              <select
                className={styles.filterSelect}
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
              >
                <option value="">Tous les groupes</option>
                {politicalGroups.map((g) => (
                  <option key={g.slug} value={g.slug}>{g.label}</option>
                ))}
              </select>

              {groupSlug && (
                <select
                  className={styles.filterSelect}
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
                >
                  <option value="">Toute position</option>
                  <option value="pour">Pour</option>
                  <option value="contre">Contre</option>
                  <option value="abstention">Abstention</option>
                </select>
              )}
            </div>

            {/* Thematic tag pills */}
            <div className={styles.tagPillsRow}>
              <span className={styles.tagPillAllLabel}>Thème :</span>
              <button
                type="button"
                className={`${styles.tagPill} ${!selectedTag ? styles.activeTag : ""}`}
                onClick={() => handleTagSelect(null)}
              >
                Tous
              </button>
              {THEMATIC_TAGS.map((tag) => (
                <button
                  key={tag.slug}
                  type="button"
                  className={`${styles.tagPill} ${selectedTag === tag.slug ? styles.activeTag : ""}`}
                  onClick={() => handleTagSelect(selectedTag === tag.slug ? null : tag.slug)}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FilterBar>

      {/* Content */}
      {loading && <LoadingSkeleton />}

      {error && (
        <div className="stateError">
          <p>Erreur : {error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className={styles.scrutinsList}>
          {sortedDates.length === 0 ? (
            <EmptyState
              variant="votes"
              message="Essayez une autre semaine, ou effacez les filtres actifs."
            />
          ) : (
            sortedDates.map((date) => {
              const isToday = date === getTodayDate();
              const scrutinsForDate = byDate.get(date) ?? [];
              return (
                <div key={date} className={styles.dateSection}>
                  <div className={styles.dateHeader}>
                    <h2 className={styles.dateLabel}>{formatDate(date)}</h2>
                    {isToday && <span className={styles.todayBadge}>Aujourd&apos;hui</span>}
                    <span className={styles.dateAccent} aria-hidden />
                  </div>

                  <div className={`${styles.scrutinCards} staggerChildren`}>
                    {scrutinsForDate.map((scrutin) => {
                      const isAdopte = scrutin.sort_code === "adopté";
                      return (
                        <Link
                          key={scrutin.id}
                          href={`/votes/${scrutin.id}`}
                          className={`${styles.scrutinCard} ${isAdopte ? styles.adopte : styles.rejete}`}
                        >
                          <div className={styles.scrutinCardTop}>
                            <div className={styles.scrutinMeta}>
                              <span className={isAdopte ? styles.badgeAdopte : styles.badgeRejete}>
                                {isAdopte ? "✓ Adopté" : "✕ Rejeté"}
                              </span>
                              {scrutin.type_vote_libelle && (
                                <span className={styles.typeVote}>{scrutin.type_vote_libelle}</span>
                              )}
                            </div>
                            {scrutin.numero && (
                              <span className={styles.scrutinNumber}>#{scrutin.numero}</span>
                            )}
                          </div>

                          <h3 className={styles.scrutinTitle}>{scrutin.titre}</h3>

                          {scrutin.tags && scrutin.tags.length > 0 && (
                            <div className={styles.scrutinTags}>
                              {scrutin.tags.map((tag) => (
                                <span key={tag.id} className={styles.cardTag}>{tag.label}</span>
                              ))}
                            </div>
                          )}

                          <VoteResultBar
                            pour={scrutin.synthese_pour}
                            contre={scrutin.synthese_contre}
                            abstentions={scrutin.synthese_abstentions}
                            nonVotants={scrutin.synthese_non_votants ?? 0}
                            size="sm"
                            showLegend
                          />
                        </Link>
                      );
                    })}
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
