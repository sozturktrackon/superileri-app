import { useEffect, useState } from 'react';
import {
  deleteCheckIn,
  listCheckIns,
  listWorkouts,
  photoUrl,
  type CheckIn,
} from '../lib/api';
import { useProfile } from '../state';
import { getPlan, normalizeDay } from '../lib/content';
import MusicSettings from '../components/MusicSettings';
import ExerciseVideoSettings from '../components/ExerciseVideoSettings';
import PartnerSettings from '../components/PartnerSettings';

type Shot = CheckIn & { url?: string };

const ProgressScreen = ({ signOut }: { signOut?: () => void }) => {
  const { profile, displayName } = useProfile();
  const [shots, setShots] = useState<Shot[]>([]);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  useEffect(() => {
    (async () => {
      const [cis, logs] = await Promise.all([listCheckIns(), listWorkouts()]);
      setWorkoutCount(logs.filter((l) => l.completed).length);
      const withUrls = await Promise.all(
        cis.map(async (c) => ({ ...c, url: await photoUrl(c.photoPath).catch(() => undefined) }))
      );
      setShots(withUrls);
      setLoading(false);
    })();
  }, []);

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

      <h3 style={{ margin: '18px 0 10px' }}>📸 Photo timeline</h3>
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
            <div key={s.id} style={{ position: 'relative' }}>
              {s.url ? <img src={s.url} alt={s.date} /> : <div className="gallery" />}
              <span
                className="pill"
                style={{ position: 'absolute', bottom: 6, left: 6, fontSize: 10 }}
              >
                {s.date}
                {typeof s.aiBodyFatPct === 'number'
                  ? ` · ${s.aiBodyFatPct.toFixed(0)}%`
                  : ''}
              </span>
              <button
                className="photo-del"
                onClick={() => removeShot(s)}
                disabled={deletingId === s.id}
                aria-label={`Delete check-in from ${s.date}`}
              >
                {deletingId === s.id ? '…' : '🗑'}
              </button>
            </div>
          ))}
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

      <p className="muted" style={{ fontSize: 11, textAlign: 'center', marginTop: 8 }}>
        Superileri Fit · your data is private to your account.
      </p>
    </div>
  );
};

export default ProgressScreen;
