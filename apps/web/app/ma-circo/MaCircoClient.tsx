"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AgendaRangeResponse } from "@agora/shared";
import { getTodayDate, addDays, formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";
import styles from "./ma-circo.module.css";
import { getCanonicalDepartementName } from "@agora/shared";

const DAYS_AHEAD = 14;

type LookupState =
  | { status: "idle" }
  | { status: "success"; code: string; name: string }
  | { status: "error"; message: string };

function inferDepartementCodeFromPostalCode(cp: string): string | null {
  const trimmed = cp.trim();
  if (!/^\d{5}$/.test(trimmed)) return null;

  if (trimmed.startsWith("97") || trimmed.startsWith("98")) {
    // DOM-TOM: use first 3 digits (971, 972, 973, 974, 976, etc.)
    return trimmed.slice(0, 3);
  }

  if (trimmed.startsWith("20")) {
    // Corse: 201xx → 2A, 202xx → 2B (approximation)
    const firstThree = parseInt(trimmed.slice(0, 3), 10);
    if (!Number.isNaN(firstThree)) {
      if (firstThree <= 201) return "2A";
      return "2B";
    }
  }

  return trimmed.slice(0, 2);
}

export default function MaCircoClient() {
  const [postalCode, setPostalCode] = useState("");
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" });
  const [loadingAgendas, setLoadingAgendas] = useState<boolean>(true);
  const [agendaRange, setAgendaRange] = useState<AgendaRangeResponse | null>(
    null
  );
  const [agendaError, setAgendaError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingAgendas(true);
      setAgendaError(null);
      try {
        const today = getTodayDate();
        const to = addDays(today, DAYS_AHEAD);
        const data = await apiClient.getAgendaRange(today, to);
        setAgendaRange(data);
      } catch (err) {
        setAgendaError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les prochaines séances"
        );
        setAgendaRange(null);
      } finally {
        setLoadingAgendas(false);
      }
    };

    void load();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inferDepartementCodeFromPostalCode(postalCode);
    if (!code) {
      setLookup({
        status: "error",
        message: "Veuillez entrer un code postal valide (5 chiffres)."
      });
      return;
    }
    const canonical = getCanonicalDepartementName(code);
    if (!canonical) {
      setLookup({
        status: "error",
        message:
          "Ce code postal ne correspond pas à un département connu. Vérifiez le code et réessayez."
      });
      return;
    }
    setLookup({
      status: "success",
      code,
      name: canonical
    });
  };

  const today = getTodayDate();

  return (
    <div className={styles.wrapper}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Ma circonscription</h1>
        <p className={styles.subtitle}>
          Entrez votre code postal pour retrouver votre département et accéder
          rapidement aux informations utiles pendant la campagne.
        </p>
      </header>

      <section className={styles.lookupSection}>
        <h2 className={styles.sectionTitle}>1. Votre point de départ</h2>
        <p className={styles.sectionIntro}>
          Ce module utilise une approximation à partir du code postal pour
          retrouver votre département. Pour le détail précis de votre
          circonscription, utilisez ensuite les liens proposés.
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="cp" className={styles.label}>
            Code postal
          </label>
          <div className={styles.inputRow}>
            <input
              id="cp"
              type="text"
              inputMode="numeric"
              pattern="\d{5}"
              maxLength={5}
              className={styles.input}
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="75005"
              aria-describedby="cp-hint"
            />
            <button type="submit" className={styles.submitButton}>
              Trouver mon département
            </button>
          </div>
          <p id="cp-hint" className={styles.hint}>
            Exemple : 75005 pour Paris 5e, 13001 pour Marseille 1er, 97400 pour
            La Réunion.
          </p>
        </form>

        {lookup.status === "error" && (
          <div className={styles.lookupError} role="alert">
            {lookup.message}
          </div>
        )}

        {lookup.status === "success" && (
          <div className={styles.lookupResult}>
            <p className={styles.lookupHeadline}>
              Pour le code postal <strong>{postalCode}</strong>, nous avons
              identifié le département :
            </p>
            <p className={styles.lookupDept}>
              <span className={styles.lookupDeptCode}>{lookup.code}</span>
              <span className={styles.lookupDeptName}>{lookup.name}</span>
            </p>
            <p className={styles.lookupNext}>
              Pour retrouver précisément votre député et votre circonscription :
            </p>
            <ul className={styles.linksList}>
              <li>
                <Link href="/mon-depute" className={styles.primaryLink}>
                  Trouver mon député →
                </Link>
              </li>
              <li>
                <Link href="/circonscriptions" className={styles.secondaryLink}>
                  Parcourir les circonscriptions →
                </Link>
              </li>
            </ul>
            <p className={styles.lookupNote}>
              Attention : un même département peut contenir plusieurs
              circonscriptions. Pour une information exacte, utilisez les pages
              dédiées ci-dessus.
            </p>
          </div>
        )}
      </section>

      <section className={styles.agendaSection}>
        <h2 className={styles.sectionTitle}>
          2. Les prochaines séances nationales
        </h2>
        <p className={styles.sectionIntro}>
          Quel que soit votre département, ces séances concernent tout le pays.
          Elles peuvent porter sur des thèmes de campagne comme le pouvoir
          d&apos;achat, le climat, la santé ou l&apos;éducation.
        </p>

        {loadingAgendas && (
          <div className="stateLoading">Chargement des prochaines séances...</div>
        )}

        {agendaError && !loadingAgendas && (
          <div className="stateError">
            <p>Erreur : {agendaError}</p>
          </div>
        )}

        {!loadingAgendas && !agendaError && agendaRange && (
          <div className={styles.agendaList}>
            {agendaRange.agendas.length === 0 ? (
              <div className="stateEmpty">
                <p>Aucune séance n&apos;est encore planifiée pour les prochains jours.</p>
              </div>
            ) : (
              agendaRange.agendas.map((agenda) => (
                <div key={agenda.date} className={styles.dateBlock}>
                  <div className={styles.dateHeader}>
                    <h3>{formatDate(agenda.date)}</h3>
                    {agenda.date === today && (
                      <span className={styles.todayBadge}>Aujourd&apos;hui</span>
                    )}
                    <Link
                      href={`/?date=${agenda.date}`}
                      className={styles.viewDayLink}
                    >
                      Voir cette journée →
                    </Link>
                  </div>

                  {agenda.sittings.length === 0 ? (
                    <p className={styles.noSittings}>
                      Aucune séance pour cette date.
                    </p>
                  ) : (
                    <ul className={styles.sittings}>
                      {agenda.sittings.map((sitting) => (
                        <li key={sitting.id} className={styles.sittingItem}>
                          <Link
                            href={`/sitting/${sitting.id}`}
                            className={styles.sittingLink}
                          >
                            <h4 className={styles.sittingTitle}>
                              {sitting.title}
                            </h4>
                            {sitting.time_range && (
                              <span className={styles.sittingTime}>
                                {sitting.time_range}
                              </span>
                            )}
                            {sitting.location && (
                              <span className={styles.sittingMeta}>
                                📍 {sitting.location}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}

