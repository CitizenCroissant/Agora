"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SittingDetailResponse, SittingAttendanceEntry } from "@agora/shared";
import { formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./sitting.module.css";
import { PageHelp } from "@/components/PageHelp";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ShareBar } from "@/components/ShareBar";

function AttendanceSummary({ attendance }: { attendance: SittingAttendanceEntry[] }) {
  const present = attendance.filter((a) => a.presence === "présent");
  const absent = attendance.filter((a) => a.presence === "absent");
  const excused = attendance.filter((a) => a.presence === "excusé");

  const renderName = (a: SittingAttendanceEntry) => a.acteur_nom ?? a.acteur_ref;

  return (
    <div className={styles.attendanceGrid}>
      <div className={styles.attendanceBlock}>
        <span className={styles.attendanceCount}>{present.length}</span>
        <span className={styles.attendanceLabel}>Présents</span>
        <ul className={styles.attendanceList}>
          {present.map((a) => (
            <li key={a.acteur_ref}>
              <Link href={`/deputy/${encodeURIComponent(a.acteur_ref)}`} className={styles.attendanceLink}>
                {renderName(a)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.attendanceBlock}>
        <span className={styles.attendanceCount}>{absent.length}</span>
        <span className={styles.attendanceLabel}>Absents</span>
        <ul className={styles.attendanceList}>
          {absent.map((a) => (
            <li key={a.acteur_ref}>
              <Link href={`/deputy/${encodeURIComponent(a.acteur_ref)}`} className={styles.attendanceLink}>
                {renderName(a)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.attendanceBlock}>
        <span className={styles.attendanceCount}>{excused.length}</span>
        <span className={styles.attendanceLabel}>Excusés</span>
        <ul className={styles.attendanceList}>
          {excused.map((a) => (
            <li key={a.acteur_ref}>
              <Link href={`/deputy/${encodeURIComponent(a.acteur_ref)}`} className={styles.attendanceLink}>
                {renderName(a)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

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

  const breadcrumbLabel =
    sitting?.title && sitting.title.length > 50
      ? sitting.title.slice(0, 50).trim() + "…"
      : sitting?.title || "Séance";

  const showDescription =
    sitting?.description &&
    sitting.description.trim() !== sitting.title.trim();

  return (
    <div className="container">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: breadcrumbLabel }]} />

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
              <ShareBar title={sitting.title} />
              <div className={styles.sittingHeader}>
                <div>
                  <h1 className={styles.title}>{sitting.title}</h1>
                  <p className={styles.date}>{formatDate(sitting.date)}</p>
                  {sitting.organe_ref && (
                    <p className={styles.commissionInfo}>
                      <span className={styles.commissionLabel}>
                        {sitting.organe?.libelle ??
                          sitting.organe?.libelle_abrege ??
                          "Commission"}
                      </span>
                      {" · "}
                      <Link
                        href={`/commissions/${encodeURIComponent(sitting.organe_ref)}`}
                        className={styles.commissionLink}
                      >
                        Voir la commission →
                      </Link>
                    </p>
                  )}
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

              {showDescription && (
                <div className={styles.description}>
                  <h2 className={styles.descriptionHeading}>Description</h2>
                  <p>{sitting.description}</p>
                </div>
              )}

              <PageHelp
                title="Comment lire cette page ?"
                points={[
                  "La description présente le contexte général de la séance (type, lieu, horaires).",
                  "La section « Scrutins de cette séance » liste les votes formels tenus pendant cette séance.",
                  "L'« Ordre du jour » détaille les points examinés, avec leur numéro, catégorie et éventuelle référence."
                ]}
              />

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

              {sitting.attendance && sitting.attendance.length > 0 && (
                <div className={styles.attendanceSection}>
                  <h2>Présence à la réunion</h2>
                  <p className={styles.attendanceIntro}>
                    Données officielles (présents, absents, excusés) pour cette réunion de commission.
                  </p>
                  {sitting.attendance.every((a) => a.presence === "absent") && (
                    <p className={styles.attendanceNote}>
                      Pour cette réunion, l’Assemblée nationale ne publie que les absences dans l’open data.
                    </p>
                  )}
                  <AttendanceSummary attendance={sitting.attendance} />
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
