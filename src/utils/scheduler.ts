import { DoseSchedule } from '../types/medication.types';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function isTimeInSleepWindow(
  mins: number,
  startMins: number,
  endMins: number
): boolean {
  if (startMins < endMins) {
    return mins >= startMins && mins < endMins;
  }
  return mins >= startMins || mins < endMins;
}

function circularDistance(minsA: number, minsB: number): number {
  const diff = Math.abs(minsA - minsB);
  return Math.min(diff, 1440 - diff);
}

function getDistanceToWakeWindow(
  mins: number,
  startMins: number,
  endMins: number
): number {
  if (!isTimeInSleepWindow(mins, startMins, endMins)) {
    return 0;
  }
  return Math.min(
    circularDistance(mins, startMins),
    circularDistance(mins, endMins)
  );
}

function evaluateStartTime(
  candidate: number,
  sleepStart: number,
  sleepEnd: number,
  frequencyHours: number
): number {
  const dosesPerDay = 24 / frequencyHours;
  let totalScore = 0;

  for (let i = 0; i < dosesPerDay; i++) {
    const doseMin = (candidate + i * frequencyHours * 60) % 1440;
    if (isTimeInSleepWindow(doseMin, sleepStart, sleepEnd)) {
      totalScore += 1000 + getDistanceToWakeWindow(doseMin, sleepStart, sleepEnd);
    }
  }

  return totalScore;
}

function findOptimalStartTime(
  sleepStart: number,
  sleepEnd: number,
  frequencyHours: number
): number {
  const step = 15;
  const candidates: number[] = [];
  const scores: number[] = [];

  for (let t = 0; t < 1440; t += step) {
    candidates.push(t);
    scores.push(evaluateStartTime(t, sleepStart, sleepEnd, frequencyHours));
  }

  const minScore = Math.min(...scores);
  const bestCandidates = candidates.filter((_, i) => scores[i] === minScore);

  const wakeAnchor = (sleepEnd + 30) % 1440;
  let best = bestCandidates[0];
  let bestDist = circularDistance(bestCandidates[0], wakeAnchor);

  for (let i = 1; i < bestCandidates.length; i++) {
    const dist = circularDistance(bestCandidates[i], wakeAnchor);
    if (dist < bestDist) {
      bestDist = dist;
      best = bestCandidates[i];
    }
  }

  return best;
}

export interface GenerateScheduleParams {
  medicationId: string;
  medicationName: string;
  sleepStart: string;
  sleepEnd: string;
  frequencyHours: number;
  durationDays: number;
  startDate: Date;
}

export function generateSmartSchedule(params: GenerateScheduleParams): DoseSchedule[] {
  const sleepStart = timeToMinutes(params.sleepStart);
  const sleepEnd = timeToMinutes(params.sleepEnd);
  const optimalStart = findOptimalStartTime(sleepStart, sleepEnd, params.frequencyHours);

  const dosesPerDay = 24 / params.frequencyHours;
  const totalDoses = Math.round(dosesPerDay * params.durationDays);

  const startOfDay = new Date(params.startDate);
  startOfDay.setHours(0, 0, 0, 0);
  const firstDoseDate = new Date(startOfDay.getTime() + optimalStart * 60000);

  const schedules: DoseSchedule[] = [];

  for (let i = 0; i < totalDoses; i++) {
    const doseTime = new Date(firstDoseDate.getTime() + i * params.frequencyHours * 3600000);
    schedules.push({
      id: `${params.medicationId}-${i}`,
      medId: params.medicationId,
      scheduledTime: doseTime.toISOString(),
      status: 'pending',
    });
  }

  return schedules;
}

export {
  timeToMinutes,
  minutesToTime,
  isTimeInSleepWindow,
  circularDistance,
  getDistanceToWakeWindow,
  evaluateStartTime,
  findOptimalStartTime,
};