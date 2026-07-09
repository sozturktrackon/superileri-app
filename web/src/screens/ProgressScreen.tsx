import { useEffect, useState } from 'react';
import {
  ANGLES,
  checkInPhotos,
  checkInThumbnail,
  deleteCheckIn,
  listCheckIns,
  listWorkouts,
  mergeCheckIns,
  photoUrl,
  type Angle,
  type CheckIn,
} from '../lib/api';
import { useProfile } from '../state';
import { getPlan, normalizeDay } from '../lib/content';
import MusicSettings from '../components/MusicSettings';
import ExerciseVideoSettings from '../components/ExerciseVideoSettings';
import PartnerSettings from '../components/PartnerSettings';
import { clearCrashLog, getCrashLog } from '../lib/crashLog';
import { completedDaySet, computeStreaks } from '../lib/streak';

type Shot = CheckIn & { url?: string; angleCount?: number };

/** Recorded app errors (see lib/crashLog). Copy button puts them on the
 *  clipboard so they can be pasted into a bug report. */
const CrashReports = () => {
  const [entries, setEntries] = useState(getCrashLog);
  const [copied, setCopied] = useState(false);
  if (entries.length === 0) return null;
  return (
    <details className="card">
      <summary style={{ cursor: 'pointer', fontWeight: 800 }}>
        🪲 Crash reports ({entries.length})
      </summary>
      <div className="stack" style={{ marginTop: 10 }}>
        {entries.map((e, i) => (
          <div key={i} style={{ fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-word' }}>
            <div className="muted">{e.at} · {e.type}</div>
            <div>{e.message}</div>
          </div>
        ))}
      </div>
      <div className="btn-grid" style={{ marginTop: 10 }}>
        <button
          className="btn ghost"
          onClick={() => {
            navigator.clipboard
              ?.writeText(JSON.stringify(getCrashLog(), null, 2))
              .then(() => setCopied(true))
              .catch(() => {});
          }}
        >
          {copied ? 'Copied ✓' : 'Copy details'}
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            clearCrashLog();
            setEntries([]);
          }}
        >
          Clear
        </button>
      </div>
    </details>
  );
};

const ProgressScreen = ({ signOut }: { signOut?: () => void }) => {
  const { profile, displayName } = useProfile();
  const [shots, setShots] = useState<Shot[]>([]);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [streaks, setStreaks] = useState({ current: 0, best: 0 });
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Merge mode: combine old single-photo check-ins into one angle-tagged one.
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [angleFor, setAngleFor] = useState<Record<string, Angle>>({});
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);

  const loadShots = async () => {
    const [cis, logs] = await Promise.all([listCheckIns(), listWorkouts()]);
    setWorkoutCount(logs.filter((l) => l.completed).length);
    if (profile) {
      setStreaks(
        computeStreaks(
          profile.plan ?? 'lean',
          profile.currentDay ?? 1,
          completedDaySet(profile.plan ?? 'lean', logs)
        )
      );
    }
    const withUrls = await Promise.all(
      cis.map(async (c) => {
        const thumb = checkInThumbnail(c);
        return {
          ...c,
          url: thumb ? await photoUrl(thumb).catch(() => undefined) : undefined,
          angleCount: checkInPhotos(c).length,
        };
      })
    );
    setShots(withUrls);
    setLoading(false);
  };

  useEffect(() => {
    loadShots();
  }, []);

  const removeShot = async (shot: Shot) => {
    if (!window.confirm(`Delete the check-in from ${shot.date}? This can't be undone.`)) return;
    setDeletingId(shot.id);
    try {
      await deleteCheckIn(shot);
      setShots((prev) => prev.filter((s) => s.id !== shot.id));
    } catch (e) {
      window.alert('Could not delete: ' + (e instanceof Error ? e.message : 'unknown error'));
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const startAssigning = () => {
    if (selectedIds.length < 2) return;
    // Default each selection to the next unused angle, in front/back/left/right order.
    const used = new Set<Angle>();
    const next: Record<string, Angle> = {};
    for (const id of selectedIds) {
      const free = ANGLES.find((a) => !used.has(a.id))?.id ?? 'front';
      used.add(free);
      next[id] = free;
    }
    setAngleFor(next);
    setAssigning(true);
    setMergeError(null);
  };

  const confirmMerge = async () => {
    setMerging(true);
    setMergeError(null);
    try {
      const selections = selectedIds.map((id) => ({
        checkIn: shots.find((s) => s.id === id)!,
        angle: angleFor[id],
      }));
      await mergeCheckIns(selections);
      setAssigning(false);
      setMergeMode(false);
      setSelectedIds([]);
      await loadShots();
    } catch (e) {
      setMergeError(e instanceof Error ? e.message : 'Merge failed.');
    } finally {
      setMerging(false);
    }
  };

  const plan = getPlan(profile?.plan ?? 'lean');
  const day = normalizeDay(profile?.currentDay ?? 1);
  const latestBf = shots.find((s) => typeof s.aiBodyFatPct === 'number')?.aiBodyFatPct;
  const firstBf = [...shots]
    .reverse()
    .find((s) => typeof s.aiBodyFatPct === 'number')?.aiBodyFatPct;
  const bfDelta =
    typeof latestBf === 'number' && typeof firstBf === 'number'
      ? latestBf - firstBf
      : null;

  return (
    <div>
      <h1 className="page-title">Progress</h1>
      <p className="page-sub">Keep showing up, {displayName}.</p>

      <div className="btn-grid" style={{ marginBottom: 14 }}>
        <div className="card" style={{ margin: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 900 }}>{workoutCount}</div>
          <div className="muted" style={{ fontSize: 12 }}>circuits done</div>
        </div>
        <div className="card" style={{ margin: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 900 }}>{day}</div>
          <div className="muted" style={{ fontSize: 12 }}>
            {plan?.name} · day
          </div>
        </div>
        <div className="card" style={{ margin: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 900 }}>🔥 {streaks.current}</div>
          <div className="muted" style={{ fontSize: 12 }}>day streak</div>
        </div>
        <div className="card" style={{ margin: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 900 }}>🏆 {streaks.best}</div>
          <div className="muted" style={{ fontSize: 12 }}>best streak</div>
        </div>
      </div>

      {typeof latestBf === 'number' && (
        <div className="card">
          <div className="card-row">
            <span className="muted">Latest est. body fat</span>
            <span className="pill accent" style={{ fontSize: 16 }}>
              {latestBf.toFixed(1)}%
            </span>
          </div>
          {bfDelta !== null && Math.abs(bfDelta) >= 0.1 && (
            <div className="card-row" style={{ marginTop: 8 }}>
              <span className="muted">Since first check-in</span>
              <span className={`pill ${bfDelta <= 0 ? 'rest' : ''}`}>
                {bfDelta <= 0 ? '▼' : '▲'} {Math.abs(bfDelta).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}

      {shots[0]?.aiComparison && (
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
            📈 AI progress (latest vs first)
          </div>
          <p style={{ lineHeight: 1.5, margin: 0 }}>{shots[0].aiComparison}</p>
        </div>
      )}

      <div className="card-row" style={{ margin: '18px 0 10px' }}>
        <h3 style={{ margin: 0 }}>📸 Photo timeline</h3>
        {shots.length >= 2 && !assigning && (
          <button
            className="btn ghost"
            style={{ padding: '6px 10px', fontSize: 12 }}
            onClick={() => {
              setMergeMode((m) => !m);
              setSelectedIds([]);
            }}
          >
            {mergeMode ? 'Cancel' : '🔗 Merge'}
          </button>
        )}
      </div>

      {mergeMode && !assigning && (
        <p className="muted" style={{ fontSize: 12, marginTop: -4, marginBottom: 10 }}>
          Select 2 or more single-photo check-ins from the same session (e.g.
          front + back + sides taken the same day) to combine into one.
        </p>
      )}

      {loading ? (
        <div className="center-screen" style={{ minHeight: 120 }}>
          <div className="spinner" />
        </div>
      ) : shots.length === 0 ? (
        <div className="card muted">
          No check-ins yet. Add one from the Check-in tab to start your timeline.
        </div>
      ) : (
        <div className="gallery">
          {shots.map((s) => (
            <div
              key={s.id}
              style={{ position: 'relative' }}
              onClick={() => mergeMode && toggleSelect(s.id)}
            >
              {s.url ? <img src={s.url} alt={s.date} /> : <div className="gallery" />}
              <span
                className="pill"
                style={{ position: 'absolute', bottom: 6, left: 6, fontSize: 10 }}
              >
                {s.date}
                {typeof s.aiBodyFatPct === 'number'
                  ? ` · ${s.aiBodyFatPct.toFixed(0)}%`
                  : ''}
                {(s.angleCount ?? 1) > 1 ? ` · ${s.angleCount} angles` : ''}
              </span>
              {mergeMode ? (
                <div
                  className={`merge-check ${selectedIds.includes(s.id) ? 'on' : ''}`}
                >
                  {selectedIds.includes(s.id) ? '✓' : ''}
                </div>
              ) : (
                <button
                  className="photo-del"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeShot(s);
                  }}
                  disabled={deletingId === s.id}
                  aria-label={`Delete check-in from ${s.date}`}
                >
                  {deletingId === s.id ? '…' : '🗑'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {mergeMode && !assigning && selectedIds.length >= 2 && (
        <button className="btn primary block" style={{ marginTop: 12 }} onClick={startAssigning}>
          Merge {selectedIds.length} check-ins →
        </button>
      )}

      {assigning && (
        <div className="card" style={{ marginTop: 14 }}>
          <h3 style={{ marginBottom: 8 }}>Assign an angle to each photo</h3>
          <div className="stack">
            {selectedIds.map((id) => {
              const shot = shots.find((s) => s.id === id)!;
              return (
                <div className="card-row" key={id} style={{ margin: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {shot.url && (
                      <img
                        src={shot.url}
                        alt={shot.date}
                        style={{
                          width: 40,
                          height: 50,
                          objectFit: 'cover',
                          borderRadius: 8,
                        }}
                      />
                    )}
                    <span className="muted" style={{ fontSize: 12 }}>{shot.date}</span>
                  </div>
                  <select
                    value={angleFor[id]}
                    onChange={(e) =>
                      setAngleFor((prev) => ({ ...prev, [id]: e.target.value as Angle }))
                    }
                    style={{ maxWidth: 130 }}
                  >
                    {ANGLES.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
          {mergeError && <p className="error-text">{mergeError}</p>}
          <div className="btn-grid" style={{ marginTop: 14 }}>
            <button className="btn ghost" onClick={() => setAssigning(false)} disabled={merging}>
              ← Back
            </button>
            <button className="btn primary" onClick={confirmMerge} disabled={merging}>
              {merging ? 'Merging…' : 'Confirm merge'}
            </button>
          </div>
        </div>
      )}

      <h3 style={{ margin: '22px 0 10px' }}>Settings</h3>
      <PartnerSettings />
      <ExerciseVideoSettings />
      <MusicSettings />

      <div className="card">
        <div className="card-row">
          <div>
            <strong>Account</strong>
            <div className="muted" style={{ fontSize: 12 }}>{displayName}</div>
          </div>
          <button className="btn ghost" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>

      <CrashReports />

      <p className="muted" style={{ fontSize: 11, textAlign: 'center', marginTop: 8 }}>
        Superileri Fit · your data is private to your account. · v{__APP_VERSION__}
      </p>
    </div>
  );
};

export default ProgressScreen;
