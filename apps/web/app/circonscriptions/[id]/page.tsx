"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import type { CirconscriptionDetail, Deputy } from "@agora/shared";
import { apiClient } from "@/lib/api";
import { isCurrentlySitting } from "@agora/shared";
import Link from "next/link";
import styles from "./circonscription.module.css";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function CirconscriptionPage() {
  const params = useParams();
  const id = (params?.id as string) ?? "";

  const [circonscription, setCirconscription] =
    useState<CirconscriptionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadCirconscription(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadCirconscription = async (circoId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getCirconscription(circoId);
      setCirconscription(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Circonscription introuvable",
      );
      setCirconscription(null);
    } finally {
      setLoading(false);
    }
  };

  if (!id) {
    notFound();
  }

  return (
    <div className="container">
      <Breadcrumb items={[{ label: "Circonscriptions", href: "/circonscriptions" }, { label: "Détail" }]} />
          {loading && (
            <div className={styles.loading}>
              Chargement de la circonscription...
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>Erreur : {error}</p>
              <p className={styles.errorHint}>
                Cette circonscription n&apos;existe peut-être pas ou l&apos;API
                est indisponible.
              </p>
            </div>
          )}

          {!loading && !error && circonscription && (
            <>
              <div className={styles.summary}>
                <span className={styles.summaryCount}>
                  {circonscription.deputy_count}
                </span>
                <span className={styles.summaryLabel}>
                  député{circonscription.deputy_count !== 1 ? "s" : ""} en
                  mandat dans cette circonscription
                </span>
              </div>

              {(() => {
                const current: Deputy[] = [];
                const past: Deputy[] = [];
                for (const d of circonscription.deputies) {
                  if (isCurrentlySitting(d.date_fin_mandat)) current.push(d);
                  else past.push(d);
                }
                return (
                  <>
                    {current.length > 0 && (
                      <div className={styles.sectionBlock}>
                        <h2 className={styles.sectionTitle}>
                          Députés en mandat ({current.length})
                        </h2>
                        <ul className={styles.deputyList}>
                          {current.map((d) => (
                            <li key={d.acteur_ref}>
                              <Link
                                href={`/deputy/${encodeURIComponent(d.acteur_ref)}`}
                                className={styles.deputyCard}
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
                                  {d.groupe_politique && (
                                    <span className={styles.deputyMeta}>
                                      {d.groupe_politique}
                                    </span>
                                  )}
                                </span>
                                <span
                                  className={styles.deputyRef}
                                  title="Référence acteur"
                                >
                                  {d.acteur_ref}
                                </span>
                                <span
                                  className={styles.deputyCardArrow}
                                  aria-hidden
                                >
                                  →
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {past.length > 0 && (
                      <div className={styles.sectionBlock}>
                        <h2 className={styles.sectionTitle}>
                          Anciens députés ({past.length})
                        </h2>
                        <ul className={styles.deputyList}>
                          {past.map((d) => (
                            <li key={d.acteur_ref}>
                              <Link
                                href={`/deputy/${encodeURIComponent(d.acteur_ref)}`}
                                className={styles.deputyCard}
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
                                  {d.groupe_politique && (
                                    <span className={styles.deputyMeta}>
                                      {d.groupe_politique}
                                    </span>
                                  )}
                                </span>
                                <span
                                  className={styles.deputyRef}
                                  title="Référence acteur"
                                >
                                  {d.acteur_ref}
                                </span>
                                <span
                                  className={styles.deputyCardArrow}
                                  aria-hidden
                                >
                                  →
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
    </div>
  );
}
