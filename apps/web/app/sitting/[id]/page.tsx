"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SittingDetailResponse } from "@agora/shared";
import { formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./sitting.module.css";
import { PageHelp } from "@/components/PageHelp";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function SittingPage() {
  const params = useParams();
  const id = params.id as string;

  const [sitting, setSitting] = useState<SittingDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadSitting(id);
    }
  }, [id]);

  const loadSitting = async (sittingId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getSitting(sittingId);
      setSitting(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sitting");
      setSitting(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: sitting?.title || "Séance" }]} />
          <PageHelp
            title="Comment lire cette page ?"
            points={[
              "La description présente le contexte général de la séance (type, lieu, horaires).",
              "La section « Scrutins de cette séance » liste les votes formels tenus pendant cette séance.",
              "L’« Ordre du jour » détaille les points examinés, avec leur numéro, catégorie et éventuelle référence.",
            ]}
          />

          {loading && (
            <div className="stateLoading">Chargement des détails...</div>
          )}

          {error && (
            <div className="stateError">
              <p>Erreur: {error}</p>
            </div>
          )}

          {!loading && !error && sitting && (
            <>
              <div className={styles.sittingHeader}>
                <div>
                  <h1 className={styles.title}>{sitting.title}</h1>
                  <p className={styles.date}>{formatDate(sitting.date)}</p>
                </div>
                {sitting.time_range && (
                  <div className={styles.timeRange}>
                    <span className={styles.timeLabel}>Horaire</span>
                    <span className={styles.time}>{sitting.time_range}</span>
                  </div>
                )}
              </div>

              {sitting.location && (
                <div className={styles.location}>
                  <span className={styles.locationIcon}>📍</span>
                  {sitting.location}
                </div>
              )}

              <div className={styles.description}>
                <p>{sitting.description}</p>
              </div>

              {sitting.scrutins && sitting.scrutins.length > 0 && (
                <div className={styles.scrutinsSection}>
                  <h2>Scrutins de cette séance</h2>
                  <div className={styles.scrutinsList}>
                    {sitting.scrutins.map((scrutin) => (
                      <Link
                        key={scrutin.id}
                        href={`/votes/${scrutin.id}`}
                        className={styles.scrutinItem}
                      >
                        <span
                          className={
                            scrutin.sort_code === "adopté"
                              ? styles.scrutinBadgeAdopte
                              : styles.scrutinBadgeRejete
                          }
                        >
                          {scrutin.sort_code === "adopté" ? "Adopté" : "Rejeté"}
                        </span>
                        <span className={styles.scrutinTitle}>
                          {scrutin.titre}
                        </span>
                        <span className={styles.scrutinLink}>
                          Voir le scrutin →
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {sitting.agenda_items.length > 0 && (
                <div className={styles.agendaSection}>
                  <h2>Ordre du jour</h2>
                  <div className={styles.agendaItems}>
                    {sitting.agenda_items.map((item, index) => (
                      <div key={item.id} className={styles.agendaItem}>
                        <div className={styles.itemHeader}>
                          <span className={styles.itemNumber}>{index + 1}</span>
                          {item.scheduled_time && (
                            <span className={styles.itemTime}>
                              {item.scheduled_time.substring(0, 5)}
                            </span>
                          )}
                          <span className={styles.itemCategory}>
                            {item.category}
                          </span>
                        </div>
                        <h3 className={styles.itemTitle}>{item.title}</h3>
                        {item.description !== item.title && (
                          <p className={styles.itemDescription}>
                            {item.description}
                          </p>
                        )}
                        {item.reference_code && (
                          <p className={styles.itemReference}>
                            Référence: {item.reference_code}
                          </p>
                        )}
                        {item.official_url && (
                          <a
                            href={item.official_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.itemLink}
                          >
                            Consulter le document officiel →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sitting.source_metadata &&
                sitting.source_metadata.original_source_url && (
                  <div className={styles.source}>
                    <h3>Source et provenance</h3>
                    <p>
                      <strong>
                        Données officielles de l'Assemblée nationale
                      </strong>
                    </p>
                    <p className={styles.sourceDate}>
                      Dernière synchronisation :{" "}
                      {new Date(
                        sitting.source_metadata.last_synced_at,
                      ).toLocaleString("fr-FR")}
                    </p>
                    <a
                      href={sitting.source_metadata.original_source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.sourceLink}
                    >
                      Voir la source originale →
                    </a>
                  </div>
                )}
            </>
          )}
    </div>
  );
}
