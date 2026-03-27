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
import type { CirconscriptionDetail } from "@agora/shared";
import { apiClient } from "@/lib/api";
import { StatusMessage } from "@/app/components/StatusMessage";
import { colors, spacing, radius, typography, shadows } from "@/theme";

export default function CirconscriptionDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [circonscription, setCirconscription] =
    useState<CirconscriptionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadCirconscription(slug);
    }
  }, [slug]);

  const loadCirconscription = async (s: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getCirconscription(s);
      setCirconscription(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Circonscription introuvable"
      );
      setCirconscription(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: circonscription?.label ?? "Circonscription",
          headerBackTitle: "Retour"
        }}
      />
      <ScrollView style={styles.container}>
        {loading && (
          <StatusMessage type="loading" message="Chargement de la circonscription..." />
        )}

        {error && (
          <StatusMessage type="error" message={`Erreur: ${error}`} />
        )}

        {!loading && !error && circonscription && (
          <View style={styles.content}>
            <Text style={styles.deputyCount}>
              {circonscription.deputy_count} député
              {circonscription.deputy_count !== 1 ? "s" : ""} dans cette
              circonscription
            </Text>

            <View style={styles.deputyList}>
              {circonscription.deputies.map((d) => {
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
                    <Text style={styles.deputyLink}>Voir la fiche →</Text>
                  </TouchableOpacity>
                );
              })}
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
    backgroundColor: colors.backgroundAlt
  },
  content: {
    padding: spacing.lg
  },
  deputyCount: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    marginBottom: spacing.lg
  },
  deputyList: {
    gap: spacing.md
  },
  deputyCard: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.lg,
    borderRadius: radius.md,
    ...shadows.sm
  },
  deputyName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.xs
  },
  deputyMeta: {
    fontSize: typography.fontSize.md,
    color: colors.textLight,
    marginBottom: spacing.sm
  },
  deputyLink: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium
  }
});
