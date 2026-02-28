import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { DayRecord } from "@/lib/game-types";

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

interface WeeklyCalendarProps {
  history: DayRecord[];
  weeksToShow?: number;
}

function getWeeksData(history: DayRecord[], weeksToShow: number) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Build a map of date -> record
  const recordMap = new Map<string, DayRecord>();
  for (const record of history) {
    recordMap.set(record.date, record);
  }

  // Get the start of the current week (Sunday)
  const currentDay = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - currentDay);

  const weeks: { date: string; dayOfWeek: number; record: DayRecord | null; isToday: boolean; isFuture: boolean }[][] = [];

  for (let w = weeksToShow - 1; w >= 0; w--) {
    const week: typeof weeks[0] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() - w * 7 + d);
      const dateStr = date.toISOString().split("T")[0];
      const isFuture = date > today;
      week.push({
        date: dateStr,
        dayOfWeek: d,
        record: recordMap.get(dateStr) ?? null,
        isToday: dateStr === todayStr,
        isFuture,
      });
    }
    weeks.push(week);
  }

  return weeks;
}

export function WeeklyCalendar({ history, weeksToShow = 4 }: WeeklyCalendarProps) {
  const weeks = useMemo(() => getWeeksData(history, weeksToShow), [history, weeksToShow]);

  // Calculate stats for the period
  const allDays = weeks.flat().filter((d) => d.record);
  const wins = allDays.filter((d) => d.record?.result === "win").length;
  const total = allDays.length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* Header with stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBadge}>
          <Text style={styles.statBadgeText}>🏆 {wins}勝</Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={styles.statBadgeText}>💤 {total - wins}敗</Text>
        </View>
        <View style={[styles.statBadge, styles.statBadgeHighlight]}>
          <Text style={[styles.statBadgeText, styles.statBadgeHighlightText]}>
            勝率 {winRate}%
          </Text>
        </View>
      </View>

      {/* Day labels */}
      <View style={styles.dayLabelsRow}>
        {DAY_LABELS.map((label, i) => (
          <View key={i} style={styles.dayLabelCell}>
            <Text
              style={[
                styles.dayLabelText,
                i === 0 && { color: "#FF5252" },
                i === 6 && { color: "#64B5F6" },
              ]}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Weeks grid */}
      {weeks.map((week, wi) => {
        // Get week date range for label
        const weekLabel = week[0].date.slice(5);
        return (
          <View key={wi}>
            <Text style={styles.weekLabel}>{weekLabel}〜</Text>
            <View style={styles.weekRow}>
              {week.map((day, di) => {
                const hasRecord = day.record !== null;
                const isWin = day.record?.result === "win";
                const isLose = day.record?.result === "lose";

                return (
                  <View
                    key={di}
                    style={[
                      styles.dayCell,
                      day.isToday && styles.dayCellToday,
                      day.isFuture && styles.dayCellFuture,
                    ]}
                  >
                    <Text style={styles.dayNumber}>
                      {parseInt(day.date.slice(8), 10)}
                    </Text>
                    {hasRecord ? (
                      <View
                        style={[
                          styles.resultDot,
                          isWin && styles.resultDotWin,
                          isLose && styles.resultDotLose,
                        ]}
                      >
                        <Text style={styles.resultEmoji}>
                          {isWin ? "🏆" : "💤"}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.resultDotEmpty} />
                    )}
                    {hasRecord && day.record!.coinsEarned > 0 && (
                      <Text style={styles.coinMini}>
                        +{day.record!.coinsEarned}
                      </Text>
                    )}
                    {hasRecord && day.record!.actualTime && (
                      <Text style={styles.timeMini}>
                        {day.record!.actualTime}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "rgba(76, 175, 80, 0.3)" }]} />
          <Text style={styles.legendText}>勝利</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "rgba(255, 23, 68, 0.3)" }]} />
          <Text style={styles.legendText}>敗北</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#1B2838" }]} />
          <Text style={styles.legendText}>記録なし</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1B2838",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A3A4E",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  statBadge: {
    backgroundColor: "#0D1B2A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A3A4E",
  },
  statBadgeText: {
    color: "#F0F4F8",
    fontSize: 12,
    fontWeight: "700",
  },
  statBadgeHighlight: {
    backgroundColor: "rgba(255, 214, 0, 0.1)",
    borderColor: "rgba(255, 214, 0, 0.3)",
  },
  statBadgeHighlightText: {
    color: "#FFD700",
  },
  dayLabelsRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  dayLabelCell: {
    flex: 1,
    alignItems: "center",
  },
  dayLabelText: {
    color: "#8892A0",
    fontSize: 11,
    fontWeight: "600",
  },
  weekLabel: {
    color: "#4A5568",
    fontSize: 10,
    marginTop: 6,
    marginBottom: 2,
  },
  weekRow: {
    flexDirection: "row",
    gap: 2,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 72,
  },
  dayCellToday: {
    backgroundColor: "rgba(229, 57, 53, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(229, 57, 53, 0.4)",
  },
  dayCellFuture: {
    opacity: 0.3,
  },
  dayNumber: {
    color: "#8892A0",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
  },
  resultDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  resultDotWin: {
    backgroundColor: "rgba(76, 175, 80, 0.2)",
  },
  resultDotLose: {
    backgroundColor: "rgba(255, 23, 68, 0.2)",
  },
  resultDotEmpty: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0D1B2A",
    borderWidth: 1,
    borderColor: "#2A3A4E",
  },
  resultEmoji: {
    fontSize: 14,
  },
  coinMini: {
    color: "#FFD700",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 1,
  },
  timeMini: {
    color: "#64B5F6",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 1,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#2A3A4E",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: "#8892A0",
    fontSize: 10,
  },
});
