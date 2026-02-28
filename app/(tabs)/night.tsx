import React, { useState, useEffect } from "react";
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
  Easing,
} from "react-native-reanimated";
import { ScreenContainer } from "@/components/screen-container";
import { useGame } from "@/lib/game-store";
import { calculateBedTime, getToday } from "@/lib/game-logic";
import { useSound } from "@/lib/sound-manager";

export default function NightScreen() {
  const { state, pitIn } = useGame();
  const { playSE } = useSound();
  const today = getToday();
  const hasPitInToday = state.lastPitInDate === today;

  const recommendedBedTime = calculateBedTime(
    state.currentTargetTime,
    state.sleepDurationHours
  );

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

  const scale = useSharedValue(1);
  const pitInDoneScale = useSharedValue(0.5);
  const pitInDoneOpacity = useSharedValue(0);

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const doneAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pitInDoneScale.value }],
    opacity: pitInDoneOpacity.value,
  }));

  const [showDone, setShowDone] = useState(hasPitInToday);

  const handlePitIn = () => {
    pitIn();
    playSE("pitin");
    setShowDone(true);
    pitInDoneScale.value = withSequence(
      withTiming(1.1, { duration: 300, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 150 })
    );
    pitInDoneOpacity.value = withTiming(1, { duration: 300 });
  };

  useEffect(() => {
    if (hasPitInToday) {
      pitInDoneScale.value = 1;
      pitInDoneOpacity.value = 1;
    }
  }, []);

  // Calculate time until recommended bed time
  const getTimeUntilBed = () => {
    const [bh, bm] = recommendedBedTime.split(":").map(Number);
    const now = new Date();
    const bedMin = bh * 60 + bm;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    let diff = bedMin - nowMin;
    if (diff < -720) diff += 1440; // handle day wrap
    if (diff < 0) return "就寝時間を過ぎています";
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours > 0) return `あと ${hours}時間${mins}分`;
    return `あと ${mins}分`;
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🌙 Pit-in</Text>
          <Text style={styles.headerSub}>ナイトルーティン</Text>
        </View>

        {/* Night Sky Visual */}
        <View style={styles.nightSky}>
          <Text style={{ fontSize: 60, textAlign: "center" }}>🌙</Text>
          <Text style={styles.nightMessage}>
            良い睡眠が、明日の勝利を作る
          </Text>
        </View>

        {/* Time Info */}
        <View style={styles.timeSection}>
          <View style={styles.timeCard}>
            <Text style={styles.timeLabel}>⏰ 明日の目標起床</Text>
            <Text style={styles.timeValue}>{state.currentTargetTime}</Text>
          </View>
          <View style={styles.timeCard}>
            <Text style={styles.timeLabel}>🛏️ 推奨就寝時間</Text>
            <Text style={[styles.timeValue, { color: "#B39DDB" }]}>
              {recommendedBedTime}
            </Text>
          </View>
        </View>

        {/* Time Until Bed */}
        <View style={styles.countdownCard}>
          <Text style={styles.countdownLabel}>就寝まで</Text>
          <Text style={styles.countdownValue}>{getTimeUntilBed()}</Text>
          <Text style={styles.countdownSub}>
            現在時刻: {currentTime} ・ 睡眠{state.sleepDurationHours}時間
          </Text>
        </View>

        {/* Pit-in Button or Done */}
        {showDone ? (
          <Animated.View style={doneAnimStyle}>
            <View style={styles.doneCard}>
              <Text style={{ fontSize: 48, textAlign: "center" }}>😴</Text>
              <Text style={styles.doneTitle}>ピットイン完了！</Text>
              <Text style={styles.doneSub}>
                {state.pitInTime} に就寝記録しました
              </Text>
              <Text style={styles.doneBonus}>
                🪙 明日の起床時に+1コインボーナス！
              </Text>
            </View>
          </Animated.View>
        ) : (
          <Animated.View style={buttonAnimStyle}>
            <TouchableOpacity
              onPress={handlePitIn}
              style={styles.pitInButton}
            >
              <Text style={styles.pitInEmoji}>🏁</Text>
              <Text style={styles.pitInText}>ピットイン！</Text>
              <Text style={styles.pitInSub}>
                タップして就寝を記録
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 早起きのコツ</Text>
          <Text style={styles.tipsText}>
            • 就寝時間を一定にすると体内時計が安定します{"\n"}
            • 寝る前のブルーライトを避けましょう{"\n"}
            • 起きたらすぐカーテンを開けて光を浴びましょう{"\n"}
            • 「ピットイン」を毎晩の習慣にしましょう
          </Text>
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
  nightSky: {
    backgroundColor: "#0A1420",
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1A237E",
  },
  nightMessage: {
    color: "#B39DDB",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 12,
  },
  timeSection: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  timeCard: {
    flex: 1,
    backgroundColor: "#1B2838",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A3A4E",
  },
  timeLabel: {
    color: "#8892A0",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  timeValue: {
    color: "#F0F4F8",
    fontSize: 28,
    fontWeight: "900",
  },
  countdownCard: {
    backgroundColor: "rgba(179, 157, 219, 0.1)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(179, 157, 219, 0.2)",
  },
  countdownLabel: {
    color: "#8892A0",
    fontSize: 12,
    fontWeight: "600",
  },
  countdownValue: {
    color: "#B39DDB",
    fontSize: 22,
    fontWeight: "900",
    marginVertical: 4,
  },
  countdownSub: {
    color: "#8892A0",
    fontSize: 11,
  },
  pitInButton: {
    backgroundColor: "#1A237E",
    borderRadius: 24,
    paddingVertical: 28,
    alignItems: "center",
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#1A237E",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
      web: {},
    }),
  },
  pitInEmoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  pitInText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 2,
  },
  pitInSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginTop: 4,
  },
  doneCard: {
    backgroundColor: "rgba(26, 35, 126, 0.2)",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(26, 35, 126, 0.4)",
  },
  doneTitle: {
    color: "#B39DDB",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 8,
  },
  doneSub: {
    color: "#8892A0",
    fontSize: 14,
    marginTop: 4,
  },
  doneBonus: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
  },
  tipsCard: {
    backgroundColor: "#1B2838",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A3A4E",
  },
  tipsTitle: {
    color: "#F0F4F8",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  tipsText: {
    color: "#8892A0",
    fontSize: 13,
    lineHeight: 22,
  },
});
