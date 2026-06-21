import type { Exercise, Group, Intervals } from './content';

export type PhaseType = 'prep' | 'on' | 'rest' | 'done';

export type Phase = {
  type: PhaseType;
  seconds: number;
  /** For 'on': the active exercise. For 'prep'/'rest': the UPCOMING exercise. */
  exercise?: Exercise;
  round?: number; // 1..rounds (for on/rest)
  index?: number; // exercise index within the round (for on)
  totalRounds: number;
};

/**
 * Build the full ordered list of phases for one circuit (group):
 *   PREP -> [round 1: on,rest,on,rest,...] -> [round 2 ...] -> ... -> DONE
 * Prep happens only once at the very start. A REST follows every ON except the
 * final ON of the final round, which goes straight to DONE.
 */
export const buildPhases = (group: Group, intervals: Intervals): Phase[] => {
  const { prepSeconds, onSeconds, offSeconds, rounds } = intervals;
  const phases: Phase[] = [];
  const exercises = group.exercises;
  if (exercises.length === 0) return phases;

  // Linear sequence of every ON across all rounds.
  const onSeq: { ex: Exercise; round: number; index: number }[] = [];
  for (let r = 1; r <= rounds; r++) {
    exercises.forEach((ex, i) => onSeq.push({ ex, round: r, index: i }));
  }

  phases.push({
    type: 'prep',
    seconds: prepSeconds,
    exercise: onSeq[0].ex,
    totalRounds: rounds,
  });

  onSeq.forEach((o, k) => {
    phases.push({
      type: 'on',
      seconds: onSeconds,
      exercise: o.ex,
      round: o.round,
      index: o.index,
      totalRounds: rounds,
    });
    const next = onSeq[k + 1];
    if (next) {
      phases.push({
        type: 'rest',
        seconds: offSeconds,
        exercise: next.ex, // show what's coming during the green rest
        round: next.round,
        totalRounds: rounds,
      });
    }
  });

  phases.push({ type: 'done', seconds: 0, totalRounds: rounds });
  return phases;
};

/** Total wall-clock seconds for a circuit (excludes the zero-length 'done'). */
export const totalSeconds = (phases: Phase[]): number =>
  phases.reduce((sum, p) => sum + p.seconds, 0);

export const fmtClock = (totalSec: number): string => {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};
