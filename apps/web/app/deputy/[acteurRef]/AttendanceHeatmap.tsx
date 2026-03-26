import { useMemo } from "react";
import { DeputyAttendanceHeatmapCell } from "@agora/shared";
import styles from "./deputy.module.css";

interface Props {
  cells: DeputyAttendanceHeatmapCell[];
}

interface DayCell {
  date: string;
  cell?: DeputyAttendanceHeatmapCell;
}

function buildRollingDays(dayCount = 364): DayCell[] {
  // Fixed 52-week window to avoid dangling partial-week columns.
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (dayCount - 1));

  const days: DayCell[] = [];
  let current = start;
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    days.push({ date: `${y}-${m}-${d}` });
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
  }
  return days;
}

function tileClassForStatus(
  status: DeputyAttendanceHeatmapCell["status"],
  score: number
) {
  switch (status) {
    case "FULL":
      return styles.heatmapTileFull;
    case "PARTIAL":
      if (score >= 70) return styles.heatmapTilePartialHigh;
      if (score >= 40) return styles.heatmapTilePartialMid;
      return styles.heatmapTilePartialLow;
    case "ABSENT":
      return styles.heatmapTileAbsent;
    case "EXCUSED":
      return styles.heatmapTileExcused;
    case "NO_ACTIVITY":
    default:
      return styles.heatmapTileEmpty;
  }
}

function LegendItem({
  className,
  label
}: {
  className: string;
  label: string;
}) {
  return (
    <span className={styles.heatmapLegendItem}>
      <span className={`${styles.heatmapLegendSwatch} ${className}`} />
      <span>{label}</span>
    </span>
  );
}

export function AttendanceHeatmap({ cells }: Props) {
  const dayMap = useMemo(() => {
    const map = new Map<string, DeputyAttendanceHeatmapCell>();
    for (const c of cells) {
      map.set(c.date, c);
    }
    return map;
  }, [cells]);

  const days = useMemo(() => buildRollingDays(364), []);

  return (
    <div className={styles.heatmapWrapper}>
      <div className={styles.heatmapGrid} aria-label="Calendrier de présence">
        {days.map((d) => {
          const cell = dayMap.get(d.date);
          if (!cell) {
            const emptyTitle = `${d.date} • Aucune activité enregistrée`;
            return (
              <div
                key={d.date}
                className={styles.heatmapTileEmpty}
                title={emptyTitle}
                aria-label={emptyTitle}
              />
            );
          }

          const className = tileClassForStatus(cell.status, cell.score);
          const title = [
            d.date,
            cell.status === "FULL"
              ? "Présence complète"
              : cell.status === "PARTIAL"
                ? "Présence partielle"
                : cell.status === "ABSENT"
                  ? "Absent"
                  : cell.status === "EXCUSED"
                    ? "Absence excusée"
                    : "Aucune activité",
            `${cell.attendedSittings}/${cell.totalSittings} réunions`,
            `${cell.participatedVotes}/${cell.totalVotes} votes`,
            `Score civique : ${cell.score}/100`
          ].join(" • ");

          return (
            <div
              key={d.date}
              className={className}
              title={title}
              aria-label={title}
            />
          );
        })}
      </div>
      <div className={styles.heatmapLegend}>
        <span className={styles.heatmapLegendLabel}>Présence</span>
        <LegendItem className={styles.heatmapTileEmpty} label="Aucune activité" />
        <LegendItem className={styles.heatmapTilePartialLow} label="Faible" />
        <LegendItem className={styles.heatmapTilePartialHigh} label="Bonne" />
        <LegendItem className={styles.heatmapTileFull} label="Excellente" />
        <LegendItem className={styles.heatmapTileAbsent} label="Absent" />
        <LegendItem className={styles.heatmapTileExcused} label="Excusé" />
      </div>
    </div>
  );
}

