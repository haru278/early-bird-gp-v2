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
import {
  getCurrentCourse,
  getNextCourse,
  getCourseProgress,
} from "@/lib/game-logic";
import {
  COURSES,
  ITEM_DEFINITIONS,
  CART_LEVELS,
  ItemType,
} from "@/lib/game-types";
import { useSound } from "@/lib/sound-manager";

function CourseCard({
  course,
  isUnlocked,
  isCurrent,
  totalCoins,
}: {
  course: (typeof COURSES)[0];
  isUnlocked: boolean;
  isCurrent: boolean;
  totalCoins: number;
}) {
  return (
    <View
      style={[
        styles.courseCard,
        isCurrent && styles.courseCardCurrent,
        !isUnlocked && styles.courseCardLocked,
      ]}
    >
      <View style={styles.courseLeft}>
        <Text style={{ fontSize: 28 }}>{course.emoji}</Text>
      </View>
      <View style={styles.courseInfo}>
        <Text
          style={[
            styles.courseName,
            !isUnlocked && { color: "#4A5568" },
          ]}
        >
          {course.name}
        </Text>
        <Text style={styles.courseCoins}>
          {isUnlocked ? "✅ アンロック済み" : `🔒 ${course.requiredCoins} コイン`}
        </Text>
      </View>
      {isCurrent && (
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>NOW</Text>
        </View>
      )}
      <View
        style={[
          styles.courseColorDot,
          { backgroundColor: isUnlocked ? course.color : "#2A3A4E" },
        ]}
      />
    </View>
  );
}

function ItemCard({
  type,
  count,
  onUse,
}: {
  type: ItemType;
  count: number;
  onUse: () => void;
}) {
  const def = ITEM_DEFINITIONS[type];

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={{ fontSize: 32 }}>{def.emoji}</Text>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.itemName}>{def.name}</Text>
          <Text style={styles.itemNameEn}>{def.nameEn}</Text>
        </View>
        <View style={styles.itemCountBadge}>
          <Text style={styles.itemCountText}>×{count}</Text>
        </View>
      </View>
      <Text style={styles.itemDesc}>{def.description}</Text>
      <Text style={styles.itemStreak}>
        🔥 {def.streakRequired}連勝ごとに獲得
      </Text>
      {count > 0 && (
        <TouchableOpacity
          onPress={onUse}
          style={[styles.useButton, { backgroundColor: def.color }]}
        >
          <Text style={styles.useButtonText}>使用する</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function CourseScreen() {
  const { state, useGameItem } = useGame();
  const { playSE } = useSound();
  const currentCourse = getCurrentCourse(state.totalCoins);
  const nextCourse = getNextCourse(state.totalCoins);
  const progress = getCourseProgress(state.totalCoins);
  const cartInfo = CART_LEVELS[state.cartLevel];

  const handleUseItem = (type: ItemType) => {
    const def = ITEM_DEFINITIONS[type];
    const confirmMsg =
      type === "killer"
        ? `${def.name}を使用してカートをアップグレードしますか？`
        : `${def.name}を使用しますか？（明日の効果）`;

    if (Platform.OS === "web") {
      if (confirm(confirmMsg)) {
        const success = useGameItem(type);
        if (success) {
          playSE("item");
        } else {
          alert("使用できません");
        }
      }
    } else {
      Alert.alert("アイテム使用", confirmMsg, [
        { text: "キャンセル", style: "cancel" },
        {
          text: "使用する",
          onPress: () => {
            const success = useGameItem(type);
            if (success) {
              playSE("item");
            } else {
              Alert.alert("エラー", "使用できません");
            }
          },
        },
      ]);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🏁 Course & Items</Text>
          <Text style={styles.headerSub}>コースとアイテム</Text>
        </View>

        {/* Current Course & Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={{ fontSize: 36 }}>{currentCourse.emoji}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.currentCourseName}>
                {currentCourse.name}
              </Text>
              {nextCourse ? (
                <Text style={styles.nextCourseText}>
                  Next: {nextCourse.emoji} {nextCourse.name}
                </Text>
              ) : (
                <Text style={[styles.nextCourseText, { color: "#FFD700" }]}>
                  🏆 全コースアンロック！
                </Text>
              )}
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progress * 100}%`,
                    backgroundColor: currentCourse.color,
                  },
                ]}
              />
              <View
                style={[
                  styles.progressCartIcon,
                  { left: `${Math.min(progress * 100, 92)}%` },
                ]}
              >
                <Text style={{ fontSize: 18 }}>🏎️</Text>
              </View>
            </View>
            {nextCourse && (
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabelText}>
                  {state.totalCoins} 🪙
                </Text>
                <Text style={styles.progressLabelText}>
                  {nextCourse.requiredCoins} 🪙
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Cart Display */}
        <View style={styles.cartSection}>
          <Text style={styles.sectionTitle}>🏎️ マイカート</Text>
          <View style={styles.cartCard}>
            <Text style={{ fontSize: 48 }}>{cartInfo?.emoji ?? "🏎️"}</Text>
            <Text style={styles.cartName}>{cartInfo?.name ?? "スタンダードカート"}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>🎒 アイテム</Text>
          <ItemCard
            type="mushroom"
            count={state.items.mushroom}
            onUse={() => handleUseItem("mushroom")}
          />
          <ItemCard
            type="star"
            count={state.items.star}
            onUse={() => handleUseItem("star")}
          />
          <ItemCard
            type="killer"
            count={state.items.killer}
            onUse={() => handleUseItem("killer")}
          />
        </View>

        {/* Scheduled Items */}
        {state.scheduledItems.length > 0 && (
          <View style={styles.scheduledSection}>
            <Text style={styles.sectionTitle}>⏰ 予約済みアイテム</Text>
            {state.scheduledItems.map((si, i) => {
              const def = ITEM_DEFINITIONS[si.type];
              return (
                <View key={i} style={styles.scheduledCard}>
                  <Text style={{ fontSize: 20 }}>{def.emoji}</Text>
                  <Text style={styles.scheduledText}>
                    {def.name} → {si.scheduledDate}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* All Courses */}
        <View style={styles.coursesSection}>
          <Text style={styles.sectionTitle}>🗺️ 全コース</Text>
          {COURSES.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isUnlocked={state.totalCoins >= course.requiredCoins}
              isCurrent={course.id === currentCourse.id}
              totalCoins={state.totalCoins}
            />
          ))}
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
  progressSection: {
    backgroundColor: "#1B2838",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2A3A4E",
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  currentCourseName: {
    color: "#F0F4F8",
    fontSize: 20,
    fontWeight: "800",
  },
  nextCourseText: {
    color: "#8892A0",
    fontSize: 13,
    marginTop: 2,
  },
  progressBarContainer: {
    gap: 4,
  },
  progressBarBg: {
    height: 24,
    backgroundColor: "#0D1B2A",
    borderRadius: 12,
    overflow: "visible",
    position: "relative",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 12,
    opacity: 0.8,
  },
  progressCartIcon: {
    position: "absolute",
    top: -2,
    marginLeft: -10,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabelText: {
    color: "#8892A0",
    fontSize: 11,
  },
  cartSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#F0F4F8",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },
  cartCard: {
    backgroundColor: "#1B2838",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A3A4E",
  },
  cartName: {
    color: "#F0F4F8",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 8,
  },
  cartLevelRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  cartLevelDot: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  cartLevelText: {
    color: "#8892A0",
    fontSize: 12,
    marginTop: 6,
  },
  itemsSection: {
    marginBottom: 16,
    gap: 10,
  },
  itemCard: {
    backgroundColor: "#1B2838",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A3A4E",
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemName: {
    color: "#F0F4F8",
    fontSize: 16,
    fontWeight: "800",
  },
  itemNameEn: {
    color: "#8892A0",
    fontSize: 11,
  },
  itemCountBadge: {
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  itemCountText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "800",
  },
  itemDesc: {
    color: "#8892A0",
    fontSize: 13,
    marginTop: 8,
  },
  itemStreak: {
    color: "#FF8A65",
    fontSize: 11,
    marginTop: 4,
  },
  useButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  useButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  scheduledSection: {
    marginBottom: 16,
  },
  scheduledCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
  },
  scheduledText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "600",
  },
  coursesSection: {
    gap: 8,
  },
  courseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1B2838",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2A3A4E",
  },
  courseCardCurrent: {
    borderColor: "#E53935",
    borderWidth: 2,
  },
  courseCardLocked: {
    opacity: 0.5,
  },
  courseLeft: {
    width: 44,
    alignItems: "center",
  },
  courseInfo: {
    flex: 1,
    marginLeft: 8,
  },
  courseName: {
    color: "#F0F4F8",
    fontSize: 14,
    fontWeight: "700",
  },
  courseCoins: {
    color: "#8892A0",
    fontSize: 11,
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: "#E53935",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  currentBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  courseColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
