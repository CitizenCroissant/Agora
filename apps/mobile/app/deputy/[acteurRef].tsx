import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, Stack } from "expo-router";
import { useRouter } from "expo-router";
import type { Deputy, DeputyAttendanceHeatmapCell } from "@agora/shared";
import { formatDate, slugify } from "@agora/shared";
import { apiClient } from "@/lib/api";
import { Config } from "@/config";
import {
  registerPushToken,
  isPushSupported,
  FAVORITE_DEPUTY_KEY
} from "@/lib/notifications";
import { StatusMessage } from "@/app/components/StatusMessage";
import { AttendanceHeatmap } from "@/app/components/AttendanceHeatmap";
import { colors, spacing, radius, typography, shadows } from "@/theme";

const PUSH_ENABLED_KEY = "@agora_push_enabled";
const PUSH_TOKEN_KEY = "@agora_push_token";
const PUSH_TOPIC_KEY = "@agora_push_topic";

function computeAge(dateNaissance: string | null): number | null {
  if (!dateNaissance) return null;
  const birth = new Date(dateNaissance);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function DeputyDetailScreen() {
  const { acteurRef } = useLocalSearchParams<{ acteurRef: string }>();
  const router = useRouter();
  const [deputy, setDeputy] = useState<Deputy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [heatmap, setHeatmap] = useState<DeputyAttendanceHeatmapCell[] | null>(
    null
  );
  const [heatmapLoading, setHeatmapLoading] = useState<boolean>(false);

  useEffect(() => {
    if (acteurRef) {
      loadDeputy(acteurRef);
    }
  }, [acteurRef]);

  useEffect(() => {
    if (!acteurRef) return;
    let cancelled = false;
    setHeatmapLoading(true);
    setHeatmap(null);
    (async () => {
      try {
        const data = await apiClient.getDeputyAttendanceHeatmap(acteurRef);
        if (!cancelled) setHeatmap(data);
      } catch {
        if (!cancelled) setHeatmap(null);
      } finally {
        if (!cancelled) setHeatmapLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [acteurRef]);

  const loadDeputy = async (ref: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getDeputy(ref);
      setDeputy(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Député introuvable");
      setDeputy(null);
    } finally {
      setLoading(false);
    }
  };

  const displayName = deputy
    ? `${deputy.civil_prenom} ${deputy.civil_nom}`.trim()
    : "";
  const age = deputy ? computeAge(deputy.date_naissance) : null;

  const setAsFavoriteForNotifications = useCallback(async () => {
    if (!deputy?.acteur_ref) return;
    await AsyncStorage.setItem(FAVORITE_DEPUTY_KEY, deputy.acteur_ref);
    await AsyncStorage.setItem(PUSH_TOPIC_KEY, "my_deputy");
    if (isPushSupported()) {
      const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      const enabled = await AsyncStorage.getItem(PUSH_ENABLED_KEY);
      if (token && enabled === "true") {
        await registerPushToken(token, {
          apiUrl: Config.API_URL,
          topic: "my_deputy",
          deputyActeurRef: deputy.acteur_ref
        });
      }
    }
  }, [deputy?.acteur_ref]);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: displayName || "Député",
          headerBackTitle: "Retour"
        }}
      />
      <ScrollView style={styles.container}>
        {loading && (
          <StatusMessage type="loading" message="Chargement du député..." />
        )}

        {error && (
          <StatusMessage type="error" message={`Erreur: ${error}`} />
        )}

        {!loading && !error && deputy && (
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{displayName}</Text>
              {deputy.groupe_politique && (
                <TouchableOpacity
                  style={styles.badge}
                  onPress={() =>
                    router.push(
                      `/groupes/${encodeURIComponent(
                        slugify(deputy.groupe_politique ?? "")
                      )}`
                    )
                  }
                  accessibilityLabel={`Voir le groupe ${deputy.groupe_politique}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.badgeText}>
                    {deputy.groupe_politique}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Identité</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Identifiant acteur</Text>
                <Text style={styles.infoValue}>{deputy.acteur_ref}</Text>
              </View>
              {deputy.date_naissance && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date de naissance</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(deputy.date_naissance)}
                    {age != null ? ` (${age} ans)` : ""}
                  </Text>
                </View>
              )}
              {deputy.lieu_naissance && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Lieu de naissance</Text>
                  <Text style={styles.infoValue}>{deputy.lieu_naissance}</Text>
                </View>
              )}
              {deputy.profession && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Profession</Text>
                  <Text style={styles.infoValue}>{deputy.profession}</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mandat</Text>
              {deputy.circonscription && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Circonscription</Text>
                  {deputy.circonscription_ref ? (
                    <TouchableOpacity
                      onPress={() =>
                        router.push(
                          `/circonscriptions/${encodeURIComponent(
                            deputy.circonscription_ref ?? ""
                          )}`
                        )
                      }
                      accessibilityLabel={`Voir la circonscription ${deputy.circonscription}`}
                      accessibilityRole="button"
                    >
                      <Text style={styles.linkText}>
                        {deputy.circonscription}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.infoValue}>
                      {deputy.circonscription}
                    </Text>
                  )}
                </View>
              )}
              {deputy.departement && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Département</Text>
                  <Text style={styles.infoValue}>{deputy.departement}</Text>
                </View>
              )}
              {deputy.date_debut_mandat && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Début du mandat</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(deputy.date_debut_mandat)}
                  </Text>
                </View>
              )}
              {deputy.legislature && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Législature</Text>
                  <Text style={styles.infoValue}>{deputy.legislature}e</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Affiliation politique</Text>
              {deputy.groupe_politique && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Groupe politique</Text>
                  <TouchableOpacity
                    onPress={() =>
                      router.push(
                        `/groupes/${encodeURIComponent(
                          slugify(deputy.groupe_politique ?? "")
                        )}`
                      )
                    }
                    accessibilityLabel={`Voir le groupe ${deputy.groupe_politique}`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.linkText}>
                      {deputy.groupe_politique}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              {deputy.parti_politique && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Parti politique</Text>
                  <Text style={styles.infoValue}>{deputy.parti_politique}</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Activité</Text>
              <Text style={styles.subsectionTitle}>
                Présence globale (derniers 12 mois)
              </Text>
              {heatmapLoading ? (
                <Text style={styles.attendanceStateText}>Chargement…</Text>
              ) : heatmap && heatmap.length > 0 ? (
                <AttendanceHeatmap cells={heatmap} />
              ) : (
                <Text style={styles.attendanceStateText}>
                  Aucune donnée de présence disponible pour les 12 derniers mois.
                </Text>
              )}
            </View>

            {isPushSupported() && (
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.notifyButton}
                  onPress={setAsFavoriteForNotifications}
                  accessibilityLabel={`Recevoir les notifications pour ${displayName}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.notifyButtonText}>
                    Recevoir les notifications pour ce député
                  </Text>
                  <Text style={styles.notifyButtonSubtext}>
                    Vous serez alerté lorsqu&apos;il vote sur un scrutin
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  router.push(
                    `/votes/deputy/${encodeURIComponent(deputy.acteur_ref)}`
                  )
                }
                accessibilityLabel={`Voir l'historique des votes de ${displayName}`}
                accessibilityRole="button"
              >
                <Text style={styles.actionText}>
                  Voir l&apos;historique des votes →
                </Text>
              </TouchableOpacity>
              {deputy.official_url && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => Linking.openURL(deputy.official_url!)}
                  accessibilityLabel={`Voir la fiche de ${displayName} sur l'Assemblée nationale`}
                  accessibilityRole="link"
                >
                  <Text style={styles.actionText}>
                    Fiche sur assemblee-nationale.fr →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
    marginBottom: spacing.xl,
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
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primaryTint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill
  },
  badgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary
  },
  section: {
    marginBottom: spacing.xl,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.sm
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  subsectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm
  },
  attendanceStateText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    lineHeight: 20
  },
  infoRow: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.3
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    color: colors.text
  },
  linkText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium
  },
  actions: {
    marginTop: spacing.sm,
    gap: spacing.md
  },
  actionButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm
  },
  actionText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium
  },
  notifyButton: {
    backgroundColor: colors.primaryTintLight,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryTintMedium
  },
  notifyButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold
  },
  notifyButtonSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginTop: spacing.xs
  }
});
