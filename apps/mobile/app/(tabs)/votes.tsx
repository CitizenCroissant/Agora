import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import type { Scrutin, ScrutinsResponse } from "@agora/shared";
import {
  createApiClient,
  getTodayDate,
  formatDate,
  getWeekStart,
  getWeekEnd,
  addWeeks,
  formatDateRange,
} from "@agora/shared";
import { Config } from "../../config";

const apiClient = createApiClient(Config.API_URL);

function groupScrutinsByDate(scrutins: Scrutin[]): Map<string, Scrutin[]> {
  const map = new Map<string, Scrutin[]>();
  for (const s of scrutins) {
    const d = s.date_scrutin;
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(s);
  }
  return map;
}

export default function VotesTabScreen() {
  const router = useRouter();
  const [data, setData] = useState<ScrutinsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<string>(getTodayDate());

  const loadScrutins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = getWeekStart(currentDate);
      const to = getWeekEnd(currentDate);
      const result = await apiClient.getScrutins(from, to);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scrutins");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadScrutins();
  }, [loadScrutins]);

  const handlePrevious = () => {
    setCurrentDate(addWeeks(currentDate, -1));
  };

  const handleNext = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(getTodayDate());
  };

  const scrutins = useMemo(() => data?.scrutins ?? [], [data]);
  const byDate = groupScrutinsByDate(scrutins);
  const sortedDates = Array.from(byDate.keys()).sort((a, b) =>
    b.localeCompare(a),
  );
  const from = getWeekStart(currentDate);
  const to = getWeekEnd(currentDate);
  const periodLabel = formatDateRange(from, to);

  return (
    <View style={styles.container}>
      <View style={styles.controlBar}>
        <View style={styles.navigationControls}>
          <TouchableOpacity style={styles.iconButton} onPress={handlePrevious}>
            <Text style={styles.iconButtonText}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleNext}>
            <Text style={styles.iconButtonText}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.todayButton} onPress={handleToday}>
            <Text style={styles.todayButtonText}>Aujourd&apos;hui</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.periodTitle}>{periodLabel}</Text>
      </View>

      <ScrollView style={styles.content}>
        {loading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#0055a4" />
            <Text style={styles.loadingText}>Chargement des scrutins...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Erreur: {error}</Text>
          </View>
        )}

        {!loading && !error && (
          <>
            {sortedDates.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Aucun scrutin pour cette période.
                </Text>
              </View>
            ) : (
              sortedDates.map((dateStr) => (
                <View key={dateStr} style={styles.dateSection}>
                  <Text style={styles.dateSectionTitle}>
                    {formatDate(dateStr)}
                  </Text>
                  {(byDate.get(dateStr) ?? []).map((scrutin) => (
                    <TouchableOpacity
                      key={scrutin.id}
                      style={styles.scrutinCard}
                      onPress={() => router.push(`/votes/${scrutin.id}`)}
                    >
                      <View style={styles.scrutinHeader}>
                        <View
                          style={[
                            styles.badge,
                            scrutin.sort_code === "adopté"
                              ? styles.badgeAdopte
                              : styles.badgeRejete,
                          ]}
                        >
                          <Text style={styles.badgeText}>
                            {scrutin.sort_code === "adopté"
                              ? "Adopté"
                              : "Rejeté"}
                          </Text>
                        </View>
                        <Text style={styles.scrutinNumero}>
                          Scrutin n°{scrutin.numero}
                        </Text>
                      </View>
                      <Text style={styles.scrutinTitle} numberOfLines={3}>
                        {scrutin.titre}
                      </Text>
                      <View style={styles.syntheseRow}>
                        <Text style={styles.syntheseText}>
                          Pour {scrutin.synthese_pour} · Contre{" "}
                          {scrutin.synthese_contre}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))
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
  controlBar: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 85, 164, 0.1)",
    padding: 16,
    paddingBottom: 12,
  },
  navigationControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  iconButtonText: {
    fontSize: 28,
    fontWeight: "300",
    color: "#333",
  },
  todayButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#0055a4",
    borderRadius: 8,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  periodTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginTop: 12,
    textTransform: "capitalize",
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
  dateSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  dateSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0055a4",
    marginBottom: 12,
    textTransform: "capitalize",
  },
  scrutinCard: {
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
  scrutinHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeAdopte: {
    backgroundColor: "rgba(0, 128, 0, 0.15)",
  },
  badgeRejete: {
    backgroundColor: "rgba(200, 0, 0, 0.15)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  scrutinNumero: {
    fontSize: 12,
    color: "#666",
  },
  scrutinTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  syntheseRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  syntheseText: {
    fontSize: 12,
    color: "#666",
  },
});
