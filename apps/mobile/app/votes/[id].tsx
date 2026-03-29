import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useRouter } from "expo-router";
import type { ScrutinDetailResponse } from "@agora/shared";
import { formatDate, slugify } from "@agora/shared";
import { apiClient } from "@/lib/api";
import { StatusMessage } from "@/app/components/StatusMessage";
import { VoteResultBar } from "@/app/components/VoteResultBar";
import { Badge } from "@/app/components/Badge";
import { Card } from "@/app/components/Card";
import { colors, spacing, radius, typography, shadows, sectionColors, fonts } from "@/theme";

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
          <StatusMessage type="loading" message="Chargement du scrutin..." />
        )}

        {error && (
          <StatusMessage type="error" message={`Erreur: ${error}`} />
        )}

        {!loading && !error && scrutin && (
          <View style={styles.content}>
            <View style={styles.header}>
              <Badge
                style={styles.headerBadge}
                variant={scrutin.sort_code === "adopté" ? "success" : "error"}
              >
                {scrutin.sort_code === "adopté" ? "Adopté" : "Rejeté"}
              </Badge>
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
                        onPress={() => router.push(`/votes?tag=${encodeURIComponent(tag.slug)}`)}
                        accessibilityLabel={`Filtrer par thème : ${tag.label}`}
                        accessibilityRole="button"
                      >
                        <Badge variant="primary">{tag.label}</Badge>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              <TouchableOpacity
                style={styles.sourcesLink}
                onPress={() => router.push("/sources")}
                accessibilityLabel="Comment lire un scrutin ? Voir les sources"
                accessibilityRole="button"
              >
                <Text style={styles.sourcesLinkText}>
                  Comment lire un scrutin ? (Sources)
                </Text>
              </TouchableOpacity>
            </View>

            <Card style={styles.synthese}>
              <Text style={styles.sectionTitle}>Résultat</Text>
              <VoteResultBar
                variant="detailed"
                pour={scrutin.synthese_pour ?? 0}
                contre={scrutin.synthese_contre ?? 0}
                abstention={scrutin.synthese_abstentions ?? 0}
              />
              <View style={styles.syntheseGrid}>
                <View style={[styles.syntheseItem, styles.syntheseItemPour]}>
                  <Text style={[styles.syntheseValue, styles.syntheseValuePour]}>
                    {scrutin.synthese_pour}
                  </Text>
                  <Text style={styles.syntheseLabel}>Pour</Text>
                </View>
                <View style={[styles.syntheseItem, styles.syntheseItemContre]}>
                  <Text style={[styles.syntheseValue, styles.syntheseValueContre]}>
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
            </Card>

            {scrutin.group_votes && scrutin.group_votes.length > 0 && (
              <View style={styles.groupVotesSection}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: spacing.lg, paddingTop: spacing.lg }]}>
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
                    accessibilityLabel={`${g.groupe_politique} : ${g.pour} pour (${g.pour_pct.toFixed(0)} %), ${g.contre} contre (${g.contre_pct.toFixed(0)} %)`}
                    accessibilityHint="Voir le groupe politique"
                    accessibilityRole="button"
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
                accessibilityLabel="Voir la séance associée"
                accessibilityRole="button"
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
                              accessibilityLabel={`${v.acteur_nom ?? v.acteur_ref}${v.groupe_politique ? ` (${v.groupe_politique})` : ""} : ${POSITION_LABELS[v.position]}`}
                              accessibilityHint="Voir la fiche du député"
                              accessibilityRole="button"
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
                accessibilityLabel="Voir le scrutin sur le site de l'Assemblée nationale"
                accessibilityRole="link"
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
  headerBadge: {
    alignSelf: "flex-start",
    marginBottom: spacing.sm
  },
  typeVote: {
    fontSize: typography.fontSize.sm,
    fontFamily: fonts.body,
    color: colors.textLight,
    marginBottom: spacing.sm
  },
  title: {
    fontSize: typography.fontSize.xl + 2,
    fontFamily: fonts.headingBold,
    color: colors.primary,
    marginBottom: spacing.sm,
    lineHeight: 28
  },
  tagsSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.primaryTintLight,
    borderRadius: radius.md
  },
  tagsTitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: fonts.bodyBold,
    color: colors.textLight,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  date: {
    fontSize: typography.fontSize.sm,
    fontFamily: fonts.body,
    color: colors.textLight,
    textTransform: "capitalize"
  },
  sourcesLink: {
    marginTop: spacing.md
  },
  sourcesLinkText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontFamily: fonts.bodyMedium
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: fonts.heading,
    color: sectionColors.votes,
    marginBottom: spacing.md
  },
  synthese: {
    marginBottom: spacing.xl
  },
  syntheseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  syntheseItem: {
    backgroundColor: colors.backgroundAlt,
    padding: spacing.lg,
    borderRadius: radius.md,
    minWidth: 72,
    alignItems: "center"
  },
  syntheseItemPour: {
    backgroundColor: colors.successBg
  },
  syntheseItemContre: {
    backgroundColor: colors.errorBg
  },
  syntheseValue: {
    fontSize: 26,
    fontFamily: fonts.headingBold,
    color: colors.primary
  },
  syntheseValuePour: {
    color: colors.success
  },
  syntheseValueContre: {
    color: colors.accentCoral
  },
  syntheseLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: fonts.body,
    color: colors.textLight,
    marginTop: spacing.xs
  },
  linkButton: {
    marginBottom: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.primaryTintLight,
    borderRadius: radius.md
  },
  linkText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontFamily: fonts.bodyMedium
  },
  groupVotesSection: {
    marginBottom: spacing.xl,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.sm
  },
  groupVotesHint: {
    fontSize: typography.fontSize.sm,
    fontFamily: fonts.body,
    color: colors.textLight,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg
  },
  groupVotesRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  groupVotesGroupLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: fonts.bodySemibold,
    color: colors.primary,
    marginBottom: spacing.xs
  },
  groupVotesStats: {
    fontSize: typography.fontSize.sm,
    fontFamily: fonts.body,
    color: colors.textLight
  },
  likeAssemblyBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg
  },
  likeAssemblyText: {
    fontSize: typography.fontSize.sm,
    fontFamily: fonts.body,
    color: colors.text,
    marginBottom: spacing.xs
  },
  votesSection: {
    marginBottom: spacing.xl
  },
  positionBlock: {
    marginBottom: spacing.lg
  },
  positionTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: fonts.bodySemibold,
    color: colors.text,
    marginBottom: spacing.sm
  },
  deputyRow: {
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  deputyLink: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontFamily: fonts.bodyMedium
  },
  voteComparisonLine: {
    fontSize: typography.fontSize.xs,
    fontFamily: fonts.body,
    color: colors.textLight,
    marginTop: spacing.xs
  },
  sourceButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  sourceLink: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontFamily: fonts.bodyMedium,
    textAlign: "center"
  }
});
