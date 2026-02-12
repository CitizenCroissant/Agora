import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput
} from "react-native";
import { useRouter } from "expo-router";
import type { PoliticalGroupSummary } from "@agora/shared";
import { apiClient } from "@/lib/api";
import { colors } from "@/theme";

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
    <View style={styles.container}>
      {!loading && !error && groups.length > 0 && (
        <View style={styles.filterBar}>
          <TextInput
            style={styles.filterInput}
            placeholder="Filtrer les groupes..."
            placeholderTextColor="#999"
            value={filterText}
            onChangeText={setFilterText}
          />
        </View>
      )}
      <ScrollView style={styles.content}>
        {loading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              Chargement des groupes politiques...
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
            {filteredGroups.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {filterText.trim()
                    ? "Aucun groupe ne correspond au filtre."
                    : "Aucun groupe politique trouvé."}
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {filteredGroups.map((g) => (
                  <TouchableOpacity
                    key={g.slug}
                    style={styles.groupCard}
                    onPress={() =>
                      router.push(`/groupes/${encodeURIComponent(g.slug)}`)
                    }
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
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5"
  },
  filterBar: {
    padding: 16,
    paddingBottom: 0
  },
  filterInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    color: "#333"
  },
  content: {
    flex: 1
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
    fontWeight: "500",
    marginBottom: 8
  },
  errorHint: {
    color: "#666",
    fontSize: 14,
    textAlign: "center"
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center"
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center"
  },
  list: {
    padding: 16
  },
  groupCard: {
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
    elevation: 2
  },
  groupLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0055a4",
    marginBottom: 4
  },
  groupCount: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8
  },
  groupLink: {
    fontSize: 14,
    color: "#0055a4",
    fontWeight: "500"
  }
});
