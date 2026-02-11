"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { PoliticalGroupDetail, Deputy } from "@agora/shared";
import { isCurrentlySitting, formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./group.module.css";
import { Breadcrumb } from "@/components/Breadcrumb";

const POSITION_LABELS: Record<string, string> = {
  majoritaire: "Majorité présidentielle",
  opposition: "Opposition",
  minoritaire: "Minorité",
};

const ORIENTATION_LABELS: Record<string, string> = {
  gauche: "Gauche",
  centre: "Centre",
  droite: "Droite",
};

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [group, setGroup] = useState<PoliticalGroupDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadGroup(slug);
    }
  }, [slug]);

  const loadGroup = async (s: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getPoliticalGroup(s);
      setGroup(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Groupe introuvable");
      setGroup(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Breadcrumb items={[{ label: "Groupes", href: "/groupes" }, { label: group?.label || "Groupe" }]} />
          {loading && (
            <div className={styles.loading}>Chargement du groupe...</div>
          )}

          {error && (
            <div className={styles.error}>
              <p>Erreur : {error}</p>
              <p className={styles.errorHint}>
                Ce groupe n&apos;existe peut-être pas ou l&apos;API est
                indisponible.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            group &&
            (() => {
              const current: Deputy[] = [];
              const past: Deputy[] = [];
              for (const d of group.deputies) {
                if (isCurrentlySitting(d.date_fin_mandat)) current.push(d);
                else past.push(d);
              }
              const meta = group.metadata;
              return (
                <>
                  {meta && (
                    <section
                      className={styles.metaCard}
                      aria-label="Informations sur le groupe"
                    >
                      <h2 className={styles.metaTitle}>À propos du groupe</h2>
                      <dl className={styles.metaList}>
                        {(meta.date_debut || meta.date_fin) && (
                          <>
                            <dt className={styles.metaTerm}>Période</dt>
                            <dd className={styles.metaValue}>
                              {meta.date_debut
                                ? formatDate(meta.date_debut)
                                : "—"}
                              {meta.date_fin
                                ? ` – ${formatDate(meta.date_fin)}`
                                : " (actif)"}
                            </dd>
                          </>
                        )}
                        {meta.position_politique && (
                          <>
                            <dt className={styles.metaTerm}>Position</dt>
                            <dd className={styles.metaValue}>
                              <span
                                className={styles.metaBadge}
                                data-position={meta.position_politique}
                              >
                                {POSITION_LABELS[meta.position_politique] ??
                                  meta.position_politique}
                              </span>
                            </dd>
                          </>
                        )}
                        {meta.orientation && (
                          <>
                            <dt className={styles.metaTerm}>Orientation</dt>
                            <dd className={styles.metaValue}>
                              {ORIENTATION_LABELS[meta.orientation] ??
                                meta.orientation}
                            </dd>
                          </>
                        )}
                        {meta.president_name && (
                          <>
                            <dt className={styles.metaTerm}>
                              Président(e) du groupe
                            </dt>
                            <dd className={styles.metaValue}>
                              {meta.president_name}
                            </dd>
                          </>
                        )}
                        {meta.legislature != null && (
                          <>
                            <dt className={styles.metaTerm}>Législature</dt>
                            <dd className={styles.metaValue}>
                              {meta.legislature}e
                            </dd>
                          </>
                        )}
                      </dl>
                      {meta.official_url && (
                        <p className={styles.metaLink}>
                          <a
                            href={meta.official_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Voir sur le site de l&apos;Assemblée nationale →
                          </a>
                        </p>
                      )}
                    </section>
                  )}

                  <div className={styles.summary}>
                    <span className={styles.summaryCount}>
                      {group.deputy_count}
                    </span>
                    <span className={styles.summaryLabel}>
                      député{group.deputy_count !== 1 ? "s" : ""} dans ce groupe
                    </span>
                  </div>

                  {current.length > 0 && (
                    <>
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
                                    {d.circonscription_ref ? (
                                      <span
                                        role="link"
                                        tabIndex={0}
                                        className={styles.deputyMetaLink}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          router.push(
                                            `/circonscriptions/${encodeURIComponent(d.circonscription_ref ?? "")}`,
                                          );
                                        }}
                                        onKeyDown={(e) => {
                                          if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                          ) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            router.push(
                                              `/circonscriptions/${encodeURIComponent(d.circonscription_ref ?? "")}`,
                                            );
                                          }
                                        }}
                                      >
                                        {d.circonscription}
                                      </span>
                                    ) : (
                                      d.circonscription
                                    )}
                                    {d.circonscription &&
                                      d.departement &&
                                      " — "}
                                    {d.departement}
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
                    </>
                  )}

                  {past.length > 0 && (
                    <div className={styles.pastSection}>
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
                                    {d.circonscription_ref ? (
                                      <span
                                        role="link"
                                        tabIndex={0}
                                        className={styles.deputyMetaLink}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          router.push(
                                            `/circonscriptions/${encodeURIComponent(d.circonscription_ref ?? "")}`,
                                          );
                                        }}
                                        onKeyDown={(e) => {
                                          if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                          ) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            router.push(
                                              `/circonscriptions/${encodeURIComponent(d.circonscription_ref ?? "")}`,
                                            );
                                          }
                                        }}
                                      >
                                        {d.circonscription}
                                      </span>
                                    ) : (
                                      d.circonscription
                                    )}
                                    {d.circonscription &&
                                      d.departement &&
                                      " — "}
                                    {d.departement}
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

                  {current.length === 0 && past.length === 0 && (
                    <p className={styles.empty}>Aucun député dans ce groupe.</p>
                  )}
                </>
              );
            })()}
    </div>
  );
}
