import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  LayoutAnimation
} from "react-native";
import { useRouter } from "expo-router";
import type { PoliticalGroupSummary } from "@agora/shared";
import { apiClient } from "@/lib/api";
import { StatusMessage } from "@/app/components/StatusMessage";
import { colors, spacing, radius, typography, shadows, commonStyles } from "@/theme";
import { layoutAnimationPresets } from "@/lib/animations";

export default function GroupesTabScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<PoliticalGroupSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getPoliticalGroups();
      LayoutAnimation.configureNext(layoutAnimationPresets.spring);
      setGroups(data.groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.label.toLowerCase().includes(q) || g.slug.toLowerCase().includes(q)
    );
  }, [groups, filterText]);

  return (
    <View style={commonStyles.screenContainer}>
      {!loading && !error && groups.length > 0 && (
        <View style={styles.filterBar}>
          <TextInput
            style={styles.filterInput}
            placeholder="Filtrer les groupes..."
            placeholderTextColor={colors.textMuted}
            value={filterText}
            onChangeText={setFilterText}
            accessibilityLabel="Filtrer les groupes politiques"
          />
        </View>
      )}
      <ScrollView style={styles.content}>
        {loading && (
          <StatusMessage type="loading" message="Chargement des groupes politiques..." />
        )}

        {error && (
          <StatusMessage
            type="error"
            message={`Erreur: ${error}`}
            hint="Vérifiez que l'API est disponible et que les députés ont été ingérés."
          />
        )}

        {!loading && !error && (
          <>
            {filteredGroups.length === 0 ? (
              <StatusMessage
                type="empty"
                message={
                  filterText.trim()
                    ? "Aucun groupe ne correspond au filtre."
                    : "Aucun groupe politique trouvé."
                }
              />
            ) : (
              <View style={styles.list}>
                {filteredGroups.map((g) => (
                  <TouchableOpacity
                    key={g.slug}
                    style={styles.groupCard}
                    onPress={() =>
                      router.push(`/groupes/${encodeURIComponent(g.slug)}`)
                    }
                    accessibilityLabel={`${g.label}, ${g.deputy_count} député${g.deputy_count !== 1 ? "s" : ""}`}
                    accessibilityHint="Voir les détails du groupe politique"
                    accessibilityRole="button"
                  >
                    <Text style={styles.groupLabel}>{g.label}</Text>
                    <Text style={styles.groupCount}>
                      {g.deputy_count} député{g.deputy_count !== 1 ? "s" : ""}
                    </Text>
                    <Text style={styles.groupLink}>Voir le groupe →</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    padding: spacing.lg,
    paddingBottom: spacing.sm
  },
  filterInput: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.md,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text
  },
  content: {
    flex: 1
  },
  list: {
    padding: spacing.lg
  },
  groupCard: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  groupLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.xs
  },
  groupCount: {
    fontSize: typography.fontSize.md,
    color: colors.textLight,
    marginBottom: spacing.sm
  },
  groupLink: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium
  }
});
