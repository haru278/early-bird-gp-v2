import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useGame } from "@/lib/game-store";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES_OPTIONS = [0, 15, 30, 45];

function TimeSelector({
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
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: "#8892A0", fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
        {label}
      </Text>
      {/* Hour selector */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingVertical: 4 }}
          style={{ flex: 1 }}
        >
          {HOURS.map((hour) => (
            <TouchableOpacity
              key={hour}
              onPress={() =>
                onChange(`${hour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`)
              }
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: hour === h ? "#E53935" : "#0D1B2A",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: hour === h ? "#E53935" : "#2A3A4E",
              }}
            >
              <Text
                style={{
                  color: hour === h ? "#fff" : "#8892A0",
                  fontWeight: hour === h ? "800" : "500",
                  fontSize: 16,
                }}
              >
                {hour.toString().padStart(2, "0")}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={{ color: "#F0F4F8", fontSize: 24, fontWeight: "900" }}>:</Text>
        {/* Minute selector */}
        <View style={{ flexDirection: "row", gap: 6 }}>
          {MINUTES_OPTIONS.map((min) => (
            <TouchableOpacity
              key={min}
              onPress={() =>
                onChange(`${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`)
              }
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: min === m ? "#E53935" : "#0D1B2A",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: min === m ? "#E53935" : "#2A3A4E",
              }}
            >
              <Text
                style={{
                  color: min === m ? "#fff" : "#8892A0",
                  fontWeight: min === m ? "800" : "500",
                  fontSize: 16,
                }}
              >
                {min.toString().padStart(2, "0")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {/* Current selection display */}
      <View style={{ alignItems: "center", marginTop: 8 }}>
        <Text style={{ color: "#FFD700", fontSize: 20, fontWeight: "900" }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export function SetupScreen() {
  const { completeSetup } = useGame();
  const [initialTime, setInitialTime] = useState("07:30");
  const [goalTime, setGoalTime] = useState("05:00");
  const [sleepHours, setSleepHours] = useState(7);

  const handleStart = () => {
    completeSetup(initialTime, goalTime, sleepHours);
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1, gap: 16 }}>
          {/* Header */}
          <View style={{ alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontSize: 48, marginBottom: 4 }}>🏁</Text>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "900",
                color: "#F0F4F8",
                textAlign: "center",
                lineHeight: 36,
              }}
            >
              Early Bird{"\n"}Grand Prix
            </Text>
            <Text
              style={{
                color: "#8892A0",
                textAlign: "center",
                marginTop: 8,
                fontSize: 14,
                lineHeight: 22,
              }}
            >
              毎日1分ずつ早起きして{"\n"}理想の朝を目指すレースを始めよう！
            </Text>
          </View>

          {/* Time Settings */}
          <View
            style={{
              backgroundColor: "#1B2838",
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: "#2A3A4E",
            }}
          >
            <TimeSelector
              label="🕐 現在の起床時間（スタート地点）"
              value={initialTime}
              onChange={setInitialTime}
            />
            <TimeSelector
              label="🏆 目標起床時間（ゴール）"
              value={goalTime}
              onChange={setGoalTime}
            />

            <View>
              <Text
                style={{
                  color: "#8892A0",
                  fontSize: 13,
                  fontWeight: "600",
                  marginBottom: 8,
                }}
              >
                😴 必要な睡眠時間
              </Text>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                {[5.5, 6, 6.5, 7, 7.5, 8].map((hrs) => (
                  <TouchableOpacity
                    key={hrs}
                    onPress={() => setSleepHours(hrs)}
                    style={{
                      flex: 1,
                      minWidth: 40,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: sleepHours === hrs ? "#E53935" : "#0D1B2A",
                      borderWidth: 1,
                      borderColor: sleepHours === hrs ? "#E53935" : "#2A3A4E",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: sleepHours === hrs ? "#fff" : "#8892A0",
                        fontWeight: sleepHours === hrs ? "800" : "500",
                        fontSize: 13,
                      }}
                    >
                      {hrs}h
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Info Card */}
          <View
            style={{
              backgroundColor: "#1B2838",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: "#2A3A4E",
            }}
          >
            <Text
              style={{
                color: "#FFD700",
                fontSize: 14,
                fontWeight: "800",
                marginBottom: 6,
              }}
            >
              📋 ルール
            </Text>
            <Text style={{ color: "#8892A0", fontSize: 12, lineHeight: 20 }}>
              • 目標時間までに起床 → 勝利！翌日の目標が1分早まる{"\n"}
              • 起きられなかった → 敗北…翌日の目標が1分遅くなる{"\n"}
              • 毎日0.1%の複利成長で、1年で約1.44倍に！{"\n"}
              • コインを集めて新しいコースをアンロック！
            </Text>
          </View>

          {/* Start Button */}
          <TouchableOpacity
            onPress={handleStart}
            style={{
              backgroundColor: "#E53935",
              paddingVertical: 18,
              borderRadius: 16,
              alignItems: "center",
              marginTop: 4,
              ...Platform.select({
                ios: {
                  shadowColor: "#E53935",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                },
                android: { elevation: 8 },
                web: {},
              }),
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 20,
                fontWeight: "900",
                letterSpacing: 1,
              }}
            >
              🏎️ レーススタート！
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
