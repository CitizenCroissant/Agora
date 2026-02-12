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
import type { CirconscriptionDetail } from "@agora/shared";
import { apiClient } from "@/lib/api";
import { colors } from "@/theme";

export default function CirconscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [circonscription, setCirconscription] =
    useState<CirconscriptionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadCirconscription(id);
    }
  }, [id]);

  const loadCirconscription = async (circoId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getCirconscription(circoId);
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
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              Chargement de la circonscription...
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Erreur: {error}</Text>
          </View>
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
  deputyMeta: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8
  },
  deputyLink: {
    fontSize: 14,
    color: "#0055a4",
    fontWeight: "500"
  }
});
