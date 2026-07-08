import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medication, DoseSchedule } from '../types/medication.types';

interface NotificationLink {
  doseId: string;
  notificationId: string;
}

interface MedsState {
  medications: Medication[];
  schedules: DoseSchedule[];
  notificationLinks: NotificationLink[];
  addMedication: (med: Medication, schedules: DoseSchedule[]) => void;
  removeMedication: (id: string) => void;
  updateDoseStatus: (doseId: string, status: DoseSchedule['status']) => void;
  setNotificationLink: (doseId: string, notificationId: string) => void;
  removeNotificationLinksByMedication: (medId: string) => void;
  removeNotificationLink: (doseId: string) => void;
  addSnoozedDose: (dose: DoseSchedule) => void;
  resetAll: () => void;
}

export const useMedsStore = create<MedsState>()(
  persist(
    (set) => ({
      medications: [],
      schedules: [],
      notificationLinks: [],

      addMedication: (med, schedules) =>
        set((state) => ({
          medications: [...state.medications, med],
          schedules: [...state.schedules, ...schedules],
        })),

      removeMedication: (id) =>
        set((state) => ({
          medications: state.medications.filter((m) => m.id !== id),
          schedules: state.schedules.filter((s) => s.medId !== id),
          notificationLinks: state.notificationLinks.filter(
            (l) => l.doseId !== id
          ),
        })),

      updateDoseStatus: (doseId, status) =>
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === doseId ? { ...s, status } : s
          ),
        })),

      setNotificationLink: (doseId, notificationId) =>
        set((state) => ({
          notificationLinks: [
            ...state.notificationLinks.filter((l) => l.doseId !== doseId),
            { doseId, notificationId },
          ],
        })),

      removeNotificationLinksByMedication: (medId) =>
        set((state) => {
          const medDoseIds = state.schedules
            .filter((s) => s.medId === medId)
            .map((s) => s.id);
          return {
            notificationLinks: state.notificationLinks.filter(
              (l) => !medDoseIds.includes(l.doseId)
            ),
          };
        }),

      removeNotificationLink: (doseId) =>
        set((state) => ({
          notificationLinks: state.notificationLinks.filter(
            (l) => l.doseId !== doseId
          ),
        })),

      addSnoozedDose: (dose) =>
        set((state) => ({
          schedules: [...state.schedules, dose],
        })),

      resetAll: () =>
        set({ medications: [], schedules: [], notificationLinks: [] }),
    }),
    {
      name: 'meds-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);