import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useRouter } from "expo-router";
import type { Deputy } from "@agora/shared";
import { formatDate, slugify } from "@agora/shared";
import { apiClient } from "@/lib/api";

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

  useEffect(() => {
    if (acteurRef) {
      loadDeputy(acteurRef);
    }
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

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: displayName || "Député",
          headerBackTitle: "Retour",
        }}
      />
      <ScrollView style={styles.container}>
        {loading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#0055a4" />
            <Text style={styles.loadingText}>Chargement du député...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Erreur: {error}</Text>
          </View>
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
                        slugify(deputy.groupe_politique ?? ""),
                      )}`,
                    )
                  }
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
                  <Text style={styles.infoValue}>{deputy.circonscription}</Text>
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
                          slugify(deputy.groupe_politique ?? ""),
                        )}`,
                      )
                    }
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

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  router.push(
                    `/votes/deputy/${encodeURIComponent(deputy.acteur_ref)}`,
                  )
                }
              >
                <Text style={styles.actionText}>
                  Voir l&apos;historique des votes →
                </Text>
              </TouchableOpacity>
              {deputy.official_url && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => Linking.openURL(deputy.official_url!)}
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
    backgroundColor: "#fff",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
    fontSize: 16,
  },
  errorContainer: {
    padding: 24,
    alignItems: "center",
  },
  errorText: {
    color: "#ef4135",
    fontSize: 16,
    fontWeight: "500",
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0055a4",
    marginBottom: 8,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0, 85, 164, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0055a4",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0055a4",
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
  },
  linkText: {
    fontSize: 16,
    color: "#0055a4",
    fontWeight: "500",
  },
  actions: {
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 14,
    color: "#0055a4",
    fontWeight: "500",
  },
});
