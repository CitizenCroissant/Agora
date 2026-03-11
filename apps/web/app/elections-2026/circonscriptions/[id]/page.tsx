"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type {
  CirconscriptionDetail,
  Deputy
} from "@agora/shared";
import { apiClient } from "@/lib/api";
import { isCurrentlySitting, getCirconscriptionDisplayName } from "@agora/shared";
import { Breadcrumb } from "@/components/Breadcrumb";
import styles from "./elections-circo.module.css";

const ELECTION_YEAR = 2026;

export default function ElectionsCircoPage() {
  const params = useParams();
  const id = (params?.id as string) ?? "";

  const [circo, setCirco] = useState<CirconscriptionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void loadCirco(id);
  }, [id]);

  const loadCirco = async (circoId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getCirconscription(circoId);
      setCirco(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les informations pour cette circonscription."
      );
      setCirco(null);
    } finally {
      setLoading(false);
    }
  };

  const currentDeputies: Deputy[] =
    circo?.deputies.filter((d) => isCurrentlySitting(d.date_fin_mandat)) ?? [];

  const circoLabel =
    circo?.label ?? (id ? getCirconscriptionDisplayName(id) ?? id : "");

  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Circonscriptions", href: "/circonscriptions" },
          { label: circoLabel || "Circonscription", href: `/circonscriptions/${encodeURIComponent(id)}` },
          { label: "Élections 2026" }
        ]}
      />

      <div className={styles.header}>
        <h1 className={styles.title}>
          Élections 2026 – {circoLabel || "Circonscription"}
        </h1>
        <p className={styles.subtitle}>
          Cette page affichera bientôt la liste officielle des candidat·es aux
          élections législatives {ELECTION_YEAR} dans cette circonscription,
          avec leur parti politique et, lorsque c&apos;est possible, leurs
          mandats passés.
        </p>
        <p className={styles.meta}>
          En attendant la publication des données officielles, vous pouvez déjà
          consulter les député·es actuels de cette circonscription et suivre les
          séances à l&apos;Assemblée nationale.
        </p>
      </div>

      <div className={styles.layout}>
        <section>
          <div className={styles.statusBox}>
            <p className={styles.statusTitle}>Données candidates à venir</p>
            {loading && (
              <p>
                Chargement des informations de circonscription… Les données
                détaillant les candidat·es seront ajoutées dès qu&apos;elles
                seront publiées en open data.
              </p>
            )}
            {!loading && error && (
              <p>
                {error} Les données de candidatures pour cette circonscription
                ne sont pas encore disponibles.
              </p>
            )}
            {!loading && !error && (
              <p>
                Les données de candidatures pour les élections législatives{" "}
                {ELECTION_YEAR} ne sont pas encore publiées par les autorités.
                Cette page se mettra automatiquement à jour dès que les
                informations seront disponibles.
              </p>
            )}
            <p className={styles.hint}>
              Pour l&apos;instant, Agora se concentre sur{" "}
              <Link href="/" className={styles.link}>
                le suivi des séances
              </Link>{" "}
              et des{" "}
              <Link href="/votes" className={styles.link}>
                scrutins à l&apos;Assemblée nationale
              </Link>
              . Les candidat·es seront ajoutés dès que les données officielles
              seront disponibles.
            </p>
          </div>
        </section>

        <aside className={styles.sidePanel}>
          <h2 className={styles.sideTitle}>Député·es actuels</h2>
          {currentDeputies.length === 0 && (
            <p>
              Aucun député en mandat n&apos;a été trouvé pour cette
              circonscription dans la base actuelle.
            </p>
          )}
          {currentDeputies.length > 0 && (
            <ul className={styles.currentDeputiesList}>
              {currentDeputies.map((d) => (
                <li key={d.acteur_ref} className={styles.currentDeputyItem}>
                  <div>
                    <div className={styles.currentDeputyName}>
                      {d.civil_prenom} {d.civil_nom}
                    </div>
                    {d.groupe_politique && (
                      <div className={styles.currentDeputyParty}>
                        {d.groupe_politique}
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/deputy/${encodeURIComponent(d.acteur_ref)}`}
                    className={styles.currentDeputyLink}
                  >
                    Fiche →
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className={styles.comingSoon}>
            Plus tard, cette colonne pourra aussi afficher le lien entre
            candidat·es et député·es sortants.
          </p>
        </aside>
      </div>
    </div>
  );
}

