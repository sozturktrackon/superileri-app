import { client } from './amplify';
import { getLang, LANG_NAMES, tGlobal } from './i18n';

/**
 * Daily coach line: exactly one Bedrock call per (day, language) per device,
 * cached in localStorage. Empty string = show nothing; the Today screen never
 * blocks or errors on this.
 */
const KEY = 'superileri.coachLine';

type CoachContext = {
  name?: string;
  dayNumber: number;
  cycle: number;
  streak: number;
  totalCircuits: number;
  isRest: boolean;
  groups: string;
};

export const getCoachLine = async (ctx: CoachContext): Promise<string> => {
  const lang = getLang();
  const today = new Date().toISOString().slice(0, 10);
  try {
    const cached = JSON.parse(localStorage.getItem(KEY) || 'null') as {
      date: string;
      lang: string;
      line: string;
    } | null;
    if (cached && cached.date === today && cached.lang === lang) {
      return cached.line;
    }
  } catch {
    /* ignore */
  }
  try {
    const { data } = await client.queries.coachLine({
      language: LANG_NAMES[lang],
      name: ctx.name,
      dayNumber: ctx.dayNumber,
      cycle: ctx.cycle,
      streak: ctx.streak,
      totalCircuits: ctx.totalCircuits,
      isRest: ctx.isRest,
      groups: ctx.groups,
    });
    const line = (data ?? '').trim();
    localStorage.setItem(KEY, JSON.stringify({ date: today, lang, line }));
    return line;
  } catch {
    return '';
  }
};

/**
 * Streak milestones that earn a celebration — once each, across ALL devices.
 * The source of truth is profile.milestonesSeen (server); localStorage is only
 * a merge-in fallback so the card hides instantly even if the profile write
 * races or fails.
 */
const MILESTONES = [7, 14, 30, 50, 100] as const;
const SEEN_KEY = 'superileri.milestonesSeen';

export const seenMilestones = (serverSeen?: (number | null)[] | null): number[] => {
  let local: number[] = [];
  try {
    local = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
  } catch {
    /* ignore */
  }
  const server = (serverSeen ?? []).filter((n): n is number => typeof n === 'number');
  return [...new Set([...local, ...server])];
};

export const pendingMilestone = (streak: number, seen: number[]): number | null => {
  const hit = [...MILESTONES].reverse().find((m) => streak >= m && !seen.includes(m));
  return hit ?? null;
};

/** Dismissing a milestone also dismisses every smaller one (no backfill spam). */
export const dismissMilestone = (m: number, seen: number[]): number[] => {
  const next = [...new Set([...seen, ...MILESTONES.filter((x) => x <= m)])];
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
};

/** Recovery-flavored reward suggestion per milestone (never food). */
export const milestoneReward = (m: number): string => {
  if (m >= 100) return tGlobal('A hundred days. Book the full spa day, you have earned every minute of it.');
  if (m >= 50) return tGlobal('Fifty days strong. Treat yourself to new training gear, you will use it.');
  if (m >= 30) return tGlobal('A full month of showing up. A massage is not a luxury now, it is maintenance.');
  if (m >= 14) return tGlobal('Two weeks without missing. A long sauna or hammam evening has your name on it.');
  return tGlobal('Seven days straight. Treat yourself to something that helps you recover: an early night, a long stretch, a proper massage.');
};
