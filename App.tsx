import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { initNotifications } from './src/services/notificationManager';
import { initNotificationListener } from './src/services/notificationListener';
import { useSleepStore } from './src/store/useSleepStore';
import SleepSetupScreen from './src/screens/SleepSetupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AddMedicationScreen from './src/screens/AddMedicationScreen';

type Screen = 'sleep_setup' | 'dashboard' | 'add_medication';

const DEFAULT_START = 1380;
const DEFAULT_END = 420;

export default function App() {
  const sleepWindow = useSleepStore((s) => s.sleepWindow);
  const hasConfiguredSleep =
    sleepWindow.startMinutes !== DEFAULT_START ||
    sleepWindow.endMinutes !== DEFAULT_END;

  const [currentScreen, setCurrentScreen] = useState<Screen>(() =>
    hasConfiguredSleep ? 'dashboard' : 'sleep_setup'
  );

  useEffect(() => {
    initNotifications();
    const subscription = initNotificationListener();
    return () => {
      subscription.remove();
    };
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'sleep_setup':
        return (
          <SleepSetupScreen onComplete={() => setCurrentScreen('dashboard')} />
        );
      case 'dashboard':
        return (
          <DashboardScreen
            onNavigateSleepSetup={() => setCurrentScreen('sleep_setup')}
            onNavigateAddMedication={() => setCurrentScreen('add_medication')}
          />
        );
      case 'add_medication':
        return (
          <AddMedicationScreen
            onNavigateBack={() => setCurrentScreen('dashboard')}
          />
        );
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      {renderScreen()}
    </>
  );
}