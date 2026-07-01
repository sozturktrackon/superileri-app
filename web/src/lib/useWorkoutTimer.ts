import { useCallback, useEffect, useRef, useState } from 'react';
import type { Phase } from './timer';
import {
  beepBell,
  beepCountdown,
  beepEnd,
  beepFinish,
  beepReady,
  buzz,
  say,
} from './sound';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export type TimerState = {
  status: TimerStatus;
  index: number; // index into phases
  phase: Phase | undefined;
  secondsLeft: number;
};

/**
 * Drives a list of phases with accurate, drift-free countdown (it anchors to
 * wall-clock time rather than counting interval ticks). Fires audio/haptic cues
 * at the right moments: GO at the start of an "on", countdown blips on the last
 * 3 seconds, a tone into REST, and a flourish on finish.
 */
export const useWorkoutTimer = (phases: Phase[]) => {
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(phases[0]?.seconds ?? 0);
  const [status, setStatus] = useState<TimerStatus>('idle');

  const endAtRef = useRef<number>(0); // wall-clock ms when current phase ends
  const remainingRef = useRef<number>((phases[0]?.seconds ?? 0) * 1000);
  const rafRef = useRef<number | null>(null);
  const lastBeepSecRef = useRef<number>(-1);
  const firedCuesRef = useRef<Set<number>>(new Set()); // which thresholds already cued this phase

  const clearLoop = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  // Announce the start of a phase (sound + haptics).
  const announcePhaseStart = useCallback((p: Phase | undefined) => {
    if (!p) return;
    lastBeepSecRef.current = -1;
    firedCuesRef.current = new Set();
    if (p.type === 'on') {
      beepBell(); // boxing-ring bell (round begins)
      buzz([90, 50, 90, 50, 120]);
    } else if (p.type === 'rest') {
      if (!say('rest')) beepEnd(); // voice "Rest", fall back to a tone
      buzz([60, 40, 60]);
    } else if (p.type === 'done') {
      beepFinish();
      buzz([100, 60, 100, 60, 200]);
    }
  }, []);

  // Fire a single countdown cue (voice, falling back to a tone if unloaded).
  const fireCue = (threshold: number) => {
    if (threshold === 4) {
      if (!say('ready')) beepReady();
    } else {
      const word = threshold === 3 ? 'three' : threshold === 2 ? 'two' : 'one';
      if (!say(word)) beepCountdown();
    }
    buzz(80);
  };

  // Spoken (or beeped) countdown for the last seconds of a phase. Uses
  // "at-or-below threshold, not yet fired" catch-up logic (not an exact ===
  // check) so a single skipped rAF frame — e.g. from main-thread work while
  // the YouTube player loads — can never silently drop a cue.
  const countdownCue = (secs: number, leadIntoWork: boolean) => {
    const thresholds = leadIntoWork ? [4, 3, 2, 1] : [3, 2, 1];
    for (const th of thresholds) {
      if (secs <= th && !firedCuesRef.current.has(th)) {
        firedCuesRef.current.add(th);
        fireCue(th);
      }
    }
  };

  const goToPhase = useCallback(
    (nextIndex: number, autoStart: boolean) => {
      const p = phases[nextIndex];
      setIndex(nextIndex);
      if (!p || p.type === 'done') {
        setStatus('finished');
        setSecondsLeft(0);
        clearLoop();
        announcePhaseStart(phases[nextIndex]);
        return;
      }
      remainingRef.current = p.seconds * 1000;
      setSecondsLeft(p.seconds);
      announcePhaseStart(p);
      if (autoStart) {
        endAtRef.current = performance.now() + remainingRef.current;
        setStatus('running');
      }
    },
    [phases, announcePhaseStart]
  );

  const tick = useCallback(() => {
    const now = performance.now();
    const remMs = Math.max(0, endAtRef.current - now);
    const secs = Math.ceil(remMs / 1000);
    const phase = phases[index];

    if (secs !== lastBeepSecRef.current) {
      // prep/rest lead INTO work -> "Ready, three, two, one"; work leads into
      // rest -> "three, two, one".
      if (phase?.type === 'prep' || phase?.type === 'rest') {
        countdownCue(secs, true);
      } else if (phase?.type === 'on') {
        countdownCue(secs, false);
      }
      lastBeepSecRef.current = secs;
      setSecondsLeft(secs);
    }

    if (remMs <= 0) {
      goToPhase(index + 1, true);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [index, phases, goToPhase]);

  // Keep the rAF loop alive only while running.
  useEffect(() => {
    if (status === 'running') {
      rafRef.current = requestAnimationFrame(tick);
      return clearLoop;
    }
    return undefined;
  }, [status, tick]);

  const start = useCallback(() => {
    const p = phases[index];
    if (!p) return;
    remainingRef.current = secondsLeft * 1000;
    endAtRef.current = performance.now() + remainingRef.current;
    announcePhaseStart(p);
    setStatus('running');
  }, [phases, index, secondsLeft, announcePhaseStart]);

  const pause = useCallback(() => {
    remainingRef.current = Math.max(0, endAtRef.current - performance.now());
    clearLoop();
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    endAtRef.current = performance.now() + remainingRef.current;
    setStatus('running');
  }, []);

  const toggle = useCallback(() => {
    if (status === 'idle') start();
    else if (status === 'running') pause();
    else if (status === 'paused') resume();
  }, [status, start, pause, resume]);

  const skip = useCallback(() => {
    if (index < phases.length - 1) goToPhase(index + 1, status === 'running');
  }, [index, phases.length, goToPhase, status]);

  const prev = useCallback(() => {
    if (index > 0) goToPhase(index - 1, status === 'running');
  }, [index, goToPhase, status]);

  const reset = useCallback(() => {
    clearLoop();
    setStatus('idle');
    setIndex(0);
    remainingRef.current = (phases[0]?.seconds ?? 0) * 1000;
    setSecondsLeft(phases[0]?.seconds ?? 0);
    lastBeepSecRef.current = -1;
    firedCuesRef.current = new Set();
  }, [phases]);

  useEffect(() => clearLoop, []);

  const state: TimerState = {
    status,
    index,
    phase: phases[index],
    secondsLeft,
  };

  return { state, start, pause, resume, toggle, skip, prev, reset };
};
