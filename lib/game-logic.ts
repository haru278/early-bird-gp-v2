import {
  GameState,
  DayRecord,
  ItemType,
  COURSES,
  ITEM_DEFINITIONS,
  GROWTH_RATE,
} from "./game-types";

// ===== Time Utilities =====

/** Parse "HH:mm" to minutes since midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Convert minutes since midnight to "HH:mm" */
export function minutesToTime(minutes: number): string {
  const clamped = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/** Get today's date as YYYY-MM-DD */
export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

/** Get current time as "HH:mm" */
export function getCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
}

// ===== Core Game Logic =====

/** Check if wake-up is a win (actual <= target) */
export function isWin(targetTime: string, actualTime: string): boolean {
  return timeToMinutes(actualTime) <= timeToMinutes(targetTime);
}

/** Check if wake-up is 30+ minutes early */
export function isEarlyWakeUp(targetTime: string, actualTime: string): boolean {
  return timeToMinutes(targetTime) - timeToMinutes(actualTime) >= 30;
}

/** Calculate next target time based on result */
export function calculateNextTarget(
  currentTarget: string,
  result: "win" | "lose",
  goalTime: string,
  starProtected: boolean
): string {
  if (starProtected) return currentTarget; // star: no change

  const currentMin = timeToMinutes(currentTarget);
  const goalMin = timeToMinutes(goalTime);

  if (result === "win") {
    const newMin = currentMin - 1; // 1 minute earlier
    // Don't go past the goal
    if (newMin <= goalMin) return goalTime;
    return minutesToTime(newMin);
  } else {
    const newMin = currentMin + 1; // 1 minute later
    return minutesToTime(newMin);
  }
}

/** Calculate coins earned for a wake-up */
export function calculateCoins(
  targetTime: string,
  actualTime: string,
  pitInToday: boolean,
  mushroomActive: boolean
): number {
  let coins = 0;
  if (isWin(targetTime, actualTime)) {
    coins += 1; // base coin for waking up on time
    if (isEarlyWakeUp(targetTime, actualTime)) {
      coins += 1; // bonus for 30+ min early
    }
  }
  if (pitInToday) {
    coins += 1; // pit-in bonus
  }
  if (mushroomActive) {
    coins *= 2; // mushroom doubles coins
  }
  return coins;
}

/** Calculate growth rate: 1.001^n */
export function calculateGrowthRate(successDays: number): number {
  return Math.pow(GROWTH_RATE, successDays);
}

/** Get growth percentage string */
export function getGrowthPercentage(successDays: number): string {
  const rate = calculateGrowthRate(successDays);
  return ((rate - 1) * 100).toFixed(1);
}

// ===== Rank / Course System =====

/** Get current course based on total coins */
export function getCurrentCourse(totalCoins: number) {
  let current = COURSES[0];
  for (const course of COURSES) {
    if (totalCoins >= course.requiredCoins) {
      current = course;
    } else {
      break;
    }
  }
  return current;
}

/** Get next course (or null if at max) */
export function getNextCourse(totalCoins: number) {
  for (const course of COURSES) {
    if (totalCoins < course.requiredCoins) {
      return course;
    }
  }
  return null;
}

/** Get progress to next course (0-1) */
export function getCourseProgress(totalCoins: number): number {
  const current = getCurrentCourse(totalCoins);
  const next = getNextCourse(totalCoins);
  if (!next) return 1;
  const range = next.requiredCoins - current.requiredCoins;
  const progress = totalCoins - current.requiredCoins;
  return Math.min(1, Math.max(0, progress / range));
}

// ===== Item System =====

/** Check if streak awards a new item */
export function checkStreakReward(streak: number): ItemType | null {
  if (streak > 0 && streak % 10 === 0) return "killer";
  if (streak > 0 && streak % 5 === 0) return "star";
  if (streak > 0 && streak % 3 === 0) return "mushroom";
  return null;
}

/** Check if any scheduled item is active today */
export function getActiveItems(state: GameState, today: string) {
  const active = { mushroom: false, star: false };
  for (const item of state.scheduledItems) {
    if (item.scheduledDate === today) {
      if (item.type === "mushroom") active.mushroom = true;
      if (item.type === "star") active.star = true;
    }
  }
  return active;
}

// ===== Night Routine =====

/** Calculate recommended bed time from wake target */
export function calculateBedTime(
  wakeTarget: string,
  sleepHours: number
): string {
  const wakeMin = timeToMinutes(wakeTarget);
  const bedMin = wakeMin - sleepHours * 60;
  return minutesToTime(bedMin);
}

// ===== Process Wake-Up =====

/** Process a wake-up event and return updated state + day record */
export function processWakeUp(state: GameState): {
  newState: GameState;
  record: DayRecord;
} {
  const today = getToday();
  const actualTime = getCurrentTime();
  const targetTime = state.currentTargetTime;

  // Check for active items
  const activeItems = getActiveItems(state, today);
  const starProtected = activeItems.star;
  const mushroomActive = activeItems.mushroom;

  // Determine win/lose
  const won = starProtected || isWin(targetTime, actualTime);
  const result: "win" | "lose" = won ? "win" : "lose";

  // Check pit-in bonus (did they pit-in last night?)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const pitInBonus = state.lastPitInDate === yesterdayStr || state.lastPitInDate === today;

  // Calculate coins
  const coinsEarned = won
    ? calculateCoins(targetTime, actualTime, pitInBonus, mushroomActive)
    : (pitInBonus ? (mushroomActive ? 2 : 1) : 0);

  // Update streak
  const newStreak = won ? state.currentStreak + 1 : 0;
  const longestStreak = Math.max(state.longestStreak, newStreak);

  // Check for item reward
  const itemReward = won ? checkStreakReward(newStreak) : null;

  // Calculate next target
  const nextTarget = calculateNextTarget(
    targetTime,
    result,
    state.goalWakeTime,
    starProtected
  );

  // Build day record
  const record: DayRecord = {
    date: today,
    targetTime,
    actualTime,
    result,
    coinsEarned,
    earlyBonus: won && isEarlyWakeUp(targetTime, actualTime),
    pitInBonus,
    itemUsed: starProtected ? "star" : mushroomActive ? "mushroom" : null,
    starProtected,
    mushroomActive,
  };

  // Build new state
  const newItems = { ...state.items };
  if (itemReward) {
    newItems[itemReward] += 1;
  }

  // Remove used scheduled items
  const remainingScheduled = state.scheduledItems.filter(
    (si) => si.scheduledDate !== today
  );

  const newState: GameState = {
    ...state,
    currentTargetTime: nextTarget,
    totalCoins: state.totalCoins + coinsEarned,
    currentStreak: newStreak,
    longestStreak,
    successDays: won ? state.successDays + 1 : state.successDays,
    totalDays: state.totalDays + 1,
    items: newItems,
    scheduledItems: remainingScheduled,
    history: [...state.history, record],
    lastActiveDate: today,
  };

  return { newState, record };
}

/** Process pit-in (going to bed) */
export function processPitIn(state: GameState): GameState {
  const today = getToday();
  const now = getCurrentTime();
  return {
    ...state,
    lastPitInDate: today,
    pitInTime: now,
  };
}

/** Use an item (schedule for tomorrow) */
export function useItem(
  state: GameState,
  itemType: ItemType
): GameState | null {
  if (state.items[itemType] <= 0) return null;

  if (itemType === "killer") {
    // Killer upgrades cart appearance
    const newCartLevel = Math.min(state.cartLevel + 1, 5);
    return {
      ...state,
      items: { ...state.items, killer: state.items.killer - 1 },
      cartLevel: newCartLevel,
    };
  }

  // Mushroom and Star are scheduled for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // Check if already scheduled
  const alreadyScheduled = state.scheduledItems.some(
    (si) => si.type === itemType && si.scheduledDate === tomorrowStr
  );
  if (alreadyScheduled) return null;

  return {
    ...state,
    items: { ...state.items, [itemType]: state.items[itemType] - 1 },
    scheduledItems: [
      ...state.scheduledItems,
      { type: itemType, scheduledDate: tomorrowStr },
    ],
  };
}

/** Check if today's wake-up has already been recorded */
export function hasRecordedToday(state: GameState): boolean {
  const today = getToday();
  return state.history.some((r) => r.date === today);
}

/** Get today's record if exists */
export function getTodayRecord(state: GameState): DayRecord | null {
  const today = getToday();
  return state.history.find((r) => r.date === today) ?? null;
}
