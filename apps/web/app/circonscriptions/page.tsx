"use client";

import { useEffect, useMemo, useState } from "react";
import type { CirconscriptionSummary } from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./circonscriptions.module.css";

const ACCENT_COLORS = [
  "#0055a4",
  "#0d7377",
  "#7d4e57",
  "#2d6a4f",
  "#9b5de5",
  "#00b4d8",
  "#e63946",
  "#f4a261",
];

function accentForId(id: string): string {
  let n = 0;
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
  return ACCENT_COLORS[n % ACCENT_COLORS.length];
}

/** Extract department name from "Dept - Xe circonscription" */
function departmentFromLabel(label: string): string {
  const idx = label.indexOf(" - ");
  return idx >= 0 ? label.slice(0, idx).trim() : label;
}

/** Extract ordinal number for sorting (1ère→1, 5e→5) */
function ordinalFromLabel(label: string): number {
  const m = label.match(/(\d+)(?:ère|e)/i);
  return m ? parseInt(m[1], 10) : 0;
}

type DeptGroup = {
  departement: string;
  circonscriptions: CirconscriptionSummary[];
};

function groupByDepartment(
  items: CirconscriptionSummary[],
  searchQuery: string,
): DeptGroup[] {
  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? items.filter(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          departmentFromLabel(c.label).toLowerCase().includes(q),
      )
    : items;

  const byDept = new Map<string, CirconscriptionSummary[]>();
  for (const c of filtered) {
    const dept = departmentFromLabel(c.label);
    const list = byDept.get(dept) ?? [];
    list.push(c);
    byDept.set(dept, list);
  }

  return Array.from(byDept.entries())
    .map(([departement, circonscriptions]) => ({
      departement,
      circonscriptions: circonscriptions.sort(
        (a, b) => ordinalFromLabel(a.label) - ordinalFromLabel(b.label),
      ),
    }))
    .sort((a, b) => a.departement.localeCompare(b.departement, "fr"));
}

export default function CirconscriptionsPage() {
  const [circonscriptions, setCirconscriptions] = useState<
    CirconscriptionSummary[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCirconscriptions();
  }, []);

  const loadCirconscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getCirconscriptions();
      setCirconscriptions(data.circonscriptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
      setCirconscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const groups = useMemo(
    () => groupByDepartment(circonscriptions, searchQuery),
    [circonscriptions, searchQuery],
  );

  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedDepts(new Set(groups.map((g) => g.departement)));
    }
  }, [searchQuery, groups]);

  const toggleDept = (dept: string) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept);
      else next.add(dept);
      return next;
    });
  };

  const expandAll = () =>
    setExpandedDepts(new Set(groups.map((g) => g.departement)));
  const collapseAll = () => setExpandedDepts(new Set());

  const allExpanded = groups.length > 0 && expandedDepts.size === groups.length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <Link href="/" className={styles.backLink}>
            ← Retour à l&apos;accueil
          </Link>
          <h1 className={styles.title}>Circonscriptions</h1>
          <p className={styles.subtitle}>
            Liste des circonscriptions électorales de l&apos;Assemblée nationale
          </p>
        </div>
      </header>

      <main className={styles.main}>
        <div className="container">
          {loading && (
            <div className={styles.loading}>
              Chargement des circonscriptions...
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>Erreur : {error}</p>
              <p className={styles.errorHint}>
                Vérifiez que l&apos;API est disponible et que les députés ont
                été ingérés.
              </p>
            </div>
          )}

          {!loading && !error && (
            <>
              {circonscriptions.length === 0 ? (
                <p className={styles.loading}>
                  Aucune circonscription trouvée. Réingérez les députés pour
                  remplir les circonscriptions.
                </p>
              ) : (
                <>
                  <div className={styles.toolbar}>
                    <input
                      type="search"
                      placeholder="Rechercher un département ou une circonscription…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={styles.searchInput}
                      aria-label="Rechercher"
                    />
                    <div className={styles.expandButtons}>
                      <button
                        type="button"
                        onClick={allExpanded ? collapseAll : expandAll}
                        className={styles.expandBtn}
                      >
                        {allExpanded ? "Tout replier" : "Tout déplier"}
                      </button>
                    </div>
                  </div>
                  <p className={styles.stats}>
                    {groups.length} département{groups.length !== 1 ? "s" : ""}
                    {searchQuery && (
                      <>
                        {" "}
                        •{" "}
                        {groups.reduce(
                          (n, g) => n + g.circonscriptions.length,
                          0,
                        )}{" "}
                        résultat(s)
                      </>
                    )}
                  </p>
                  <div className={styles.groups}>
                    {groups.map((group, idx) => {
                      const isExpanded = expandedDepts.has(group.departement);
                      const totalDeputies = group.circonscriptions.reduce(
                        (n, c) => n + c.deputy_count,
                        0,
                      );
                      const groupId = `group-${idx}`;
                      const headerId = `header-${idx}`;
                      return (
                        <section
                          key={group.departement}
                          className={styles.group}
                          data-expanded={isExpanded}
                        >
                          <button
                            type="button"
                            onClick={() => toggleDept(group.departement)}
                            className={styles.groupHeader}
                            aria-expanded={isExpanded}
                            aria-controls={groupId}
                            id={headerId}
                          >
                            <span className={styles.groupName}>
                              {group.departement}
                            </span>
                            <span className={styles.groupMeta}>
                              {group.circonscriptions.length} circonscription
                              {group.circonscriptions.length !== 1
                                ? "s"
                                : ""} • {totalDeputies} député
                              {totalDeputies !== 1 ? "s" : ""}
                            </span>
                            <span className={styles.groupChevron} aria-hidden>
                              {isExpanded ? "▼" : "▶"}
                            </span>
                          </button>
                          <div
                            id={groupId}
                            role="region"
                            aria-labelledby={headerId}
                            className={styles.groupContent}
                            hidden={!isExpanded}
                          >
                            <ul className={styles.list}>
                              {group.circonscriptions.map((c) => (
                                <li key={c.id}>
                                  <Link
                                    href={`/circonscriptions/${encodeURIComponent(c.id)}`}
                                    className={styles.card}
                                    style={
                                      {
                                        "--accent": accentForId(c.id),
                                      } as React.CSSProperties
                                    }
                                  >
                                    <span
                                      className={styles.cardAccent}
                                      aria-hidden
                                    />
                                    <span className={styles.cardBody}>
                                      <span className={styles.cardLabel}>
                                        {c.label}
                                      </span>
                                      <span className={styles.cardCount}>
                                        {c.deputy_count} député
                                        {c.deputy_count !== 1 ? "s" : ""}
                                      </span>
                                    </span>
                                    <span
                                      className={styles.cardArrow}
                                      aria-hidden
                                    >
                                      →
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </>
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
