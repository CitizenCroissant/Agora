import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, typography, shadows, sectionColors } from "@/theme";

const LINKS = [
  {
    href: "/mon-depute",
    label: "Mon député",
    description: "Trouver et suivre votre représentant",
    icon: "person" as const,
    accentColor: sectionColors.aujourdhui
  },
  {
    href: "/groupes",
    label: "Groupes politiques",
    description: "Voir les groupes et leurs positions de vote",
    icon: "people" as const,
    accentColor: sectionColors.votes
  },
  {
    href: "/circonscriptions",
    label: "Circonscriptions",
    description: "Carte et liste des 577 circonscriptions",
    icon: "map" as const,
    accentColor: sectionColors.calendrier
  }
];

export default function ExplorerScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionAccent, { backgroundColor: sectionColors.explorer }]} />
        <Text style={styles.sectionTitle}>Explorer l&apos;Assemblée</Text>
      </View>
      <Text style={styles.intro}>
        Découvrez les acteurs de la vie parlementaire — vos élus, leurs groupes et vos circonscriptions.
      </Text>
      {LINKS.map((item) => (
        <TouchableOpacity
          key={item.href}
          style={styles.card}
          onPress={() => router.push(item.href)}
          activeOpacity={0.75}
        >
          <View style={[styles.iconContainer, { backgroundColor: item.accentColor + '18' }]}>
            <Ionicons name={item.icon} size={24} color={item.accentColor} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{item.label}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundAlt
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  sectionAccent: {
    width: 4,
    height: 22,
    borderRadius: 2
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary
  },
  intro: {
    fontSize: typography.fontSize.md,
    color: colors.textLight,
    lineHeight: 20,
    marginBottom: spacing.xl
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center"
  },
  cardText: {
    flex: 1,
    marginLeft: spacing.md
  },
  cardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: 2
  },
  cardDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    lineHeight: 18
  }
});
