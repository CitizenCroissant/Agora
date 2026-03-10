"use client";

import Link from "next/link";
import type { Scrutin, SittingWithItems } from "@agora/shared";
import { formatDate } from "@agora/shared";
import styles from "./BillLifecycle.module.css";

/** Legislative steps (aligned with democratie "Comment une loi est votée"). Index = step order. */
const LEGISLATIVE_STEPS = [
  { id: 1, short: "Initiative", full: "Initiative (projet ou proposition de loi)" },
  { id: 2, short: "Commission", full: "Examen en commission" },
  { id: 3, short: "Débat AN", full: "Débat à l'Assemblée" },
  { id: 4, short: "Vote AN", full: "Vote à l'Assemblée" },
  { id: 5, short: "Navette", full: "Navette avec le Sénat" },
  { id: 6, short: "Accord", full: "Accord entre les deux chambres" },
  { id: 7, short: "Promulgation", full: "Promulgation" }
] as const;

export interface BillLifecycleProps {
  /** Scrutins linked to this bill (will be sorted chronologically) */
  scrutins: Scrutin[];
  /** Sittings where these scrutins took place (for timeline links) */
  sittings?: SittingWithItems[] | null;
  /** Official dossier URL for "next step" link */
  officialUrl?: string | null;
}

/** Derive current step index: 0-based. No scrutins → step 2 (Commission). Has scrutins → step 4 (Vote AN) done, current = 5 (Navette). */
function getCurrentStepIndex(scrutins: Scrutin[]): number {
  if (scrutins.length === 0) return 2; // Commission or before vote
  return 5; // Vote AN done, next = Navette
}

/** Last scrutin date for status line. */
function getLastScrutinDate(scrutins: Scrutin[]): string | null {
  if (scrutins.length === 0) return null;
  const sorted = [...scrutins].sort(
    (a, b) => new Date(b.date_scrutin).getTime() - new Date(a.date_scrutin).getTime()
  );
  return sorted[0].date_scrutin;
}

/** Groups scrutins by sitting_id and sorts by date; returns scrutins without sitting last, sorted by date. */
function buildTimelineSteps(
  scrutins: Scrutin[],
  sittings: SittingWithItems[] | null | undefined
): Array<
  | { type: "sitting"; sitting: SittingWithItems; scrutins: Scrutin[] }
  | { type: "scrutin"; scrutin: Scrutin }
> {
  const byDate = [...scrutins].sort(
    (a, b) =>
      new Date(a.date_scrutin).getTime() - new Date(b.date_scrutin).getTime()
  );
  const sittingMap = new Map<string, SittingWithItems>();
  if (sittings) {
    for (const s of sittings) {
      sittingMap.set(s.id, s);
    }
  }

  const steps: Array<
    | { type: "sitting"; sitting: SittingWithItems; scrutins: Scrutin[] }
    | { type: "scrutin"; scrutin: Scrutin }
  > = [];

  // Group by sitting_id (preserve chronological order of first scrutin per sitting)
  const scrutinsBySitting = new Map<string, Scrutin[]>();
  const orphanScrutins: Scrutin[] = [];

  for (const s of byDate) {
    if (s.sitting_id && sittingMap.has(s.sitting_id)) {
      const list = scrutinsBySitting.get(s.sitting_id) ?? [];
      list.push(s);
      scrutinsBySitting.set(s.sitting_id, list);
    } else {
      orphanScrutins.push(s);
    }
  }

  // Sittings in chronological order (by first scrutin date)
  const sittingOrder = [...scrutinsBySitting.entries()].sort(
    ([, listA], [, listB]) =>
      new Date(listA[0].date_scrutin).getTime() -
      new Date(listB[0].date_scrutin).getTime()
  );

  for (const [sittingId, list] of sittingOrder) {
    const sitting = sittingMap.get(sittingId);
    if (sitting) {
      steps.push({ type: "sitting", sitting, scrutins: list });
    }
  }

  for (const s of orphanScrutins) {
    steps.push({ type: "scrutin", scrutin: s });
  }

  return steps;
}

export function BillLifecycle({
  scrutins,
  sittings,
  officialUrl
}: BillLifecycleProps) {
  if (scrutins.length === 0) {
    return (
      <section className={styles.section} aria-labelledby="lifecycle-title">
        <h2 id="lifecycle-title" className={styles.sectionTitle}>
          Parcours du dossier
        </h2>
        <div className={styles.empty}>
          <p>
            Ce dossier n&apos;a pas encore fait l&apos;objet d&apos;un vote en
            séance à l&apos;Assemblée nationale. Il peut être en cours
            d&apos;examen en commission ou en attente de discussion.
          </p>
          <ul className={styles.links}>
            <li>
              <Link href="/democratie#loi">
                Comment une loi est votée (les 7 étapes)
              </Link>
            </li>
            {officialUrl && (
              <li>
                <a
                  href={officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.externalLink}
                >
                  Suivre le dossier sur assemblee-nationale.fr →
                </a>
              </li>
            )}
          </ul>
        </div>
      </section>
    );
  }

  const steps = buildTimelineSteps(scrutins, sittings);
  const currentStepIndex = getCurrentStepIndex(scrutins);
  const lastDate = getLastScrutinDate(scrutins);

  return (
    <section className={styles.section} aria-labelledby="lifecycle-title">
      <h2 id="lifecycle-title" className={styles.sectionTitle}>
        Parcours du dossier
      </h2>

      {/* At-a-glance status. Do not show adopté/rejeté for "last vote" — it's often an amendment, not the bill. */}
      <div className={styles.statusStrip} role="status" aria-live="polite">
        {scrutins.length === 0 ? (
          <span>
            <strong>Pas encore de scrutin en séance</strong> — le dossier peut
            être en commission ou en débat à l&apos;Assemblée.
          </span>
        ) : (
          <span>
            <strong>
              {scrutins.length} scrutin{scrutins.length > 1 ? "s" : ""} à
              l&apos;Assemblée
            </strong>
            {lastDate && (
              <> · Dernier scrutin le {formatDate(lastDate)}</>
            )}
          </span>
        )}
      </div>

      {/* Horizontal stepper: all steps, current highlighted */}
      <nav
        className={styles.stepper}
        aria-label="Étapes du parcours législatif"
      >
        <ol className={styles.stepperList}>
          {LEGISLATIVE_STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            return (
              <li
                key={step.id}
                className={
                  isCurrent
                    ? styles.stepperItemCurrent
                    : isCompleted
                      ? styles.stepperItemDone
                      : styles.stepperItem
                }
              >
                <span
                  className={styles.stepperDot}
                  title={step.full}
                  aria-hidden
                />
                <span className={styles.stepperLabel}>{step.short}</span>
              </li>
            );
          })}
        </ol>
        <p className={styles.stepperCurrentLabel}>
          Étape actuelle :{" "}
          <strong>{LEGISLATIVE_STEPS[currentStepIndex].full}</strong>
        </p>
      </nav>

      <p className={styles.intro}>
        Étapes connues pour ce dossier à l&apos;Assemblée nationale : séances
        publiques et votes. Pour le détail du processus (commission, navette,
        promulgation), voir{" "}
        <Link href="/democratie#loi">Comment une loi est votée</Link>.
      </p>

      <ol className={styles.timeline}>
        {steps.map((step, stepIndex) => {
          const isLastStep = stepIndex === steps.length - 1;
          if (step.type === "sitting") {
            const { sitting, scrutins: sittingScrutins } = step;
            return (
              <li
                key={sitting.id}
                className={
                  isLastStep ? `${styles.step} ${styles.stepLast}` : styles.step
                }
              >
                <div className={styles.stepMarker} aria-hidden />
                <div className={styles.stepContent}>
                  <Link
                    href={`/sitting/${sitting.id}`}
                    className={styles.sittingLink}
                  >
                    <span className={styles.stepLabel}>Séance du </span>
                    {formatDate(sitting.date)}
                  </Link>
                  {sitting.title && (
                    <p className={styles.sittingTitle}>{sitting.title}</p>
                  )}
                  <ul className={styles.scrutinsInStep}>
                    {sittingScrutins.map((scrutin) => (
                      <li key={scrutin.id} className={styles.scrutinRow}>
                        <Link
                          href={`/votes/${scrutin.id}`}
                          className={styles.scrutinLink}
                        >
                          Scrutin n°{scrutin.numero} – {scrutin.titre}
                          <span
                            className={
                              scrutin.sort_code === "adopté"
                                ? styles.badgeAdopte
                                : styles.badgeRejete
                            }
                          >
                            {scrutin.sort_code === "adopté" ? "Adopté" : "Rejeté"}
                          </span>
                        </Link>
                        <div className={styles.scrutinStats}>
                          <span className={styles.statPour}>
                            {scrutin.synthese_pour} pour
                          </span>
                          <span className={styles.statContre}>
                            {scrutin.synthese_contre} contre
                          </span>
                          <span className={styles.statAbstention}>
                            {scrutin.synthese_abstentions} abst.
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          }
          const { scrutin } = step;
          return (
            <li
              key={scrutin.id}
              className={
                isLastStep ? `${styles.step} ${styles.stepLast}` : styles.step
              }
            >
              <div className={styles.stepMarker} aria-hidden />
              <div className={styles.stepContent}>
                <div className={styles.scrutinRow}>
                  <Link href={`/votes/${scrutin.id}`} className={styles.scrutinLink}>
                    <span className={styles.stepLabel}>Vote du </span>
                    {formatDate(scrutin.date_scrutin)} – Scrutin n°{scrutin.numero}{" "}
                    {scrutin.titre}
                    <span
                      className={
                        scrutin.sort_code === "adopté"
                          ? styles.badgeAdopte
                          : styles.badgeRejete
                      }
                    >
                      {scrutin.sort_code === "adopté" ? "Adopté" : "Rejeté"}
                    </span>
                  </Link>
                  <div className={styles.scrutinStats}>
                    <span className={styles.statPour}>
                      {scrutin.synthese_pour} pour
                    </span>
                    <span className={styles.statContre}>
                      {scrutin.synthese_contre} contre
                    </span>
                    <span className={styles.statAbstention}>
                      {scrutin.synthese_abstentions} abst.
                    </span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {officialUrl && (
        <div className={styles.nextStep}>
          <p>
            <strong>Prochaine étape prévue</strong> : pour la suite du parcours
            (navette avec le Sénat, adoption définitive, promulgation),
            consultez le{" "}
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.externalLink}
            >
              dossier sur assemblee-nationale.fr
            </a>
            .
          </p>
        </div>
      )}
    </section>
  );
}
