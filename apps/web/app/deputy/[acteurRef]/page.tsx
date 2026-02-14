"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Deputy,
  DeputyVotesResponse,
  DeputyVoteRecord,
  DeputyAttendanceResponse,
  DeputyAttendanceEntry
} from "@agora/shared";
import {
  formatDate,
  slugify,
  mandateStatusLabel,
  isCurrentlySitting
} from "@agora/shared";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import styles from "./deputy.module.css";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ShareBar } from "@/components/ShareBar";

const POSITION_LABELS: Record<string, string> = {
  pour: "Pour",
  contre: "Contre",
  abstention: "Abstention",
  non_votant: "Non votant"
};

const RECENT_VOTES_COUNT = 5;

/** Start of current month (YYYY-MM-DD) */
function startOfThisMonth(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

/** Count votes in a given month (date_scrutin >= monthStart and < next month) */
function countVotesInMonth(
  votes: DeputyVoteRecord[],
  monthStart: string
): number {
  const [y, m] = monthStart.split("-").map(Number);
  const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return votes.filter(
    (v) => v.date_scrutin >= monthStart && v.date_scrutin < nextMonth
  ).length;
}

function computeAge(dateNaissance: string | null): number | null {
  if (!dateNaissance) return null;
  const birth = new Date(dateNaissance);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function DeputyPage() {
  const params = useParams();
  const acteurRef = params.acteurRef as string;

  const [deputy, setDeputy] = useState<Deputy | null>(null);
  const [votes, setVotes] = useState<DeputyVotesResponse | null>(null);
  const [attendance, setAttendance] = useState<DeputyAttendanceResponse | null>(
    null
  );
  const [showAllAttendance, setShowAllAttendance] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const RECENT_ATTENDANCE_COUNT = 5;
  const attendanceList = attendance?.attendance ?? [];
  const attendanceRecent = attendanceList.slice(0, RECENT_ATTENDANCE_COUNT);
  const showAttendanceExpand =
    attendanceList.length > RECENT_ATTENDANCE_COUNT;

  useEffect(() => {
    if (acteurRef) {
      loadDeputy(acteurRef);
      loadVotes(acteurRef);
      loadAttendance(acteurRef);
    }
  }, [acteurRef]);

  const loadDeputy = async (ref: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getDeputy(ref);
      setDeputy(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Député introuvable");
      setDeputy(null);
    } finally {
      setLoading(false);
    }
  };

  const loadVotes = async (ref: string) => {
    try {
      const data = await apiClient.getDeputyVotes(ref);
      setVotes(data);
    } catch {
      setVotes(null);
    }
  };

  const loadAttendance = async (ref: string) => {
    try {
      const data = await apiClient.getDeputyAttendance(ref);
      setAttendance(data);
    } catch {
      setAttendance(null);
    }
  };

  const displayName = deputy
    ? `${deputy.civil_prenom} ${deputy.civil_nom}`.trim()
    : "";
  const age = deputy ? computeAge(deputy.date_naissance) : null;

  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Mon député", href: "/mon-depute" },
          { label: displayName || "Député" }
        ]}
      />
      {loading && <div className="stateLoading">Chargement du député...</div>}

      {error && (
        <div className="stateError">
          <p>Erreur : {error}</p>
          <p className={styles.errorHint}>
            Ce député n&apos;est peut-être pas encore dans notre base. Vérifiez
            que l&apos;ingestion des députés a été exécutée.
          </p>
        </div>
      )}

      {!loading && !error && deputy && (
        <>
          <ShareBar title={displayName} />
          <header className={styles.profileHeader}>
            <div className={styles.profileTitleRow}>
              <h1 className={styles.title}>{displayName}</h1>
              {deputy.groupe_politique && (
                <span className={styles.badge}>{deputy.groupe_politique}</span>
              )}
            </div>
            {deputy.official_url && (
              <a
                href={deputy.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.officialLink}
              >
                Fiche sur assemblee-nationale.fr →
              </a>
            )}
          </header>

          {/* 1. Fiche du député */}
          <section
            className={styles.ficheBlock}
            aria-labelledby="section-fiche"
          >
            <h2 id="section-fiche" className={styles.sectionTitle}>
              Fiche du député
            </h2>
            <dl className={styles.ficheList}>
              <div className={styles.ficheRow}>
                <dt>Identifiant</dt>
                <dd><code>{deputy.acteur_ref}</code></dd>
              </div>
              {deputy.date_naissance && (
                <div className={styles.ficheRow}>
                  <dt>Naissance</dt>
                  <dd>{formatDate(deputy.date_naissance)}{age != null && ` (${age} ans)`}</dd>
                </div>
              )}
              {deputy.profession && (
                <div className={styles.ficheRow}>
                  <dt>Profession</dt>
                  <dd>{deputy.profession}</dd>
                </div>
              )}
              {(deputy.date_debut_mandat || deputy.date_fin_mandat) && (
                <div className={styles.ficheRow}>
                  <dt>Mandat</dt>
                  <dd>
                    <span
                      className={
                        isCurrentlySitting(deputy.date_fin_mandat)
                          ? styles.mandatActuel
                          : styles.mandatPasse
                      }
                    >
                      {mandateStatusLabel(
                        deputy.date_debut_mandat,
                        deputy.date_fin_mandat
                      )}
                    </span>
                  </dd>
                </div>
              )}
              {deputy.circonscription && (
                <div className={styles.ficheRow}>
                  <dt>Circonscription</dt>
                  <dd>
                    {deputy.circonscription_ref ? (
                      <Link
                        href={`/circonscriptions/${encodeURIComponent(deputy.circonscription_ref)}`}
                        className={styles.actionLink}
                      >
                        {deputy.circonscription}
                      </Link>
                    ) : (
                      deputy.circonscription
                    )}
                    {deputy.departement && ` · ${deputy.departement}`}
                  </dd>
                </div>
              )}
              {deputy.date_debut_mandat && (
                <div className={styles.ficheRow}>
                  <dt>Début mandat</dt>
                  <dd>{formatDate(deputy.date_debut_mandat)}</dd>
                </div>
              )}
              {deputy.legislature && (
                <div className={styles.ficheRow}>
                  <dt>Législature</dt>
                  <dd>{deputy.legislature}e</dd>
                </div>
              )}
              {deputy.groupe_politique && (
                <div className={styles.ficheRow}>
                  <dt>Groupe</dt>
                  <dd>
                    <Link
                      href={`/groupes/${encodeURIComponent(slugify(deputy.groupe_politique))}`}
                      className={styles.actionLink}
                    >
                      {deputy.groupe_politique}
                    </Link>
                  </dd>
                </div>
              )}
              {deputy.parti_politique && (
                <div className={styles.ficheRow}>
                  <dt>Parti</dt>
                  <dd>{deputy.parti_politique}</dd>
                </div>
              )}
            </dl>
            {deputy.commissions && deputy.commissions.length > 0 && (
              <div className={styles.commissionsBlock}>
                <span className={styles.commissionsLabel}>Commissions et organes</span>
                <ul className={styles.commissionsChips}>
                  {deputy.commissions.map((org) => (
                    <li key={org.id}>
                      <Link
                        href={`/commissions/${encodeURIComponent(org.id)}`}
                        className={styles.commissionChip}
                      >
                        {org.libelle_abrege ?? org.libelle ?? org.id}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* 2. Activité */}
          <section
            className={styles.activitySection}
            aria-labelledby="section-activite"
          >
            <h2 id="section-activite" className={styles.sectionTitle}>
              Activité
            </h2>
            <div className={styles.activitySummary}>
              <div className={styles.activitySummaryItem}>
                <span className={styles.activitySummaryValue}>
                  {votes?.votes
                    ? countVotesInMonth(votes.votes, startOfThisMonth())
                    : "—"}
                </span>
                <span className={styles.activitySummaryLabel}>
                  scrutins ce mois
                </span>
              </div>
              <div className={styles.activitySummaryItem}>
                <span className={styles.activitySummaryValue}>
                  {votes?.votes?.length ?? "—"}
                </span>
                <span className={styles.activitySummaryLabel}>
                  scrutins au total
                </span>
              </div>
              <div className={styles.activitySummaryItem}>
                <span className={styles.activitySummaryValue}>
                  {attendance?.attendance
                    ? attendance.attendance.length
                    : attendance === null
                      ? "—"
                      : 0}
                </span>
                <span className={styles.activitySummaryLabel}>
                  réunions commission
                </span>
              </div>
            </div>

            <h3 id="section-reunions" className={styles.sectionSubtitle}>
              Présence aux réunions de commission
            </h3>
            {attendance === null && (
              <p className={styles.attendanceState}>
                Chargement…
              </p>
            )}
            {attendance?.attendance && attendance.attendance.length === 0 && (
              <p className={styles.attendanceState}>
                Aucune réunion enregistrée.
              </p>
            )}
            {attendanceList.length > 0 && (
              <>
                <ul className={styles.attendanceList}>
                  {(showAllAttendance ? attendanceList : attendanceRecent).map(
                    (a: DeputyAttendanceEntry) => (
                      <li key={a.sitting_id} className={styles.attendanceItem}>
                        <span
                          className={
                            a.presence === "présent"
                              ? styles.badgePresent
                              : a.presence === "absent"
                                ? styles.badgeAbsent
                                : styles.badgeExcuse
                          }
                        >
                          {a.presence === "présent"
                            ? "Présent"
                            : a.presence === "absent"
                              ? "Absent"
                              : "Excusé"}
                        </span>
                        <span className={styles.attendanceDate}>
                          {formatDate(a.date)}
                        </span>
                        <Link
                          href={`/sitting/${encodeURIComponent(a.sitting_id)}`}
                          className={styles.attendanceTitle}
                        >
                          {a.sitting_title || "Réunion de commission"}
                        </Link>
                      </li>
                    )
                  )}
                </ul>
                {showAttendanceExpand && (
                  <button
                    type="button"
                    onClick={() => setShowAllAttendance((v) => !v)}
                    className={styles.viewAllButton}
                  >
                    {showAllAttendance
                      ? "Voir moins de réunions"
                      : `Voir toutes les réunions (${attendanceList.length}) →`}
                  </button>
                )}
              </>
            )}

            <h3 id="section-votes" className={styles.sectionSubtitle}>
              Votes récents
            </h3>
            {votes?.votes && votes.votes.length > 0 ? (
              <>
                <ul className={styles.activityVoteList}>
                  {votes.votes
                    .slice(0, RECENT_VOTES_COUNT)
                    .map((v: DeputyVoteRecord) => (
                      <li key={v.scrutin_id} className={styles.activityVoteItem}>
                        <span
                          className={
                            v.position === "pour"
                              ? styles.badgePour
                              : v.position === "contre"
                                ? styles.badgeContre
                                : v.position === "abstention"
                                  ? styles.badgeAbstention
                                  : styles.badgeNonVotant
                          }
                        >
                          {POSITION_LABELS[v.position]}
                        </span>
                        <span className={styles.activityVoteDate}>
                          {formatDate(v.date_scrutin)}
                        </span>
                        <Link
                          href={`/votes/${v.scrutin_id}`}
                          className={styles.activityVoteTitre}
                        >
                          {v.scrutin_titre}
                        </Link>
                      </li>
                    ))}
                </ul>
                <p className={styles.activityFooter}>
                  <Link
                    href={`/votes/deputy/${encodeURIComponent(deputy.acteur_ref)}`}
                    className={styles.actionLink}
                  >
                    Voir tout l&apos;historique des votes
                    {votes.votes.length > 0
                      ? ` (${votes.votes.length})`
                      : ""}
                    {" →"}
                  </Link>
                </p>
              </>
            ) : (
              <p className={styles.activityFooter}>
                <Link
                  href={`/votes/deputy/${encodeURIComponent(deputy.acteur_ref)}`}
                  className={styles.actionLink}
                >
                  Voir l&apos;historique des votes
                  {votes?.votes ? ` (${votes.votes.length})` : ""}
                  {" →"}
                </Link>
              </p>
            )}
          </section>

          {/* 3. Contact (generic, at bottom) */}
          {isCurrentlySitting(deputy.date_fin_mandat) && (
            <section
              className={styles.contactSection}
              aria-labelledby="section-contact"
            >
              <h2 id="section-contact" className={styles.sectionTitle}>
                Contacter ce député
              </h2>
              <div className={styles.contactBlock}>
                <p className={styles.contactRow}>
                  <strong>Par courrier</strong>
                  <br />
                  {displayName}
                  <br />
                  Assemblée nationale
                  <br />
                  126 rue de l&apos;Université
                  <br />
                  75355 Paris 07 SP
                </p>
                <p className={styles.contactRow}>
                  <strong>Par téléphone</strong>
                  <br />
                  Standard de l&apos;Assemblée :{" "}
                  <a href="tel:+33140636000" className={styles.contactLink}>
                    01 40 63 60 00
                  </a>
                  <br />
                  <span className={styles.contactHint}>
                    Demander le député ou son cabinet
                  </span>
                </p>
                {deputy.official_url && (
                  <p className={styles.contactRow}>
                    <strong>En ligne</strong>
                    <br />
                    Fiche officielle avec formulaire ou coordonnées de la
                    permanence en circonscription :{" "}
                    <a
                      href={deputy.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.contactLink}
                    >
                      Voir la fiche sur assemblee-nationale.fr →
                    </a>
                  </p>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
