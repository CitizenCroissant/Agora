import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, typography } from "@/theme";

const LINKS = [
  {
    href: "/mon-depute",
    label: "Mon député",
    description: "Trouver et suivre votre député",
    icon: "person" as const,
  },
  {
    href: "/groupes",
    label: "Groupes politiques",
    description: "Voir les groupes et leurs positions",
    icon: "people" as const,
  },
  {
    href: "/circonscriptions",
    label: "Circonscriptions",
    description: "Carte et liste des circonscriptions",
    icon: "map" as const,
  },
];

export default function ExplorerScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.intro}>
        Explorer les députés, groupes et circonscriptions.
      </Text>
      {LINKS.map((item) => (
        <TouchableOpacity
          key={item.href}
          style={styles.card}
          onPress={() => router.push(item.href)}
          activeOpacity={0.7}
        >
          <Ionicons name={item.icon} size={28} color={colors.primary} />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{item.label}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.textLight} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  intro: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    marginBottom: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardText: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  cardDescription: {
    fontSize: typography.fontSize.md,
    color: colors.textLight,
    marginTop: 2,
  },
});
