import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMedsStore } from '../store/useMedsStore';
import { useSleepStore } from '../store/useSleepStore';
import { scheduleMedicationNotifications } from '../services/notificationManager';
import { generateSmartSchedule } from '../utils/scheduler';
import { colors, typography, spacing, borderRadius } from '../utils/theme';
import { DoseSchedule } from '../types/medication.types';

interface Props {
  onNavigateBack: () => void;
}

const FREQUENCY_OPTIONS = [
  { label: 'Cada 4 horas', value: 4 },
  { label: 'Cada 6 horas', value: 6 },
  { label: 'Cada 8 horas', value: 8 },
  { label: 'Cada 12 horas', value: 12 },
  { label: 'Una vez al día', value: 24 },
];

function minutesToTimeDisplay(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDoseTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function isTimeInSleepWindow(
  mins: number,
  startMins: number,
  endMins: number
): boolean {
  if (startMins < endMins) return mins >= startMins && mins < endMins;
  return mins >= startMins || mins < endMins;
}

function isNearBoundary(
  mins: number,
  startMins: number,
  endMins: number
): boolean {
  if (!isTimeInSleepWindow(mins, startMins, endMins)) return false;
  let distStart = Math.abs(mins - startMins);
  if (distStart > 720) distStart = 1440 - distStart;
  let distEnd = Math.abs(mins - endMins);
  if (distEnd > 720) distEnd = 1440 - distEnd;
  return distStart <= 60 || distEnd <= 60;
}

export default function AddMedicationScreen({ onNavigateBack }: Props) {
  const sleepWindow = useSleepStore((s) => s.sleepWindow);
  const addMedication = useMedsStore((s) => s.addMedication);

  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState(8);
  const [duration, setDuration] = useState('');
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [preview, setPreview] = useState<DoseSchedule[] | null>(null);
  const [saving, setSaving] = useState(false);

  const durationNum = parseInt(duration, 10) || 0;

  const sleepStartStr = useMemo(
    () =>
      `${String(Math.floor(sleepWindow.startMinutes / 60)).padStart(2, '0')}:${String(sleepWindow.startMinutes % 60).padStart(2, '0')}`,
    [sleepWindow]
  );
  const sleepEndStr = useMemo(
    () =>
      `${String(Math.floor(sleepWindow.endMinutes / 60)).padStart(2, '0')}:${String(sleepWindow.endMinutes % 60).padStart(2, '0')}`,
    [sleepWindow]
  );

  const canPreview = name.trim().length > 0 && durationNum > 0 && durationNum <= 90;

  const handlePreview = () => {
    if (!canPreview) return;
    const medId = `med-${Date.now()}`;
    const result = generateSmartSchedule({
      medicationId: medId,
      medicationName: name.trim(),
      sleepStart: sleepStartStr,
      sleepEnd: sleepEndStr,
      frequencyHours: frequency,
      durationDays: durationNum,
      startDate: new Date(),
    });
    setPreview(result);
  };

  const handleConfirm = async () => {
    if (!preview || saving) return;
    setSaving(true);
    const schedulesToSave = preview;
    const existingMeds = useMedsStore.getState().medications;

    const newMed = {
      id: preview[0]?.medId || `med-${Date.now()}`,
      name: name.trim(),
      frequencyHours: frequency,
      durationDays: durationNum,
      totalDoses: preview.length,
      dosesTaken: 0,
      createdAt: new Date().toISOString(),
    };

    addMedication(newMed, schedulesToSave);
    await scheduleMedicationNotifications(schedulesToSave);
    setSaving(false);
    onNavigateBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.brand}>MedFlow</Text>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons
            name="account-circle"
            size={28}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Nuevo Tratamiento</Text>
          <Text style={styles.subtitle}>
            Configura tu medicación para un programa óptimo de adherencia.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.field}>
            <Text style={styles.label}>Nombre del Medicamento</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="medication"
                size={20}
                color={colors.onSurfaceVariant}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="ej. Ibuprofeno"
                placeholderTextColor={colors.outline}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.fieldRow}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Frecuencia</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowFrequencyPicker(!showFrequencyPicker)}
              >
                <Text style={styles.pickerText}>
                  {FREQUENCY_OPTIONS.find((f) => f.value === frequency)
                    ?.label || 'Seleccionar'}
                </Text>
                <MaterialIcons
                  name="expand-more"
                  size={20}
                  color={colors.onSurfaceVariant}
                />
              </TouchableOpacity>
              {showFrequencyPicker && (
                <View style={styles.pickerDropdown}>
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.pickerOption,
                        frequency === opt.value && styles.pickerOptionActive,
                      ]}
                      onPress={() => {
                        setFrequency(opt.value);
                        setShowFrequencyPicker(false);
                        setPreview(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          frequency === opt.value &&
                            styles.pickerOptionTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Duración (Días)</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="ej. 5"
                  placeholderTextColor={colors.outline}
                  keyboardType="number-pad"
                  value={duration}
                  onChangeText={(t) => {
                    setDuration(t);
                    setPreview(null);
                  }}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.previewSection}>
          <View style={styles.previewHeader}>
            <MaterialIcons
              name="auto-awesome"
              size={22}
              color={colors.primary}
            />
            <Text style={styles.previewTitle}>
              Vista Previa del Programa Inteligente
            </Text>
          </View>

          {!preview && (
            <TouchableOpacity
              style={[
                styles.calculateButton,
                !canPreview && styles.calculateButtonDisabled,
              ]}
              onPress={handlePreview}
              disabled={!canPreview}
            >
              <MaterialIcons
                name="auto-awesome"
                size={18}
                color={canPreview ? colors.onPrimary : colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.calculateButtonText,
                  !canPreview && styles.calculateButtonTextDisabled,
                ]}
              >
                Vista Previa
              </Text>
            </TouchableOpacity>
          )}

          {preview && (
            <View style={styles.previewTimeline}>
              {preview.slice(0, 10).map((dose, index) => {
                const doseDate = new Date(dose.scheduledTime);
                const doseMins = doseDate.getHours() * 60 + doseDate.getMinutes();
                const isBoundary = isNearBoundary(
                  doseMins,
                  sleepWindow.startMinutes,
                  sleepWindow.endMinutes
                );
                const isInSleep = isTimeInSleepWindow(
                  doseMins,
                  sleepWindow.startMinutes,
                  sleepWindow.endMinutes
                );

                return (
                  <View key={dose.id} style={styles.previewItem}>
                    <View style={styles.previewNode}>
                      <View
                        style={[
                          styles.previewDot,
                          isBoundary && styles.previewDotBoundary,
                          !isInSleep && styles.previewDotNormal,
                        ]}
                      />
                      {index < Math.min(preview.length, 10) - 1 && (
                        <View style={styles.previewLine} />
                      )}
                    </View>
                    <View
                      style={[
                        styles.previewCard,
                        isBoundary && styles.previewCardBoundary,
                      ]}
                    >
                      <View style={styles.previewCardInfo}>
                        <Text style={styles.previewTime}>
                          {formatDoseTime(dose.scheduledTime)}
                        </Text>
                        <Text style={styles.previewDoseLabel}>
                          Dosis {index + 1}
                        </Text>
                      </View>
                      {isBoundary && (
                        <View style={styles.badgeSleepBoundary}>
                          <MaterialIcons
                            name={isInSleep ? 'bedtime' : 'wb-sunny'}
                            size={14}
                            color={colors.onPrimaryContainer}
                          />
                          <Text style={styles.badgeSleepBoundaryText}>
                            Optimizado: Borde de Sueño
                          </Text>
                        </View>
                      )}
                      {!isBoundary && !isInSleep && (
                        <View style={styles.badgeNormal}>
                          <Text style={styles.badgeNormalText}>Horas de Vigilia</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
              {preview.length > 10 && (
                <Text style={styles.moreText}>
                  +{preview.length - 10} dosis más
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={styles.backActionButton}
          onPress={onNavigateBack}
        >
          <Text style={styles.backActionText}>Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!preview || saving) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!preview || saving}
        >
          <MaterialIcons
            name="notifications-active"
            size={20}
            color={colors.onPrimary}
          />
          <Text style={styles.confirmButtonText}>
            {saving ? 'Guardando...' : 'Confirmar y Programar Alarmas'}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: spacing.gutter,
    height: 56 + 56,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: spacing.xs,
  },
  brand: {
    ...typography.headlineMd,
    color: colors.primary,
    fontWeight: '700',
  },
  iconButton: {
    padding: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.gutter,
    paddingBottom: 120,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
  },
  formCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.gutter,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  label: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  inputIcon: {
    paddingLeft: spacing.md,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: spacing.md,
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md,
  },
  pickerText: {
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  pickerDropdown: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    zIndex: 100,
    elevation: 10,
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pickerOptionActive: {
    backgroundColor: colors.primaryContainer,
  },
  pickerOptionText: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  pickerOptionTextActive: {
    color: colors.onPrimaryContainer,
    fontWeight: '600',
  },
  previewSection: {
    gap: spacing.md,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  calculateButtonDisabled: {
    backgroundColor: colors.surfaceContainer,
  },
  calculateButtonText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
  calculateButtonTextDisabled: {
    color: colors.onSurfaceVariant,
  },
  previewTimeline: {
    paddingLeft: spacing.md,
  },
  previewItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  previewNode: {
    width: 24,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  previewDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 4,
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
  },
  previewDotBoundary: {
    borderColor: colors.primaryContainer,
    backgroundColor: colors.primaryContainer,
  },
  previewDotNormal: {
    borderColor: colors.surfaceContainerHigh,
  },
  previewLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.surfaceContainer,
  },
  previewCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  previewCardBoundary: {
    borderColor: colors.primaryContainer,
  },
  previewCardInfo: {},
  previewTime: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  previewDoseLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  badgeSleepBoundary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeSleepBoundaryText: {
    ...typography.labelMd,
    color: colors.onPrimaryContainer,
  },
  badgeNormal: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainer,
  },
  badgeNormalText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  moreText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  backActionButton: {
    flex: 1,
    height: 56,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backActionText: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  confirmButton: {
    flex: 2,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.surfaceContainer,
  },
  confirmButtonText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
});