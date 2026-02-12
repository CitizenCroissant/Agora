import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet
} from "react-native";
import { useRouter } from "expo-router";
import type { DepartementSummary, Deputy } from "@agora/shared";
import { apiClient } from "@/lib/api";
import { isCurrentlySitting } from "@agora/shared";
import { colors } from "@/theme";

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
    <View style={styles.container}>
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
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              Chargement des départements...
            </Text>
          </View>
        )}

        {error && !selectedDepartement && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Erreur: {error}</Text>
            <Text style={styles.errorHint}>
              Vérifiez que l&apos;API est disponible.
            </Text>
          </View>
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
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>
                  Chargement des députés du {selectedDepartement}...
                </Text>
              </View>
            )}

            {error && selectedDepartement && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Erreur: {error}</Text>
              </View>
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
                  <Text style={styles.empty}>
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
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Aucun département avec députés en base.
              </Text>
            </View>
          )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5"
  },
  backBar: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0"
  },
  backBarText: {
    fontSize: 15,
    color: "#0055a4",
    fontWeight: "600"
  },
  content: {
    flex: 1
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 48
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
    fontSize: 16
  },
  errorContainer: {
    padding: 24,
    alignItems: "center"
  },
  errorText: {
    color: "#ef4135",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8
  },
  errorHint: {
    color: "#666",
    fontSize: 14,
    textAlign: "center"
  },
  intro: {
    padding: 16
  },
  introText: {
    fontSize: 15,
    color: "#333",
    marginBottom: 16,
    lineHeight: 22
  },
  deptListTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
    textTransform: "uppercase"
  },
  list: {
    gap: 8
  },
  deptCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0"
  },
  deptName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#0055a4"
  },
  deptCount: {
    fontSize: 14,
    color: "#666",
    marginRight: 8
  },
  deptArrow: {
    fontSize: 20,
    color: "#999",
    fontWeight: "300",
    lineHeight: 20,
    marginLeft: 8
  },
  circoLink: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: "center"
  },
  circoLinkText: {
    fontSize: 15,
    color: "#0055a4",
    fontWeight: "500"
  },
  deputiesSection: {
    padding: 16,
    paddingBottom: 32
  },
  deputyCount: {
    fontSize: 15,
    color: "#666",
    marginBottom: 16
  },
  deputyCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 12
  },
  deputyName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0055a4",
    marginBottom: 4
  },
  deputyNameSmall: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0055a4",
    flex: 1
  },
  deputyMeta: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4
  },
  deputyLinks: {
    marginTop: 12,
    gap: 8
  },
  primaryLink: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0055a4",
    marginBottom: 4
  },
  secondaryLink: {
    fontSize: 14,
    color: "#666"
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginTop: 24,
    marginBottom: 12,
    textTransform: "uppercase"
  },
  deputyCardSmall: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 8
  },
  deputyCardArrow: {
    fontSize: 20,
    color: "#999",
    fontWeight: "300",
    lineHeight: 20,
    marginLeft: "auto"
  },
  empty: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginTop: 24
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center"
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center"
  }
});
