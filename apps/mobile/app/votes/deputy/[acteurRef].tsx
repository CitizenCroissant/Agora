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
import type {
  DeputyVotesResponse,
  DeputyVoteRecordWithComparison
} from "@agora/shared";
import { formatDate } from "@agora/shared";
import { apiClient } from "@/lib/api";
import { StatusMessage } from "@/app/components/StatusMessage";
import { colors, spacing, radius, typography, shadows } from "@/theme";

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

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Votes",
          headerBackTitle: "Retour"
        }}
      />
      <ScrollView style={styles.container}>
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

            {data.votes.length === 0 ? (
              <StatusMessage
                type="empty"
                message="Aucun vote enregistré pour ce député."
              />
            ) : (
              <View style={styles.voteList}>
                {data.votes.map((v) => {
                  const withComp = v as DeputyVoteRecordWithComparison;
                  const comp = withComp.comparison;
                  return (
                    <TouchableOpacity
                      key={`${v.scrutin_id}-${v.date_scrutin}-${v.position}`}
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
  }
});
