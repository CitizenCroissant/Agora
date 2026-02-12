/**
 * Static diagram of the French legislative process: 7 steps in a vertical flow.
 * Mirrors the steps in LegislativeProcessSteps for users who prefer to scan.
 */
import styles from "./DemocracyDiagram.module.css";

const STEPS = [
  "Initiative",
  "Commission",
  "Débat (AN)",
  "Vote (AN)",
  "Navette / Sénat",
  "Accord 2 chambres",
  "Promulgation"
];

export function DemocracyDiagram() {
  return (
    <figure className={styles.figure}>
      <svg
        viewBox="0 0 200 520"
        className={styles.svg}
        role="img"
        aria-label="Schéma du parcours d’une loi : initiative, commission, débat, vote, navette, accord, promulgation"
      >
        <defs>
          <marker
            id="arrow"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="var(--color-primary)" />
          </marker>
        </defs>
        {STEPS.map((label, i) => {
          const y = 30 + i * 70;
          const isLast = i === STEPS.length - 1;
          const stepId = i + 1;
          return (
            <g key={label}>
              <a
                href={`#loi-step-${stepId}`}
                className={styles.stepLink}
                aria-label={`Aller à l’étape ${stepId} : ${label}`}
              >
                <rect
                  x="50"
                  y={y}
                  width="100"
                  height="44"
                  rx="6"
                  className={styles.box}
                />
                <text
                  x="100"
                  y={y + 28}
                  textAnchor="middle"
                  className={styles.label}
                >
                  {label}
                </text>
              </a>
              {!isLast && (
                <line
                  x1="100"
                  y1={y + 44}
                  x2="100"
                  y2={y + 70}
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                  markerEnd="url(#arrow)"
                />
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className={styles.caption}>
        Parcours simplifié d’une loi : de l’initiative à la promulgation
      </figcaption>
    </figure>
  );
}
