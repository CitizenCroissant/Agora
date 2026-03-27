import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation
} from "react-native";
import { useRouter } from "expo-router";
import type { DepartementSummary, Deputy } from "@agora/shared";
import { apiClient } from "@/lib/api";
import { isCurrentlySitting } from "@agora/shared";
import { StatusMessage } from "@/app/components/StatusMessage";
import { colors, spacing, radius, typography, shadows, commonStyles } from "@/theme";
import { layoutAnimationPresets } from "@/lib/animations";

export default function MonDeputeTabScreen() {
  const router = useRouter();
  const [departements, setDepartements] = useState<DepartementSummary[]>([]);
  const [deputies, setDeputies] = useState<Deputy[]>([]);
  const [selectedDepartement, setSelectedDepartement] = useState<string | null>(
    null
  );
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingDeputies, setLoadingDeputies] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDepartements();
  }, []);

  useEffect(() => {
    if (selectedDepartement) {
      loadDeputies(selectedDepartement);
    } else {
      setDeputies([]);
    }
  }, [selectedDepartement]);

  const loadDepartements = async () => {
    setLoadingDepts(true);
    setError(null);
    try {
      const data = await apiClient.getDepartements();
      LayoutAnimation.configureNext(layoutAnimationPresets.spring);
      setDepartements(data.departements.filter((d) => d.deputy_count > 0));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur de chargement des départements"
      );
      setDepartements([]);
    } finally {
      setLoadingDepts(false);
    }
  };

  const loadDeputies = async (departement: string) => {
    setLoadingDeputies(true);
    setError(null);
    try {
      const data = await apiClient.getDeputiesByDepartement(departement);
      LayoutAnimation.configureNext(layoutAnimationPresets.normal);
      setDeputies(data.deputies);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur de chargement des députés"
      );
      setDeputies([]);
    } finally {
      setLoadingDeputies(false);
    }
  };

  const clearSelection = () => {
    setSelectedDepartement(null);
    setDeputies([]);
    setError(null);
  };

  const currentDeputies = deputies.filter((d) =>
    isCurrentlySitting(d.date_fin_mandat)
  );
  const pastDeputies = deputies.filter(
    (d) => !isCurrentlySitting(d.date_fin_mandat)
  );

  return (
    <View style={commonStyles.screenContainer}>
      {selectedDepartement && (
        <TouchableOpacity
          style={styles.backBar}
          onPress={clearSelection}
          accessibilityLabel="Changer de département"
        >
          <Text style={styles.backBarText}>← Changer de département</Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.content}>
        {loadingDepts && !selectedDepartement && (
          <StatusMessage type="loading" message="Chargement des départements..." />
        )}

        {error && !selectedDepartement && (
          <StatusMessage
            type="error"
            message={`Erreur: ${error}`}
            hint="Vérifiez que l'API est disponible."
          />
        )}

        {!selectedDepartement && !loadingDepts && departements.length > 0 && (
          <View style={styles.intro}>
            <Text style={styles.introText}>
              Choisissez votre département pour voir les députés de votre
              circonscription.
            </Text>
            <Text style={styles.deptListTitle}>Départements</Text>
            <View style={styles.list}>
              {departements.map((d) => (
                <TouchableOpacity
                  key={d.name}
                  style={styles.deptCard}
                  onPress={() => setSelectedDepartement(d.name)}
                  accessibilityLabel={`${d.name}, ${d.deputy_count} député${d.deputy_count !== 1 ? "s" : ""}`}
                  accessibilityHint="Voir les députés de ce département"
                  accessibilityRole="button"
                >
                  <Text style={styles.deptName}>{d.name}</Text>
                  <Text style={styles.deptCount}>
                    {d.deputy_count} député{d.deputy_count !== 1 ? "s" : ""}
                  </Text>
                  <Text style={styles.deptArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.circoLink}
              onPress={() => router.push("/(tabs)/circonscriptions")}
              accessibilityLabel="Voir par circonscription"
              accessibilityRole="button"
            >
              <Text style={styles.circoLinkText}>
                Voir par circonscription →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedDepartement && (
          <>
            {loadingDeputies && (
              <StatusMessage
                type="loading"
                message={`Chargement des députés du ${selectedDepartement}...`}
              />
            )}

            {error && selectedDepartement && (
              <StatusMessage type="error" message={`Erreur: ${error}`} />
            )}

            {!loadingDeputies && !error && (
              <View style={styles.deputiesSection}>
                <Text style={styles.deputyCount}>
                  {currentDeputies.length} député
                  {currentDeputies.length !== 1 ? "s" : ""} en mandat dans le{" "}
                  {selectedDepartement}
                </Text>

                {currentDeputies.map((d) => (
                  <View key={d.acteur_ref} style={styles.deputyCard}>
                    <Text style={styles.deputyName}>
                      {d.civil_prenom} {d.civil_nom}
                    </Text>
                    {(d.circonscription || d.departement) && (
                      <Text style={styles.deputyMeta}>
                        {[d.circonscription, d.departement]
                          .filter(Boolean)
                          .join(" — ")}
                      </Text>
                    )}
                    {d.groupe_politique && (
                      <Text style={styles.deputyMeta}>
                        {d.groupe_politique}
                      </Text>
                    )}
                    <View style={styles.deputyLinks}>
                      <TouchableOpacity
                        onPress={() =>
                          router.push(
                            `/deputy/${encodeURIComponent(d.acteur_ref)}`
                          )
                        }
                        accessibilityLabel={`Fiche du député ${d.civil_prenom} ${d.civil_nom}`}
                        accessibilityRole="button"
                      >
                        <Text style={styles.primaryLink}>
                          Fiche du député →
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          router.push(
                            `/votes/deputy/${encodeURIComponent(d.acteur_ref)}`
                          )
                        }
                        accessibilityLabel={`Votes de ${d.civil_prenom} ${d.civil_nom}`}
                        accessibilityRole="button"
                      >
                        <Text style={styles.secondaryLink}>
                          Votes de mon député
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {pastDeputies.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>
                      Anciens députés ({pastDeputies.length})
                    </Text>
                    {pastDeputies.map((d) => (
                      <TouchableOpacity
                        key={d.acteur_ref}
                        style={styles.deputyCardSmall}
                        onPress={() =>
                          router.push(
                            `/deputy/${encodeURIComponent(d.acteur_ref)}`
                          )
                        }
                        accessibilityLabel={`${d.civil_prenom} ${d.civil_nom}, ancien député`}
                        accessibilityHint="Voir la fiche du député"
                        accessibilityRole="button"
                      >
                        <Text style={styles.deputyNameSmall}>
                          {d.civil_prenom} {d.civil_nom}
                        </Text>
                        <Text style={styles.deputyCardArrow}>→</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {currentDeputies.length === 0 && pastDeputies.length === 0 && (
                  <Text style={[commonStyles.emptyText, { marginTop: spacing.xl }]}>
                    Aucun député trouvé pour ce département.
                  </Text>
                )}
              </View>
            )}
          </>
        )}

        {!loadingDepts &&
          departements.length === 0 &&
          !error &&
          !selectedDepartement && (
            <StatusMessage
              type="empty"
              message="Aucun département avec députés en base."
            />
          )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backBar: {
    backgroundColor: colors.backgroundCard,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  backBarText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold
  },
  content: {
    flex: 1
  },
  intro: {
    padding: spacing.lg
  },
  introText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    marginBottom: spacing.lg,
    lineHeight: 22
  },
  deptListTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textLight,
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  list: {
    gap: spacing.sm
  },
  deptCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundCard,
    padding: spacing.lg,
    borderRadius: radius.md,
    ...shadows.sm
  },
  deptName: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary
  },
  deptCount: {
    fontSize: typography.fontSize.md,
    color: colors.textLight,
    marginRight: spacing.sm
  },
  deptArrow: {
    fontSize: 20,
    color: colors.textMuted,
    fontWeight: "300",
    lineHeight: 20,
    marginLeft: spacing.sm
  },
  circoLink: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: "center"
  },
  circoLinkText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium
  },
  deputiesSection: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl
  },
  deputyCount: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    marginBottom: spacing.lg
  },
  deputyCard: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  deputyName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.xs
  },
  deputyNameSmall: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    flex: 1
  },
  deputyMeta: {
    fontSize: typography.fontSize.md,
    color: colors.textLight,
    marginBottom: spacing.xs
  },
  deputyLinks: {
    marginTop: spacing.md,
    gap: spacing.sm
  },
  primaryLink: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.xs
  },
  secondaryLink: {
    fontSize: typography.fontSize.md,
    color: colors.textLight
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textLight,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  deputyCardSmall: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    ...shadows.sm
  },
  deputyCardArrow: {
    fontSize: 20,
    color: colors.textMuted,
    fontWeight: "300",
    lineHeight: 20,
    marginLeft: "auto"
  }
});
