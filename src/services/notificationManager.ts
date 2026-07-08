import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DoseSchedule } from '../types/medication.types';
import { useMedsStore } from '../store/useMedsStore';

const MAX_SCHEDULED = 40;
const CATEGORY_ID = 'MEDICATION_REMINDER';
const TAKE_ACTION = 'TAKE_ACTION';
const SNOOZE_ACTION = 'SNOOZE_ACTION';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function initNotifications(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.warn('Notification permissions not granted');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Recordatorios de medicación',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    {
      identifier: TAKE_ACTION,
      buttonTitle: 'Tomar',
      options: { opensAppToForeground: false },
    },
    {
      identifier: SNOOZE_ACTION,
      buttonTitle: 'Posponer 15 min',
      options: { opensAppToForeground: false },
    },
  ]);

  return true;
}

function dateTrigger(date: Date): Notifications.DateTriggerInput {
  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date,
  };
}

export async function scheduleMedicationNotifications(
  schedules: DoseSchedule[]
): Promise<void> {
  const now = new Date();
  const pendingSchedules = schedules
    .filter((s) => s.status === 'pending' && new Date(s.scheduledTime) > now)
    .slice(0, MAX_SCHEDULED);

  for (const dose of pendingSchedules) {
    const triggerDate = new Date(dose.scheduledTime);
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Smart Schedule Meds',
        body: `Hora de tomar tu medicamento`,
        data: { doseId: dose.id, medId: dose.medId },
        categoryIdentifier: CATEGORY_ID,
        sound: true,
      },
      trigger: dateTrigger(triggerDate),
    });

    useMedsStore.getState().setNotificationLink(dose.id, notificationId);
  }
}

export async function cancelMedicationNotifications(medId: string): Promise<void> {
  const state = useMedsStore.getState();
  const medDoseIds = state.schedules
    .filter((s) => s.medId === medId)
    .map((s) => s.id);

  const linksToRemove = state.notificationLinks.filter((l) =>
    medDoseIds.includes(l.doseId)
  );

  for (const link of linksToRemove) {
    await Notifications.cancelScheduledNotificationAsync(link.notificationId);
  }

  state.removeNotificationLinksByMedication(medId);
}

export async function snoozeDoseNotification(
  doseId: string,
  medId: string
): Promise<void> {
  const state = useMedsStore.getState();
  const originalDose = state.schedules.find((s) => s.id === doseId);
  if (!originalDose) return;

  const link = state.notificationLinks.find((l) => l.doseId === doseId);
  if (link) {
    await Notifications.cancelScheduledNotificationAsync(link.notificationId);
    state.removeNotificationLink(doseId);
  }

  const snoozedDate = new Date(Date.now() + 15 * 60 * 1000);
  const snoozedDose: DoseSchedule = {
    id: `${doseId}-snoozed-${Date.now()}`,
    medId,
    scheduledTime: snoozedDate.toISOString(),
    status: 'pending',
  };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Recordatorio de medicamento',
      body: `Es hora de tomar ${originalDose.medId}`,
      data: { doseId: snoozedDose.id, medId },
      categoryIdentifier: CATEGORY_ID,
      sound: true,
    },
    trigger: dateTrigger(snoozedDate),
  });

  state.addSnoozedDose(snoozedDose);
  state.setNotificationLink(snoozedDose.id, notificationId);
}