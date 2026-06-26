import { useRef, useState } from 'react';
import {
  analyzeCheckIn,
  createCheckIn,
  createProfile,
  uploadPhoto,
} from '../lib/api';
import { useProfile } from '../state';

const Onboarding = () => {
  const { displayName, refresh } = useProfile();
  const [step, setStep] = useState<1 | 2>(1);
  const [plan, setPlan] = useState<'lean' | 'bulk'>('lean');
  const [name, setName] = useState(displayName);
  const [sex, setSex] = useState<'male' | 'female' | 'other'>('male');
  const [birthYear, setBirthYear] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [goal, setGoal] = useState('');

  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setPhoto(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const finish = async () => {
    if (!photo) {
      setError('Please add a full-body photo so we can track your progress.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const ext = photo.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = await uploadPhoto(photo, ext);
      const checkIn = await createCheckIn({ photoPath: path, kind: 'onboarding' });
      await createProfile({
        plan,
        displayName: name,
        sex,
        birthYear: birthYear ? Number(birthYear) : undefined,
        heightCm: heightCm ? Number(heightCm) : undefined,
        goal,
      });
      // Fire-and-forget AI analysis; don't block onboarding if Bedrock is slow.
      analyzeCheckIn(checkIn).catch(() => {});
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  return (
    <div className="app-main">
      <h1 className="page-title">Welcome{name ? `, ${name}` : ''} 💪</h1>
      <p className="page-sub">Let's set up your program. Takes 30 seconds.</p>

      {step === 1 && (
        <>
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Choose your plan</h3>
            <div className="choice-grid">
              <button
                className={`choice ${plan === 'lean' ? 'selected' : ''}`}
                onClick={() => setPlan('lean')}
              >
                <h3>Lean</h3>
                <p>Fewer rest days, more cardio. Get shredded.</p>
              </button>
              <button
                className={`choice ${plan === 'bulk' ? 'selected' : ''}`}
                onClick={() => setPlan('bulk')}
              >
                <h3>Bulk</h3>
                <p>More rest, less cardio. Build lean muscle.</p>
              </button>
            </div>
          </div>

          <div className="card">
            <div className="field">
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label>Sex (for body estimates)</label>
              <select value={sex} onChange={(e) => setSex(e.target.value as typeof sex)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Prefer not to say</option>
              </select>
            </div>
            <div className="btn-grid">
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Birth year</label>
                <input
                  inputMode="numeric"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="1990"
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Height (cm)</label>
                <input
                  inputMode="numeric"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="178"
                />
              </div>
            </div>
            <div className="field" style={{ marginTop: 14, marginBottom: 0 }}>
              <label>Your goal (optional)</label>
              <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Lose belly fat, feel strong…"
              />
            </div>
          </div>

          <button className="btn primary block" onClick={() => setStep(2)}>
            Next: your starting photo →
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="card">
            <h3 style={{ marginBottom: 6 }}>📸 Your starting photo</h3>
            <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
              Take a full-body photo in good light. This is private to you and
              becomes your Day 1 baseline, and we'll compare future check-ins to it.
            </p>
            {preview && (
              <img
                src={preview}
                alt="preview"
                style={{
                  width: '100%',
                  borderRadius: 14,
                  marginTop: 10,
                  maxHeight: 360,
                  objectFit: 'cover',
                }}
              />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={pick}
              style={{ display: 'none' }}
            />
            <button
              className="btn ghost block"
              style={{ marginTop: 12 }}
              onClick={() => fileRef.current?.click()}
            >
              {preview ? 'Retake / choose another' : '📷 Take / choose photo'}
            </button>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button
            className="btn primary block"
            onClick={finish}
            disabled={busy}
          >
            {busy ? 'Setting up…' : "Start training 🚀"}
          </button>
          <button
            className="btn ghost block"
            style={{ marginTop: 10 }}
            onClick={() => setStep(1)}
            disabled={busy}
          >
            ← Back
          </button>
        </>
      )}
    </div>
  );
};

export default Onboarding;
