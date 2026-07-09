import { useEffect, useState } from 'react';
import {
  analyzeCheckIn,
  createCheckIn,
  listCheckIns,
  uploadAnglePhotos,
  type Angle,
  type CheckIn,
} from '../lib/api';
import AnglePhotoCapture from '../components/AnglePhotoCapture';
import { useT } from '../lib/i18n';

const daysSince = (iso: string) =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

const CheckInScreen = () => {
  const { t } = useT();
  const [last, setLast] = useState<CheckIn | null>(null);
  const [files, setFiles] = useState<Partial<Record<Angle, File>>>({});
  const [weight, setWeight] = useState('');
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string>('');
  const [result, setResult] = useState<CheckIn | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCheckIns().then((cs) => setLast(cs[0] ?? null));
  }, []);

  const setAngle = (angle: Angle, file: File | undefined) => {
    setFiles((f) => ({ ...f, [angle]: file }));
    setResult(null);
  };

  const submit = async () => {
    if (!files.front) {
      setError(t('At least a front photo is required.'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setStage(t('Uploading photos…'));
      const photos = await uploadAnglePhotos(files);
      setStage(t('Saving check-in…'));
      const ci = await createCheckIn({
        photos,
        kind: 'monthly',
        weightKg: weight ? Number(weight) : undefined,
      });
      setStage(t('Analyzing with AI…'));
      const analyzed = await analyzeCheckIn(ci);
      setResult(analyzed);
      setLast(analyzed);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Something went wrong.'));
    } finally {
      setBusy(false);
      setStage('');
    }
  };

  return (
    <div>
      <h1 className="page-title">{t('Check-in')}</h1>
      <p className="page-sub">
        {t(
          'Snap full-body photos monthly to track real progress. Front is required; add back and side views for a much better read.'
        )}
      </p>

      {last && !result && (
        <div className="banner">
          {t('Last check-in: {date} ({days} days ago).', {
            date: last.date,
            days: daysSince(last.date),
          })}{' '}
          {daysSince(last.date) >= 28
            ? t('Time for a new one! 🔥')
            : t('Next one in {days} days.', { days: 30 - daysSince(last.date) })}
        </div>
      )}

      <div className="card">
        <AnglePhotoCapture files={files} onChange={setAngle} />
        <div className="field" style={{ marginTop: 14, marginBottom: 0 }}>
          <label>{t('Weight today (kg, optional)')}</label>
          <input
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={t('e.g. 78.5')}
          />
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <button className="btn primary block" onClick={submit} disabled={busy}>
        {busy ? stage || t('Working…') : t('Save & analyze 🤖')}
      </button>

      {result && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 8 }}>{t('🤖 AI Body Analysis')}</h3>
          {typeof result.aiBodyFatPct === 'number' && (
            <div className="card-row" style={{ marginBottom: 8 }}>
              <span className="muted">{t('Estimated body fat')}</span>
              <span className="pill accent" style={{ fontSize: 16 }}>
                {result.aiBodyFatPct.toFixed(1)}%
              </span>
            </div>
          )}
          <p style={{ lineHeight: 1.5 }}>{result.aiSummary}</p>
          {result.aiComparison && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid var(--line)',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                {t('📈 Progress vs your first check-in')}
              </div>
              <p style={{ lineHeight: 1.5, margin: 0 }}>{result.aiComparison}</p>
            </div>
          )}
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            {t('Estimates are for personal motivation only, not medical advice.')}
          </p>
        </div>
      )}
    </div>
  );
};

export default CheckInScreen;
