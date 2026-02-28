import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GameState,
  DayRecord,
  ItemType,
  createDefaultGameState,
} from "./game-types";
import {
  processWakeUp,
  processPitIn,
  useItem,
  hasRecordedToday,
  getTodayRecord,
  getToday,
} from "./game-logic";

const STORAGE_KEY = "@early_bird_gp_state";

interface GameContextType {
  state: GameState;
  isLoading: boolean;
  todayRecord: DayRecord | null;
  hasWokenUpToday: boolean;

  // Actions
  wakeUp: () => { record: DayRecord } | null;
  pitIn: () => void;
  useGameItem: (type: ItemType) => boolean;
  completeSetup: (initial: string, goal: string, sleepHours: number) => void;
  resetGame: () => void;
  updateSettings: (updates: Partial<Pick<GameState, "initialWakeTime" | "goalWakeTime" | "sleepDurationHours">>) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(createDefaultGameState());
  const [isLoading, setIsLoading] = useState(true);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load state from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as GameState;
          setState(parsed);
        }
      } catch (e) {
        console.warn("Failed to load game state:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Save state to AsyncStorage whenever it changes
  const saveState = useCallback(async (newState: GameState) => {
    setState(newState);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.warn("Failed to save game state:", e);
    }
  }, []);

  const wakeUp = useCallback(() => {
    const current = stateRef.current;
    if (hasRecordedToday(current)) return null;
    const { newState, record } = processWakeUp(current);
    saveState(newState);
    return { record };
  }, [saveState]);

  const pitIn = useCallback(() => {
    const newState = processPitIn(stateRef.current);
    saveState(newState);
  }, [saveState]);

  const useGameItem = useCallback(
    (type: ItemType) => {
      const result = useItem(stateRef.current, type);
      if (!result) return false;
      saveState(result);
      return true;
    },
    [saveState]
  );

  const completeSetup = useCallback(
    (initial: string, goal: string, sleepHours: number) => {
      const newState: GameState = {
        ...stateRef.current,
        initialWakeTime: initial,
        goalWakeTime: goal,
        sleepDurationHours: sleepHours,
        currentTargetTime: initial,
        setupComplete: true,
      };
      saveState(newState);
    },
    [saveState]
  );

  const resetGame = useCallback(() => {
    const fresh = createDefaultGameState();
    saveState(fresh);
  }, [saveState]);

  const updateSettings = useCallback(
    (updates: Partial<Pick<GameState, "initialWakeTime" | "goalWakeTime" | "sleepDurationHours">>) => {
      const newState = { ...stateRef.current, ...updates };
      saveState(newState);
    },
    [saveState]
  );

  const todayRecord = getTodayRecord(state);
  const hasWokenUpToday = hasRecordedToday(state);

  return (
    <GameContext.Provider
      value={{
        state,
        isLoading,
        todayRecord,
        hasWokenUpToday,
        wakeUp,
        pitIn,
        useGameItem,
        completeSetup,
        resetGame,
        updateSettings,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
