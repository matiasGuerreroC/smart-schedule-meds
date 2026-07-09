import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { useSleepStore } from '../store/useSleepStore';
import { colors, typography, spacing, borderRadius } from '../utils/theme';

const DEFAULT_START_HOUR = 23;
const DEFAULT_START_MIN = 30;
const DEFAULT_END_HOUR = 7;
const DEFAULT_END_MIN = 30;

interface Props {
  onComplete: () => void;
}

export default function SleepSetupScreen({ onComplete }: Props) {
  const setSleepWindow = useSleepStore((s) => s.setSleepWindow);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setHours(DEFAULT_START_HOUR, DEFAULT_START_MIN, 0, 0);
    return d;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setHours(DEFAULT_END_HOUR, DEFAULT_END_MIN, 0, 0);
    return d;
  });

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const hours = startDate.getHours();
  const mins = startDate.getMinutes();
  const startMinutes = hours * 60 + mins;

  const endHours = endDate.getHours();
  const endMins = endDate.getMinutes();
  const endMinutes = endHours * 60 + endMins;

  let sleepDurationHours = 0;
  let sleepDurationMins = 0;
  if (endMinutes > startMinutes) {
    sleepDurationHours = Math.floor((endMinutes - startMinutes) / 60);
    sleepDurationMins = (endMinutes - startMinutes) % 60;
  } else {
    const diff = 1440 - startMinutes + endMinutes;
    sleepDurationHours = Math.floor(diff / 60);
    sleepDurationMins = diff % 60;
  }

  const formatTime = (date: Date): string => {
    const h = date.getHours();
    const m = date.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const onStartChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selected) setStartDate(selected);
  };

  const onEndChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selected) setEndDate(selected);
  };

  const handleSave = () => {
    setSleepWindow(startMinutes, endMinutes);
    onComplete();
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>MedFlow</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Configura tu Ventana de Sueño</Text>
          <Text style={styles.subtitle}>
            Ajustamos tu horario de medicación para proteger tus ciclos de descanso.
          </Text>
        </View>

        <View style={styles.dialOuter}>
          <View style={styles.dialInner}>
            <Text style={styles.dialLabel}>DURACIÓN DEL SUEÑO</Text>
            <Text style={styles.dialValue}>
              {sleepDurationHours}h {String(sleepDurationMins).padStart(2, '0')}m
            </Text>
          </View>
        </View>

        <View style={styles.timeButtons}>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowStartPicker(true)}
          >
            <MaterialIcons name="nights-stay" size={20} color={colors.primary} />
            <Text style={styles.timeButtonText}>
              Acostarse: {formatTime(startDate)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowEndPicker(true)}
          >
            <MaterialIcons name="wb-sunny" size={20} color={colors.tertiaryContainer} />
            <Text style={styles.timeButtonText}>
              Despertarse: {formatTime(endDate)}
            </Text>
          </TouchableOpacity>
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="time"
            is24Hour={false}
            onChange={onStartChange}
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="time"
            is24Hour={false}
            onChange={onEndChange}
          />
        )}
      </View>

      <View style={styles.bottomAction}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>
            Guardar y Continuar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  topBar: {
    paddingTop: 56,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.gutter,
    alignItems: 'center',
  },
  brand: {
    ...typography.headlineMd,
    color: colors.primary,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.gutter,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  dialOuter: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 6,
    borderColor: colors.primaryContainer,
  },
  dialInner: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  dialLabel: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  dialValue: {
    ...typography.headlineMd,
    color: colors.primary,
    fontWeight: '700',
  },
  timeButtons: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 56,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md,
  },
  timeButtonText: {
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  bottomAction: {
    paddingHorizontal: spacing.gutter,
    paddingBottom: 32,
    paddingTop: spacing.sm,
  },
  primaryButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
});