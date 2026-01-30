import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useRouter } from "expo-router";
import type { DeputyVotesResponse } from "@agora/shared";
import { formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";

const POSITION_LABELS: Record<string, string> = {
  pour: "Pour",
  contre: "Contre",
  abstention: "Abstention",
  non_votant: "Non votant",
};

export default function DeputyVotesScreen() {
  const { acteurRef } = useLocalSearchParams<{ acteurRef: string }>();
  const router = useRouter();
  const [data, setData] = useState<DeputyVotesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (acteurRef) {
      loadVotes(acteurRef);
    }
  }, [acteurRef]);

  const loadVotes = async (ref: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getDeputyVotes(ref);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger les votes",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const displayName = data?.acteur_nom ?? data?.acteur_ref ?? acteurRef;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Votes",
          headerBackTitle: "Retour",
        }}
      />
      <ScrollView style={styles.container}>
        {loading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#0055a4" />
            <Text style={styles.loadingText}>Chargement des votes...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Erreur: {error}</Text>
          </View>
        )}

        {!loading && !error && data && (
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{displayName}</Text>
              {data.acteur_nom && (
                <Text style={styles.acteurRef}>({data.acteur_ref})</Text>
              )}
            </View>

            {data.votes.length === 0 ? (
              <Text style={styles.emptyText}>
                Aucun vote enregistré pour ce député.
              </Text>
            ) : (
              <View style={styles.voteList}>
                {data.votes.map((v) => (
                  <TouchableOpacity
                    key={`${v.scrutin_id}-${v.date_scrutin}-${v.position}`}
                    style={styles.voteCard}
                    onPress={() => router.push(`/votes/${v.scrutin_id}`)}
                  >
                    <View style={styles.voteHeader}>
                      <View
                        style={[
                          styles.positionBadge,
                          v.position === "pour" && styles.badgePour,
                          v.position === "contre" && styles.badgeContre,
                          v.position === "abstention" && styles.badgeAbstention,
                          v.position === "non_votant" && styles.badgeNonVotant,
                        ]}
                      >
                        <Text style={styles.positionText}>
                          {POSITION_LABELS[v.position]}
                        </Text>
                      </View>
                      <Text style={styles.voteDate}>
                        {formatDate(v.date_scrutin)}
                      </Text>
                    </View>
                    <Text style={styles.voteTitle} numberOfLines={2}>
                      {v.scrutin_titre}
                    </Text>
                    <Text style={styles.voteLink}>Voir le scrutin →</Text>
                  </TouchableOpacity>
                ))}
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
    fontSize: 22,
    fontWeight: "700",
    color: "#0055a4",
    marginBottom: 4,
  },
  acteurRef: {
    fontSize: 14,
    color: "#666",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    padding: 24,
  },
  voteList: {
    gap: 12,
  },
  voteCard: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  voteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  positionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgePour: {
    backgroundColor: "rgba(0, 128, 0, 0.15)",
  },
  badgeContre: {
    backgroundColor: "rgba(200, 0, 0, 0.15)",
  },
  badgeAbstention: {
    backgroundColor: "rgba(128, 128, 0, 0.15)",
  },
  badgeNonVotant: {
    backgroundColor: "rgba(128, 128, 128, 0.15)",
  },
  positionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  voteDate: {
    fontSize: 12,
    color: "#666",
    textTransform: "capitalize",
  },
  voteTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  voteLink: {
    fontSize: 14,
    color: "#0055a4",
    fontWeight: "500",
  },
});
