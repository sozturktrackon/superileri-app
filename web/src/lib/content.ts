import exercisesData from '../content/exercises.json';
import calendarsData from '../content/calendars.json';
import { getLang } from './i18n';
import { trContent } from '../i18n/content-tr';

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

export type PlanId = 'lean' | 'bulk' | 'lean2' | 'bulk2';

// ---- Content localization: names are swapped per active language at the
// accessor level, so every screen gets localized content for free. English is
// canonical; anything missing in an overlay falls back to it.
const locGroup = (g: Group): Group => {
  if (getLang() !== 'tr') return g;
  return {
    ...g,
    name: trContent.groups[g.key] ?? g.name,
    exercises: g.exercises.map((e) => ({
      ...e,
      name: trContent.exercises[e.id] ?? e.name,
    })),
  };
};

const locPlan = (p: Plan): Plan => {
  if (getLang() !== 'tr') return p;
  const o = trContent.plans[p.id];
  return o ? { ...p, name: o.name, note: o.note } : p;
};

export const allGroups = (): Group[] => groups.map(locGroup);
export const allPlans = (): Plan[] => plans.map(locPlan);

export const getPlan = (id: string): Plan | undefined => {
  const p = plans.find((x) => x.id === id);
  return p ? locPlan(p) : undefined;
};

export const getGroupByKey = (key: string): Group | undefined => {
  const g = groupByKey.get(key);
  return g ? locGroup(g) : undefined;
};

/** Short tile labels for the calendar grid. The internal keys GAME / Royce /
 *  J-Lo are legacy identifiers kept only for stored-data compatibility (they
 *  live in saved workout logs) and must never be shown to the user. */
const SHORT_LABELS: Record<string, string> = {
  GAME: 'Full Body',
  Royce: 'Core',
  'J-Lo': 'Glutes',
  Chest2: 'Chest',
  Back2: 'Back',
  Shoulders2: 'Shoulders',
  Legs2: 'Legs',
  UPH2: 'UPH',
  LBH2: 'LBH',
  CH2: 'CH',
  GAME2: 'Full Body',
  Royce2: 'Core',
  JLo2: 'Glutes',
};
export const groupShort = (key: string): string => {
  if (getLang() === 'tr') {
    return trContent.shortLabels[key] ?? SHORT_LABELS[key] ?? key;
  }
  return SHORT_LABELS[key] ?? key;
};

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

// Cycle length is PER PLAN and comes from the calendar data itself:
// Lean is 4 clean weeks (28 days, Sunday rests); Bulk is 6 rolling 5-day
// blocks (30 days: Chest, Back, Shoulders, Legs, Rest).
export const planLength = (planId: string): number =>
  getPlan(planId)?.days.length ?? 28;

/** Wrap day numbers so the next cycle starts where this plan's pattern says. */
export const normalizeDay = (day: number, planId: string): number => {
  const len = planLength(planId);
  return ((((day - 1) % len) + len) % len) + 1;
};
