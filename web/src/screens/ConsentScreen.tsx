import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TERMS_VERSION } from '../content/legal';
import { useT } from '../lib/i18n';

export type ConsentResult = {
  termsAcceptedAt: string;
  termsVersion: string;
  healthConsentAt: string | null;
};

/**
 * The consent gate. Shown before onboarding for new users, and once to
 * existing users whose profile predates the terms (or after a terms-version
 * bump). GDPR notes baked into the design:
 *  - terms/privacy acceptance and the health-data consent are SEPARATE
 *    checkboxes (Art. 9 explicit consent must not be bundled),
 *  - the health consent is optional: declining it still lets the user train,
 *    it only disables photo check-ins and AI analysis until granted,
 *  - the linked documents are readable without an account.
 */
const ConsentScreen = ({
  onAccept,
  onDecline,
}: {
  onAccept: (c: ConsentResult) => void;
  onDecline: () => void;
}) => {
  const { t } = useT();
  const [terms, setTerms] = useState(false);
  const [health, setHealth] = useState(false);

  return (
    <div className="app-main">
      <h1 className="page-title">{t('Before you start')}</h1>
      <p className="page-sub">
        {t('A minute of honesty: what you agree to, and what happens with your data.')}
      </p>

      <div className="card">
        <div style={{ fontWeight: 800, marginBottom: 6 }}>{t('The short version')}</div>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6, fontSize: 14 }}>
          <li>{t('Exercise at your own risk; check with a doctor first if you have any condition. This app is not medical advice.')}</li>
          <li>{t('Your data (profile, workouts, photos) is private to your account, stored on AWS, never sold or shared.')}</li>
          <li>{t('Progress photos and AI body analysis are optional and need your separate consent below.')}</li>
          <li>{t('You can export or permanently delete everything, anytime, from Progress.')}</li>
        </ul>
        <p className="muted" style={{ fontSize: 13, marginTop: 10, marginBottom: 0 }}>
          <Link to="/legal/terms">{t('Terms of Use')}</Link>
          {' · '}
          <Link to="/legal/privacy">{t('Privacy Policy')}</Link>
        </p>
      </div>

      <label className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          style={{ width: 22, height: 22, marginTop: 2 }}
        />
        <span style={{ fontSize: 14, lineHeight: 1.5 }}>
          {t('I have read and accept the Terms of Use and the Privacy Policy, including the exercise risk disclaimer.')}
        </span>
      </label>

      <label className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={health}
          onChange={(e) => setHealth(e.target.checked)}
          style={{ width: 22, height: 22, marginTop: 2 }}
        />
        <span style={{ fontSize: 14, lineHeight: 1.5 }}>
          {t('Optional: I explicitly consent to my body photos and related data being processed by AI to estimate my progress. I can withdraw this anytime by deleting my photos or account.')}
        </span>
      </label>

      <button
        className="btn primary block"
        disabled={!terms}
        onClick={() =>
          onAccept({
            termsAcceptedAt: new Date().toISOString(),
            termsVersion: TERMS_VERSION,
            healthConsentAt: health ? new Date().toISOString() : null,
          })
        }
      >
        {t('Agree and continue')}
      </button>
      <button className="btn ghost block" style={{ marginTop: 8 }} onClick={onDecline}>
        {t('Decline and sign out')}
      </button>
      <p className="muted" style={{ fontSize: 11, textAlign: 'center', marginTop: 10 }}>
        {t('Without the optional photo consent you can still train fully; only photo check-ins and AI analysis stay off.')}
      </p>
    </div>
  );
};

export default ConsentScreen;
