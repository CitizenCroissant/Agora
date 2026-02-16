import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Linking
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useRouter } from "expo-router";
import type { ScrutinDetailResponse } from "@agora/shared";
import { formatDate, slugify } from "@agora/shared";
import { apiClient } from "@/lib/api";
import { colors } from "@/theme";

const POSITION_LABELS: Record<string, string> = {
  pour: "Pour",
  contre: "Contre",
  abstention: "Abstention",
  non_votant: "Non votant"
};

export default function ScrutinDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [scrutin, setScrutin] = useState<ScrutinDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadScrutin(id);
    }
  }, [id]);

  const loadScrutin = async (scrutinId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getScrutin(scrutinId);
      setScrutin(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scrutin");
      setScrutin(null);
    } finally {
      setLoading(false);
    }
  };

  const byPosition =
    scrutin?.votes?.reduce(
      (acc, v) => {
        if (!acc[v.position]) acc[v.position] = [];
        acc[v.position].push(v);
        return acc;
      },
      {} as Record<string, typeof scrutin.votes>
    ) ?? {};

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: scrutin?.titre?.slice(0, 30) ?? "Scrutin",
          headerBackTitle: "Retour"
        }}
      />
      <ScrollView style={styles.container}>
        {loading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Chargement du scrutin...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Erreur: {error}</Text>
          </View>
        )}

        {!loading && !error && scrutin && (
          <View style={styles.content}>
            <View style={styles.header}>
              <View
                style={[
                  styles.badge,
                  scrutin.sort_code === "adopté"
                    ? styles.badgeAdopte
                    : styles.badgeRejete
                ]}
              >
                <Text style={styles.badgeText}>
                  {scrutin.sort_code === "adopté" ? "Adopté" : "Rejeté"}
                </Text>
              </View>
              {scrutin.type_vote_libelle && (
                <Text style={styles.typeVote}>{scrutin.type_vote_libelle}</Text>
              )}
              <Text style={styles.title}>{scrutin.titre}</Text>
              <Text style={styles.date}>
                {formatDate(scrutin.date_scrutin)} · Scrutin n°{scrutin.numero}
              </Text>
              {scrutin.tags && scrutin.tags.length > 0 && (
                <View style={styles.tagsSection}>
                  <Text style={styles.tagsTitle}>Thèmes</Text>
                  <View style={styles.tagsContainer}>
                    {scrutin.tags.map((tag) => (
                      <TouchableOpacity
                        key={tag.id}
                        style={styles.tag}
                        onPress={() => router.push(`/votes?tag=${encodeURIComponent(tag.slug)}`)}
                      >
                        <Text style={styles.tagText}>{tag.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              <TouchableOpacity
                style={styles.sourcesLink}
                onPress={() => router.push("/sources")}
              >
                <Text style={styles.sourcesLinkText}>
                  Comment lire un scrutin ? (Sources)
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.synthese}>
              <Text style={styles.sectionTitle}>Résultat</Text>
              <View style={styles.syntheseGrid}>
                <View style={styles.syntheseItem}>
                  <Text style={styles.syntheseValue}>
                    {scrutin.synthese_pour}
                  </Text>
                  <Text style={styles.syntheseLabel}>Pour</Text>
                </View>
                <View style={styles.syntheseItem}>
                  <Text style={styles.syntheseValue}>
                    {scrutin.synthese_contre}
                  </Text>
                  <Text style={styles.syntheseLabel}>Contre</Text>
                </View>
                <View style={styles.syntheseItem}>
                  <Text style={styles.syntheseValue}>
                    {scrutin.synthese_abstentions}
                  </Text>
                  <Text style={styles.syntheseLabel}>Abstentions</Text>
                </View>
                <View style={styles.syntheseItem}>
                  <Text style={styles.syntheseValue}>
                    {scrutin.synthese_non_votants}
                  </Text>
                  <Text style={styles.syntheseLabel}>Non votants</Text>
                </View>
              </View>
            </View>

            {scrutin.group_votes && scrutin.group_votes.length > 0 && (
              <View style={styles.groupVotesSection}>
                <Text style={styles.sectionTitle}>
                  Comment chaque groupe a voté
                </Text>
                <Text style={styles.groupVotesHint}>
                  Répartition par groupe politique (votes nominatifs).
                </Text>
                {scrutin.group_votes.map((g) => (
                  <TouchableOpacity
                    key={g.groupe_politique}
                    style={styles.groupVotesRow}
                    onPress={() =>
                      router.push(
                        `/groupes/${encodeURIComponent(slugify(g.groupe_politique))}`
                      )
                    }
                  >
                    <Text style={styles.groupVotesGroupLabel}>
                      {g.groupe_politique}
                    </Text>
                    <Text style={styles.groupVotesStats}>
                      Pour {g.pour} ({g.pour_pct.toFixed(0)} %) · Contre {g.contre}{" "}
                      ({g.contre_pct.toFixed(0)} %) · Abst. {g.abstention} · NV{" "}
                      {g.non_votant}
                    </Text>
                  </TouchableOpacity>
                ))}
                {scrutin.group_votes.filter(
                  (gr) => typeof gr.pct_voted_like_assembly === "number"
                ).length > 0 && (
                  <View style={styles.likeAssemblyBlock}>
                    {scrutin.group_votes
                      .filter(
                        (gr) => typeof gr.pct_voted_like_assembly === "number"
                      )
                      .map((gr) => (
                        <Text
                          key={gr.groupe_politique}
                          style={styles.likeAssemblyText}
                        >
                          Sur ce scrutin, {gr.pct_voted_like_assembly!.toFixed(0)} %
                          des députés du groupe {gr.groupe_politique} ont voté
                          comme l{"'"}Assemblée.
                        </Text>
                      ))}
                  </View>
                )}
              </View>
            )}

            {scrutin.sitting_id && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => router.push(`/sitting/${scrutin.sitting_id}`)}
              >
                <Text style={styles.linkText}>Voir la séance associée →</Text>
              </TouchableOpacity>
            )}

            {scrutin.votes && scrutin.votes.length > 0 && (
              <View style={styles.votesSection}>
                <Text style={styles.sectionTitle}>Vote des députés</Text>
                {(["pour", "contre", "abstention", "non_votant"] as const).map(
                  (pos) => {
                    const list = byPosition[pos] ?? [];
                    if (list.length === 0) return null;
                    return (
                      <View key={pos} style={styles.positionBlock}>
                        <Text style={styles.positionTitle}>
                          {POSITION_LABELS[pos]} ({list.length})
                        </Text>
                        {list.map((v) => {
                          const groupForVote =
                            v.groupe_politique && scrutin.group_votes
                              ? scrutin.group_votes.find(
                                  (g) => g.groupe_politique === v.groupe_politique
                                )
                              : undefined;
                          const assemblyLabel =
                            scrutin.sort_code === "adopté" ? "Adopté" : "Rejeté";
                          return (
                            <TouchableOpacity
                              key={v.id}
                              style={styles.deputyRow}
                              onPress={() =>
                                router.push(
                                  `/deputy/${encodeURIComponent(v.acteur_ref)}`
                                )
                              }
                            >
                              <Text style={styles.deputyLink}>
                                {v.acteur_nom ?? v.acteur_ref}
                                {v.groupe_politique
                                  ? ` (${v.groupe_politique})`
                                  : ""}
                              </Text>
                              {v.groupe_politique && groupForVote && (
                                <Text style={styles.voteComparisonLine}>
                                  Député : {POSITION_LABELS[v.position]} ·
                                  Groupe : {groupForVote.pour_pct.toFixed(0)} %
                                  pour · Assemblée : {assemblyLabel}
                                </Text>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  }
                )}
              </View>
            )}

            {scrutin.official_url && (
              <TouchableOpacity
                style={styles.sourceButton}
                onPress={() => Linking.openURL(scrutin.official_url!)}
              >
                <Text style={styles.sourceLink}>
                  Voir le scrutin sur assemblee-nationale.fr →
                </Text>
              </TouchableOpacity>
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
  header: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#e0e0e0"
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8
  },
  badgeAdopte: {
    backgroundColor: "rgba(0, 128, 0, 0.15)"
  },
  badgeRejete: {
    backgroundColor: "rgba(200, 0, 0, 0.15)"
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333"
  },
  typeVote: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0055a4",
    marginBottom: 8
  },
  tagsSection: {
    marginTop: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8
  },
  tagsTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(0, 85, 164, 0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent"
  },
  tagText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#0055a4"
  },
  date: {
    fontSize: 14,
    color: "#666",
    textTransform: "capitalize"
  },
  sourcesLink: {
    marginTop: 12
  },
  sourcesLinkText: {
    fontSize: 14,
    color: "#0055a4",
    fontWeight: "500"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0055a4",
    marginBottom: 12
  },
  synthese: {
    marginBottom: 20
  },
  syntheseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  syntheseItem: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center"
  },
  syntheseValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0055a4"
  },
  syntheseLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4
  },
  linkButton: {
    marginBottom: 20
  },
  linkText: {
    fontSize: 14,
    color: "#0055a4",
    fontWeight: "500"
  },
  groupVotesSection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8
  },
  groupVotesHint: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12
  },
  groupVotesRow: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0"
  },
  groupVotesGroupLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0055a4",
    marginBottom: 4
  },
  groupVotesStats: {
    fontSize: 12,
    color: "#666"
  },
  likeAssemblyBlock: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0"
  },
  likeAssemblyText: {
    fontSize: 12,
    color: "#333",
    marginBottom: 6
  },
  votesSection: {
    marginBottom: 20
  },
  positionBlock: {
    marginBottom: 16
  },
  positionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8
  },
  deputyRow: {
    paddingVertical: 8,
    paddingLeft: 8
  },
  deputyLink: {
    fontSize: 14,
    color: "#0055a4",
    fontWeight: "500"
  },
  voteComparisonLine: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
    marginLeft: 0
  },
  sourceButton: {
    marginTop: 16,
    paddingVertical: 12
  },
  sourceLink: {
    fontSize: 14,
    color: "#0055a4",
    fontWeight: "500"
  }
});
