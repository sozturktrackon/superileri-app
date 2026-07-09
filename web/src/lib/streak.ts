import { getDay, normalizeDay, PLAN_LENGTH } from './content';
import type { WorkoutLog } from './api';

/**
 * Streaks over the whole program history. `currentDay` on the profile is a
 * RAW ever-increasing counter (day 30 = day 2 of cycle 2), so walking 1..raw
 * covers every cycle. Rules, per the product decision:
 *   - rest days neither count toward nor break a streak
 *   - a missed training day breaks it
 *   - today not being done (yet) doesn't break it
 *
 * Completions are stored per NORMALIZED program day, so a day completed in an
 * earlier cycle also reads as completed in later ones — good enough until
 * logs become cycle-aware.
 */

/** Program days (1..PLAN_LENGTH) where every required circuit has a log. */
export const completedDaySet = (
  planId: string,
  logs: WorkoutLog[]
): Set<number> => {
  const done = new Set<number>();
  for (let day = 1; day <= PLAN_LENGTH; day++) {
    const resolved = getDay(planId, day);
    if (!resolved || resolved.rest) continue;
    const required = resolved.groups
      .filter((g) => g.exercises.length > 0)
      .map((g) => g.key);
    if (required.length === 0) continue;
    const logged = new Set(
      logs
        .filter((l) => l.planId === planId && l.dayNumber === day && l.completed)
        .flatMap((l) => l.groupKeys ?? [])
    );
    if (required.every((k) => logged.has(k))) done.add(day);
  }
  return done;
};

export const computeStreaks = (
  planId: string,
  currentDayRaw: number,
  completed: Set<number>
): { current: number; best: number } => {
  let best = 0;
  let run = 0;
  for (let pos = 1; pos <= currentDayRaw; pos++) {
    const n = normalizeDay(pos);
    const d = getDay(planId, n);
    if (!d || d.rest) continue;
    if (completed.has(n)) {
      run++;
      if (run > best) best = run;
    } else if (pos < currentDayRaw) {
      run = 0; // a missed PAST training day breaks the run; today doesn't
    }
  }
  return { current: run, best };
};
