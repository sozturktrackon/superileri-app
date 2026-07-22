import { I18n } from 'aws-amplify/utils';
import { amplifyLangCode, LANGS, useT, type Lang } from '../lib/i18n';

/**
 * Pre-auth welcome. Job: in five seconds, tell a stranger this is a serious
 * fitness app and make starting feel easy. Deliberately minimal — one
 * headline, one line of substance, three proof chips, one button. The full
 * story stays inside the app.
 */
const Landing = ({ onStart }: { onStart: () => void }) => {
  const { t, lang, setLang } = useT();

  return (
    <div className="landing">
      <div className="landing-top">
        <select
          value={lang}
          aria-label="Language"
          onChange={(e) => {
            const l = e.target.value as Lang;
            setLang(l);
            I18n.setLanguage(amplifyLangCode(l));
          }}
          style={{ padding: '6px 10px', borderRadius: 10, fontSize: 13 }}
        >
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </div>

      <div className="landing-hero">
        <img src="/icon-192.png" alt="hop30" className="landing-logo" />
        <h1 className="landing-name">hop30</h1>
        <h2 className="landing-headline">{t('The new you starts today.')}</h2>
        <p className="landing-sub">
          {t('30 seconds of work at a time, never more. Average days run 30+ minutes: give each move your full focus and results come fast.')}
        </p>
        <div className="landing-chips">
          <span className="pill">{t('No equipment')}</span>
          <span className="pill">{t('30+ minutes a day')}</span>
          <span className="pill">{t('Free')}</span>
        </div>
        <button className="btn primary block landing-cta" onClick={onStart}>
          {t('Get started')} →
        </button>
      </div>

      <p className="muted landing-legal">
        <a href="#/legal/terms">{t('Terms of Use')}</a>
        {' · '}
        <a href="#/legal/privacy">{t('Privacy Policy')}</a>
      </p>
    </div>
  );
};

export default Landing;
