import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  TouchableOpacity
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useRouter } from "expo-router";
import { SittingDetailResponse } from "@agora/shared";
import { formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";
import { StatusMessage } from "@/app/components/StatusMessage";
import { colors, spacing, radius, typography, shadows } from "@/theme";

export default function SittingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [sitting, setSitting] = useState<SittingDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadSitting(id);
    }
  }, [id]);

  const loadSitting = async (sittingId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getSitting(sittingId);
      setSitting(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sitting");
      setSitting(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: sitting?.title || "Détails",
          headerBackTitle: "Retour"
        }}
      />
      <ScrollView style={styles.container}>
        {loading && (
          <StatusMessage type="loading" message="Chargement..." />
        )}

        {error && (
          <StatusMessage type="error" message={`Erreur: ${error}`} />
        )}

        {!loading && !error && sitting && (
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{sitting.title}</Text>
              <Text style={styles.date}>{formatDate(sitting.date)}</Text>
              {sitting.time_range && (
                <View style={styles.timeContainer}>
                  <Text style={styles.timeLabel}>Horaire</Text>
                  <Text style={styles.time}>{sitting.time_range}</Text>
                </View>
              )}
            </View>

            {sitting.location && (
              <View style={styles.locationContainer}>
                <Text style={styles.location}>📍 {sitting.location}</Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.description}>{sitting.description}</Text>
            </View>

            {sitting.scrutins && sitting.scrutins.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Scrutins de cette séance
                </Text>
                {sitting.scrutins.map((scrutin) => (
                  <TouchableOpacity
                    key={scrutin.id}
                    style={styles.scrutinItem}
                    onPress={() => router.push(`/votes/${scrutin.id}`)}
                    accessibilityLabel={`${scrutin.sort_code === "adopté" ? "Adopté" : "Rejeté"} — ${scrutin.titre}`}
                    accessibilityHint="Voir les détails du scrutin"
                    accessibilityRole="button"
                  >
                    <View
                      style={[
                        styles.scrutinBadge,
                        scrutin.sort_code === "adopté"
                          ? styles.scrutinBadgeAdopte
                          : styles.scrutinBadgeRejete
                      ]}
                    >
                      <Text style={styles.scrutinBadgeText}>
                        {scrutin.sort_code === "adopté" ? "Adopté" : "Rejeté"}
                      </Text>
                    </View>
                    <Text style={styles.scrutinTitle} numberOfLines={2}>
                      {scrutin.titre}
                    </Text>
                    <Text style={styles.scrutinLink}>Voir le scrutin →</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {sitting.agenda_items.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ordre du jour</Text>
                {sitting.agenda_items.map((item, index) => (
                  <View key={item.id} style={styles.agendaItem}>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemNumber}>
                        <Text style={styles.itemNumberText}>{index + 1}</Text>
                      </View>
                      {item.scheduled_time && (
                        <Text style={styles.itemTime}>
                          {item.scheduled_time.substring(0, 5)}
                        </Text>
                      )}
                      <Text style={styles.itemCategory}>{item.category}</Text>
                    </View>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {item.description !== item.title && (
                      <Text style={styles.itemDescription}>
                        {item.description}
                      </Text>
                    )}
                    {item.reference_code && (
                      <Text style={styles.itemReference}>
                        Référence: {item.reference_code}
                      </Text>
                    )}
                    {item.official_url && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(item.official_url!)}
                        accessibilityLabel={`Consulter le document officiel : ${item.title}`}
                        accessibilityRole="link"
                      >
                        <Text style={styles.itemLink}>
                          Consulter le document officiel →
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            {sitting.source_metadata &&
              sitting.source_metadata.original_source_url && (
                <View style={styles.sourceContainer}>
                  <Text style={styles.sourceTitle}>Source et provenance</Text>
                  <Text style={styles.sourceLabel}>
                    Données officielles de l&apos;Assemblée nationale
                  </Text>
                  <Text style={styles.sourceDate}>
                    Dernière synchronisation:{" "}
                    {new Date(
                      sitting.source_metadata.last_synced_at
                    ).toLocaleDateString("fr-FR")}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(
                        sitting.source_metadata!.original_source_url
                      )
                    }
                    accessibilityLabel="Voir la source originale sur l'Assemblée nationale"
                    accessibilityRole="link"
                  >
                    <Text style={styles.sourceLink}>
                      Voir la source originale →
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundAlt
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl
  },
  header: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  title: {
    fontSize: typography.fontSize.xl + 2,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
    lineHeight: 30
  },
  date: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    textTransform: "capitalize",
    marginBottom: spacing.md
  },
  timeContainer: {
    backgroundColor: colors.primaryTintLight,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primaryTintMedium
  },
  timeLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  time: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary
  },
  locationContainer: {
    backgroundColor: colors.backgroundAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border
  },
  location: {
    fontSize: typography.fontSize.md,
    color: colors.text
  },
  section: {
    marginBottom: spacing.xl
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.md
  },
  description: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text
  },
  agendaItem: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    flexWrap: "wrap",
    gap: spacing.sm
  },
  itemNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  itemNumberText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold
  },
  itemTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm
  },
  itemCategory: {
    fontSize: typography.fontSize.xs,
    color: colors.textInverse,
    backgroundColor: colors.accentTeal,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    textTransform: "uppercase",
    fontWeight: typography.fontWeight.semibold
  },
  itemTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
    color: colors.text
  },
  itemDescription: {
    fontSize: typography.fontSize.md,
    lineHeight: 20,
    color: colors.textLight,
    marginBottom: spacing.xs
  },
  itemReference: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs
  },
  itemLink: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium
  },
  sourceContainer: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.lg,
    ...shadows.sm
  },
  sourceTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
    color: colors.text
  },
  sourceLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
    color: colors.text
  },
  sourceDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.sm
  },
  sourceLink: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium
  },
  scrutinItem: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  scrutinBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginBottom: spacing.sm
  },
  scrutinBadgeAdopte: {
    backgroundColor: colors.successBg
  },
  scrutinBadgeRejete: {
    backgroundColor: colors.errorBg
  },
  scrutinBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text
  },
  scrutinTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm
  },
  scrutinLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium
  }
});
