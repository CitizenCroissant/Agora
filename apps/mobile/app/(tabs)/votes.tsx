import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { DatePickerModal } from "@/app/components/DatePickerModal";
import { StatusMessage } from "@/app/components/StatusMessage";
import { ScreenContainer } from "@/app/components/ScreenContainer";
import type { Scrutin, ScrutinsResponse } from "@agora/shared";
import { colors, spacing, radius, typography, shadows } from "@/theme";
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
  const searchParams = useLocalSearchParams<{ date?: string; tag?: string }>();
  const [data, setData] = useState<ScrutinsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState<string>(getTodayDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(
    () => new Date(getTodayDate() + "T12:00:00"),
  );

  // Sync with URL ?date= for deep links (e.g. from timeline "Voir les scrutins")
  useEffect(() => {
    const dateParam = searchParams.date;
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      setCurrentDate(dateParam);
      setPickerDate(new Date(dateParam + "T12:00:00"));
    }
  }, [searchParams.date]);

  const loadScrutins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from =
        viewMode === "week"
          ? getWeekStart(currentDate)
          : getMonthStart(currentDate);
      const to =
        viewMode === "week"
          ? getWeekEnd(currentDate)
          : getMonthEnd(currentDate);
      const result = await apiClient.getScrutins(from, to);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scrutins");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode]);

  useEffect(() => {
    loadScrutins();
  }, [loadScrutins]);

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
    }
    return formatMonth(currentDate);
  };

  const scrutins = useMemo(() => data?.scrutins ?? [], [data]);
  const byDate = groupScrutinsByDate(scrutins);
  const sortedDates = Array.from(byDate.keys()).sort((a, b) =>
    b.localeCompare(a),
  );

  return (
    <ScreenContainer>
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

        <Text style={styles.periodTitle}>{getPeriodLabel()}</Text>
      </View>

      <ScrollView style={styles.content}>
        {loading && (
          <StatusMessage type="loading" message="Chargement des scrutins..." />
        )}

        {error && (
          <StatusMessage type="error" message={`Erreur: ${error}`} />
        )}

        {!loading && !error && (
          <>
            {sortedDates.length === 0 ? (
              <StatusMessage type="empty" message="Aucun scrutin pour cette période." />
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
                      {scrutin.tags && scrutin.tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                          {scrutin.tags.slice(0, 3).map((tag) => (
                            <View key={tag.id} style={styles.tag}>
                              <Text style={styles.tagText}>{tag.label}</Text>
                            </View>
                          ))}
                          {scrutin.tags.length > 3 && (
                            <Text style={styles.moreTags}>
                              +{scrutin.tags.length - 3}
                            </Text>
                          )}
                        </View>
                      )}
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

      <DatePickerModal
        visible={showDatePicker}
        value={pickerDate}
        onConfirm={handleDateConfirm}
        onCancel={() => setShowDatePicker(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  controlBar: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryTint,
    padding: spacing.lg,
    paddingBottom: spacing.md,
    ...shadows.sm,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  navigationControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rightControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dateButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    minWidth: 44,
  },
  dateButtonText: {
    fontSize: typography.fontSize.lg,
    lineHeight: 20,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.md,
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
    backgroundColor: colors.background,
    ...shadows.sm,
  },
  viewButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textLight,
  },
  viewButtonTextActive: {
    color: colors.primary,
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  iconButtonText: {
    fontSize: 28,
    fontWeight: "300",
    color: colors.text,
  },
  todayButton: {
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
  periodTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    textAlign: "center",
    textTransform: "capitalize",
  },
  content: {
    flex: 1,
  },
  dateSection: {
    marginHorizontal: spacing.lg,
    marginTop: 20,
  },
  dateSectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.md,
    textTransform: "capitalize",
  },
  scrutinCard: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  scrutinHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  badgeAdopte: {
    backgroundColor: colors.successBg,
  },
  badgeRejete: {
    backgroundColor: colors.errorBg,
  },
  badgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  scrutinNumero: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  scrutinTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.lg,
  },
  tagText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  moreTags: {
    fontSize: 11,
    color: colors.textLight,
    alignSelf: "center",
  },
  syntheseRow: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  syntheseText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
});
