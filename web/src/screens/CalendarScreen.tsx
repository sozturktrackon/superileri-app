import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../state';
import { getDay, getPlan, groupShort, normalizeDay } from '../lib/content';
import {
  clearManualMark,
  listWorkouts,
  markDayComplete,
  setCurrentDay,
  updateProfile,
  type WorkoutLog,
} from '../lib/api';

const CalendarScreen = () => {
  const { profile, refresh } = useProfile();
  const navigate = useNavigate();
  const [planId, setPlanId] = useState<'lean' | 'bulk'>(profile?.plan ?? 'lean');
  const plan = getPlan(planId)!;
  const today = normalizeDay(profile?.currentDay ?? 1);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const reloadLogs = () => listWorkouts().then(setLogs);
  useEffect(() => {
    reloadLogs();
  }, []);

  // A day is complete once every required circuit has a logged workout.
  const completedDays = useMemo(() => {
    const done = new Set<number>();
    for (const d of plan.days) {
      const resolved = getDay(planId, d.day);
      if (!resolved || resolved.rest) continue;
      const required = resolved.groups
        .filter((g) => g.exercises.length > 0)
        .map((g) => g.key);
      if (required.length === 0) continue;
      const loggedKeys = new Set(
        logs
          .filter((l) => l.planId === planId && l.dayNumber === d.day && l.completed)
          .flatMap((l) => l.groupKeys ?? [])
      );
      if (required.every((k) => loggedKeys.has(k))) done.add(d.day);
    }
    return done;
  }, [logs, plan, planId]);

  const switchPlan = async (id: 'lean' | 'bulk') => {
    setPlanId(id);
    setSelected(null);
    if (profile && profile.plan !== id) {
      setSaving(true);
      await updateProfile(profile.id, { plan: id });
      await refresh();
      setSaving(false);
    }
  };

  const requiredKeys = (day: number) =>
    (getDay(planId, day)?.groups ?? [])
      .filter((g) => g.exercises.length > 0)
      .map((g) => g.key);

  const hasManualMark = (day: number) =>
    logs.some(
      (l) => l.planId === planId && l.dayNumber === day && l.notes === 'manual'
    );

  const doMarkDone = async (day: number) => {
    const keys = requiredKeys(day);
    if (keys.length === 0) return;
    setBusy(true);
    try {
      await markDayComplete(planId, day, keys);
      await reloadLogs();
    } finally {
      setBusy(false);
    }
  };

  const doUndo = async (day: number) => {
    setBusy(true);
    try {
      await clearManualMark(planId, day);
      await reloadLogs();
    } finally {
      setBusy(false);
    }
  };

  const doSetToday = async (day: number) => {
    if (!profile) return;
    setBusy(true);
    try {
      await setCurrentDay(
        profile.id,
        day,
        planId !== profile.plan ? planId : undefined
      );
      await refresh();
      navigate('/');
    } finally {
      setBusy(false);
    }
  };

  const completedCount = completedDays.size;
  const trainingDays = plan.days.filter((d) => !d.rest).length;
  const selDay = selected != null ? plan.days.find((d) => d.day === selected) : null;
  const selResolved = selected != null ? getDay(planId, selected) : null;

  return (
    <div>
      <h1 className="page-title">Calendar</h1>
      <p className="page-sub">{plan.note}</p>

      <div className="choice-grid" style={{ marginBottom: 16 }}>
        {(['lean', 'bulk'] as const).map((id) => (
          <button
            key={id}
            className={`choice ${planId === id ? 'selected' : ''}`}
            onClick={() => switchPlan(id)}
            disabled={saving}
          >
            <h3>{getPlan(id)!.name}</h3>
            <p>{id === 'lean' ? 'Shred' : 'Build muscle'}</p>
          </button>
        ))}
      </div>

      <div className="card-row" style={{ marginBottom: 12 }}>
        <span className="pill rest">✓ {completedCount} done</span>
        <span className="pill">{trainingDays} training days</span>
      </div>

      <div className="cal-grid">
        {plan.days.map((d) => {
          const isToday = d.day === today && planId === profile?.plan;
          const isDone = completedDays.has(d.day);
          return (
            <button
              key={d.day}
              className={`cal-cell ${isToday ? 'today' : ''} ${
                d.rest ? 'rest' : ''
              } ${isDone ? 'done' : ''} ${selected === d.day ? 'sel' : ''}`}
              onClick={() => setSelected(d.day)}
            >
              <span className="d">{isDone ? '✓' : d.day}</span>
              <span>
                {d.rest ? 'Rest' : d.workouts.map((w) => <div key={w}>{groupShort(w)}</div>)}
              </span>
            </button>
          );
        })}
      </div>

      {selDay && selResolved && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="card-row">
            <div>
              <strong>Day {selDay.day}</strong>
              {today === selDay.day && planId === profile?.plan && (
                <span className="pill accent" style={{ marginLeft: 8, fontSize: 10 }}>
                  today
                </span>
              )}
              {completedDays.has(selDay.day) && (
                <span className="pill rest" style={{ marginLeft: 6, fontSize: 10 }}>
                  ✓ done
                </span>
              )}
              <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                {selDay.rest ? 'Rest day' : selResolved.groups.map((g) => g.name).join(' + ')}
              </div>
            </div>
            <button
              className="btn ghost"
              style={{ padding: '6px 10px' }}
              onClick={() => setSelected(null)}
            >
              ✕
            </button>
          </div>

          <div className="stack" style={{ marginTop: 12 }}>
            {!selDay.rest && selResolved.groups.some((g) => g.exercises.length > 0) && (
              <button
                className="btn primary block"
                onClick={() =>
                  navigate(
                    `/workout/${planId}/${selDay.day}/${encodeURIComponent(
                      selResolved.groups[0].key
                    )}`
                  )
                }
              >
                ▶ Start workout
              </button>
            )}
            {!selDay.rest &&
              (hasManualMark(selDay.day) ? (
                <button
                  className="btn ghost block"
                  disabled={busy}
                  onClick={() => doUndo(selDay.day)}
                >
                  ↩ Undo manual mark
                </button>
              ) : (
                <button
                  className="btn ghost block"
                  disabled={busy || completedDays.has(selDay.day)}
                  onClick={() => doMarkDone(selDay.day)}
                >
                  {completedDays.has(selDay.day) ? '✓ Already complete' : '✓ Mark day done'}
                </button>
              ))}
            <button
              className="btn ghost block"
              disabled={busy}
              onClick={() => doSetToday(selDay.day)}
            >
              📍 Set as today
            </button>
          </div>
        </div>
      )}

      <p className="muted" style={{ fontSize: 12, marginTop: 14 }}>
        Tap any day to start it, tick it done by hand (e.g. trained with a
        friend), or set it as today. Days also check off automatically when you
        finish their circuits. The 4-week cycle repeats.
      </p>
    </div>
  );
};

export default CalendarScreen;
