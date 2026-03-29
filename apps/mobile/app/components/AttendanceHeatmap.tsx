import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import type { DeputyAttendanceHeatmapCell } from "@agora/shared";
import { colors, spacing, radius, typography, sectionColors } from "@/theme";

const TILE = 10;
const GAP = 3;

interface Props {
  cells: DeputyAttendanceHeatmapCell[];
}

interface DayCell {
  date: string;
}

function buildRollingDays(dayCount = 364): DayCell[] {
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

function tileColor(
  status: DeputyAttendanceHeatmapCell["status"],
  score: number
): string {
  switch (status) {
    case "FULL":
      return sectionColors.calendrier;
    case "PARTIAL":
      if (score >= 70) return "rgba(43, 168, 158, 0.7)";
      if (score >= 40) return "rgba(43, 168, 158, 0.45)";
      return "rgba(43, 168, 158, 0.2)";
    case "ABSENT":
      return colors.accentCoral;
    case "EXCUSED":
      return colors.accentAmber;
    case "NO_ACTIVITY":
    default:
      return colors.border;
  }
}

function accessibilityLabelForDay(
  date: string,
  cell: DeputyAttendanceHeatmapCell | undefined
): string {
  if (!cell) {
    return `${date} • Aucune activité enregistrée`;
  }
  const statusFr =
    cell.status === "FULL"
      ? "Présence complète"
      : cell.status === "PARTIAL"
        ? "Présence partielle"
        : cell.status === "ABSENT"
          ? "Absent"
          : cell.status === "EXCUSED"
            ? "Absence excusée"
            : "Aucune activité";
  return [
    date,
    statusFr,
    `${cell.attendedSittings}/${cell.totalSittings} réunions`,
    `${cell.participatedVotes}/${cell.totalVotes} votes`,
    `Score civique : ${cell.score}/100`
  ].join(" • ");
}

function LegendItem({
  color,
  label
}: {
  color: string;
  label: string;
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
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

  const weeks = useMemo(() => {
    const chunks: DayCell[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      chunks.push(days.slice(i, i + 7));
    }
    return chunks;
  }, [days]);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="scrollbar"
        accessibilityLabel="Calendrier de présence, défilement horizontal"
      >
        <View
          style={styles.grid}
          accessibilityRole="none"
          accessibilityLabel="Calendrier de présence"
        >
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekColumn}>
              {week.map((d) => {
                const cell = dayMap.get(d.date);
                const bg = cell
                  ? tileColor(cell.status, cell.score)
                  : colors.border;
                return (
                  <View
                    key={d.date}
                    style={[styles.tile, { backgroundColor: bg }]}
                    accessibilityLabel={accessibilityLabelForDay(d.date, cell)}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.legend}>
        <Text style={styles.legendHeading}>Présence</Text>
        <LegendItem color={colors.border} label="Aucune activité" />
        <LegendItem color="rgba(43, 168, 158, 0.2)" label="Faible" />
        <LegendItem color="rgba(43, 168, 158, 0.7)" label="Bonne" />
        <LegendItem color={sectionColors.calendrier} label="Excellente" />
        <LegendItem color={colors.accentCoral} label="Absent" />
        <LegendItem color={colors.accentAmber} label="Excusé" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.sm
  },
  grid: {
    flexDirection: "row",
    gap: GAP,
    padding: spacing.sm,
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  weekColumn: {
    flexDirection: "column",
    gap: GAP
  },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: 2
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  legendHeading: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginRight: spacing.xs
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2
  },
  legendLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted
  }
});
