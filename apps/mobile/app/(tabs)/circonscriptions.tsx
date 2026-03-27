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
import type { CirconscriptionSummary } from "@agora/shared";
import { apiClient } from "@/lib/api";
import { StatusMessage } from "@/app/components/StatusMessage";
import { colors, spacing, radius, typography, shadows, commonStyles } from "@/theme";
import { layoutAnimationPresets } from "@/lib/animations";

export default function CirconscriptionsTabScreen() {
  const router = useRouter();
  const [circonscriptions, setCirconscriptions] = useState<
    CirconscriptionSummary[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    loadCirconscriptions();
  }, []);

  const loadCirconscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getCirconscriptions();
      LayoutAnimation.configureNext(layoutAnimationPresets.spring);
      setCirconscriptions(data.circonscriptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
      setCirconscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return circonscriptions;
    return circonscriptions.filter(
      (c) =>
        c.label.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    );
  }, [circonscriptions, filterText]);

  return (
    <View style={commonStyles.screenContainer}>
      {!loading && !error && circonscriptions.length > 0 && (
        <View style={styles.filterBar}>
          <TextInput
            style={styles.filterInput}
            placeholder="Filtrer les circonscriptions..."
            placeholderTextColor={colors.textMuted}
            value={filterText}
            onChangeText={setFilterText}
            accessibilityLabel="Filtrer les circonscriptions"
          />
        </View>
      )}
      <ScrollView style={styles.content}>
        {loading && (
          <StatusMessage type="loading" message="Chargement des circonscriptions..." />
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
            {filtered.length === 0 ? (
              <StatusMessage
                type="empty"
                message={
                  filterText.trim()
                    ? "Aucune circonscription ne correspond au filtre."
                    : "Aucune circonscription trouvée."
                }
              />
            ) : (
              <View style={styles.list}>
                {filtered.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.card}
                    onPress={() =>
                      router.push(
                        `/circonscriptions/${encodeURIComponent(c.id)}`
                      )
                    }
                    accessibilityLabel={`${c.label}, ${c.deputy_count} député${c.deputy_count !== 1 ? "s" : ""}`}
                    accessibilityHint="Voir les députés de cette circonscription"
                    accessibilityRole="button"
                  >
                    <Text style={styles.cardLabel}>{c.label}</Text>
                    <Text style={styles.cardCount}>
                      {c.deputy_count} député{c.deputy_count !== 1 ? "s" : ""}
                    </Text>
                    <Text style={styles.cardLink}>
                      Voir la circonscription →
                    </Text>
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
  card: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  cardLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.xs
  },
  cardCount: {
    fontSize: typography.fontSize.md,
    color: colors.textLight,
    marginBottom: spacing.sm
  },
  cardLink: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium
  }
});
