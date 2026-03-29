import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useRouter } from "expo-router";
import type {
  DeputyVotesResponse,
  DeputyVoteRecordWithComparison
} from "@agora/shared";
import { formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";
import { StatusMessage } from "@/app/components/StatusMessage";
import { colors, spacing, radius, typography, shadows } from "@/theme";

const PAGE_SIZE = 20;

const POSITION_LABELS: Record<string, string> = {
  pour: "Pour",
  contre: "Contre",
  abstention: "Abstention",
  non_votant: "Non votant"
};

export default function DeputyVotesScreen() {
  const { acteurRef } = useLocalSearchParams<{ acteurRef: string }>();
  const router = useRouter();
  const [data, setData] = useState<DeputyVotesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setPage(1);
  }, [acteurRef]);

  useEffect(() => {
    if (acteurRef) {
      loadVotes(acteurRef);
    }
  }, [acteurRef]);

  const loadVotes = async (ref: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getDeputyVotes(ref, {
        enrich: "comparison"
      });
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger les votes"
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const displayName = data?.acteur_nom ?? data?.acteur_ref ?? acteurRef;

  const sortedVotes = useMemo(() => {
    if (!data?.votes.length) return [];
    return [...data.votes].sort((a, b) => {
      const byDate = b.date_scrutin.localeCompare(a.date_scrutin);
      if (byDate !== 0) return byDate;
      return b.scrutin_id.localeCompare(a.scrutin_id);
    });
  }, [data]);

  const totalVotes = sortedVotes.length;
  const totalPages = Math.max(1, Math.ceil(totalVotes / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const paginatedVotes = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return sortedVotes.slice(start, start + PAGE_SIZE);
  }, [sortedVotes, safePage]);

  const goToPage = useCallback((next: number) => {
    const clamped = Math.min(Math.max(1, next), totalPages);
    setPage(clamped);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [totalPages]);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Votes",
          headerBackTitle: "Retour"
        }}
      />
      <ScrollView ref={scrollRef} style={styles.container}>
        {loading && (
          <StatusMessage type="loading" message="Chargement des votes..." />
        )}

        {error && (
          <StatusMessage type="error" message={`Erreur: ${error}`} />
        )}

        {!loading && !error && data && (
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{displayName}</Text>
              {data.acteur_nom && (
                <Text style={styles.acteurRef}>({data.acteur_ref})</Text>
              )}
            </View>

            {totalVotes === 0 ? (
              <StatusMessage
                type="empty"
                message="Aucun vote enregistré pour ce député."
              />
            ) : (
              <View style={styles.voteList}>
                {paginatedVotes.map((v) => {
                  const withComp = v as DeputyVoteRecordWithComparison;
                  const comp = withComp.comparison;
                  return (
                    <TouchableOpacity
                      key={v.scrutin_id}
                      style={styles.voteCard}
                      onPress={() => router.push(`/votes/${v.scrutin_id}`)}
                      accessibilityLabel={`${POSITION_LABELS[v.position]} — ${v.scrutin_titre}`}
                      accessibilityHint="Voir les détails du scrutin"
                      accessibilityRole="button"
                    >
                      <View style={styles.voteHeader}>
                        <View
                          style={[
                            styles.positionBadge,
                            v.position === "pour" && styles.badgePour,
                            v.position === "contre" && styles.badgeContre,
                            v.position === "abstention" && styles.badgeAbstention,
                            v.position === "non_votant" && styles.badgeNonVotant
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
                      {comp && (
                        <Text style={styles.voteComparisonLine}>
                          Votre député : {POSITION_LABELS[v.position]} · Groupe (
                          {comp.group_label}) : {comp.group_pour_pct.toFixed(0)} %
                          pour · Assemblée :{" "}
                          {comp.assembly_result === "adopté"
                            ? "Adopté"
                            : "Rejeté"}
                        </Text>
                      )}
                      <Text style={styles.voteLink}>Voir le scrutin →</Text>
                    </TouchableOpacity>
                  );
                })}
                {totalPages > 1 && (
                  <View style={styles.pagination}>
                    <TouchableOpacity
                      style={[
                        styles.paginationBtn,
                        safePage <= 1 && styles.paginationBtnDisabled
                      ]}
                      onPress={() => goToPage(safePage - 1)}
                      disabled={safePage <= 1}
                      accessibilityLabel="Page précédente"
                    >
                      <Text
                        style={[
                          styles.paginationBtnText,
                          safePage <= 1 && styles.paginationBtnTextDisabled
                        ]}
                      >
                        Précédent
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.paginationMeta}>
                      Page {safePage} sur {totalPages}
                      {totalVotes > 0 && (
                        <Text style={styles.paginationCount}>
                          {" \u00b7 "}
                          {totalVotes} vote{totalVotes > 1 ? "s" : ""}
                        </Text>
                      )}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.paginationBtn,
                        safePage >= totalPages && styles.paginationBtnDisabled
                      ]}
                      onPress={() => goToPage(safePage + 1)}
                      disabled={safePage >= totalPages}
                      accessibilityLabel="Page suivante"
                    >
                      <Text
                        style={[
                          styles.paginationBtnText,
                          safePage >= totalPages &&
                            styles.paginationBtnTextDisabled
                        ]}
                      >
                        Suivant
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
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
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs
  },
  acteurRef: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight
  },
  voteList: {
    gap: spacing.md
  },
  voteCard: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.lg,
    borderRadius: radius.md,
    ...shadows.sm
  },
  voteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm
  },
  positionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm
  },
  badgePour: {
    backgroundColor: colors.successBg
  },
  badgeContre: {
    backgroundColor: colors.errorBg
  },
  badgeAbstention: {
    backgroundColor: colors.primaryTintLight
  },
  badgeNonVotant: {
    backgroundColor: colors.backgroundAlt
  },
  positionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text
  },
  voteDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    textTransform: "capitalize"
  },
  voteTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm
  },
  voteComparisonLine: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.sm
  },
  voteLink: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm
  },
  paginationBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryTintLight,
    borderWidth: 1,
    borderColor: colors.border
  },
  paginationBtnDisabled: {
    opacity: 0.45
  },
  paginationBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary
  },
  paginationBtnTextDisabled: {
    color: colors.textMuted
  },
  paginationMeta: {
    flex: 1,
    textAlign: "center",
    fontSize: typography.fontSize.sm,
    color: colors.textLight
  },
  paginationCount: {
    color: colors.textMuted
  }
});
