"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Deputy } from "@agora/shared";
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (acteurRef) {
      loadDeputy(acteurRef);
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
          <div className={styles.profileHeader}>
            <h1 className={styles.title}>{displayName}</h1>
            {deputy.groupe_politique && (
              <span className={styles.badge}>{deputy.groupe_politique}</span>
            )}
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoSection}>
              <h2>Identité</h2>
              <dl className={styles.infoList}>
                <div className={styles.infoRow}>
                  <dt>Identifiant acteur</dt>
                  <dd>
                    <code>{deputy.acteur_ref}</code>
                  </dd>
                </div>
                {deputy.date_naissance && (
                  <div className={styles.infoRow}>
                    <dt>Date de naissance</dt>
                    <dd>
                      {formatDate(deputy.date_naissance)}
                      {age != null && ` (${age} ans)`}
                    </dd>
                  </div>
                )}
                {deputy.lieu_naissance && (
                  <div className={styles.infoRow}>
                    <dt>Lieu de naissance</dt>
                    <dd>{deputy.lieu_naissance}</dd>
                  </div>
                )}
                {deputy.profession && (
                  <div className={styles.infoRow}>
                    <dt>Profession</dt>
                    <dd>{deputy.profession}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className={styles.infoSection}>
              <h2>Mandat</h2>
              <dl className={styles.infoList}>
                {(deputy.date_debut_mandat || deputy.date_fin_mandat) && (
                  <div className={styles.infoRow}>
                    <dt>Statut du mandat</dt>
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
                  <div className={styles.infoRow}>
                    <dt>Circonscription</dt>
                    <dd>
                      {deputy.circonscription_ref ? (
                        <Link
                          href={`/circonscriptions/${encodeURIComponent(deputy.circonscription_ref ?? "")}`}
                          className={styles.actionLink}
                        >
                          {deputy.circonscription}
                        </Link>
                      ) : (
                        deputy.circonscription
                      )}
                    </dd>
                  </div>
                )}
                {deputy.departement && (
                  <div className={styles.infoRow}>
                    <dt>Département</dt>
                    <dd>{deputy.departement}</dd>
                  </div>
                )}
                {deputy.date_debut_mandat && (
                  <div className={styles.infoRow}>
                    <dt>Début du mandat</dt>
                    <dd>{formatDate(deputy.date_debut_mandat)}</dd>
                  </div>
                )}
                {deputy.date_fin_mandat &&
                  !isCurrentlySitting(deputy.date_fin_mandat) && (
                    <div className={styles.infoRow}>
                      <dt>Fin du mandat</dt>
                      <dd>{formatDate(deputy.date_fin_mandat)}</dd>
                    </div>
                  )}
                {deputy.legislature && (
                  <div className={styles.infoRow}>
                    <dt>Législature</dt>
                    <dd>{deputy.legislature}e</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className={styles.infoSection}>
              <h2>Affiliation politique</h2>
              <dl className={styles.infoList}>
                {deputy.groupe_politique && (
                  <div className={styles.infoRow}>
                    <dt>Groupe politique</dt>
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
                  <div className={styles.infoRow}>
                    <dt>Parti politique</dt>
                    <dd>{deputy.parti_politique}</dd>
                  </div>
                )}
              </dl>
            </div>

            {deputy.commissions && deputy.commissions.length > 0 && (
              <div className={styles.infoSection}>
                <h2>Commissions et organes</h2>
                <ul className={styles.commissionsList}>
                  {deputy.commissions.map((org) => (
                    <li key={org.id}>
                      <Link
                        href={`/commissions/${encodeURIComponent(org.id)}`}
                        className={styles.actionLink}
                      >
                        {org.libelle ?? org.libelle_abrege ?? org.id}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {isCurrentlySitting(deputy.date_fin_mandat) && (
            <section
              className={styles.contactSection}
              aria-labelledby="contact-depute-heading"
            >
              <h2 id="contact-depute-heading" className={styles.contactHeading}>
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

          <div className={styles.actions}>
            <Link
              href={`/votes/deputy/${encodeURIComponent(deputy.acteur_ref)}`}
              className={styles.actionLink}
            >
              Voir l&apos;historique des votes →
            </Link>
            {deputy.official_url && (
              <a
                href={deputy.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.actionLink}
              >
                Fiche sur assemblee-nationale.fr →
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}
