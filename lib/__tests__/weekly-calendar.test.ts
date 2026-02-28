import { describe, it, expect } from "vitest";
import type { DayRecord } from "../game-types";

// Test the calendar data generation logic inline
function getWeeksData(history: DayRecord[], weeksToShow: number) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const recordMap = new Map<string, DayRecord>();
  for (const record of history) {
    recordMap.set(record.date, record);
  }

  const currentDay = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - currentDay);

  const weeks: {
    date: string;
    dayOfWeek: number;
    record: DayRecord | null;
    isToday: boolean;
    isFuture: boolean;
  }[][] = [];

  for (let w = weeksToShow - 1; w >= 0; w--) {
    const week: (typeof weeks)[0] = [];
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

describe("Weekly Calendar Data", () => {
  it("generates correct number of weeks", () => {
    const weeks = getWeeksData([], 4);
    expect(weeks.length).toBe(4);
  });

  it("each week has 7 days", () => {
    const weeks = getWeeksData([], 4);
    for (const week of weeks) {
      expect(week.length).toBe(7);
    }
  });

  it("marks today correctly", () => {
    const weeks = getWeeksData([], 4);
    const todayStr = new Date().toISOString().split("T")[0];
    const allDays = weeks.flat();
    const todayDays = allDays.filter((d) => d.isToday);
    expect(todayDays.length).toBe(1);
    expect(todayDays[0].date).toBe(todayStr);
  });

  it("matches records to dates", () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const record: DayRecord = {
      date: todayStr,
      targetTime: "07:30",
      actualTime: "07:25",
      result: "win",
      coinsEarned: 1,
      earlyBonus: false,
      starProtected: false,
      mushroomActive: false,
      pitInBonus: false,
      itemUsed: null,
    };

    const weeks = getWeeksData([record], 4);
    const allDays = weeks.flat();
    const todayDay = allDays.find((d) => d.isToday);
    expect(todayDay?.record).not.toBeNull();
    expect(todayDay?.record?.result).toBe("win");
  });

  it("returns null for days without records", () => {
    const weeks = getWeeksData([], 4);
    const allDays = weeks.flat();
    for (const day of allDays) {
      expect(day.record).toBeNull();
    }
  });

  it("calculates win rate correctly", () => {
    const records: DayRecord[] = [
      {
        date: new Date().toISOString().split("T")[0],
        targetTime: "07:30",
        actualTime: "07:25",
        result: "win",
        coinsEarned: 1,
        earlyBonus: false,
        starProtected: false,
        mushroomActive: false,
        pitInBonus: false,
        itemUsed: null,
      },
    ];
    const weeks = getWeeksData(records, 4);
    const allDays = weeks.flat().filter((d) => d.record);
    const wins = allDays.filter((d) => d.record?.result === "win").length;
    const total = allDays.length;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    expect(winRate).toBe(100);
  });
});
