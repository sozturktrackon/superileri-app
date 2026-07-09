import exercisesData from '../content/exercises.json';
import calendarsData from '../content/calendars.json';

export type Exercise = {
  id: string;
  name: string;
  progressions: string[];
};

export type Group = {
  id: string;
  name: string;
  key: string;
  exercises: Exercise[];
  _missing?: boolean;
  _note?: string;
};

export type Intervals = {
  prepSeconds: number;
  onSeconds: number;
  offSeconds: number;
  rounds: number;
  beepLastSeconds: number;
};

export type PlanDay = {
  day: number;
  rest: boolean;
  workouts: string[]; // group keys
};

export type Plan = {
  id: 'lean' | 'bulk';
  name: string;
  note: string;
  days: PlanDay[];
};

const groups = exercisesData.groups as Group[];
const plans = calendarsData.plans as Plan[];
export const intervals = calendarsData.intervals as Intervals;

const groupByKey = new Map(groups.map((g) => [g.key, g]));

export const allGroups = (): Group[] => groups;
export const allPlans = (): Plan[] => plans;

export const getPlan = (id: string): Plan | undefined =>
  plans.find((p) => p.id === id);

export const getGroupByKey = (key: string): Group | undefined =>
  groupByKey.get(key);

/** Short tile labels for the calendar grid. The internal keys GAME / Royce /
 *  J-Lo are legacy identifiers kept only for stored-data compatibility (they
 *  live in saved workout logs) and must never be shown to the user. */
const SHORT_LABELS: Record<string, string> = {
  GAME: 'Full Body',
  Royce: 'Core',
  'J-Lo': 'Glutes',
};
export const groupShort = (key: string): string => SHORT_LABELS[key] ?? key;

/** Resolve a plan day into its ordered list of exercise groups. */
export const getDay = (planId: string, dayNumber: number) => {
  const plan = getPlan(planId);
  if (!plan) return undefined;
  const day = plan.days.find((d) => d.day === dayNumber);
  if (!day) return undefined;
  return {
    ...day,
    groups: day.workouts
      .map((k) => getGroupByKey(k))
      .filter((g): g is Group => !!g),
  };
};

// Cycle length comes from the calendar data itself (4 clean weeks = 28 days;
// the original program's days 29-30 were trimmed because they collided with
// the restart — Chest on day 29 AND again on day 1).
export const PLAN_LENGTH = plans[0]?.days.length ?? 28;

/** Wrap day numbers so week 5 starts the cycle again. */
export const normalizeDay = (day: number): number =>
  ((((day - 1) % PLAN_LENGTH) + PLAN_LENGTH) % PLAN_LENGTH) + 1;
