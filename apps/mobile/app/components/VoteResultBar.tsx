import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography, fonts } from "@/theme";

export type VoteResultBarVariant = "compact" | "detailed";

export interface VoteResultBarProps {
  pour: number;
  contre: number;
  abstention: number;
  /** compact: thin bar (lists). detailed: taller bar + legend (detail screens). */
  variant?: VoteResultBarVariant;
}

function buildAccessibilityLabel(
  pour: number,
  contre: number,
  abstention: number
): string {
  const total = pour + contre + abstention;
  if (total === 0) return "Aucun vote enregistré";
  const pourPct = (pour / total) * 100;
  const contrePct = (contre / total) * 100;
  const abstPct = (abstention / total) * 100;
  return `Résultat du vote : ${pourPct.toFixed(0)} % pour, ${contrePct.toFixed(0)} % contre${abstPct > 0 ? `, ${abstPct.toFixed(0)} % abstentions` : ""}`;
}

export function VoteResultBar({
  pour,
  contre,
  abstention,
  variant = "compact"
}: VoteResultBarProps) {
  const total = pour + contre + abstention;
  if (total === 0) return null;
  const pourPct = (pour / total) * 100;
  const contrePct = (contre / total) * 100;
  const abstPct = (abstention / total) * 100;
  const label = buildAccessibilityLabel(pour, contre, abstention);

  const barHeight = variant === "compact" ? 5 : 10;
  const barRadius = variant === "compact" ? 3 : 5;

  const bar = (
    <View
      style={[
        styles.bar,
        { height: barHeight, borderRadius: barRadius }
      ]}
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      <View style={[styles.segment, styles.pour, { flex: pourPct }]} />
      <View style={[styles.segment, styles.abstention, { flex: abstPct }]} />
      <View style={[styles.segment, styles.contre, { flex: contrePct }]} />
    </View>
  );

  if (variant === "compact") {
    return <View style={styles.compactWrap}>{bar}</View>;
  }

  return (
    <View style={styles.detailedWrap}>
      {bar}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Pour {pourPct.toFixed(0)}%</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.accentCoral }]} />
          <Text style={styles.legendText}>Contre {contrePct.toFixed(0)}%</Text>
        </View>
        {abstPct > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.accentAmber }]} />
            <Text style={styles.legendText}>Abst. {abstPct.toFixed(0)}%</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compactWrap: {
    marginTop: spacing.sm
  },
  detailedWrap: {
    marginBottom: spacing.lg
  },
  bar: {
    flexDirection: "row",
    overflow: "hidden",
    backgroundColor: colors.backgroundAlt,
    marginBottom: spacing.sm
  },
  segment: { height: "100%" },
  pour: { backgroundColor: colors.success },
  contre: { backgroundColor: colors.accentCoral },
  abstention: { backgroundColor: colors.accentAmber },
  legend: {
    flexDirection: "row",
    gap: spacing.lg,
    flexWrap: "wrap"
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    fontFamily: fonts.body
  }
});
