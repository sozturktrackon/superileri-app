import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../state';
import { getDay, getPlan, intervals, normalizeDay } from '../lib/content';
import { advanceDay } from '../lib/api';

const Today = () => {
  const { profile, displayName, refresh } = useProfile();

  const planId = profile?.plan ?? 'lean';
  const rawDay = profile?.currentDay ?? 1;
  const dayNumber = normalizeDay(rawDay);
  const plan = getPlan(planId);
  const day = useMemo(() => getDay(planId, dayNumber), [planId, dayNumber]);

  const cycle = Math.floor((rawDay - 1) / 30) + 1;

  const next = async () => {
    if (profile) {
      await advanceDay(profile);
      await refresh();
    }
  };

  if (!day || !plan) return null;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div>
      <div className="card-row" style={{ marginBottom: 4 }}>
        <span className="pill accent">{plan.name}</span>
        <span className="pill">
          Day {dayNumber}
          {cycle > 1 ? ` · Cycle ${cycle}` : ''}
        </span>
      </div>
      <h1 className="page-title">
        {greeting}, {displayName}.
      </h1>
      <p className="page-sub">
        {day.rest
          ? "It's a rest day. Recovery is where growth happens."
          : `Today's session · ${intervals.rounds} rounds of 30s on / 30s off`}
      </p>

      {day.rest ? (
        <div className="card" style={{ textAlign: 'center', padding: 28 }}>
          <div style={{ fontSize: 56 }}>🛌</div>
          <h2 style={{ marginTop: 8 }}>Rest Day</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            Stretch, hydrate, sleep well.
          </p>
          {day.groups.length > 0 && (
            <>
              <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>
                Optional active recovery:
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
            Mark rest complete · Next day →
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
                      Part {i + 1} of {day.groups.length}
                    </div>
                    <h2 style={{ fontSize: 22 }}>{g.name}</h2>
                    <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                      {g.exercises.length} exercises ·{' '}
                      {g._missing ? 'content coming soon' : `${intervals.rounds} rounds`}
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
                  ▶ Start {g.name}
                </Link>
              </div>
            ))}
          </div>

          <button className="btn ghost block" style={{ marginTop: 4 }} onClick={next}>
            Finished everything · Next day →
          </button>
        </>
      )}
    </div>
  );
};

export default Today;
