import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getGroupByKey, intervals } from '../lib/content';
import { buildPhases, fmtClock, totalSeconds } from '../lib/timer';
import { useWorkoutTimer } from '../lib/useWorkoutTimer';
import { loadVoice, unlockAudio } from '../lib/sound';
import { releaseWakeLock, requestWakeLock } from '../lib/wakeLock';
import { listPartners, logForPartner, logWorkout, type Partner } from '../lib/api';
import {
  endLiveSession,
  getOrCreateCode,
  publishLiveSession,
  tvUrl,
} from '../lib/liveSession';
import ExerciseVideo from '../components/ExerciseVideo';
import YouTubeMusic, { type MusicState } from '../components/YouTubeMusic';

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
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnerState, setPartnerState] = useState<
    Record<string, { state: 'idle' | 'logging' | 'done' | 'error'; msg?: string }>
  >({});
  const [broadcasting, setBroadcasting] = useState(false);
  const [tvPanel, setTvPanel] = useState(false);
  const musicRef = useRef<MusicState>({ playing: false, ytId: null, kind: null, label: null });
  const tvCode = getOrCreateCode();

  // Wake lock for the duration of the screen.
  useEffect(() => {
    requestWakeLock();
    return () => {
      releaseWakeLock();
    };
  }, []);

  // Preload the spoken countdown clips so they play with zero latency.
  useEffect(() => {
    loadVoice();
  }, []);

  // Load training partners (for the "mark for partner" option on completion).
  useEffect(() => {
    listPartners().then(setPartners).catch(() => {});
  }, []);

  const markForPartner = async (p: Partner) => {
    setPartnerState((s) => ({ ...s, [p.id]: { state: 'logging' } }));
    try {
      const res = await logForPartner({
        partnerEmail: p.email,
        planId: planId ?? 'lean',
        dayNumber: Number(day) || 1,
        groupKeys: group ? [group.key] : [],
        durationSec: activeSecRef.current,
      });
      setPartnerState((s) => ({
        ...s,
        [p.id]: { state: res.ok ? 'done' : 'error', msg: res.message },
      }));
    } catch (e) {
      setPartnerState((s) => ({
        ...s,
        [p.id]: { state: 'error', msg: e instanceof Error ? e.message : 'Failed' },
      }));
    }
  };

  // Accumulate genuine "running" time so skipping to the end doesn't count.
  useEffect(() => {
    if (state.status !== 'running') return;
    const id = window.setInterval(() => {
      activeSecRef.current += 1;
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.status]);

  // While "Send to TV" is active, push the live state to the paired TV (it
  // polls this record) — phase, exercise, countdown, and what music is
  // playing (the TV mounts its own player for that; see YouTubeMusic).
  useEffect(() => {
    if (!broadcasting || !group) return;
    const m = musicRef.current;
    publishLiveSession(tvCode, {
      phaseType: state.phase?.type,
      exerciseName: state.phase?.exercise?.name,
      exerciseId: state.phase?.exercise?.id,
      groupName: group.name,
      secondsLeft: state.secondsLeft,
      totalSeconds: state.phase?.seconds,
      round: state.phase?.round,
      totalRounds: state.phase?.totalRounds,
      status: state.status,
      musicYtId: m.ytId,
      musicKind: m.kind,
      musicLabel: m.label,
      musicPlaying: m.playing,
    }).catch(() => {});
  }, [
    broadcasting,
    tvCode,
    group,
    state.phase,
    state.secondsLeft,
    state.status,
  ]);

  // Stop broadcasting when leaving the workout screen.
  useEffect(() => {
    return () => {
      if (broadcasting) endLiveSession(tvCode).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broadcasting]);

  const startBroadcast = () => {
    setBroadcasting(true);
    setTvPanel(true);
  };

  const stopBroadcast = () => {
    setBroadcasting(false);
    endLiveSession(tvCode).catch(() => {});
  };

  // Log completion once, but only if the circuit was genuinely worked through
  // (at least 80% of its real duration). Closing the app early never reaches
  // 'finished', so nothing is logged in that case.
  useEffect(() => {
    if (state.status === 'finished' && !logged && group) {
      setLogged(true);
      const earned = total > 0 && activeSecRef.current >= total * 0.5;
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
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="timer-close"
            onClick={() => (broadcasting ? setTvPanel((p) => !p) : startBroadcast())}
            aria-label="Send to TV"
            style={broadcasting ? { background: 'var(--accent)' } : undefined}
          >
            📺
          </button>
          <button
            className="timer-close"
            onClick={toggleFullscreen}
            aria-label="Fullscreen / TV mode"
          >
            ⛶
          </button>
        </div>
      </div>

      {tvPanel && (
        <div
          className="card"
          style={{
            position: 'absolute',
            top: 'calc(var(--safe-t) + 60px)',
            right: 12,
            left: 12,
            zIndex: 61,
            color: 'var(--text)',
          }}
        >
          <div className="card-row">
            <strong>📺 Sending to TV</strong>
            <button
              className="btn ghost"
              style={{ padding: '4px 8px' }}
              onClick={() => setTvPanel(false)}
            >
              ✕
            </button>
          </div>
          <p className="muted" style={{ fontSize: 13, margin: '8px 0' }}>
            On your TV's browser, open:
          </p>
          <div
            style={{
              background: 'var(--bg-elev-2)',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 14,
              wordBreak: 'break-all',
              marginBottom: 10,
            }}
          >
            {tvUrl(tvCode)}
          </div>
          <div className="btn-grid">
            <button
              className="btn ghost"
              onClick={() => navigator.clipboard?.writeText(tvUrl(tvCode)).catch(() => {})}
            >
              Copy link
            </button>
            <button className="btn primary" onClick={stopBroadcast}>
              Stop casting
            </button>
          </div>
          <p className="muted" style={{ fontSize: 11, marginTop: 8, marginBottom: 0 }}>
            Same code every time — pair once, reuse it for future workouts.
          </p>
        </div>
      )}

      <YouTubeMusic
        active={state.status === 'running'}
        groupKey={group.key}
        day={Number(day) || 1}
        broadcast={broadcasting}
        onStateChange={(s) => {
          musicRef.current = s;
        }}
      />

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
                : 'Skipped ahead. Finish the full circuit to check this day off.'}
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

            {counted && partners.length > 0 && (
              <div
                style={{
                  marginTop: 26,
                  width: 'min(90vw, 380px)',
                  background: 'rgba(0,0,0,0.22)',
                  borderRadius: 16,
                  padding: 14,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
                  🤝 Also mark complete for:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {partners.map((p) => {
                    const st = partnerState[p.id]?.state ?? 'idle';
                    return (
                      <div key={p.id}>
                        <button
                          className="btn ghost block"
                          disabled={st === 'logging' || st === 'done'}
                          onClick={() => markForPartner(p)}
                          style={{
                            justifyContent: 'space-between',
                            borderColor:
                              st === 'done'
                                ? 'var(--rest)'
                                : st === 'error'
                                ? 'var(--accent-2)'
                                : undefined,
                          }}
                        >
                          <span>{p.name || p.email}</span>
                          <span>
                            {st === 'logging'
                              ? '…'
                              : st === 'done'
                              ? '✓'
                              : st === 'error'
                              ? '!'
                              : '＋'}
                          </span>
                        </button>
                        {st === 'error' && (
                          <div
                            style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}
                          >
                            {partnerState[p.id]?.msg}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
