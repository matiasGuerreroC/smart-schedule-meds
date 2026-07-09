import {
  generateSmartSchedule,
  findOptimalStartTime,
  minutesToTime,
  evaluateStartTime,
} from './scheduler';

function runScenario(
  label: string,
  sleepStart: string,
  sleepEnd: string,
  frequencyHours: number,
  durationDays: number
) {
  console.log(`\n=== ${label} ===`);
  console.log('  Sueño: ${sleepStart} - ${sleepEnd}');
  console.log(`  Frecuencia: ${frequencyHours}h, Duración: ${durationDays} días`);

  const schedules = generateSmartSchedule({
    medicationId: 'test-med',
    medicationName: 'Test',
    sleepStart,
    sleepEnd,
    frequencyHours,
    durationDays,
    startDate: new Date('2026-07-08T00:00:00'),
  });

  const sleepStartMin = sleepStart.split(':').reduce((h, m) => Number(h) * 60 + Number(m), 0);
  const sleepEndMin = sleepEnd.split(':').reduce((h, m) => Number(h) * 60 + Number(m), 0);

  console.log(`  Total dosis: ${schedules.length}`);

  const sleepDoses = schedules.filter((s) => {
    const d = new Date(s.scheduledTime);
    const mins = d.getHours() * 60 + d.getMinutes();
    if (sleepStartMin < sleepEndMin) {
      return mins >= sleepStartMin && mins < sleepEndMin;
    }
    return mins >= sleepStartMin || mins < sleepEndMin;
  });

  console.log(`  Dosis en ventana de sueño: ${sleepDoses.length}/${schedules.length}`);
  console.log(`  Primera dosis: ${new Date(schedules[0].scheduledTime).toLocaleString()}`);

  const timeStrings = schedules.slice(0, Math.min(10, schedules.length)).map((s) => {
    const d = new Date(s.scheduledTime);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  console.log(`  Primeras ${timeStrings.length} dosis: ${timeStrings.join(', ')}${schedules.length > 10 ? '...' : ''}`);
}

function runEvaluationScenario(
  label: string,
  sleepStart: string,
  sleepEnd: string,
  frequencyHours: number
) {
  const ssMin = sleepStart.split(':').reduce((h, m) => Number(h) * 60 + Number(m), 0);
  const seMin = sleepEnd.split(':').reduce((h, m) => Number(h) * 60 + Number(m), 0);

  console.log(`\n--- Evaluación: ${label} ---`);
  console.log(`  Sueño: ${sleepStart} - ${sleepEnd}, Frecuencia: ${frequencyHours}h`);

  let bestScore = Infinity;
  let bestTimes: number[] = [];

  for (let t = 0; t < 1440; t += 60) {
    const score = evaluateStartTime(t, ssMin, seMin, frequencyHours);
    if (score < bestScore) {
      bestScore = score;
      bestTimes = [t];
    } else if (score === bestScore) {
      bestTimes.push(t);
    }
  }

  console.log(`  Mejor score: ${bestScore}`);
  console.log(`  Mejores horarios de inicio: ${bestTimes.map(minutesToTime).join(', ')}`);
}

console.log('==================================');
console.log('  TEST DEL ALGORITMO SMART SCHEDULE');
console.log('==================================');

runScenario('Escenario A', '23:00', '07:00', 8, 5);
runScenario('Escenario B', '23:00', '07:00', 4, 3);
runScenario('Escenario C', '23:30', '07:30', 6, 4);

console.log('\n==================================');
console.log('  EVALUACIÓN POR CANDIDATO');
console.log('==================================');

runEvaluationScenario('Cada 8h', '23:00', '07:00', 8);
runEvaluationScenario('Cada 4h', '23:00', '07:00', 4);
runEvaluationScenario('Cada 6h', '23:30', '07:30', 6);