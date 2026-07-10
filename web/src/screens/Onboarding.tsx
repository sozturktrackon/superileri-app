import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  analyzeCheckIn,
  createCheckIn,
  createProfile,
  uploadAnglePhotos,
  type Angle,
} from '../lib/api';
import { useProfile } from '../state';
import AnglePhotoCapture from '../components/AnglePhotoCapture';
import { useT } from '../lib/i18n';
import { stagedConsent } from '../App';

const Onboarding = () => {
  const { displayName, refresh } = useProfile();
  const navigate = useNavigate();
  const { t, lang } = useT();
  const [step, setStep] = useState<1 | 2>(1);
  const [plan, setPlan] = useState<'lean' | 'bulk'>('lean');
  const [name, setName] = useState(displayName);
  const [sex, setSex] = useState<'male' | 'female' | 'other'>('male');
  const [birthYear, setBirthYear] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [goal, setGoal] = useState('');

  const [files, setFiles] = useState<Partial<Record<Angle, File>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAngle = (angle: Angle, file: File | undefined) => {
    setFiles((f) => ({ ...f, [angle]: file }));
  };

  const consent = stagedConsent();
  const photosAllowed = !!consent?.healthConsentAt;

  const finish = async () => {
    if (photosAllowed && !files.front) {
      setError(t('Please add at least a front photo so we can track your progress.'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const checkIn = photosAllowed
        ? await createCheckIn({
            photos: await uploadAnglePhotos(files),
            kind: 'onboarding',
          })
        : null;
      await createProfile({
        plan,
        language: lang,
        termsAcceptedAt: consent?.termsAcceptedAt,
        termsVersion: consent?.termsVersion,
        healthConsentAt: consent?.healthConsentAt ?? null,
        displayName: name,
        sex,
        birthYear: birthYear ? Number(birthYear) : undefined,
        heightCm: heightCm ? Number(heightCm) : undefined,
        goal,
      });
      // Fire-and-forget AI analysis; don't block onboarding if Bedrock is slow.
      if (checkIn) analyzeCheckIn(checkIn).catch(() => {});
      try {
        sessionStorage.removeItem('superileri.consentStage');
      } catch {
        /* ignore */
      }
      await refresh();
      // Land brand-new users on the philosophy page once; it stays reachable
      // from Progress afterwards.
      navigate('/about', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Something went wrong.'));
      setBusy(false);
    }
  };

  return (
    <div className="app-main">
      <h1 className="page-title">{t('Welcome')}{name ? `, ${name}` : ''} 💪</h1>
      <p className="page-sub">{t("Let's set up your program. Takes 30 seconds.")}</p>

      {step === 1 && (
        <>
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>{t('Choose your plan')}</h3>
            <div className="choice-grid">
              <button
                className={`choice ${plan === 'lean' ? 'selected' : ''}`}
                onClick={() => setPlan('lean')}
              >
                <h3>Lean</h3>
                <p>{t('Fewer rest days, more cardio. Get shredded.')}</p>
              </button>
              <button
                className={`choice ${plan === 'bulk' ? 'selected' : ''}`}
                onClick={() => setPlan('bulk')}
              >
                <h3>Bulk</h3>
                <p>{t('More rest, less cardio. Build lean muscle.')}</p>
              </button>
            </div>
          </div>

          <div className="card">
            <div className="field">
              <label>{t('Name')}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label>{t('Sex (for body estimates)')}</label>
              <select value={sex} onChange={(e) => setSex(e.target.value as typeof sex)}>
                <option value="male">{t('Male')}</option>
                <option value="female">{t('Female')}</option>
                <option value="other">{t('Prefer not to say')}</option>
              </select>
            </div>
            <div className="btn-grid">
              <div className="field" style={{ marginBottom: 0 }}>
                <label>{t('Birth year')}</label>
                <input
                  inputMode="numeric"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="1990"
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>{t('Height (cm)')}</label>
                <input
                  inputMode="numeric"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="178"
                />
              </div>
            </div>
            <div className="field" style={{ marginTop: 14, marginBottom: 0 }}>
              <label>{t('Your goal (optional)')}</label>
              <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder={t('Lose belly fat, feel strong…')}
              />
            </div>
          </div>

          <button className="btn primary block" onClick={() => setStep(2)}>
            {t('Next: your starting photo →')}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="card">
            <h3 style={{ marginBottom: 6 }}>{t('📸 Your starting photos')}</h3>
            {!photosAllowed && (
              <p className="muted" style={{ fontSize: 13 }}>
                {t('You skipped the photo consent, so this step is optional and photos stay off. You can grant consent later from the Check-in screen.')}
              </p>
            )}
            <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
              {t("Take full-body photos in good light. Front is required; add back and side views too if you can. This is private to you and becomes your Day 1 baseline, so we'll compare future check-ins to it.")}
            </p>
            {photosAllowed && <AnglePhotoCapture files={files} onChange={setAngle} />}
          </div>

          {error && <p className="error-text">{error}</p>}

          <button
            className="btn primary block"
            onClick={finish}
            disabled={busy}
          >
            {busy ? t('Setting up…') : t('Start training 🚀')}
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
