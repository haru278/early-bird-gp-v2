import { describe, it, expect } from "vitest";
import {
  timeToMinutes,
  minutesToTime,
  isWin,
  isEarlyWakeUp,
  calculateNextTarget,
  calculateCoins,
  calculateGrowthRate,
  getGrowthPercentage,
  getCurrentCourse,
  getNextCourse,
  getCourseProgress,
  checkStreakReward,
  calculateBedTime,
  useItem,
} from "../game-logic";
import { COURSES, createDefaultGameState } from "../game-types";

describe("Time Utilities", () => {
  it("converts time string to minutes", () => {
    expect(timeToMinutes("07:30")).toBe(450);
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("23:59")).toBe(1439);
    expect(timeToMinutes("12:00")).toBe(720);
  });

  it("converts minutes to time string", () => {
    expect(minutesToTime(450)).toBe("07:30");
    expect(minutesToTime(0)).toBe("00:00");
    expect(minutesToTime(1439)).toBe("23:59");
    expect(minutesToTime(720)).toBe("12:00");
  });

  it("handles negative minutes wrapping", () => {
    expect(minutesToTime(-60)).toBe("23:00");
    expect(minutesToTime(-1)).toBe("23:59");
  });
});

describe("Core Game Logic", () => {
  it("determines win when actual <= target", () => {
    expect(isWin("07:30", "07:30")).toBe(true);
    expect(isWin("07:30", "07:00")).toBe(true);
    expect(isWin("07:30", "07:31")).toBe(false);
    expect(isWin("07:30", "08:00")).toBe(false);
  });

  it("detects early wake-up (30+ min early)", () => {
    expect(isEarlyWakeUp("07:30", "07:00")).toBe(true);
    expect(isEarlyWakeUp("07:30", "06:00")).toBe(true);
    expect(isEarlyWakeUp("07:30", "07:15")).toBe(false);
    expect(isEarlyWakeUp("07:30", "07:30")).toBe(false);
  });

  it("calculates next target on win (1 min earlier)", () => {
    expect(calculateNextTarget("07:30", "win", "05:00", false)).toBe("07:29");
    expect(calculateNextTarget("05:01", "win", "05:00", false)).toBe("05:00");
    expect(calculateNextTarget("05:00", "win", "05:00", false)).toBe("05:00");
  });

  it("calculates next target on lose (1 min later)", () => {
    expect(calculateNextTarget("07:30", "lose", "05:00", false)).toBe("07:31");
  });

  it("star protection prevents target change", () => {
    expect(calculateNextTarget("07:30", "win", "05:00", true)).toBe("07:30");
    expect(calculateNextTarget("07:30", "lose", "05:00", true)).toBe("07:30");
  });
});

describe("Coin Calculation", () => {
  it("gives 1 coin for on-time wake-up", () => {
    expect(calculateCoins("07:30", "07:30", false, false)).toBe(1);
  });

  it("gives 2 coins for early wake-up (30+ min)", () => {
    expect(calculateCoins("07:30", "06:50", false, false)).toBe(2);
  });

  it("gives pit-in bonus", () => {
    expect(calculateCoins("07:30", "07:30", true, false)).toBe(2);
  });

  it("mushroom doubles coins", () => {
    expect(calculateCoins("07:30", "07:30", false, true)).toBe(2);
    expect(calculateCoins("07:30", "06:50", true, true)).toBe(6);
  });

  it("gives 0 coins for late wake-up (no pit-in)", () => {
    expect(calculateCoins("07:30", "07:31", false, false)).toBe(0);
  });
});

describe("Growth Rate", () => {
  it("calculates 1.001^n correctly", () => {
    expect(calculateGrowthRate(0)).toBeCloseTo(1.0, 4);
    expect(calculateGrowthRate(1)).toBeCloseTo(1.001, 4);
    expect(calculateGrowthRate(365)).toBeCloseTo(1.4402, 2);
  });

  it("returns growth percentage string", () => {
    expect(getGrowthPercentage(0)).toBe("0.0");
    expect(getGrowthPercentage(100)).toBe("10.5");
  });
});

describe("Course System", () => {
  it("returns first course for 0 coins", () => {
    const course = getCurrentCourse(0);
    expect(course.name).toBe("Midnight Circuit");
  });

  it("returns correct course for coin amount", () => {
    expect(getCurrentCourse(10).name).toBe("Hoshizora Snow Land");
    expect(getCurrentCourse(50).name).toBe("Akebono Canyon");
    expect(getCurrentCourse(999).name).toBe("Golden Sun Peak");
    expect(getCurrentCourse(1000).name).toBe("Eternal Light Road");
  });

  it("returns next course correctly", () => {
    expect(getNextCourse(0)?.name).toBe("Hoshizora Snow Land");
    expect(getNextCourse(1000)).toBeNull();
  });

  it("calculates course progress", () => {
    expect(getCourseProgress(0)).toBe(0);
    expect(getCourseProgress(5)).toBeCloseTo(0.5, 1);
    expect(getCourseProgress(1000)).toBe(1);
  });
});

describe("Item System", () => {
  it("awards mushroom at streak 3", () => {
    expect(checkStreakReward(3)).toBe("mushroom");
  });

  it("awards star at streak 5", () => {
    expect(checkStreakReward(5)).toBe("star");
  });

  it("awards killer at streak 10", () => {
    expect(checkStreakReward(10)).toBe("killer");
  });

  it("awards mushroom at streak 6", () => {
    expect(checkStreakReward(6)).toBe("mushroom");
  });

  it("returns null for non-reward streaks", () => {
    expect(checkStreakReward(1)).toBeNull();
    expect(checkStreakReward(2)).toBeNull();
    expect(checkStreakReward(4)).toBeNull();
  });
});

describe("Night Routine", () => {
  it("calculates bed time correctly", () => {
    expect(calculateBedTime("07:00", 7)).toBe("00:00");
    expect(calculateBedTime("06:00", 7)).toBe("23:00");
    expect(calculateBedTime("05:30", 8)).toBe("21:30");
  });
});

describe("Killer - Cart Upgrade", () => {
  it("upgrades cart level when killer is used", () => {
    const state = createDefaultGameState();
    state.items.killer = 2;
    state.cartLevel = 0;
    const result = useItem(state, "killer");
    expect(result).not.toBeNull();
    expect(result!.cartLevel).toBe(1);
    expect(result!.items.killer).toBe(1);
  });

  it("caps cart level at 5", () => {
    const state = createDefaultGameState();
    state.items.killer = 1;
    state.cartLevel = 5;
    const result = useItem(state, "killer");
    expect(result).not.toBeNull();
    expect(result!.cartLevel).toBe(5);
    expect(result!.items.killer).toBe(0);
  });

  it("returns null when no killer items", () => {
    const state = createDefaultGameState();
    state.items.killer = 0;
    const result = useItem(state, "killer");
    expect(result).toBeNull();
  });
});
