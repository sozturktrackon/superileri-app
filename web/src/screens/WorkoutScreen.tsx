import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getGroupByKey, intervals } from '../lib/content';
import { buildPhases, fmtClock, totalSeconds } from '../lib/timer';
import { useWorkoutTimer } from '../lib/useWorkoutTimer';
import { unlockAudio } from '../lib/sound';
import { releaseWakeLock, requestWakeLock } from '../lib/wakeLock';
import { logWorkout } from '../lib/api';
import ExerciseVideo from '../components/ExerciseVideo';
import YouTubeMusic from '../components/YouTubeMusic';

const phaseTitle: Record<string, string> = {
  prep: 'Get Ready',
  on: 'Work',
  rest: 'Rest',
  done: 'Complete',
};

const WorkoutScreen = () => {
  const { planId, day, groupKey } = useParams();
  const navigate = useNavigate();
  const group = groupKey ? getGroupByKey(groupKey) : undefined;

  const phases = useMemo(
    () => (group ? buildPhases(group, intervals) : []),
    [group]
  );
  const total = useMemo(() => totalSeconds(phases), [phases]);

  const { state, toggle, skip, prev, reset } = useWorkoutTimer(phases);
  const [logged, setLogged] = useState(false);
  const [counted, setCounted] = useState(true);
  const screenRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const activeSecRef = useRef(0); // real seconds actually spent running

  // Wake lock for the duration of the screen.
  useEffect(() => {
    requestWakeLock();
    return () => {
      releaseWakeLock();
    };
  }, []);

  // Accumulate genuine "running" time so skipping to the end doesn't count.
  useEffect(() => {
    if (state.status !== 'running') return;
    const id = window.setInterval(() => {
      activeSecRef.current += 1;
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.status]);

  // Log completion once — but only if the circuit was genuinely worked through
  // (at least 80% of its real duration). Closing the app early never reaches
  // 'finished', so nothing is logged in that case.
  useEffect(() => {
    if (state.status === 'finished' && !logged && group) {
      setLogged(true);
      const earned = total > 0 && activeSecRef.current >= total * 0.8;
      setCounted(earned);
      if (earned) {
        logWorkout({
          planId: planId ?? 'lean',
          dayNumber: Number(day) || 1,
          groupKeys: [group.key],
          durationSec: activeSecRef.current,
        }).catch(() => {});
      }
    }
  }, [state.status, logged, group, planId, day, total]);

  if (!group) {
    return (
      <div className="app-main">
        <h1 className="page-title">Workout not found</h1>
        <button className="btn primary block" onClick={() => navigate('/')}>
          Back to Today
        </button>
      </div>
    );
  }

  if (group.exercises.length === 0) {
    return (
      <div className="app-main">
        <h1 className="page-title">{group.name}</h1>
        <div className="banner">
          This circuit's exercises aren't available yet. {group._note ?? ''}
        </div>
        <button className="btn primary block" onClick={() => navigate('/')}>
          ← Back to Today
        </button>
      </div>
    );
  }

  const phase = state.phase;
  const type = phase?.type ?? 'prep';
  const elapsed = phases
    .slice(0, state.index)
    .reduce((s, p) => s + p.seconds, 0);
  const phaseElapsed = (phase?.seconds ?? 0) - state.secondsLeft;
  const progress = total ? ((elapsed + phaseElapsed) / total) * 100 : 0;

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await screenRef.current?.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      /* unsupported */
    }
  };

  const onPrimary = () => {
    if (!startedRef.current) {
      startedRef.current = true;
      unlockAudio();
    }
    toggle();
  };

  const exercise = phase?.exercise;
  const hasProgressions = (exercise?.progressions?.length ?? 0) > 0;

  return (
    <div className={`timer-screen ${type}`} ref={screenRef}>
      <div className="timer-top">
        <button
          className="timer-close"
          onClick={() => navigate('/')}
          aria-label="Close"
        >
          ✕
        </button>
        <div style={{ textAlign: 'center' }}>
          <div className="timer-phase-label">{phaseTitle[type]}</div>
          {phase?.round && type !== 'done' && (
            <div className="timer-round">
              Round {phase.round}/{phase.totalRounds} · {group.name}
            </div>
          )}
        </div>
        <button
          className="timer-close"
          onClick={toggleFullscreen}
          aria-label="Fullscreen / TV mode"
        >
          ⛶
        </button>
      </div>

      <YouTubeMusic active={state.status === 'running'} groupKey={group.key} />

      <div className="timer-mid">
        {type === 'done' ? (
          <>
            <div style={{ fontSize: 80 }}>{counted ? '🎉' : '👏'}</div>
            <h2 style={{ fontSize: 34 }}>
              {counted ? 'Circuit complete!' : 'Nice effort!'}
            </h2>
            <p className="timer-next">
              {counted
                ? `${group.name} · ${intervals.rounds} rounds · ${fmtClock(total)}`
                : 'Skipped ahead — finish the full circuit to check this day off.'}
            </p>
            <div
              style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap', justifyContent: 'center' }}
            >
              <button
                className="btn ghost"
                onClick={() => {
                  reset();
                  setLogged(false);
                  setCounted(true);
                  startedRef.current = false;
                  activeSecRef.current = 0;
                }}
              >
                ↻ Repeat
              </button>
              <button className="btn primary" onClick={() => navigate('/')}>
                Done →
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              className={`timer-count ${
                type === 'on' && state.secondsLeft <= 3 ? 'pulse' : ''
              }`}
            >
              {state.secondsLeft}
            </div>
            {type === 'on' ? (
              <div className="timer-exercise">{exercise?.name}</div>
            ) : (
              <div className="timer-next">
                {type === 'prep' ? 'Starting with' : 'Next up'} ·{' '}
                <strong>{exercise?.name}</strong>
              </div>
            )}
            {hasProgressions && (
              <div className="timer-progressions">
                Level up: {exercise!.progressions.join(', ')}
              </div>
            )}
            <ExerciseVideo exerciseId={exercise?.id} exerciseName={exercise?.name} />
          </>
        )}
      </div>

      {type !== 'done' && (
        <>
          <div className="timer-bar">
            <div style={{ width: `${progress}%` }} />
          </div>
          <div className="timer-controls">
            <button className="tctrl" onClick={prev} aria-label="Previous">
              ⏮
            </button>
            <button className="tctrl big" onClick={onPrimary} aria-label="Play/Pause">
              {state.status === 'running' ? '⏸' : '▶'}
            </button>
            <button className="tctrl" onClick={skip} aria-label="Skip">
              ⏭
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default WorkoutScreen;
