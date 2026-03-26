export interface DailyAttendanceRow {
  acteur_ref: string;
  date: string;
  total_sittings: number;
  attended_sittings: number;
  total_votes: number;
  participated_votes: number;
  has_excused_absence: boolean;
  parliament_open: boolean;
}

export type HeatmapStatus =
  | "FULL"
  | "PARTIAL"
  | "ABSENT"
  | "EXCUSED"
  | "NO_ACTIVITY";

/**
 * Compute civic participation score (0–100) and heatmap status
 * for one deputy on one day.
 */
export function computeScoreAndStatus(row: DailyAttendanceRow): {
  score: number;
  status: HeatmapStatus;
} {
  if (!row.parliament_open) {
    return { score: 0, status: "NO_ACTIVITY" };
  }

  const sittingScore =
    row.total_sittings > 0
      ? row.attended_sittings / row.total_sittings
      : 1;
  const voteScore =
    row.total_votes > 0 ? row.participated_votes / row.total_votes : 1;

  // Simple weighted civic score (0–100)
  let score = 100 * (0.5 * sittingScore + 0.5 * voteScore);
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  if (row.has_excused_absence && row.attended_sittings === 0) {
    return { score, status: "EXCUSED" };
  }

  if (row.attended_sittings === 0 && row.participated_votes === 0) {
    return { score, status: "ABSENT" };
  }

  if (score >= 95) {
    return { score, status: "FULL" };
  }

  return { score, status: "PARTIAL" };
}

