import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import type { CirconscriptionSummary } from "@agora/shared";
import { apiClient } from "@/lib/api";

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
        c.label.toLowerCase().includes(q) || c.id.toLowerCase().includes(q),
    );
  }, [circonscriptions, filterText]);

  return (
    <View style={styles.container}>
      {!loading && !error && circonscriptions.length > 0 && (
        <View style={styles.filterBar}>
          <TextInput
            style={styles.filterInput}
            placeholder="Filtrer les circonscriptions..."
            placeholderTextColor="#999"
            value={filterText}
            onChangeText={setFilterText}
          />
        </View>
      )}
      <ScrollView style={styles.content}>
        {loading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#0055a4" />
            <Text style={styles.loadingText}>
              Chargement des circonscriptions...
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Erreur: {error}</Text>
            <Text style={styles.errorHint}>
              Vérifiez que l&apos;API est disponible et que les députés ont été
              ingérés.
            </Text>
          </View>
        )}

        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {filterText.trim()
                    ? "Aucune circonscription ne correspond au filtre."
                    : "Aucune circonscription trouvée."}
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {filtered.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.card}
                    onPress={() =>
                      router.push(
                        `/circonscriptions/${encodeURIComponent(c.id)}`,
                      )
                    }
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
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  filterBar: {
    padding: 16,
    paddingBottom: 0,
  },
  filterInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    color: "#333",
  },
  content: {
    flex: 1,
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
    marginBottom: 8,
  },
  errorHint: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0055a4",
    marginBottom: 4,
  },
  cardCount: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  cardLink: {
    fontSize: 14,
    color: "#0055a4",
    fontWeight: "500",
  },
});
