import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMedsStore } from '../store/useMedsStore';
import { useSleepStore } from '../store/useSleepStore';
import {
  cancelMedicationNotifications,
  snoozeDoseNotification,
} from '../services/notificationManager';
import { colors, typography, spacing, borderRadius } from '../utils/theme';
import { DoseSchedule } from '../types/medication.types';

interface Props {
  onNavigateSleepSetup: () => void;
  onNavigateAddMedication: () => void;
}

function minutesToTimeDisplay(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDoseTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function isInSleepWindow(
  mins: number,
  startMins: number,
  endMins: number
): boolean {
  if (startMins < endMins) return mins >= startMins && mins < endMins;
  return mins >= startMins || mins < endMins;
}

function getProximityToBoundary(
  mins: number,
  startMins: number,
  endMins: number
): 'wake' | 'bed' | null {
  if (!isInSleepWindow(mins, startMins, endMins)) return null;
  let distStart = Math.abs(mins - startMins);
  if (distStart > 720) distStart = 1440 - distStart;
  let distEnd = Math.abs(mins - endMins);
  if (distEnd > 720) distEnd = 1440 - distEnd;
  if (distStart <= 60) return 'bed';
  if (distEnd <= 60) return 'wake';
  return null;
}

export default function DashboardScreen({
  onNavigateSleepSetup,
  onNavigateAddMedication,
}: Props) {
  const medications = useMedsStore((s) => s.medications);
  const schedules = useMedsStore((s) => s.schedules);
  const updateDoseStatus = useMedsStore((s) => s.updateDoseStatus);
  const removeMedication = useMedsStore((s) => s.removeMedication);
  const sleepWindow = useSleepStore((s) => s.sleepWindow);

  const todaySchedules = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfTomorrow = new Date(startOfToday);
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 2);

    return schedules
      .filter((s) => {
        const t = new Date(s.scheduledTime).getTime();
        return (
          s.status === 'pending' &&
          t >= startOfToday.getTime() &&
          t < endOfTomorrow.getTime()
        );
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledTime).getTime() -
          new Date(b.scheduledTime).getTime()
      );
  }, [schedules]);

  const handleTakeDose = (dose: DoseSchedule) => {
    updateDoseStatus(dose.id, 'taken');
  };

  const handleSnooze = (dose: DoseSchedule) => {
    updateDoseStatus(dose.id, 'snoozed');
    snoozeDoseNotification(dose.id, dose.medId);
  };

  const handleDeleteMedication = (medId: string) => {
    cancelMedicationNotifications(medId);
    removeMedication(medId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.topBarInner}>
          <Text style={styles.brand}>MedFlow</Text>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons
              name="account-circle"
              size={28}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <View style={styles.sleepBanner}>
            <MaterialIcons name="bedtime" size={20} color={colors.secondary} />
            <Text style={styles.sleepBannerText}>
              Your sleep: {minutesToTimeDisplay(sleepWindow.startMinutes)} -{' '}
              {minutesToTimeDisplay(sleepWindow.endMinutes)}
            </Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={onNavigateSleepSetup}
            >
              <MaterialIcons name="edit" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Treatments</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardRow}
          >
            {medications.length === 0 && (
              <View style={styles.emptyCard}>
                <MaterialIcons
                  name="medication"
                  size={32}
                  color={colors.outlineVariant}
                />
                <Text style={styles.emptyText}>No active treatments</Text>
              </View>
            )}
            {medications.map((med) => {
              const doseCount = schedules.filter(
                (s) => s.medId === med.id
              ).length;
              const takenCount = schedules.filter(
                (s) => s.medId === med.id && s.status === 'taken'
              ).length;
              const progress =
                doseCount > 0 ? (takenCount / doseCount) * 100 : 0;
              return (
                <View key={med.id} style={styles.medCard}>
                  <View style={styles.medCardHeader}>
                    <View style={styles.medCardInfo}>
                      <Text style={styles.medName}>{med.name}</Text>
                      <Text style={styles.medDoses}>
                        {takenCount} of {doseCount} doses taken
                      </Text>
                    </View>
                    <View style={styles.medIcon}>
                      <MaterialIcons
                        name="medication"
                        size={22}
                        color={colors.primary}
                      />
                    </View>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[styles.progressBarFill, { width: `${progress}%` }]}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteMedication(med.id)}
                  >
                    <MaterialIcons
                      name="delete-outline"
                      size={18}
                      color={colors.onSurfaceVariant}
                    />
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Timeline</Text>
          <View style={styles.timeline}>
            {todaySchedules.length === 0 && (
              <View style={styles.emptyTimelineCard}>
                <Text style={styles.emptyText}>
                  No pending doses for today
                </Text>
              </View>
            )}
            {todaySchedules.map((dose, index) => {
              const d = new Date(dose.scheduledTime);
              const mins = d.getHours() * 60 + d.getMinutes();
              const med = medications.find((m) => m.id === dose.medId);
              const proximity = getProximityToBoundary(
                mins,
                sleepWindow.startMinutes,
                sleepWindow.endMinutes
              );
              const isFirst = index === 0;
              const isLast = index === todaySchedules.length - 1;

              return (
                <View key={dose.id} style={styles.timelineItem}>
                  <View style={styles.timelineNode}>
                    <View
                      style={[
                        styles.timelineDot,
                        proximity === 'wake'
                          ? styles.dotWake
                          : proximity === 'bed'
                          ? styles.dotBed
                          : styles.dotDefault,
                      ]}
                    />
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineCard}>
                    <View style={styles.timelineCardHeader}>
                      <View>
                        <Text style={styles.doseTime}>
                          {formatDoseTime(dose.scheduledTime)}
                        </Text>
                        <Text style={styles.doseMedName}>
                          {med?.name ?? 'Unknown'}
                        </Text>
                      </View>
                      {proximity === 'wake' && (
                        <View style={styles.badgeWake}>
                          <MaterialIcons
                            name="wb-sunny"
                            size={14}
                            color={colors.onPrimaryContainer}
                          />
                          <Text style={styles.badgeWakeText}>
                            Right After Waking
                          </Text>
                        </View>
                      )}
                      {proximity === 'bed' && (
                        <View style={styles.badgeBed}>
                          <MaterialIcons
                            name="bedtime"
                            size={14}
                            color={colors.onTertiaryContainer}
                          />
                          <Text style={styles.badgeBedText}>
                            Before Bed
                          </Text>
                        </View>
                      )}
                      {!proximity && (
                        <View style={styles.badgePending}>
                          <Text style={styles.badgePendingText}>Pending</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.timelineActions}>
                      <TouchableOpacity
                        style={styles.takeButton}
                        onPress={() => handleTakeDose(dose)}
                      >
                        <MaterialIcons
                          name="check-circle"
                          size={18}
                          color={colors.onPrimary}
                        />
                        <Text style={styles.takeButtonText}>Take Now</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.snoozeButton}
                        onPress={() => handleSnooze(dose)}
                      >
                        <MaterialIcons
                          name="schedule"
                          size={18}
                          color={colors.onSurfaceVariant}
                        />
                        <Text style={styles.snoozeButtonText}>Snooze 15m</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={onNavigateAddMedication}
        activeOpacity={0.9}
      >
        <MaterialIcons name="add" size={28} color={colors.onPrimary} />
      </TouchableOpacity>

      <View style={styles.bottomNav}>
        <View style={styles.navItemActive}>
          <MaterialIcons name="calendar-today" size={22} color={colors.onPrimaryContainer} />
          <Text style={styles.navLabelActive}>Schedule</Text>
        </View>
        <View style={styles.navItem}>
          <MaterialIcons name="medication" size={22} color={colors.onSurfaceVariant} />
          <Text style={styles.navLabel}>Meds</Text>
        </View>
        <View style={styles.navItem}>
          <MaterialIcons name="history" size={22} color={colors.onSurfaceVariant} />
          <Text style={styles.navLabel}>History</Text>
        </View>
        <View style={styles.navItem}>
          <MaterialIcons name="analytics" size={22} color={colors.onSurfaceVariant} />
          <Text style={styles.navLabel}>Health</Text>
        </View>
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
    paddingHorizontal: spacing.gutter,
    backgroundColor: colors.surface,
  },
  topBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
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
    paddingBottom: 160,
  },
  greetingSection: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  sleepBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
  },
  sleepBannerText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  editButton: {
    padding: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.gutter,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  cardRow: {
    gap: spacing.sm,
    paddingRight: spacing.gutter,
  },
  emptyCard: {
    minWidth: 200,
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  medCard: {
    minWidth: 260,
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
    gap: spacing.md,
  },
  medCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medCardInfo: {
    flex: 1,
  },
  medName: {
    ...typography.bodyLg,
    fontWeight: '600',
    color: colors.onSurface,
  },
  medDoses: {
    ...typography.labelMd,
    color: colors.secondary,
  },
  medIcon: {
    backgroundColor: colors.primaryContainer,
    padding: spacing.xs,
    borderRadius: borderRadius.full,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  deleteText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  timeline: {
    paddingLeft: spacing.md,
  },
  emptyTimelineCard: {
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
    alignItems: 'center',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  timelineNode: {
    width: 24,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    backgroundColor: colors.surfaceContainerLowest,
  },
  dotDefault: {
    borderColor: colors.surfaceContainerHigh,
  },
  dotWake: {
    borderColor: colors.primaryContainer,
  },
  dotBed: {
    borderColor: colors.tertiaryContainer,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.surfaceContainer,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  doseTime: {
    ...typography.labelMd,
    color: colors.tertiary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.05,
    marginBottom: 2,
  },
  doseMedName: {
    ...typography.bodyLg,
    fontWeight: '600',
    color: colors.onSurface,
  },
  badgeWake: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeWakeText: {
    ...typography.labelMd,
    color: colors.onPrimaryContainer,
  },
  badgeBed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.tertiaryContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeBedText: {
    ...typography.labelMd,
    color: colors.onTertiaryContainer,
  },
  badgePending: {
    backgroundColor: colors.tertiaryFixed,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgePendingText: {
    ...typography.labelMd,
    color: colors.tertiary,
  },
  timelineActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  takeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  takeButtonText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
  snoozeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceContainerLow,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  snoozeButtonText: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: spacing.gutter,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainer,
  },
  navItem: {
    alignItems: 'center',
    gap: 2,
  },
  navItemActive: {
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  navLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  navLabelActive: {
    ...typography.labelMd,
    color: colors.onPrimaryContainer,
  },
});