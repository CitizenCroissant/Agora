import styles from "./PeriodControlRow.module.css";

export type PeriodControlAccent = "votes" | "timeline";

export interface PeriodControlRowProps {
  accent: PeriodControlAccent;
  viewMode: "week" | "month";
  onViewModeChange: (mode: "week" | "month") => void;
  periodLabel: string;
  dateInput: string;
  onDateInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  className?: string;
}

export function PeriodControlRow({
  accent,
  viewMode,
  onViewModeChange,
  periodLabel,
  dateInput,
  onDateInputChange,
  onPrevious,
  onNext,
  onToday,
  className
}: PeriodControlRowProps) {
  return (
    <div
      className={`${styles.row} ${className ?? ""}`.trim()}
      data-accent={accent}
    >
      <div className={styles.left}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onPrevious}
          aria-label="Période précédente"
          title="Période précédente"
        >
          ‹
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onNext}
          aria-label="Période suivante"
          title="Période suivante"
        >
          ›
        </button>
        <button
          type="button"
          className={styles.todayButton}
          onClick={onToday}
        >
          Aujourd&apos;hui
        </button>
      </div>

      <div className={styles.center}>
        <h2 className={styles.periodTitle}>{periodLabel}</h2>
      </div>

      <div className={styles.right}>
        <div className={styles.datePickerWrapper}>
          <span className={styles.calendarIcon} aria-hidden>
            📅
          </span>
          <input
            type="date"
            className={styles.datePicker}
            value={dateInput}
            onChange={onDateInputChange}
            aria-label="Sélectionner une date"
            title="Choisir une date"
          />
        </div>
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={`${styles.viewButton} ${viewMode === "week" ? styles.activeView : ""}`}
            onClick={() => onViewModeChange("week")}
            title="Vue semaine"
            aria-label="Vue semaine"
            aria-pressed={viewMode === "week"}
          >
            S
          </button>
          <button
            type="button"
            className={`${styles.viewButton} ${viewMode === "month" ? styles.activeView : ""}`}
            onClick={() => onViewModeChange("month")}
            title="Vue mois"
            aria-label="Vue mois"
            aria-pressed={viewMode === "month"}
          >
            M
          </button>
        </div>
      </div>
    </div>
  );
}
