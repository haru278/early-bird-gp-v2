import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useGame } from "@/lib/game-store";
import { COURSES, CART_LEVELS } from "@/lib/game-types";
import { getCurrentCourse, getGrowthPercentage } from "@/lib/game-logic";
import { useSound } from "@/lib/sound-manager";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES_OPTIONS = [0, 15, 30, 45];

function CompactTimeSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [h, m] = value.split(":").map(Number);

  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.timePickerRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 4 }}
          style={{ flex: 1 }}
        >
          {HOURS.map((hour) => (
            <TouchableOpacity
              key={hour}
              onPress={() =>
                onChange(
                  `${hour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
                )
              }
              style={[
                styles.timePill,
                hour === h && styles.timePillActive,
              ]}
            >
              <Text
                style={[
                  styles.timePillText,
                  hour === h && styles.timePillTextActive,
                ]}
              >
                {hour.toString().padStart(2, "0")}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.timeSeparator}>:</Text>
        <View style={{ flexDirection: "row", gap: 4 }}>
          {MINUTES_OPTIONS.map((min) => (
            <TouchableOpacity
              key={min}
              onPress={() =>
                onChange(
                  `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`
                )
              }
              style={[
                styles.timePill,
                min === m && styles.timePillActive,
              ]}
            >
              <Text
                style={[
                  styles.timePillText,
                  min === m && styles.timePillTextActive,
                ]}
              >
                {min.toString().padStart(2, "0")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { state, updateSettings, resetGame } = useGame();
  const { sfxEnabled, toggleSFX } = useSound();
  const [goalTime, setGoalTime] = useState(state.goalWakeTime);
  const [sleepHours, setSleepHours] = useState(state.sleepDurationHours);

  const course = getCurrentCourse(state.totalCoins);
  const growthPct = getGrowthPercentage(state.successDays);

  const handleSaveGoal = () => {
    updateSettings({ goalWakeTime: goalTime });
    if (Platform.OS === "web") {
      alert("目標時間を更新しました！");
    } else {
      Alert.alert("保存完了", "目標時間を更新しました！");
    }
  };

  const handleSaveSleep = () => {
    updateSettings({ sleepDurationHours: sleepHours });
    if (Platform.OS === "web") {
      alert("睡眠時間を更新しました！");
    } else {
      Alert.alert("保存完了", "睡眠時間を更新しました！");
    }
  };

  const handleReset = () => {
    const doReset = () => {
      resetGame();
    };

    if (Platform.OS === "web") {
      if (
        confirm(
          "すべてのデータをリセットしますか？この操作は取り消せません。"
        )
      ) {
        doReset();
      }
    } else {
      Alert.alert(
        "データリセット",
        "すべてのデータをリセットしますか？この操作は取り消せません。",
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "リセット",
            style: "destructive",
            onPress: doReset,
          },
        ]
      );
    }
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⚙️ Settings</Text>
          <Text style={styles.headerSub}>設定</Text>
        </View>

        {/* Profile Summary */}
        <View style={styles.profileCard}>
          <Text style={{ fontSize: 48 }}>🏎️</Text>
          <Text style={styles.profileName}>
            Early Bird Racer
          </Text>
          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>
                {course.emoji} {course.name}
              </Text>
              <Text style={styles.profileStatLabel}>現在のコース</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>+{growthPct}%</Text>
              <Text style={styles.profileStatLabel}>成長率</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>
                🪙 {state.totalCoins}
              </Text>
              <Text style={styles.profileStatLabel}>コイン</Text>
            </View>
          </View>
        </View>

        {/* Goal Time Setting */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 最終目標時間</Text>
          <CompactTimeSelector
            label="目標起床時間"
            value={goalTime}
            onChange={setGoalTime}
          />
          <TouchableOpacity
            onPress={handleSaveGoal}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>保存</Text>
          </TouchableOpacity>
        </View>

        {/* Sleep Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>😴 必要な睡眠時間</Text>
          <View style={styles.sleepRow}>
            {[5.5, 6, 6.5, 7, 7.5, 8].map((hrs) => (
              <TouchableOpacity
                key={hrs}
                onPress={() => setSleepHours(hrs)}
                style={[
                  styles.sleepPill,
                  sleepHours === hrs && styles.sleepPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.sleepPillText,
                    sleepHours === hrs && styles.sleepPillTextActive,
                  ]}
                >
                  {hrs}h
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={handleSaveSleep}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>保存</Text>
          </TouchableOpacity>
        </View>

        {/* Sound Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔊 サウンド設定</Text>
          <TouchableOpacity
            onPress={toggleSFX}
            style={[styles.soundToggle, sfxEnabled && styles.soundToggleActive]}
          >
            <Text style={styles.soundToggleText}>🎵 効果音</Text>
            <Text style={[styles.soundToggleStatus, sfxEnabled && styles.soundToggleStatusActive]}>
              {sfxEnabled ? "ON" : "OFF"}
            </Text>
          </TouchableOpacity>

        </View>

        {/* Current Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 現在のステータス</Text>
          <View style={styles.statusGrid}>
            <StatusRow label="初期起床時間" value={state.initialWakeTime} />
            <StatusRow label="現在の目標" value={state.currentTargetTime} />
            <StatusRow label="最終目標" value={state.goalWakeTime} />
            <StatusRow label="総日数" value={`${state.totalDays}日`} />
            <StatusRow label="成功日数" value={`${state.successDays}日`} />
            <StatusRow label="現在の連勝" value={`${state.currentStreak}日`} />
            <StatusRow label="最長連勝" value={`${state.longestStreak}日`} />
            <StatusRow label="カート" value={`${CART_LEVELS[state.cartLevel]?.emoji ?? "🏎️"} ${CART_LEVELS[state.cartLevel]?.name ?? "スタンダードカート"}`} />
            <StatusRow label="開始日" value={state.createdAt} />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>⚠️ デンジャーゾーン</Text>
          <Text style={styles.dangerDesc}>
            すべてのデータ（コイン、アイテム、履歴）がリセットされます。
          </Text>
          <TouchableOpacity
            onPress={handleReset}
            style={styles.resetButton}
          >
            <Text style={styles.resetButtonText}>
              🗑️ すべてのデータをリセット
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>
            Early Bird Grand Prix v1.0
          </Text>
          <Text style={styles.appInfoText}>
            🏎️ 毎日1分ずつ、理想の朝へ
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.statusValue}>{value}</Text>
    </View>
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
  profileCard: {
    backgroundColor: "#1B2838",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2A3A4E",
  },
  profileName: {
    color: "#F0F4F8",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 8,
  },
  profileStats: {
    flexDirection: "row",
    marginTop: 16,
    alignItems: "center",
  },
  profileStat: {
    flex: 1,
    alignItems: "center",
  },
  profileStatValue: {
    color: "#F0F4F8",
    fontSize: 13,
    fontWeight: "700",
  },
  profileStatLabel: {
    color: "#8892A0",
    fontSize: 10,
    marginTop: 2,
  },
  profileStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#2A3A4E",
  },
  section: {
    backgroundColor: "#1B2838",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2A3A4E",
  },
  sectionTitle: {
    color: "#F0F4F8",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  settingRow: {
    marginBottom: 8,
  },
  settingLabel: {
    color: "#8892A0",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  timePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#0D1B2A",
  },
  timePillActive: {
    backgroundColor: "#E53935",
  },
  timePillText: {
    color: "#8892A0",
    fontSize: 14,
    fontWeight: "600",
  },
  timePillTextActive: {
    color: "#fff",
  },
  timeSeparator: {
    color: "#F0F4F8",
    fontSize: 20,
    fontWeight: "800",
  },
  saveButton: {
    backgroundColor: "#E53935",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 12,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  sleepRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  sleepPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#0D1B2A",
    borderWidth: 1,
    borderColor: "#2A3A4E",
  },
  sleepPillActive: {
    backgroundColor: "#E53935",
    borderColor: "#E53935",
  },
  sleepPillText: {
    color: "#8892A0",
    fontSize: 14,
    fontWeight: "600",
  },
  sleepPillTextActive: {
    color: "#fff",
  },
  statusGrid: {
    gap: 2,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2A3A4E",
  },
  statusLabel: {
    color: "#8892A0",
    fontSize: 13,
  },
  statusValue: {
    color: "#F0F4F8",
    fontSize: 13,
    fontWeight: "700",
  },
  dangerSection: {
    backgroundColor: "rgba(255, 23, 68, 0.08)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 23, 68, 0.2)",
  },
  dangerTitle: {
    color: "#FF5252",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  dangerDesc: {
    color: "#8892A0",
    fontSize: 13,
    marginBottom: 12,
  },
  resetButton: {
    backgroundColor: "#FF1744",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  appInfo: {
    alignItems: "center",
    paddingVertical: 20,
  },
  appInfoText: {
    color: "#4A5568",
    fontSize: 12,
    marginTop: 2,
  },
  soundToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#0D1B2A",
    borderWidth: 1,
    borderColor: "#2A3A4E",
    marginTop: 8,
  },
  soundToggleActive: {
    borderColor: "#FFD600",
    backgroundColor: "rgba(255, 214, 0, 0.08)",
  },
  soundToggleText: {
    color: "#F0F4F8",
    fontSize: 15,
    fontWeight: "700",
  },
  soundToggleStatus: {
    color: "#8892A0",
    fontSize: 14,
    fontWeight: "800",
  },
  soundToggleStatusActive: {
    color: "#FFD600",
  },
});
