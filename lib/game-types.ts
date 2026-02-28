// ===== Game Types & Constants for Early Bird Grand Prix =====

/** A single day's wake-up record */
export interface DayRecord {
  date: string; // YYYY-MM-DD
  targetTime: string; // HH:mm
  actualTime: string | null; // HH:mm or null if not recorded
  result: "win" | "lose" | "pending";
  coinsEarned: number;
  earlyBonus: boolean; // 30min+ early
  pitInBonus: boolean; // went to bed on time
  itemUsed: ItemType | null;
  starProtected: boolean; // star was active (no time change)
  mushroomActive: boolean; // mushroom doubled coins
}

/** Item types */
export type ItemType = "mushroom" | "star" | "killer";

/** Player's item inventory */
export interface ItemInventory {
  mushroom: number;
  star: number;
  killer: number;
}

/** Scheduled item for next day */
export interface ScheduledItem {
  type: ItemType;
  scheduledDate: string; // YYYY-MM-DD
}

/** Course/Rank definition */
export interface Course {
  id: number;
  name: string;
  requiredCoins: number;
  color: string;
  emoji: string;
}

/** Full game state persisted in AsyncStorage */
export interface GameState {
  // Setup
  initialWakeTime: string; // HH:mm (e.g., "07:30")
  goalWakeTime: string; // HH:mm (e.g., "04:30")
  sleepDurationHours: number; // hours of sleep needed (default 7)

  // Current state
  currentTargetTime: string; // HH:mm - today's target
  totalCoins: number;
  currentStreak: number;
  longestStreak: number;
  successDays: number; // total wins (for growth calc)
  totalDays: number;

  // Items
  items: ItemInventory;
  scheduledItems: ScheduledItem[];
  cartLevel: number; // 0-5, upgraded by killer

  // Pit-in (night routine)
  lastPitInDate: string | null; // YYYY-MM-DD
  pitInTime: string | null; // HH:mm

  // History
  history: DayRecord[];

  // Meta
  setupComplete: boolean;
  createdAt: string;
  lastActiveDate: string;
}

// ===== Constants =====

export const COURSES: Course[] = [
  { id: 0, name: "Midnight Circuit", requiredCoins: 0, color: "#1A237E", emoji: "🌑" },
  { id: 1, name: "Hoshizora Snow Land", requiredCoins: 10, color: "#E3F2FD", emoji: "❄️" },
  { id: 2, name: "Yoake Mist Valley", requiredCoins: 25, color: "#B39DDB", emoji: "🌫️" },
  { id: 3, name: "Akebono Canyon", requiredCoins: 50, color: "#FF8A65", emoji: "🏜️" },
  { id: 4, name: "Sunrise Pier", requiredCoins: 100, color: "#FFB74D", emoji: "🌅" },
  { id: 5, name: "Komorebi Forest", requiredCoins: 200, color: "#81C784", emoji: "🌳" },
  { id: 6, name: "Harebare Skyway", requiredCoins: 300, color: "#64B5F6", emoji: "☁️" },
  { id: 7, name: "Shining Metropolis", requiredCoins: 500, color: "#CE93D8", emoji: "🏙️" },
  { id: 8, name: "Golden Sun Peak", requiredCoins: 700, color: "#FFD54F", emoji: "⛰️" },
  { id: 9, name: "Eternal Light Road", requiredCoins: 1000, color: "#FFFFFF", emoji: "✨" },
];

export const ITEM_DEFINITIONS = {
  mushroom: {
    name: "キノコ",
    nameEn: "Mushroom",
    description: "翌日の獲得コインが2倍",
    emoji: "🍄",
    streakRequired: 3,
    color: "#FF5722",
  },
  star: {
    name: "スター",
    nameEn: "Star",
    description: "翌日の判定を無効化（時間変更なし、ストリーク維持）",
    emoji: "⭐",
    streakRequired: 5,
    color: "#FFD700",
  },
  killer: {
    name: "キラー",
    nameEn: "Killer",
    description: "カートの見た目をアップグレード",
    emoji: "🚀",
    streakRequired: 10,
    color: "#424242",
  },
} as const;

export const GROWTH_RATE = 1.001; // daily compound growth rate

export const CART_LEVELS = [
  { level: 0, name: "スタンダードカート", emoji: "🏎️" },
  { level: 1, name: "スポーツカート", emoji: "🚗" },
  { level: 2, name: "レーシングカート", emoji: "🏎️💨" },
  { level: 3, name: "ゴールドカート", emoji: "✨🏎️✨" },
  { level: 4, name: "ロイヤルカート", emoji: "👑🏎️👑" },
  { level: 5, name: "レジェンドカート", emoji: "🌟🏎️🌟" },
];

/** Default initial game state */
export function createDefaultGameState(): GameState {
  const today = new Date().toISOString().split("T")[0];
  return {
    initialWakeTime: "07:30",
    goalWakeTime: "05:00",
    sleepDurationHours: 7,
    currentTargetTime: "07:30",
    totalCoins: 0,
    currentStreak: 0,
    longestStreak: 0,
    successDays: 0,
    totalDays: 0,
    items: { mushroom: 0, star: 0, killer: 0 },
    scheduledItems: [],
    cartLevel: 0,
    lastPitInDate: null,
    pitInTime: null,
    history: [],
    setupComplete: false,
    createdAt: today,
    lastActiveDate: today,
  };
}
