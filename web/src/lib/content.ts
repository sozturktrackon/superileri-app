import exercisesData from '../content/exercises.json';
import calendarsData from '../content/calendars.json';
import { getLang } from './i18n';
import { trContent } from '../i18n/content-tr';
import { hiContent } from '../i18n/content-hi';
import { frContent } from '../i18n/content-fr';
import { deContent } from '../i18n/content-de';
import { esContent } from '../i18n/content-es';
import { ptContent } from '../i18n/content-pt';
import { tlContent } from '../i18n/content-tl';
import { idContent } from '../i18n/content-id';
import { itContent } from '../i18n/content-it';
import { jaContent } from '../i18n/content-ja';
import { viContent } from '../i18n/content-vi';
import { thContent } from '../i18n/content-th';
import { ruContent } from '../i18n/content-ru';
import { ukContent } from '../i18n/content-uk';
import { arContent } from '../i18n/content-ar';
import { heContent } from '../i18n/content-he';

type ContentOverlay = typeof trContent;
const OVERLAYS: Partial<Record<string, ContentOverlay>> = {
  tr: trContent, hi: hiContent, fr: frContent, de: deContent,
  es: esContent, pt: ptContent, tl: tlContent, id: idContent, it: itContent,
  ja: jaContent, vi: viContent, th: thContent, ru: ruContent,
  uk: ukContent, ar: arContent, he: heContent,
};
const overlay = (): ContentOverlay | undefined => OVERLAYS[getLang()];

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

/** Which repeat of the plan a raw ever-increasing day counter is in (1-based). */
export const cycleOf = (rawDay: number, planId: string): number =>
  Math.floor((rawDay - 1) / planLength(planId)) + 1;
const locGroup = (g: Group): Group => {
  const o = overlay();
  if (!o) return g;
  return {
    ...g,
    name: o.groups[g.key] ?? g.name,
    exercises: g.exercises.map((e) => ({
      ...e,
      name: o.exercises[e.id] ?? e.name,
      progressions: (e.progressions ?? []).map(
        (pr) => o.progressions[pr] ?? pr
      ),
    })),
  };
};

const locPlan = (p: Plan): Plan => {
  const o = overlay();
  const loc = o?.plans[p.id];
  return loc ? { ...p, name: loc.name, note: loc.note } : p;
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
  const o = overlay();
  return o?.shortLabels[key] ?? SHORT_LABELS[key] ?? key;
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
