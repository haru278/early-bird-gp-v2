import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useGame } from "@/lib/game-store";
import { GrowthLineChart, WakeTimeChart } from "@/components/growth-chart";
import { WeeklyCalendar } from "@/components/weekly-calendar";
import { getGrowthPercentage, calculateGrowthRate } from "@/lib/game-logic";

type ChartTab = "growth" | "waketime" | "calendar";

export default function ChartScreen() {
  const { state } = useGame();
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 40;
  const [activeTab, setActiveTab] = useState<ChartTab>("calendar");

  const growthRate = calculateGrowthRate(state.successDays);
  const growthPct = getGrowthPercentage(state.successDays);
  const winRate =
    state.totalDays > 0
      ? ((state.successDays / state.totalDays) * 100).toFixed(0)
      : "0";

  // Recent 7 days summary
  const recent7 = state.history.slice(-7);
  const recent7Wins = recent7.filter((r) => r.result === "win").length;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📊 Growth Chart</Text>
          <Text style={styles.headerSub}>成長の軌跡</Text>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>+{growthPct}%</Text>
            <Text style={styles.statLabel}>累計成長率</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{state.successDays}</Text>
            <Text style={styles.statLabel}>成功日数</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{winRate}%</Text>
            <Text style={styles.statLabel}>勝率</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{state.longestStreak}</Text>
            <Text style={styles.statLabel}>最長連勝</Text>
          </View>
        </View>

        {/* Growth Milestone */}
        <View style={styles.milestoneCard}>
          <Text style={styles.milestoneEmoji}>📈</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.milestoneTitle}>
              成長率: ×{growthRate.toFixed(4)}
            </Text>
            <Text style={styles.milestoneDesc}>
              1年(365日成功)で ×1.44 に到達！現在 {state.successDays}/365日
            </Text>
          </View>
        </View>

        {/* Chart Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            onPress={() => setActiveTab("calendar")}
            style={[
              styles.tab,
              activeTab === "calendar" && styles.tabActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "calendar" && styles.tabTextActive,
              ]}
            >
              📅 カレンダー
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("growth")}
            style={[
              styles.tab,
              activeTab === "growth" && styles.tabActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "growth" && styles.tabTextActive,
              ]}
            >
              成長率
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("waketime")}
            style={[
              styles.tab,
              activeTab === "waketime" && styles.tabActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "waketime" && styles.tabTextActive,
              ]}
            >
              起床時間
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chart / Calendar */}
        {activeTab === "calendar" ? (
          <WeeklyCalendar history={state.history} weeksToShow={4} />
        ) : activeTab === "growth" ? (
          <GrowthLineChart history={state.history} width={chartWidth} />
        ) : (
          <WakeTimeChart history={state.history} width={chartWidth} />
        )}

        {/* Recent 7 Days */}
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>📅 直近7日間</Text>
          <View style={styles.recentGrid}>
            {recent7.length === 0 ? (
              <Text style={styles.emptyText}>まだデータがありません</Text>
            ) : (
              recent7.map((record, i) => (
                <View key={i} style={styles.dayCard}>
                  <Text style={styles.dayDate}>
                    {record.date.slice(5)}
                  </Text>
                  <Text style={{ fontSize: 20 }}>
                    {record.result === "win" ? "🏆" : "💤"}
                  </Text>
                  <Text style={styles.dayTime}>
                    {record.actualTime || "--:--"}
                  </Text>
                  {record.coinsEarned > 0 && (
                    <Text style={styles.dayCoins}>
                      +{record.coinsEarned}🪙
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        </View>

      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    color: "#F0F4F8",
    fontSize: 24,
    fontWeight: "900",
  },
  headerSub: {
    color: "#8892A0",
    fontSize: 13,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#1B2838",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A3A4E",
  },
  statValue: {
    color: "#66BB6A",
    fontSize: 22,
    fontWeight: "900",
  },
  statLabel: {
    color: "#8892A0",
    fontSize: 11,
    marginTop: 4,
  },
  milestoneCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(102, 187, 106, 0.1)",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(102, 187, 106, 0.2)",
  },
  milestoneEmoji: {
    fontSize: 28,
  },
  milestoneTitle: {
    color: "#66BB6A",
    fontSize: 16,
    fontWeight: "800",
  },
  milestoneDesc: {
    color: "#8892A0",
    fontSize: 12,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#1B2838",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A3A4E",
  },
  tabActive: {
    backgroundColor: "#E53935",
    borderColor: "#E53935",
  },
  tabText: {
    color: "#8892A0",
    fontSize: 14,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#fff",
  },
  recentSection: {
    marginTop: 20,
  },
  recentTitle: {
    color: "#F0F4F8",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
  },
  recentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayCard: {
    backgroundColor: "#1B2838",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    minWidth: 70,
    flex: 1,
    borderWidth: 1,
    borderColor: "#2A3A4E",
  },
  dayDate: {
    color: "#8892A0",
    fontSize: 10,
    marginBottom: 4,
  },
  dayTime: {
    color: "#F0F4F8",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  dayCoins: {
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  emptyText: {
    color: "#8892A0",
    fontSize: 14,
    textAlign: "center",
    padding: 20,
  },

});
