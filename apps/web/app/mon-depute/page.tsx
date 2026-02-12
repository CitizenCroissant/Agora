"use client";

import { useEffect, useRef, useState } from "react";
import type {
  DepartementSummary,
  Deputy,
  DeputiesListResponse
} from "@agora/shared";
import { apiClient } from "@/lib/api";
import { isCurrentlySitting } from "@agora/shared";
import Link from "next/link";
import styles from "./mon-depute.module.css";
import { Breadcrumb } from "@/components/Breadcrumb";

/** Normalize for search: lowercase, strip accents */
function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export default function MonDeputePage() {
  const [departements, setDepartements] = useState<DepartementSummary[]>([]);
  const [deputies, setDeputies] = useState<Deputy[]>([]);
  const [selectedDepartement, setSelectedDepartement] = useState<string | null>(
    null
  );
  const [loadingDepts, setLoadingDepts] = useState<boolean>(true);
  const [loadingDeputies, setLoadingDeputies] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [comboQuery, setComboQuery] = useState("");
  const [comboOpen, setComboOpen] = useState(false);
  const comboRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDepartements();
  }, []);

  useEffect(() => {
    if (selectedDepartement) {
      loadDeputies(selectedDepartement);
    } else {
      setDeputies([]);
      setLoadingDeputies(false);
    }
  }, [selectedDepartement]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setComboOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadDepartements = async () => {
    setLoadingDepts(true);
    setError(null);
    try {
      const data = await apiClient.getDepartements();
      setDepartements(data.departements);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur de chargement des départements"
      );
      setDepartements([]);
    } finally {
      setLoadingDepts(false);
    }
  };

  const filteredDepartements = comboQuery.trim()
    ? departements.filter((d) =>
        normalizeForSearch(d.name).includes(normalizeForSearch(comboQuery))
      )
    : departements;

  const loadDeputies = async (departement: string) => {
    setLoadingDeputies(true);
    setError(null);
    try {
      const data: DeputiesListResponse =
        await apiClient.getDeputiesByDepartement(departement);
      setDeputies(data.deputies);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur de chargement des députés"
      );
      setDeputies([]);
    } finally {
      setLoadingDeputies(false);
    }
  };

  const currentDeputies = deputies.filter((d) =>
    isCurrentlySitting(d.date_fin_mandat)
  );
  const pastDeputies = deputies.filter(
    (d) => !isCurrentlySitting(d.date_fin_mandat)
  );

  return (
    <div className="container">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Trouver mon député" }]} />
          {loadingDepts && (
            <div className="stateLoading">Chargement des départements...</div>
          )}

          {error && !selectedDepartement && (
            <div className="stateError">
              <p>Erreur : {error}</p>
              <p className={styles.errorHint}>
                Vérifiez que l&apos;API est disponible.
              </p>
            </div>
          )}

          {!loadingDepts && departements.length > 0 && (
            <div className={styles.selectorSection}>
              <label
                id="departement-combo-label"
                className={styles.label}
              >
                Mon département
              </label>
              <div
                ref={comboRef}
                className={styles.comboWrapper}
                role="combobox"
                aria-expanded={comboOpen}
                aria-haspopup="listbox"
                aria-controls="departement-listbox"
                aria-labelledby="departement-combo-label"
              >
                <input
                  type="text"
                  className={styles.comboInput}
                  value={comboOpen ? comboQuery : selectedDepartement ?? ""}
                  onChange={(e) => {
                    setComboQuery(e.target.value);
                    setComboOpen(true);
                    if (selectedDepartement && e.target.value !== selectedDepartement) {
                      setSelectedDepartement(null);
                    }
                  }}
                  onFocus={() => setComboOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setComboOpen(false);
                      setComboQuery(selectedDepartement ?? "");
                    }
                  }}
                  placeholder="Tapez pour rechercher un département..."
                  aria-autocomplete="list"
                  aria-activedescendant={comboOpen ? undefined : undefined}
                />
                <button
                  type="button"
                  className={styles.comboToggle}
                  onClick={() => setComboOpen((o) => !o)}
                  aria-label={comboOpen ? "Fermer la liste" : "Ouvrir la liste"}
                  tabIndex={-1}
                >
                  {comboOpen ? "▲" : "▼"}
                </button>
                {comboOpen && (
                  <ul
                    id="departement-listbox"
                    className={styles.comboList}
                    role="listbox"
                    aria-labelledby="departement-combo-label"
                  >
                    {filteredDepartements.length === 0 ? (
                      <li className={styles.comboEmpty} role="option">
                        Aucun département ne correspond à votre recherche.
                      </li>
                    ) : (
                      filteredDepartements.map((d) => (
                        <li
                          key={d.name}
                          role="option"
                          className={styles.comboOption}
                          onClick={() => {
                            setSelectedDepartement(d.name);
                            setComboQuery("");
                            setComboOpen(false);
                          }}
                        >
                          <span className={styles.comboOptionName}>
                            {d.name}
                          </span>
                          <span className={styles.comboOptionCount}>
                            {d.deputy_count} député
                            {d.deputy_count !== 1 ? "s" : ""}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
              <p className={styles.hint}>
                Tapez pour filtrer la liste. Vous pouvez aussi consulter par{" "}
                <Link href="/circonscriptions" className={styles.link}>
                  circonscription
                </Link>
                .
              </p>
            </div>
          )}

          {selectedDepartement && (
            <>
              {loadingDeputies && (
                <div className="stateLoading">
                  Chargement des députés du {selectedDepartement}...
                </div>
              )}

              {error && selectedDepartement && (
                <div className="stateError">
                  <p>Erreur : {error}</p>
                </div>
              )}

              {!loadingDeputies && !error && (
                <>
                  <div className={styles.summary}>
                    <span className={styles.summaryCount}>
                      {currentDeputies.length}
                    </span>
                    <span className={styles.summaryLabel}>
                      député{currentDeputies.length !== 1 ? "s" : ""} en mandat
                      dans le {selectedDepartement}
                    </span>
                  </div>

                  {currentDeputies.length > 0 && (
                    <div className={styles.sectionBlock}>
                      <h2 className={styles.sectionTitle}>
                        Députés en mandat ({currentDeputies.length})
                      </h2>
                      <ul className={styles.deputyList}>
                        {currentDeputies.map((d) => (
                          <li key={d.acteur_ref}>
                            <div className={styles.deputyCard}>
                              <div className={styles.deputyCardBody}>
                                <span className={styles.deputyName}>
                                  {d.civil_prenom} {d.civil_nom}
                                </span>
                                {(d.circonscription || d.departement) && (
                                  <span className={styles.deputyMeta}>
                                    {[d.circonscription, d.departement]
                                      .filter(Boolean)
                                      .join(" — ")}
                                  </span>
                                )}
                                {d.groupe_politique && (
                                  <span className={styles.deputyMeta}>
                                    {d.groupe_politique}
                                  </span>
                                )}
                                <div className={styles.deputyLinks}>
                                  <Link
                                    href={`/deputy/${encodeURIComponent(
                                      d.acteur_ref
                                    )}`}
                                    className={styles.primaryLink}
                                  >
                                    Fiche du député →
                                  </Link>
                                  <Link
                                    href={`/votes/deputy/${encodeURIComponent(
                                      d.acteur_ref
                                    )}`}
                                    className={styles.secondaryLink}
                                  >
                                    Votes de mon député
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {pastDeputies.length > 0 && (
                    <div className={styles.sectionBlock}>
                      <h2 className={styles.sectionTitle}>
                        Anciens députés ({pastDeputies.length})
                      </h2>
                      <ul className={styles.deputyList}>
                        {pastDeputies.map((d) => (
                          <li key={d.acteur_ref}>
                            <Link
                              href={`/deputy/${encodeURIComponent(
                                d.acteur_ref
                              )}`}
                              className={styles.deputyCardLink}
                            >
                              <span className={styles.deputyCardBody}>
                                <span className={styles.deputyName}>
                                  {d.civil_prenom} {d.civil_nom}
                                </span>
                                {(d.circonscription || d.departement) && (
                                  <span className={styles.deputyMeta}>
                                    {[d.circonscription, d.departement]
                                      .filter(Boolean)
                                      .join(" — ")}
                                  </span>
                                )}
                              </span>
                              <span className={styles.deputyCardArrow}>→</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentDeputies.length === 0 &&
                    pastDeputies.length === 0 && (
                      <p className="stateEmpty">
                        Aucun député trouvé pour ce département.
                      </p>
                    )}
                </>
              )}
            </>
          )}

          {!loadingDepts && departements.length === 0 && !error && (
            <p className="stateEmpty">
              Aucun département avec députés en base. Vérifiez que
              l&apos;ingestion des députés a été effectuée.
            </p>
          )}
    </div>
  );
}
