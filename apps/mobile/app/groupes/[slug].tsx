import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useRouter } from "expo-router";
import type { PoliticalGroupDetail, Deputy } from "@agora/shared";
import { isCurrentlySitting } from "@agora/shared";
import { apiClient } from "@/lib/api";
import { StatusMessage } from "@/app/components/StatusMessage";
import { colors, spacing, radius, typography, shadows } from "@/theme";

export default function GroupDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [group, setGroup] = useState<PoliticalGroupDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadGroup(slug);
    }
  }, [slug]);

  const loadGroup = async (s: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getPoliticalGroup(s);
      setGroup(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Groupe introuvable");
      setGroup(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: group?.label ?? "Groupe",
          headerBackTitle: "Retour"
        }}
      />
      <ScrollView style={styles.container}>
        {loading && (
          <StatusMessage type="loading" message="Chargement du groupe..." />
        )}

        {error && (
          <StatusMessage type="error" message={`Erreur: ${error}`} />
        )}

        {!loading &&
          !error &&
          group &&
          (() => {
            const current: Deputy[] = [];
            const past: Deputy[] = [];
            for (const d of group.deputies) {
              if (isCurrentlySitting(d.date_fin_mandat)) current.push(d);
              else past.push(d);
            }
            const renderDeputy = (d: Deputy) => {
              const name = `${d.civil_prenom} ${d.civil_nom}`.trim();
              return (
                <TouchableOpacity
                  key={d.acteur_ref}
                  style={styles.deputyCard}
                  onPress={() =>
                    router.push(`/deputy/${encodeURIComponent(d.acteur_ref)}`)
                  }
                >
                  <Text style={styles.deputyName}>{name}</Text>
                  {(d.circonscription || d.departement) && (
                    <View style={styles.deputyMetaRow}>
                      {d.circonscription_ref ? (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/circonscriptions/${encodeURIComponent(
                                d.circonscription_ref ?? ""
                              )}`
                            );
                          }}
                          style={styles.deputyMetaTouchable}
                        >
                          <Text style={styles.deputyMetaLink}>
                            {d.circonscription}
                          </Text>
                        </TouchableOpacity>
                      ) : d.circonscription ? (
                        <Text style={styles.deputyMeta}>
                          {d.circonscription}
                        </Text>
                      ) : null}
                      {d.circonscription && d.departement ? (
                        <Text style={styles.deputyMeta}> — </Text>
                      ) : null}
                      {d.departement ? (
                        <Text style={styles.deputyMeta}>{d.departement}</Text>
                      ) : null}
                    </View>
                  )}
                  <Text style={styles.deputyLink}>Voir la fiche →</Text>
                </TouchableOpacity>
              );
            };
            return (
              <View style={styles.content}>
                <Text style={styles.deputyCount}>
                  {group.deputy_count} député
                  {group.deputy_count !== 1 ? "s" : ""} dans ce groupe
                </Text>

                {current.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>
                      Députés en mandat ({current.length})
                    </Text>
                    <View style={styles.deputyList}>
                      {current.map(renderDeputy)}
                    </View>
                  </>
                )}

                {past.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>
                      Anciens députés ({past.length})
                    </Text>
                    <View style={styles.deputyList}>
                      {past.map(renderDeputy)}
                    </View>
                  </>
                )}

                {current.length === 0 && past.length === 0 && (
                  <Text style={styles.empty}>Aucun député dans ce groupe.</Text>
                )}
              </View>
            );
          })()}
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
    padding: spacing.lg
  },
  deputyCount: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    marginBottom: spacing.lg
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: spacing.xl,
    marginBottom: spacing.md
  },
  empty: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    marginTop: spacing.xl
  },
  deputyList: {
    gap: spacing.md
  },
  deputyCard: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.lg,
    borderRadius: radius.md,
    ...shadows.sm
  },
  deputyName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.xs
  },
  deputyMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.sm
  },
  deputyMetaTouchable: {
    alignSelf: "flex-start"
  },
  deputyMeta: {
    fontSize: typography.fontSize.md,
    color: colors.textLight
  },
  deputyMetaLink: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium
  },
  deputyLink: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium
  }
});
