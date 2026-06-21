import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../state';
import { getDay, getPlan, normalizeDay } from '../lib/content';
import { listWorkouts, updateProfile, type WorkoutLog } from '../lib/api';

const CalendarScreen = () => {
  const { profile, refresh } = useProfile();
  const navigate = useNavigate();
  const [planId, setPlanId] = useState<'lean' | 'bulk'>(profile?.plan ?? 'lean');
  const plan = getPlan(planId)!;
  const today = normalizeDay(profile?.currentDay ?? 1);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);

  useEffect(() => {
    listWorkouts().then(setLogs);
  }, []);

  // A day is "complete" once every required circuit for it has a logged workout.
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
    if (profile && profile.plan !== id) {
      setSaving(true);
      await updateProfile(profile.id, { plan: id });
      await refresh();
      setSaving(false);
    }
  };

  const completedCount = completedDays.size;
  const trainingDays = plan.days.filter((d) => !d.rest).length;

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
              } ${isDone ? 'done' : ''}`}
              onClick={() => {
                if (!d.rest && d.workouts[0])
                  navigate(
                    `/workout/${planId}/${d.day}/${encodeURIComponent(d.workouts[0])}`
                  );
              }}
            >
              <span className="d">
                {isDone ? '✓' : d.day}
              </span>
              <span>
                {d.rest ? 'Rest' : d.workouts.map((w) => <div key={w}>{w}</div>)}
              </span>
            </button>
          );
        })}
      </div>

      <p className="muted" style={{ fontSize: 12, marginTop: 14 }}>
        Days are checked off automatically as you finish their circuits. Your
        current day is highlighted; the 30-day cycle repeats automatically.
      </p>
    </div>
  );
};

export default CalendarScreen;
