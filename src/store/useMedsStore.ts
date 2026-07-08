import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medication, DoseSchedule } from '../types/medication.types';

interface MedsState {
  medications: Medication[];
  schedules: DoseSchedule[];
  addMedication: (med: Medication, schedules: DoseSchedule[]) => void;
  removeMedication: (id: string) => void;
  updateDoseStatus: (doseId: string, status: DoseSchedule['status']) => void;
  resetAll: () => void;
}

export const useMedsStore = create<MedsState>()(
  persist(
    (set) => ({
      medications: [],
      schedules: [],

      addMedication: (med, schedules) =>
        set((state) => ({
          medications: [...state.medications, med],
          schedules: [...state.schedules, ...schedules],
        })),

      removeMedication: (id) =>
        set((state) => ({
          medications: state.medications.filter((m) => m.id !== id),
          schedules: state.schedules.filter((s) => s.medId !== id),
        })),

      updateDoseStatus: (doseId, status) =>
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === doseId ? { ...s, status } : s
          ),
        })),

      resetAll: () => set({ medications: [], schedules: [] }),
    }),
    {
      name: 'meds-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);