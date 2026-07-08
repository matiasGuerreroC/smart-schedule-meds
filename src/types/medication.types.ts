export interface SleepWindow {
  startMinutes: number;
  endMinutes: number;
}

export interface Medication {
  id: string;
  name: string;
  frequencyHours: number;
  durationDays: number;
  totalDoses: number;
  dosesTaken: number;
  createdAt: string;
}

export interface DoseSchedule {
  id: string;
  medId: string;
  scheduledTime: string;
  status: 'pending' | 'taken' | 'snoozed' | 'missed';
}