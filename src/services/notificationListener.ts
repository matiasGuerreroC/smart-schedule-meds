import * as Notifications from 'expo-notifications';
import { useMedsStore } from '../store/useMedsStore';
import { snoozeDoseNotification } from './notificationManager';

const TAKE_ACTION = 'TAKE_ACTION';
const SNOOZE_ACTION = 'SNOOZE_ACTION';

export function initNotificationListener(): Notifications.EventSubscription {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const { actionIdentifier, notification } = response;
      const data = notification.request.content.data as
        | { doseId?: string; medId?: string }
        | undefined;

      if (!data?.doseId || !data?.medId) return;

      const { updateDoseStatus } = useMedsStore.getState();

      switch (actionIdentifier) {
        case TAKE_ACTION:
          updateDoseStatus(data.doseId, 'taken');
          break;
        case SNOOZE_ACTION:
          updateDoseStatus(data.doseId, 'snoozed');
          snoozeDoseNotification(data.doseId, data.medId);
          break;
        default:
          break;
      }
    }
  );

  return subscription;
}