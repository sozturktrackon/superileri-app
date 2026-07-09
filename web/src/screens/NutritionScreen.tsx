import { useState } from 'react';
import diets from '../content/diets.json';
import { useProfile } from '../state';

type MealPlan = (typeof diets.mealPlans)['lean'];

const NutritionScreen = () => {
  const { profile } = useProfile();
  // Level II plans eat like their Level I counterpart.
  const [planId, setPlanId] = useState<'lean' | 'bulk'>(
    profile?.plan?.startsWith('bulk') ? 'bulk' : 'lean'
  );
  const plan: MealPlan = diets.mealPlans[planId];

  return (
    <div>
      <h1 className="page-title">Nutrition</h1>
      <p className="page-sub">The diet that works is the one you stick to.</p>

      {/* Goal */}
      <div className="card">
        <div style={{ fontWeight: 800, marginBottom: 6 }}>🎯 Your goal</div>
        <p style={{ margin: 0, lineHeight: 1.5 }}>{diets.goal}</p>
      </div>

      {/* Habits that work */}
      <h3 style={{ margin: '18px 0 10px' }}>Habits that actually work</h3>
      <div className="stack">
        {diets.habits.map((h) => (
          <div className="card" key={h.title} style={{ margin: 0 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ fontSize: 24, lineHeight: 1 }}>{h.icon}</div>
              <div>
                <div style={{ fontWeight: 700 }}>{h.title}</div>
                <p
                  className="muted"
                  style={{ margin: '2px 0 0', fontSize: 13, lineHeight: 1.45, color: 'var(--text)' }}
                >
                  {h.text}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="banner" style={{ marginTop: 14 }}>
        {diets.dinnerCarbNote}
      </div>

      {/* Optional meal template */}
      <details className="card" style={{ marginTop: 14 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 800 }}>
          🍽️ Want it spelled out? Meal template (optional)
        </summary>

        <div className="choice-grid" style={{ margin: '12px 0' }}>
          {(['lean', 'bulk'] as const).map((id) => (
            <button
              key={id}
              className={`choice ${planId === id ? 'selected' : ''}`}
              onClick={() => setPlanId(id)}
              style={{ padding: '12px' }}
            >
              <h3>{id === 'lean' ? 'Lean' : 'Bulk'}</h3>
              <p>{id === 'lean' ? 'Shred' : 'Build muscle'}</p>
            </button>
          ))}
        </div>

        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>{plan.summary}</p>

        <ul className="exercise-list">
          {plan.meals.map((m) => (
            <li key={m.name} style={{ display: 'block' }}>
              <strong>{m.name}</strong>
              <div className="muted" style={{ fontSize: 13, color: 'var(--text)' }}>
                {m.items}
              </div>
            </li>
          ))}
        </ul>

        <div className="stack" style={{ marginTop: 12, fontSize: 13 }}>
          <div>
            <strong>Proteins:</strong>{' '}
            <span className="muted" style={{ color: 'var(--text)' }}>{diets.proteins}</span>
          </div>
          <div>
            <strong>Carbs:</strong>{' '}
            <span className="muted" style={{ color: 'var(--text)' }}>{plan.carbs}</span>
          </div>
          <div>
            <strong>Veggies:</strong>{' '}
            <span className="muted" style={{ color: 'var(--text)' }}>{diets.veggies}</span>
          </div>
        </div>
      </details>

      {/* Grocery list */}
      <details className="card">
        <summary style={{ cursor: 'pointer', fontWeight: 800 }}>🛒 Grocery list</summary>
        <div className="stack" style={{ marginTop: 12 }}>
          {diets.grocery.map((g) => (
            <div key={g.group}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{g.group}</div>
              <div className="muted" style={{ fontSize: 13, color: 'var(--text)' }}>
                {g.items}
              </div>
            </div>
          ))}
        </div>
      </details>

      {/* Rules */}
      <details className="card">
        <summary style={{ cursor: 'pointer', fontWeight: 800 }}>📋 Simple rules</summary>
        <ul style={{ margin: '12px 0 0', paddingLeft: 18, lineHeight: 1.6, fontSize: 13 }}>
          {diets.rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </details>

      <p className="muted" style={{ fontSize: 11, textAlign: 'center', marginTop: 8 }}>
        General guidance for healthy adults, not medical or dietary advice. Check
        with a professional for your situation.
      </p>
    </div>
  );
};

export default NutritionScreen;
