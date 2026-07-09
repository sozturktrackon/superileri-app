import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getGroupByKey, intervals } from '../lib/content';
import { buildPhases, fmtClock, totalSeconds } from '../lib/timer';
import { useWorkoutTimer } from '../lib/useWorkoutTimer';
import { loadVoice, unlockAudio } from '../lib/sound';
import { releaseWakeLock, requestWakeLock } from '../lib/wakeLock';
import { listPartners, logForPartner, logWorkout, type Partner } from '../lib/api';
import {
  clearTvCode,
  endLiveSession,
  getSavedTvCode,
  publishLiveSession,
  saveTvCode,
} from '../lib/liveSession';
import { loadExVideos } from '../lib/exerciseVideos';
import ExerciseVideo from '../components/ExerciseVideo';
import YouTubeMusic, { type MusicState } from '../components/YouTubeMusic';
import QrScanner from '../components/QrScanner';
import { useT } from '../lib/i18n';

const phaseTitle: Record<string, string> = {
  prep: 'Get Ready',
  on: 'Work',
  rest: 'Rest',
  done: 'Complete',
};

// Saved mid-circuit position, so a refresh (or crash recovery) resumes the
// workout instead of restarting it. Session-scoped: gone when the tab closes.
const PROGRESS_KEY = 'superileri.workoutProgress';

type SavedProgress = {
  planId?: string;
  day: number;
  groupKey?: string;
  index: number;
  secondsLeft: number;
  activeSec: number;
  savedAt: number;
};

const loadProgress = (
  planId?: string,
  day?: string,
  groupKey?: string
): SavedProgress | null => {
  try {
    const s = JSON.parse(
      sessionStorage.getItem(PROGRESS_KEY) || 'null'
    ) as SavedProgress | null;
    if (
      s &&
      s.planId === planId &&
      s.day === (Number(day) || 1) &&
      s.groupKey === groupKey &&
      Date.now() - s.savedAt < 3 * 3600e3
    ) {
      return s;
    }
  } catch {
    /* corrupted -> ignore */
  }
  return null;
};

const WorkoutScreen = () => {
  const { t } = useT();
  const { planId, day, groupKey } = useParams();
  const navigate = useNavigate();
  const group = groupKey ? getGroupByKey(groupKey) : undefined;

  const phases = useMemo(
    () => (group ? buildPhases(group, intervals) : []),
    [group]
  );
  const total = useMemo(() => totalSeconds(phases), [phases]);

  const savedProgress = useMemo(
    () => loadProgress(planId, day, groupKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const { state, toggle, skip, prev, reset } = useWorkoutTimer(
    phases,
    savedProgress ?? undefined
  );
  const [logged, setLogged] = useState(false);
  const [counted, setCounted] = useState(true);
  const screenRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  // Real seconds actually spent running (restored across a refresh so a
  // resumed circuit still counts toward completion).
  const activeSecRef = useRef(savedProgress?.activeSec ?? 0);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnerState, setPartnerState] = useState<
    Record<string, { state: 'idle' | 'logging' | 'done' | 'error'; msg?: string }>
  >({});
  const [broadcasting, setBroadcasting] = useState(false);
  const [tvPanel, setTvPanel] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [tvCode, setTvCode] = useState<string>(() => getSavedTvCode() ?? '');
  const [codeDraft, setCodeDraft] = useState('');
  const musicRef = useRef<MusicState>({ playing: false, ytId: null, kind: null, label: null });

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

  // Persist the mid-circuit position each second; a refresh or crash-reload
  // then resumes here (paused) instead of restarting the workout.
  useEffect(() => {
    if (state.status === 'finished') {
      sessionStorage.removeItem(PROGRESS_KEY);
      return;
    }
    if (state.status === 'idle' && !startedRef.current && !savedProgress) return;
    const p: SavedProgress = {
      planId,
      day: Number(day) || 1,
      groupKey,
      index: state.index,
      secondsLeft: state.secondsLeft,
      activeSec: activeSecRef.current,
      savedAt: Date.now(),
    };
    try {
      sessionStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
    } catch {
      /* storage full/blocked -> resume just won't work */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index, state.secondsLeft, state.status]);

  // While "Send to TV" is active, push the live state to the paired TV (it
  // polls this record) - phase, exercise, countdown, and what music is
  // playing (the TV mounts its own player for that; see YouTubeMusic).
  useEffect(() => {
    if (!broadcasting || !group || !tvCode) return;
    const m = musicRef.current;
    // Resolve the demo clip on the phone (defaults + the user's own overrides
    // live in this device's localStorage) so the TV just plays what we send.
    const exId = state.phase?.exercise?.id;
    const vid = exId ? loadExVideos()[exId] : undefined;
    publishLiveSession(tvCode, {
      phaseType: state.phase?.type,
      exerciseName: state.phase?.exercise?.name,
      exerciseId: state.phase?.exercise?.id,
      videoYtId: vid?.ytId ?? null,
      videoStart: vid?.start ?? null,
      groupName: group.name,
      secondsLeft: state.secondsLeft,
      phaseEndsAt: state.endsAt,
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

  // Connect to a TV by its code (from the QR scan or typed in). Remembers it so
  // future workouts cast with one tap.
  const connectToTv = (code: string) => {
    if (!/^\d{6}$/.test(code)) return;
    saveTvCode(code);
    setTvCode(code);
    setScanning(false);
    setCodeDraft('');
    setBroadcasting(true);
    setTvPanel(true);
  };

  const openTvPanel = () => {
    if (broadcasting) setTvPanel((p) => !p);
    else if (tvCode) {
      setBroadcasting(true);
      setTvPanel(true);
    } else setTvPanel(true); // no TV yet -> panel offers scan / enter code
  };

  const stopBroadcast = () => {
    setBroadcasting(false);
    if (tvCode) endLiveSession(tvCode).catch(() => {});
  };

  const forgetTv = () => {
    stopBroadcast();
    clearTvCode();
    setTvCode('');
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
    startedRef.current = true;
    // Re-unlock on EVERY tap, not just the first: iOS kills the audio session
    // on screen lock / Siri / calls, and a fresh user gesture is the reliable
    // way to bring it back. Idempotent and free when already running.
    unlockAudio();
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
          <div className="timer-phase-label">{t(phaseTitle[type])}</div>
          {phase?.round && type !== 'done' && (
            <div className="timer-round">
              {t('Round {r}/{n}', { r: phase.round, n: phase.totalRounds ?? 0 })} · {group.name}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="timer-close"
            onClick={openTvPanel}
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

      {scanning && (
        <QrScanner onDetected={connectToTv} onClose={() => setScanning(false)} />
      )}

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
            <strong>📺 {broadcasting ? t('Sending to TV') : t('Send to TV')}</strong>
            <button
              className="btn ghost"
              style={{ padding: '4px 8px' }}
              onClick={() => setTvPanel(false)}
            >
              ✕
            </button>
          </div>

          {broadcasting && tvCode ? (
            <>
              <p className="muted" style={{ fontSize: 13, margin: '8px 0' }}>
                {t('Connected to TV')} <strong>{tvCode}</strong>.{' '}
                {t('Your workout is live on the big screen.')}
              </p>
              <div className="btn-grid">
                <button className="btn ghost" onClick={forgetTv}>
                  {t('Change TV')}
                </button>
                <button className="btn primary" onClick={stopBroadcast}>
                  {t('Stop casting')}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="muted" style={{ fontSize: 13, margin: '8px 0' }}>
                {t('On your TV open')} <strong>app.superileri.com/tv</strong>{t(', then scan the QR it shows:')}
              </p>
              <button
                className="btn primary"
                style={{ width: '100%' }}
                onClick={() => setScanning(true)}
              >
                {t('📷 Scan TV code')}
              </button>
              <p className="muted" style={{ fontSize: 12, margin: '12px 0 6px' }}>
                {t('Or enter the 6-digit code from the TV:')}
              </p>
              <div className="btn-grid">
                <input
                  value={codeDraft}
                  onChange={(e) =>
                    setCodeDraft(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  inputMode="numeric"
                  placeholder="123456"
                  style={{
                    fontSize: 20,
                    letterSpacing: '0.15em',
                    textAlign: 'center',
                    padding: '10px',
                    borderRadius: 10,
                    border: '1px solid var(--line)',
                    background: 'var(--bg-elev-2)',
                    color: 'var(--text)',
                  }}
                />
                <button
                  className="btn primary"
                  disabled={!/^\d{6}$/.test(codeDraft)}
                  onClick={() => connectToTv(codeDraft)}
                >
                  {t('Connect')}
                </button>
              </div>
            </>
          )}
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
              {counted ? t('Circuit complete!') : t('Nice effort!')}
            </h2>
            <p className="timer-next">
              {counted
                ? `${group.name} · ${t('{n} rounds', { n: intervals.rounds })} · ${fmtClock(total)}`
                : t('Skipped ahead. Finish the full circuit to check this day off.')}
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
                ↻ {t('Repeat')}
              </button>
              <button className="btn primary" onClick={() => navigate('/')}>
                {t('Done')} →
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
                  {t('🤝 Also mark complete for:')}
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
                {type === 'prep' ? t('Starting with') : t('Next up')} ·{' '}
                <strong>{exercise?.name}</strong>
              </div>
            )}
            {hasProgressions && (
              <div className="timer-progressions">
                {t('Level up:')} {exercise!.progressions.join(', ')}
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
