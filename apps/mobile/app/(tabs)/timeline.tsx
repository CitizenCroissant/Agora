import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { DatePickerModal } from "@/app/components/DatePickerModal";
import { AgendaRangeResponse } from "@agora/shared";
import {
  getTodayDate,
  formatDate,
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
  addWeeks,
  addMonths,
  formatDateRange,
  formatMonth,
} from "@agora/shared";
import { apiClient } from "@/lib/api";

type ViewMode = "week" | "month";

export default function TimelineScreen() {
  const router = useRouter();
  const [agendaRange, setAgendaRange] = useState<AgendaRangeResponse | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState<string>(getTodayDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(
    () => new Date(currentDate + "T12:00:00"),
  );

  useEffect(() => {
    loadTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, currentDate]);

  const loadTimeline = async () => {
    setLoading(true);
    setError(null);
    try {
      let from: string;
      let to: string;

      if (viewMode === "week") {
        from = getWeekStart(currentDate);
        to = getWeekEnd(currentDate);
      } else {
        from = getMonthStart(currentDate);
        to = getMonthEnd(currentDate);
      }

      const data = await apiClient.getAgendaRange(from, to);
      setAgendaRange(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timeline");
      setAgendaRange(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, -1));
    } else {
      setCurrentDate(addMonths(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(getTodayDate());
  };

  const openDatePicker = () => {
    setPickerDate(new Date(currentDate + "T12:00:00"));
    setShowDatePicker(true);
  };

  const dateToYyyyMmDd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const handleDateConfirm = (date: Date) => {
    setCurrentDate(dateToYyyyMmDd(date));
    setShowDatePicker(false);
  };

  const getPeriodLabel = () => {
    if (viewMode === "week") {
      const from = getWeekStart(currentDate);
      const to = getWeekEnd(currentDate);
      return formatDateRange(from, to);
    } else {
      return formatMonth(currentDate);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.controlBar}>
        <View style={styles.topRow}>
          <View style={styles.navigationControls}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handlePrevious}
            >
              <Text style={styles.iconButtonText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleNext}>
              <Text style={styles.iconButtonText}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.todayButton} onPress={handleToday}>
              <Text style={styles.todayButtonText}>Aujourd&apos;hui</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rightControls}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={openDatePicker}
            >
              <Text style={styles.dateButtonText}>📅</Text>
            </TouchableOpacity>
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[
                  styles.viewButton,
                  viewMode === "week" && styles.viewButtonActive,
                ]}
                onPress={() => setViewMode("week")}
              >
                <Text
                  style={[
                    styles.viewButtonText,
                    viewMode === "week" && styles.viewButtonTextActive,
                  ]}
                >
                  S
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewButton,
                  viewMode === "month" && styles.viewButtonActive,
                ]}
                onPress={() => setViewMode("month")}
              >
                <Text
                  style={[
                    styles.viewButtonText,
                    viewMode === "month" && styles.viewButtonTextActive,
                  ]}
                >
                  M
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.periodLabel}>{getPeriodLabel()}</Text>
      </View>

      <ScrollView style={styles.content}>
        {loading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#0055a4" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Erreur: {error}</Text>
          </View>
        )}

        {!loading && !error && agendaRange && (
          <>
            {agendaRange.agendas.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Aucune séance prévue pour cette période.
                </Text>
              </View>
            ) : (
              agendaRange.agendas.map((agenda) => {
                const isToday = agenda.date === getTodayDate();
                return (
                  <View
                    key={agenda.date}
                    style={[styles.dateSection, isToday && styles.todaySection]}
                  >
                    <View style={styles.dateHeader}>
                      <Text style={styles.dateText}>
                        {formatDate(agenda.date)}
                      </Text>
                      {isToday && (
                        <Text style={styles.todayBadge}>Aujourd&apos;hui</Text>
                      )}
                      <TouchableOpacity
                        style={styles.dateLink}
                        onPress={() =>
                          router.push(`/votes?date=${agenda.date}`)
                        }
                      >
                        <Text style={styles.dateLinkText}>
                          Voir les scrutins →
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {agenda.sittings.length === 0 ? (
                      <Text style={styles.noSittings}>
                        Aucune séance prévue
                      </Text>
                    ) : (
                      agenda.sittings.map((sitting) => (
                        <TouchableOpacity
                          key={sitting.id}
                          style={styles.sittingCard}
                          onPress={() => router.push(`/sitting/${sitting.id}`)}
                        >
                          <View style={styles.sittingHeader}>
                            <Text style={styles.sittingTitle}>
                              {sitting.title}
                            </Text>
                            {sitting.time_range && (
                              <Text style={styles.timeRange}>
                                {sitting.time_range}
                              </Text>
                            )}
                          </View>
                          <Text style={styles.itemCount}>
                            {sitting.agenda_items.length} point(s) à
                            l&apos;ordre du jour
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        value={pickerDate}
        onConfirm={handleDateConfirm}
        onCancel={() => setShowDatePicker(false)}
      />
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  navigationControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    lineHeight: 32,
  },
  todayButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#0055a4",
    borderRadius: 8,
    marginLeft: 6,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  rightControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#fff",
    minWidth: 44,
  },
  dateButtonText: {
    fontSize: 18,
    lineHeight: 20,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 3,
    gap: 2,
  },
  viewButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    backgroundColor: "transparent",
  },
  viewButtonActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  viewButtonTextActive: {
    color: "#0055a4",
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
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
    marginBottom: 24,
    paddingLeft: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#e0e0e0",
  },
  todaySection: {
    borderLeftColor: "#ef4135",
  },
  dateHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 12,
    paddingRight: 16,
    gap: 8,
  },
  dateLink: {
    marginLeft: "auto",
  },
  dateLinkText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0055a4",
  },
  dateText: {
    fontSize: 18,
    fontWeight: "600",
    textTransform: "capitalize",
    flex: 1,
  },
  todayBadge: {
    backgroundColor: "#ef4135",
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  noSittings: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    marginBottom: 12,
  },
  sittingCard: {
    backgroundColor: "#fff",
    marginRight: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  sittingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  sittingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0055a4",
    flex: 1,
    marginRight: 8,
  },
  timeRange: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  itemCount: {
    fontSize: 12,
    color: "#666",
  },
});
