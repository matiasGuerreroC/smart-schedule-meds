import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SleepWindow } from '../types/medication.types';

interface SleepState {
  sleepWindow: SleepWindow;
  setSleepWindow: (startMinutes: number, endMinutes: number) => void;
  resetSleepWindow: () => void;
}

const DEFAULT_SLEEP_WINDOW: SleepWindow = {
  startMinutes: 1380,
  endMinutes: 420,
};

export const useSleepStore = create<SleepState>()(
  persist(
    (set) => ({
      sleepWindow: DEFAULT_SLEEP_WINDOW,
      setSleepWindow: (startMinutes, endMinutes) =>
        set({ sleepWindow: { startMinutes, endMinutes } }),
      resetSleepWindow: () => set({ sleepWindow: DEFAULT_SLEEP_WINDOW }),
    }),
    {
      name: 'sleep-window-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);