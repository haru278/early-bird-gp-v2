import React, { createContext, useContext, useEffect, useCallback, useState } from "react";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { Platform } from "react-native";

// Sound assets
const SOUNDS = {
  victory: require("@/assets/sounds/victory.wav"),
  defeat: require("@/assets/sounds/defeat.wav"),
  coin: require("@/assets/sounds/coin.wav"),
  pitin: require("@/assets/sounds/pitin.wav"),
  item: require("@/assets/sounds/item.wav"),
  tap: require("@/assets/sounds/tap.wav"),
} as const;

export type SoundName = keyof typeof SOUNDS;

interface SoundContextType {
  playSE: (name: SoundName) => void;
  sfxEnabled: boolean;
  toggleSFX: () => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [sfxEnabled, setSfxEnabled] = useState(true);

  // Initialize audio mode
  useEffect(() => {
    if (Platform.OS !== "web") {
      setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    }
  }, []);

  const playSE = useCallback((name: SoundName) => {
    if (!sfxEnabled) return;
    try {
      const player = createAudioPlayer(SOUNDS[name]);
      player.play();
      // Auto-cleanup after playback (generous timeout)
      setTimeout(() => {
        try { player.remove(); } catch {}
      }, 3000);
    } catch (e) {
      console.warn("Failed to play SE:", name, e);
    }
  }, [sfxEnabled]);

  const toggleSFX = useCallback(() => {
    setSfxEnabled(prev => !prev);
  }, []);

  return (
    <SoundContext.Provider
      value={{
        playSE,
        sfxEnabled,
        toggleSFX,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound(): SoundContextType {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used within SoundProvider");
  return ctx;
}
