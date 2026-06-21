import { useEffect, useRef, useState } from 'react';
import {
  analyzeCheckIn,
  createCheckIn,
  listCheckIns,
  uploadPhoto,
  type CheckIn,
} from '../lib/api';

const daysSince = (iso: string) =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

const CheckInScreen = () => {
  const [last, setLast] = useState<CheckIn | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string>('');
  const [result, setResult] = useState<CheckIn | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listCheckIns().then((cs) => setLast(cs[0] ?? null));
  }, []);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setPhoto(f);
      setPreview(URL.createObjectURL(f));
      setResult(null);
    }
  };

  const submit = async () => {
    if (!photo) {
      setError('Add a full-body photo first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setStage('Uploading photo…');
      const ext = photo.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = await uploadPhoto(photo, ext);
      setStage('Saving check-in…');
      const ci = await createCheckIn({
        photoPath: path,
        kind: 'monthly',
        weightKg: weight ? Number(weight) : undefined,
      });
      setStage('Analyzing with AI…');
      const analyzed = await analyzeCheckIn(ci);
      setResult(analyzed);
      setLast(analyzed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
      setStage('');
    }
  };

  return (
    <div>
      <h1 className="page-title">Check-in</h1>
      <p className="page-sub">
        Snap a monthly full-body photo to track real progress.
      </p>

      {last && !result && (
        <div className="banner">
          Last check-in: {last.date} ({daysSince(last.date)} days ago).
          {daysSince(last.date) >= 28
            ? ' Time for a new one! 🔥'
            : ' Next one in ' + (30 - daysSince(last.date)) + ' days.'}
        </div>
      )}

      <div className="card">
        {preview && (
          <img
            src={preview}
            alt="preview"
            style={{
              width: '100%',
              borderRadius: 14,
              marginBottom: 12,
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
        <button className="btn ghost block" onClick={() => fileRef.current?.click()}>
          {preview ? 'Retake / choose another' : '📷 Take / choose photo'}
        </button>
        <div className="field" style={{ marginTop: 14, marginBottom: 0 }}>
          <label>Weight today (kg, optional)</label>
          <input
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 78.5"
          />
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <button className="btn primary block" onClick={submit} disabled={busy}>
        {busy ? stage || 'Working…' : 'Save & analyze 🤖'}
      </button>

      {result && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 8 }}>🤖 AI Body Analysis</h3>
          {typeof result.aiBodyFatPct === 'number' && (
            <div className="card-row" style={{ marginBottom: 8 }}>
              <span className="muted">Estimated body fat</span>
              <span className="pill accent" style={{ fontSize: 16 }}>
                {result.aiBodyFatPct.toFixed(1)}%
              </span>
            </div>
          )}
          <p style={{ lineHeight: 1.5 }}>{result.aiSummary}</p>
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            Estimates are for personal motivation only — not medical advice.
          </p>
        </div>
      )}
    </div>
  );
};

export default CheckInScreen;
