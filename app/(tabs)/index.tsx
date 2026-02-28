import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { ScreenContainer } from "@/components/screen-container";
import { SetupScreen } from "@/components/setup-screen";
import { useGame } from "@/lib/game-store";
import {
  getCurrentCourse,
  getNextCourse,
  getCourseProgress,
  getGrowthPercentage,
  calculateGrowthRate,
  calculateBedTime,
} from "@/lib/game-logic";
import { CART_LEVELS, type DayRecord } from "@/lib/game-types";
import { useSound } from "@/lib/sound-manager";

function WakeUpResult({ record }: { record: DayRecord }) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.1, { duration: 300, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 150 })
    );
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const isWin = record.result === "win";

  return (
    <Animated.View style={animStyle}>
      <View
        style={[
          styles.resultCard,
          { backgroundColor: isWin ? "rgba(76, 175, 80, 0.15)" : "rgba(255, 23, 68, 0.15)" },
          { borderColor: isWin ? "#4CAF50" : "#FF1744" },
        ]}
      >
        <Text style={{ fontSize: 48, textAlign: "center" }}>
          {isWin ? "🏆" : "💤"}
        </Text>
        <Text
          style={[
            styles.resultTitle,
            { color: isWin ? "#66BB6A" : "#FF5252" },
          ]}
        >
          {isWin ? "VICTORY!" : "DEFEAT..."}
        </Text>
        <Text style={styles.resultSubtitle}>
          {record.actualTime} に起床{" "}
          {isWin ? `(目標: ${record.targetTime})` : `(目標: ${record.targetTime})`}
        </Text>
        {record.coinsEarned > 0 && (
          <View style={styles.coinBadge}>
            <Text style={styles.coinBadgeText}>
              +{record.coinsEarned} コイン 🪙
            </Text>
          </View>
        )}
        {record.earlyBonus && (
          <Text style={styles.bonusText}>⚡ 30分以上早起きボーナス！</Text>
        )}
        {record.starProtected && (
          <Text style={styles.bonusText}>⭐ スター発動！時間変更なし</Text>
        )}
        {record.mushroomActive && (
          <Text style={styles.bonusText}>🍄 キノコ発動！コイン2倍</Text>
        )}
      </View>
    </Animated.View>
  );
}

function RaceDashboard() {
  const { state, wakeUp, hasWokenUpToday, todayRecord } = useGame();
  const { playSE } = useSound();
  const [showResult, setShowResult] = useState(false);
  const [lastRecord, setLastRecord] = useState<DayRecord | null>(null);

  const course = getCurrentCourse(state.totalCoins);

  const nextCourse = getNextCourse(state.totalCoins);
  const progress = getCourseProgress(state.totalCoins);
  const growthPct = getGrowthPercentage(state.successDays);

  const buttonScale = useSharedValue(1);
  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleWakeUp = useCallback(() => {
    if (hasWokenUpToday) return;
    const result = wakeUp();
    if (result) {
      setLastRecord(result.record);
      setShowResult(true);
      // Play victory or defeat SE
      if (result.record.result === "win") {
        playSE("victory");
        if (result.record.coinsEarned > 0) {
          setTimeout(() => playSE("coin"), 500);
        }
      } else {
        playSE("defeat");
      }
    }
  }, [hasWokenUpToday, wakeUp, playSE]);

  // Show today's record if already recorded
  useEffect(() => {
    if (todayRecord) {
      setLastRecord(todayRecord);
      setShowResult(true);
    }
  }, []);

  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
      );
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.courseName}>
              {course.emoji} {course.name}
            </Text>
            <Text style={styles.streakText}>
              🔥 {state.currentStreak}連勝
            </Text>
          </View>
          <View style={styles.coinContainer}>
            <Text style={styles.coinText}>🪙 {state.totalCoins}</Text>
          </View>
        </View>

        {/* Course Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: course.color,
                },
              ]}
            />
            <View
              style={[
                styles.cartIcon,
                { left: `${Math.min(progress * 100, 92)}%` },
              ]}
            >
              <Text style={{ fontSize: 16 }}>{CART_LEVELS[state.cartLevel]?.emoji ?? "🏎️"}</Text>
            </View>
          </View>
          {nextCourse && (
            <Text style={styles.progressText}>
              Next: {nextCourse.emoji} {nextCourse.name} (あと{" "}
              {nextCourse.requiredCoins - state.totalCoins} コイン)
            </Text>
          )}
        </View>

        {/* Main Race Area */}
        <View style={styles.raceArea}>
          {/* Target Time */}
          <View style={styles.targetSection}>
            <Text style={styles.targetLabel}>🎯 TODAY'S TARGET</Text>
            <Text style={styles.targetTime}>{state.currentTargetTime}</Text>
            <Text style={styles.currentTimeText}>
              現在時刻: {currentTime}
            </Text>
          </View>

          {/* Growth Rate */}
          <View style={styles.growthCard}>
            <Text style={styles.growthLabel}>📈 成長率</Text>
            <Text style={styles.growthValue}>
              +{growthPct}%
            </Text>
            <Text style={styles.growthDetail}>
              {state.successDays}日成功 / {state.totalDays}日
            </Text>
          </View>

          {/* Wake Up Button or Result */}
          {showResult && lastRecord ? (
            <WakeUpResult record={lastRecord} />
          ) : (
            <Animated.View style={buttonAnimStyle}>
              <TouchableOpacity
                onPress={handleWakeUp}
                disabled={hasWokenUpToday}
                style={[
                  styles.wakeUpButton,
                  hasWokenUpToday && styles.wakeUpButtonDisabled,
                ]}
              >
                <Text style={styles.wakeUpButtonEmoji}>☀️</Text>
                <Text style={styles.wakeUpButtonText}>
                  {hasWokenUpToday ? "記録済み" : "起床！"}
                </Text>
                <Text style={styles.wakeUpButtonSub}>
                  {hasWokenUpToday
                    ? "明日もがんばろう"
                    : "タップして起床を記録"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📅</Text>
            <Text style={styles.statValue}>{state.totalDays}</Text>
            <Text style={styles.statLabel}>総日数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{state.longestStreak}</Text>
            <Text style={styles.statLabel}>最長連勝</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🎯</Text>
            <Text style={styles.statValue}>{state.goalWakeTime}</Text>
            <Text style={styles.statLabel}>最終目標</Text>
          </View>
        </View>

        {/* Items Quick View */}
        {(state.items.mushroom > 0 ||
          state.items.star > 0 ||
          state.items.killer > 0) && (
          <View style={styles.itemsQuick}>
            <Text style={styles.itemsQuickTitle}>🎒 所持アイテム</Text>
            <View style={styles.itemsRow}>
              {state.items.mushroom > 0 && (
                <View style={styles.itemBadge}>
                  <Text style={styles.itemBadgeText}>
                    🍄 ×{state.items.mushroom}
                  </Text>
                </View>
              )}
              {state.items.star > 0 && (
                <View style={styles.itemBadge}>
                  <Text style={styles.itemBadgeText}>
                    ⭐ ×{state.items.star}
                  </Text>
                </View>
              )}
              {state.items.killer > 0 && (
                <View style={styles.itemBadge}>
                  <Text style={styles.itemBadgeText}>
                    🚀 ×{state.items.killer}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

export default function HomeScreen() {
  const { state, isLoading } = useGame();

  if (isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <Text className="text-4xl mb-4">🏎️</Text>
          <Text className="text-foreground text-lg font-bold">Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!state.setupComplete) {
    return <SetupScreen />;
  }

  return <RaceDashboard />;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  courseName: {
    color: "#F0F4F8",
    fontSize: 16,
    fontWeight: "700",
  },
  streakText: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  coinContainer: {
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  coinText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "800",
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 20,
    backgroundColor: "#1B2838",
    borderRadius: 10,
    overflow: "visible",
    borderWidth: 1,
    borderColor: "#2A3A4E",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
    opacity: 0.8,
  },
  cartIcon: {
    position: "absolute",
    top: -4,
    marginLeft: -10,
  },
  progressText: {
    color: "#8892A0",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  raceArea: {
    gap: 16,
    marginBottom: 16,
  },
  targetSection: {
    alignItems: "center",
    backgroundColor: "#1B2838",
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#2A3A4E",
  },
  targetLabel: {
    color: "#8892A0",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 8,
  },
  targetTime: {
    color: "#F0F4F8",
    fontSize: 56,
    fontWeight: "900",
    letterSpacing: 2,
  },
  currentTimeText: {
    color: "#8892A0",
    fontSize: 14,
    marginTop: 4,
  },
  growthCard: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.2)",
  },
  growthLabel: {
    color: "#8892A0",
    fontSize: 12,
    fontWeight: "600",
  },
  growthValue: {
    color: "#66BB6A",
    fontSize: 28,
    fontWeight: "900",
    marginVertical: 2,
  },
  growthDetail: {
    color: "#8892A0",
    fontSize: 12,
  },
  wakeUpButton: {
    backgroundColor: "#E53935",
    borderRadius: 24,
    paddingVertical: 28,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#E53935",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
      web: {},
    }),
  },
  wakeUpButtonDisabled: {
    backgroundColor: "#2A3A4E",
    ...Platform.select({
      ios: {
        shadowColor: "transparent",
        shadowOpacity: 0,
      },
      android: { elevation: 0 },
      web: {},
    }),
  },
  wakeUpButtonEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  wakeUpButtonText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 2,
  },
  wakeUpButtonSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    marginTop: 4,
  },
  resultCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 8,
  },
  resultSubtitle: {
    color: "#8892A0",
    fontSize: 14,
    marginTop: 4,
  },
  coinBadge: {
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  coinBadgeText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "800",
  },
  bonusText: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1B2838",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A3A4E",
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    color: "#F0F4F8",
    fontSize: 14,
    fontWeight: "800",
  },
  statLabel: {
    color: "#8892A0",
    fontSize: 10,
    marginTop: 2,
  },
  itemsQuick: {
    backgroundColor: "#1B2838",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2A3A4E",
  },
  itemsQuickTitle: {
    color: "#F0F4F8",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  itemsRow: {
    flexDirection: "row",
    gap: 8,
  },
  itemBadge: {
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
  },
  itemBadgeText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "700",
  },
});
