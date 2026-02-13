"use client";

import { useEffect, useState, useMemo } from "react";
import type { Organe, CommissionType } from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./commissions.module.css";
import { Breadcrumb } from "@/components/Breadcrumb";

const DEFAULT_TYPE = "COMPER";

export default function CommissionsPage() {
  const [types, setTypes] = useState<CommissionType[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>(DEFAULT_TYPE);
  const [organes, setOrganes] = useState<Organe[]>([]);
  const [loadingTypes, setLoadingTypes] = useState<boolean>(true);
  const [loadingOrganes, setLoadingOrganes] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const labelByCode = useMemo(
    () => Object.fromEntries(types.map((t) => [t.code, t.label])),
    [types]
  );

  useEffect(() => {
    let cancelled = false;
    setLoadingTypes(true);
    setError(null);
    apiClient
      .getCommissionTypes()
      .then((res) => {
        if (!cancelled) {
          setTypes(res.types);
          if (res.types.length > 0) {
            setTypeFilter((prev) =>
              res.types.some((t) => t.code === prev) ? prev : res.types[0].code
            );
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erreur de chargement des types");
          setTypes([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTypes(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (types.length === 0) return;
    if (!typeFilter) return;
    let cancelled = false;
    setLoadingOrganes(true);
    setError(null);
    apiClient
      .getCommissions(typeFilter)
      .then((data) => {
        if (!cancelled) setOrganes(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erreur de chargement");
          setOrganes([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingOrganes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [types.length, typeFilter]);

  return (
    <div className="container">
      <Breadcrumb
        items={[{ label: "Accueil", href: "/" }, { label: "Commissions" }]}
      />
      <h1 className={styles.title}>Commissions et organes</h1>
      <p className={styles.intro}>
        Commissions permanentes, commissions d&apos;enquête, délégations et
        autres organes de travail de l&apos;Assemblée nationale.
      </p>
      <p className={styles.comprendreBlock}>
        <Link href="/democratie#commissions" className={styles.comprendreLink}>
          Comprendre les commissions et organes →
        </Link>
      </p>

      {(loadingTypes || (types.length > 0 && loadingOrganes)) && (
        <div className="stateLoading">
          {loadingTypes
            ? "Chargement des types d'organes..."
            : "Chargement des organes..."}
        </div>
      )}

      {error && (
        <div className="stateError">
          <p>Erreur : {error}</p>
          <p className={styles.errorHint}>
            Vérifiez que l&apos;API est disponible et que l&apos;ingestion des
            organes a été exécutée.
          </p>
        </div>
      )}

      {!loadingTypes && !error && types.length > 0 && (
        <div className={styles.filters}>
          <label htmlFor="commission-type-filter" className={styles.filterLabel}>
            Type d&apos;organe
          </label>
          <select
            id="commission-type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={styles.filterSelect}
            aria-label="Choisir le type d'organe"
          >
            {types.map((t) => (
              <option key={t.code} value={t.code}>
                {t.label}
              </option>
            ))}
          </select>
          <span className={styles.resultCount} aria-live="polite">
            {organes.length} organe{organes.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {!loadingTypes && !error && types.length === 0 && (
        <p className="stateEmpty">
          Aucun type d&apos;organe disponible. Exécutez l&apos;ingestion des
          organes pour remplir les données.
        </p>
      )}

      {!loadingOrganes && !error && types.length > 0 && (
        <>
          {organes.length === 0 ? (
            <p className="stateEmpty">
              Aucun organe pour ce type. Choisissez un autre type dans la liste.
            </p>
          ) : (
            <div className={styles.listByType}>
              <section
                className={styles.typeSection}
                aria-labelledby="type-heading"
              >
                <h2 id="type-heading" className={styles.typeHeading}>
                  {labelByCode[typeFilter] ?? typeFilter}
                </h2>
                <ul className={styles.list}>
                  {organes.map((org) => (
                    <li key={org.id}>
                      <Link
                        href={`/commissions/${encodeURIComponent(org.id)}`}
                        className={styles.card}
                      >
                        <span className={styles.cardLabel}>
                          {org.libelle_abrege ?? org.libelle ?? org.id}
                        </span>
                        {org.libelle &&
                          org.libelle !== org.libelle_abrege && (
                            <span className={styles.cardFullName}>
                              {org.libelle}
                            </span>
                          )}
                        <span className={styles.cardArrow} aria-hidden>
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
