import { useEffect, useState } from 'react';
import {
  ANGLES,
  analyzeCheckIn,
  checkInPhotos,
  deleteMyAccount,
  exportMyData,
  checkInThumbnail,
  deleteCheckIn,
  listCheckIns,
  listWorkouts,
  mergeCheckIns,
  photoUrl,
  updateProfile,
  type Angle,
  type CheckIn,
} from '../lib/api';
import { Link } from 'react-router-dom';
import { useProfile } from '../state';
import { allPlans, getPlan, normalizeDay, type PlanId } from '../lib/content';
import PhotoLightbox from '../components/PhotoLightbox';
import MusicSettings from '../components/MusicSettings';
import ExerciseVideoSettings from '../components/ExerciseVideoSettings';
import PartnerSettings from '../components/PartnerSettings';
import { clearCrashLog, getCrashLog } from '../lib/crashLog';
import { resetTour } from '../lib/tourState';
import { completedDaySet, computeStreaks } from '../lib/streak';
import { LANGS, useT, type Lang } from '../lib/i18n';

type Shot = CheckIn & { url?: string; angleCount?: number };

/** Recorded app errors (see lib/crashLog). Copy button puts them on the
 *  clipboard so they can be pasted into a bug report. */
const CrashReports = () => {
  const { t } = useT();
  const [entries, setEntries] = useState(getCrashLog);
  const [copied, setCopied] = useState(false);
  if (entries.length === 0) return null;
  return (
    <details className="card">
      <summary style={{ cursor: 'pointer', fontWeight: 800 }}>
        {t('🪲 Crash reports ({count})', { count: entries.length })}
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
          {copied ? t('Copied ✓') : t('Copy details')}
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            clearCrashLog();
            setEntries([]);
          }}
        >
          {t('Clear')}
        </button>
      </div>
    </details>
  );
};

const ProgressScreen = ({ signOut }: { signOut?: () => void }) => {
  const { t, lang, setLang } = useT();
  const { profile, displayName, refresh } = useProfile();
  const [switching, setSwitching] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [shots, setShots] = useState<Shot[]>([]);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [streaks, setStreaks] = useState({ current: 0, best: 0 });
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fullscreen viewer: one shot = browse angles, two shots = side-by-side.
  const [viewShots, setViewShots] = useState<Shot[] | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  // Merge mode: combine old single-photo check-ins into one angle-tagged one.
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [angleFor, setAngleFor] = useState<Record<string, Angle>>({});
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);

  const latestAnalyzed = shots.find(
    (s) => s.analyzed && (s.aiSummary || s.aiComparison)
  );

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
    if (!window.confirm(t("Delete the check-in from {date}? This can't be undone.", { date: shot.date }))) return;
    setDeletingId(shot.id);
    try {
      await deleteCheckIn(shot);
      setShots((prev) => prev.filter((s) => s.id !== shot.id));
    } catch (e) {
      window.alert(t('Could not delete: {error}', { error: e instanceof Error ? e.message : t('unknown error') }));
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
      setMergeError(e instanceof Error ? e.message : t('Merge failed.'));
    } finally {
      setMerging(false);
    }
  };

  const plan = getPlan(profile?.plan ?? 'lean');
  const day = normalizeDay(profile?.currentDay ?? 1, profile?.plan ?? 'lean');
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
      <h1 className="page-title">{t('Progress')}</h1>
      <p className="page-sub">{t('Keep showing up, {name}.', { name: displayName })}</p>

      <div className="btn-grid" style={{ marginBottom: 14 }}>
        <div className="card" style={{ margin: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 900 }}>{workoutCount}</div>
          <div className="muted" style={{ fontSize: 12 }}>{t('circuits done')}</div>
        </div>
        <div className="card" style={{ margin: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 900 }}>{day}</div>
          <div className="muted" style={{ fontSize: 12 }}>
            {plan?.name} · {t('day')}
          </div>
        </div>
        <div className="card" style={{ margin: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 900 }}>🔥 {streaks.current}</div>
          <div className="muted" style={{ fontSize: 12 }}>{t('day streak')}</div>
        </div>
        <div className="card" style={{ margin: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 900 }}>🏆 {streaks.best}</div>
          <div className="muted" style={{ fontSize: 12 }}>{t('best streak')}</div>
        </div>
      </div>

      {typeof latestBf === 'number' && (
        <div className="card">
          <div className="card-row">
            <span className="muted">{t('Latest est. body fat')}</span>
            <span className="pill accent" style={{ fontSize: 16 }}>
              {latestBf.toFixed(1)}%
            </span>
          </div>
          {bfDelta !== null && Math.abs(bfDelta) >= 0.1 && (
            <div className="card-row" style={{ marginTop: 8 }}>
              <span className="muted">{t('Since first check-in')}</span>
              <span className={`pill ${bfDelta <= 0 ? 'rest' : ''}`}>
                {bfDelta <= 0 ? '▼' : '▲'} {Math.abs(bfDelta).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}

      {latestAnalyzed && (
        <div className="card">
          <div className="card-row" style={{ marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{t('🧠 Latest AI analysis')}</div>
            <span className="muted" style={{ fontSize: 12 }}>{latestAnalyzed.date}</span>
          </div>
          {latestAnalyzed.aiSummary && (
            <p style={{ lineHeight: 1.5, margin: '4px 0 0' }}>{latestAnalyzed.aiSummary}</p>
          )}
          {latestAnalyzed.aiComparison && (
            <>
              <div style={{ fontWeight: 700, fontSize: 13, margin: '10px 0 2px' }}>
                {t('📈 Progress vs first check-in')}
              </div>
              <p style={{ lineHeight: 1.5, margin: 0 }}>{latestAnalyzed.aiComparison}</p>
            </>
          )}
        </div>
      )}

      {shots[0] && !shots[0].analyzed && (
        <div className="card">
          <div className="card-row">
            <span className="muted" style={{ fontSize: 13 }}>
              {t("Your newest check-in ({date}) hasn't been analyzed yet.", { date: shots[0].date })}
            </span>
            <button
              className="btn primary"
              style={{ padding: '8px 12px', fontSize: 13 }}
              disabled={analyzing}
              onClick={async () => {
                setAnalyzing(true);
                try {
                  await analyzeCheckIn(shots[0]);
                  await loadShots();
                } catch (e) {
                  window.alert(e instanceof Error ? e.message : t('Analysis failed'));
                } finally {
                  setAnalyzing(false);
                }
              }}
            >
              {analyzing ? t('Analyzing…') : t('🧠 Analyze')}
            </button>
          </div>
        </div>
      )}

      <div className="card-row" style={{ margin: '18px 0 10px' }}>
        <h3 style={{ margin: 0 }}>{t('📸 Photo timeline')}</h3>
        <Link
          to="/checkin"
          className="btn primary"
          style={{ padding: '6px 12px', fontSize: 12, textDecoration: 'none' }}
        >
          {t('+ New check-in')}
        </Link>
        {shots.length >= 2 && !assigning && !mergeMode && (
          <button
            className="btn ghost"
            style={{ padding: '6px 10px', fontSize: 12 }}
            onClick={() => {
              setCompareMode((c) => !c);
              setSelectedIds([]);
            }}
          >
            {compareMode ? t('Cancel') : t('🆚 Compare')}
          </button>
        )}
        {shots.length >= 2 && !assigning && !compareMode && (
          <button
            className="btn ghost"
            style={{ padding: '6px 10px', fontSize: 12 }}
            onClick={() => {
              setMergeMode((m) => !m);
              setSelectedIds([]);
            }}
          >
            {mergeMode ? t('Cancel') : t('🔗 Merge')}
          </button>
        )}
      </div>

      {compareMode && (
        <p className="muted" style={{ fontSize: 12, marginTop: -4, marginBottom: 10 }}>
          {t('Select two check-ins to compare them side by side.')}
        </p>
      )}

      {mergeMode && !assigning && (
        <p className="muted" style={{ fontSize: 12, marginTop: -4, marginBottom: 10 }}>
          {t('Select 2 or more single-photo check-ins from the same session (e.g. front + back + sides taken the same day) to combine into one.')}
        </p>
      )}

      {loading ? (
        <div className="center-screen" style={{ minHeight: 120 }}>
          <div className="spinner" />
        </div>
      ) : shots.length === 0 ? (
        <div className="card muted">
          {t('No check-ins yet. Tap "+ New check-in" above to start your timeline.')}
        </div>
      ) : (
        <div className="gallery">
          {shots.map((s) => (
            <div
              key={s.id}
              style={{ position: 'relative' }}
              onClick={() => {
                if (mergeMode) toggleSelect(s.id);
                else if (compareMode) {
                  if (selectedIds.includes(s.id) || selectedIds.length < 2) toggleSelect(s.id);
                } else setViewShots([s]);
              }}
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
                {(s.angleCount ?? 1) > 1 ? ` · ${t('{count} angles', { count: s.angleCount ?? 0 })}` : ''}
              </span>
              {mergeMode || compareMode ? (
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
                  aria-label={t('Delete check-in from {date}', { date: s.date })}
                >
                  {deletingId === s.id ? '…' : '🗑'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {compareMode && selectedIds.length === 2 && (
        <button
          className="btn primary block"
          style={{ marginTop: 12 }}
          onClick={() => {
            setViewShots(shots.filter((s) => selectedIds.includes(s.id)));
            setCompareMode(false);
            setSelectedIds([]);
          }}
        >
          {t('Compare side by side →')}
        </button>
      )}

      {mergeMode && !assigning && selectedIds.length >= 2 && (
        <button className="btn primary block" style={{ marginTop: 12 }} onClick={startAssigning}>
          {t('Merge {count} check-ins →', { count: selectedIds.length })}
        </button>
      )}

      {assigning && (
        <div className="card" style={{ marginTop: 14 }}>
          <h3 style={{ marginBottom: 8 }}>{t('Assign an angle to each photo')}</h3>
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
                        {t(a.label)}
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
              {t('← Back')}
            </button>
            <button className="btn primary" onClick={confirmMerge} disabled={merging}>
              {merging ? t('Merging…') : t('Confirm merge')}
            </button>
          </div>
        </div>
      )}

      <h3 style={{ margin: '22px 0 10px' }}>{t('Settings')}</h3>

      <div className="card">
        <div className="card-row">
          <div>
            <strong>{t('Program')}</strong>
            <div className="muted" style={{ fontSize: 12 }}>
              {getPlan(profile?.plan ?? 'lean')?.name}
            </div>
          </div>
          <select
            value={profile?.plan ?? 'lean'}
            disabled={switching}
            onChange={async (e) => {
              const next = e.target.value as PlanId;
              if (!profile || next === profile.plan) return;
              const name = getPlan(next)?.name ?? next;
              if (
                !window.confirm(
                  t('Switch your program to {name}? Your Today screen and calendar will follow it. Finished cycles and history are kept.', { name })
                )
              ) {
                e.target.value = profile.plan ?? 'lean';
                return;
              }
              setSwitching(true);
              try {
                await updateProfile(profile.id, { plan: next });
                await refresh();
              } finally {
                setSwitching(false);
              }
            }}
            style={{ padding: '8px 10px', borderRadius: 10 }}
          >
            {allPlans().map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <p className="muted" style={{ fontSize: 12, margin: '8px 0 0' }}>
          {t('Best results come from finishing full cycles. Switch when your goal changes, not mid-program. Browse any calendar first from the Calendar tab.')}
        </p>
        <div className="card-row" style={{ marginTop: 10 }}>
          <div>
            <strong>{t('Language')}</strong>
          </div>
          <select
            value={lang}
            onChange={async (e) => {
              const next = e.target.value as Lang;
              setLang(next);
              if (profile) updateProfile(profile.id, { language: next }).catch(() => {});
            }}
            style={{ padding: '8px 10px', borderRadius: 10 }}
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
        <div className="card-row" style={{ marginTop: 10 }}>
          <div>
            <strong>{t('Guided tips')}</strong>
          </div>
          <button
            className="btn ghost"
            style={{ padding: '8px 14px', fontSize: 13 }}
            onClick={() => {
              resetTour();
              window.alert(t('Tips are back on. They will appear as you visit each screen.'));
            }}
          >
            {t('Show tips again')}
          </button>
        </div>
      </div>

      <PartnerSettings />
      <ExerciseVideoSettings />
      <MusicSettings />

      <div className="card">
        <div className="card-row">
          <div>
            <strong>{t('Account')}</strong>
            <div className="muted" style={{ fontSize: 12 }}>{displayName}</div>
          </div>
          <button className="btn ghost" onClick={signOut}>
            {t('Sign out')}
          </button>
        </div>
        <div className="btn-grid" style={{ marginTop: 12 }}>
          <button
            className="btn ghost"
            onClick={async () => {
              const data = await exportMyData();
              const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json',
              });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'superileri-my-data.json';
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            {t('Export my data')}
          </button>
          <button
            className="btn ghost"
            style={{ borderColor: 'var(--accent-2)', color: 'var(--accent-2)' }}
            onClick={async () => {
              if (!window.confirm(t('Delete your account and ALL data (profile, history, photos)? This cannot be undone.'))) return;
              const word = window.prompt(t('Type DELETE to confirm permanent deletion.'));
              if (word !== 'DELETE') return;
              try {
                await deleteMyAccount();
                window.location.reload();
              } catch (e) {
                window.alert(e instanceof Error ? e.message : 'Failed');
              }
            }}
          >
            {t('Delete account')}
          </button>
        </div>
        <p className="muted" style={{ fontSize: 11, marginTop: 8, marginBottom: 0 }}>
          {t('Export gives you a JSON of everything we store. Deletion permanently removes your login, history, and photos.')}
        </p>
      </div>

      <CrashReports />

      <p className="muted" style={{ fontSize: 11, textAlign: 'center', marginTop: 8 }}>
        {t('hop30 · your data is private to your account.')} · v{__APP_VERSION__}
      </p>

      {viewShots && <PhotoLightbox shots={viewShots} onClose={() => setViewShots(null)} />}
    </div>
  );
};

export default ProgressScreen;
