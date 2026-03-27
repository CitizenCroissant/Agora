import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation
} from "react-native";
import { useRouter } from "expo-router";
import { DatePickerModal } from "@/app/components/DatePickerModal";
import { StatusMessage } from "@/app/components/StatusMessage";
import { ScreenContainer } from "@/app/components/ScreenContainer";
import { AgendaRangeResponse } from "@agora/shared";
import { colors, spacing, radius, typography, shadows, sectionColors } from "@/theme";
import { layoutAnimationPresets } from "@/lib/animations";
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
  formatMonth
} from "@agora/shared";
import { apiClient } from "@/lib/api";

type ViewMode = "week" | "month";

export default function TimelineScreen() {
  const router = useRouter();
  const [agendaRange, setAgendaRange] = useState<AgendaRangeResponse | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState<string>(getTodayDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(
    () => new Date(currentDate + "T12:00:00")
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
      LayoutAnimation.configureNext(layoutAnimationPresets.normal);
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
    <ScreenContainer>
      <View style={styles.controlBar}>
        <View style={styles.topRow}>
          <View style={styles.navigationControls}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handlePrevious}
              accessibilityLabel={viewMode === "week" ? "Semaine précédente" : "Mois précédent"}
              accessibilityRole="button"
            >
              <Text style={styles.iconButtonText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleNext}
              accessibilityLabel={viewMode === "week" ? "Semaine suivante" : "Mois suivant"}
              accessibilityRole="button"
            >
              <Text style={styles.iconButtonText}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.todayButton}
              onPress={handleToday}
              accessibilityLabel="Aller à aujourd'hui"
              accessibilityRole="button"
            >
              <Text style={styles.todayButtonText}>Aujourd&apos;hui</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rightControls}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={openDatePicker}
              accessibilityLabel="Choisir une date"
              accessibilityRole="button"
            >
              <Text style={styles.dateButtonText}>📅</Text>
            </TouchableOpacity>
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[
                  styles.viewButton,
                  viewMode === "week" && styles.viewButtonActive
                ]}
                onPress={() => setViewMode("week")}
                accessibilityLabel="Vue semaine"
                accessibilityRole="button"
                accessibilityState={{ selected: viewMode === "week" }}
              >
                <Text
                  style={[
                    styles.viewButtonText,
                    viewMode === "week" && styles.viewButtonTextActive
                  ]}
                >
                  S
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewButton,
                  viewMode === "month" && styles.viewButtonActive
                ]}
                onPress={() => setViewMode("month")}
                accessibilityLabel="Vue mois"
                accessibilityRole="button"
                accessibilityState={{ selected: viewMode === "month" }}
              >
                <Text
                  style={[
                    styles.viewButtonText,
                    viewMode === "month" && styles.viewButtonTextActive
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
          <StatusMessage type="loading" message="Chargement..." />
        )}

        {error && (
          <StatusMessage type="error" message={`Erreur: ${error}`} />
        )}

        {!loading && !error && agendaRange && (
          <>
            {agendaRange.agendas.length === 0 ? (
              <StatusMessage type="empty" message="Aucune séance prévue pour cette période." />
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
                        accessibilityLabel={`Voir les scrutins du ${formatDate(agenda.date)}`}
                        accessibilityRole="button"
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
                          accessibilityLabel={sitting.title}
                          accessibilityHint="Voir les détails de la séance"
                          accessibilityRole="button"
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
    ...shadows.sm
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md
  },
  navigationControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background
  },
  iconButtonText: {
    fontSize: 28,
    fontWeight: "300",
    color: colors.text,
    lineHeight: 32
  },
  todayButton: {
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    marginLeft: 6
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background
  },
  rightControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
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
    minWidth: 44
  },
  dateButtonText: {
    fontSize: typography.fontSize.lg,
    lineHeight: 20
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.md,
    padding: 3,
    gap: 2
  },
  viewButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    backgroundColor: "transparent"
  },
  viewButtonActive: {
    backgroundColor: colors.background,
    ...shadows.sm
  },
  viewButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textLight
  },
  viewButtonTextActive: {
    color: colors.primary
  },
  periodLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    textAlign: "center",
    textTransform: "capitalize"
  },
  content: {
    flex: 1
  },
  dateSection: {
    marginBottom: spacing.xl,
    paddingLeft: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.border,
    marginLeft: spacing.lg
  },
  todaySection: {
    borderLeftColor: sectionColors.calendrier
  },
  dateHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingRight: spacing.lg,
    gap: spacing.sm
  },
  dateLink: {
    marginLeft: "auto"
  },
  dateLinkText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: sectionColors.votes
  },
  dateText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    textTransform: "capitalize",
    flex: 1,
    color: colors.text
  },
  todayBadge: {
    backgroundColor: sectionColors.calendrier,
    color: colors.background,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    overflow: "hidden"
  },
  noSittings: {
    fontSize: typography.fontSize.md,
    color: colors.textMuted,
    fontStyle: "italic",
    marginBottom: spacing.md
  },
  sittingCard: {
    backgroundColor: colors.background,
    marginRight: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  sittingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs
  },
  sittingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    flex: 1,
    marginRight: spacing.sm
  },
  timeRange: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm
  },
  itemCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight
  }
});
