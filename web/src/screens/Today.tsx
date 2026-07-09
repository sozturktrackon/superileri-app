import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../state';
import { getDay, getPlan, intervals, normalizeDay, planLength } from '../lib/content';
import { advanceDay, listWorkouts } from '../lib/api';
import { completedDaySet, computeStreaks } from '../lib/streak';
import { useT } from '../lib/i18n';

const Today = () => {
  const { profile, displayName, refresh } = useProfile();
  const { t } = useT();

  const planId = profile?.plan ?? 'lean';
  const rawDay = profile?.currentDay ?? 1;
  const dayNumber = normalizeDay(rawDay, planId);
  const plan = getPlan(planId);
  const day = useMemo(() => getDay(planId, dayNumber), [planId, dayNumber]);
  const [streak, setStreak] = useState(0);

  const cycle = Math.floor((rawDay - 1) / planLength(planId)) + 1;

  useEffect(() => {
    listWorkouts()
      .then((logs) =>
        setStreak(
          computeStreaks(planId, rawDay, completedDaySet(planId, logs)).current
        )
      )
      .catch(() => {});
  }, [planId, rawDay]);

  const next = async () => {
    if (profile) {
      await advanceDay(profile);
      await refresh();
    }
  };

  if (!day || !plan) return null;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t('Good morning');
    if (h < 18) return t('Good afternoon');
    return t('Good evening');
  })();

  return (
    <div>
      <div className="card-row" style={{ marginBottom: 4 }}>
        <span className="pill accent">{plan.name}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {streak > 0 && (
            <span className="pill" style={{ background: 'rgba(255,122,24,0.18)' }}>
              {t('🔥 {n}-day streak', { n: streak })}
            </span>
          )}
          <span className="pill">
            {t('Day {n}', { n: dayNumber })}
            {cycle > 1 ? ` · ${t('Cycle {c}', { c: cycle })}` : ''}
          </span>
        </div>
      </div>
      <h1 className="page-title">
        {greeting}, {displayName}.
      </h1>
      <p className="page-sub">
        {day.rest
          ? t("It's a rest day. Recovery is where growth happens.")
          : t("Today's session · {n} rounds of 30s on / 30s off", { n: intervals.rounds })}
      </p>

      {day.rest ? (
        <div className="card" style={{ textAlign: 'center', padding: 28 }}>
          <div style={{ fontSize: 56 }}>🛌</div>
          <h2 style={{ marginTop: 8 }}>{t('Rest Day')}</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            {t('Stretch, hydrate, sleep well.')}
          </p>
          {day.groups.length > 0 && (
            <>
              <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>
                {t('Optional active recovery:')}
              </p>
              <Link
                className="btn ghost block"
                style={{ marginTop: 8 }}
                to={`/workout/${planId}/${dayNumber}/${encodeURIComponent(
                  day.groups[0].key
                )}`}
              >
                ▶ {day.groups[0].name}
              </Link>
            </>
          )}
          <button className="btn primary block" style={{ marginTop: 16 }} onClick={next}>
            {t('Mark rest complete · Next day →')}
          </button>
        </div>
      ) : (
        <>
          <div className="stack">
            {day.groups.map((g, i) => (
              <div className="card" key={g.key}>
                <div className="card-row">
                  <div>
                    <div className="pill" style={{ marginBottom: 8 }}>
                      {t('Part {i} of {n}', { i: i + 1, n: day.groups.length })}
                    </div>
                    <h2 style={{ fontSize: 22 }}>{g.name}</h2>
                    <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                      {t('{n} exercises', { n: g.exercises.length })} ·{' '}
                      {g._missing ? t('content coming soon') : t('{n} rounds', { n: intervals.rounds })}
                    </p>
                  </div>
                </div>
                <ol className="exercise-list" style={{ marginTop: 8 }}>
                  {g.exercises.map((ex, idx) => (
                    <li key={ex.id}>
                      <span className="exercise-num">{idx + 1}</span>
                      {ex.name}
                    </li>
                  ))}
                  {g.exercises.length === 0 && (
                    <li className="muted">{g._note}</li>
                  )}
                </ol>
                <Link
                  className="btn primary block"
                  style={{ marginTop: 12 }}
                  to={`/workout/${planId}/${dayNumber}/${encodeURIComponent(g.key)}`}
                >
                  ▶ {t('Start')} {g.name}
                </Link>
              </div>
            ))}
          </div>

          <button className="btn ghost block" style={{ marginTop: 4 }} onClick={next}>
            {t('Finished everything · Next day →')}
          </button>
        </>
      )}
    </div>
  );
};

export default Today;
