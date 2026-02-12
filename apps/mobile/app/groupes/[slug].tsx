import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useRouter } from "expo-router";
import type { PoliticalGroupDetail, Deputy } from "@agora/shared";
import { isCurrentlySitting } from "@agora/shared";
import { apiClient } from "@/lib/api";
import { colors } from "@/theme";

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
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Chargement du groupe...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Erreur: {error}</Text>
          </View>
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
    backgroundColor: "#fff"
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
    fontWeight: "500"
  },
  content: {
    padding: 16
  },
  deputyCount: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0055a4",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 12
  },
  empty: {
    fontSize: 16,
    color: "#666",
    marginTop: 24
  },
  deputyList: {
    gap: 12
  },
  deputyCard: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0"
  },
  deputyName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0055a4",
    marginBottom: 4
  },
  deputyMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8
  },
  deputyMetaTouchable: {
    alignSelf: "flex-start"
  },
  deputyMeta: {
    fontSize: 14,
    color: "#666"
  },
  deputyMetaLink: {
    fontSize: 14,
    color: "#0055a4",
    fontWeight: "500"
  },
  deputyLink: {
    fontSize: 14,
    color: "#0055a4",
    fontWeight: "500"
  }
});
