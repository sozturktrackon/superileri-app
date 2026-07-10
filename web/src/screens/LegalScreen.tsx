import { Link, useParams } from 'react-router-dom';
import { privacyPolicy, termsOfUse } from '../content/legal';
import { useT } from '../lib/i18n';

/**
 * Public reader for /legal/privacy and /legal/terms - reachable without an
 * account, since consent must be informed before sign-up. Documents are
 * maintained in English (master copies); the surrounding chrome follows the
 * app language.
 */
const LegalScreen = () => {
  const { doc } = useParams();
  const { t } = useT();
  const d = doc === 'terms' ? termsOfUse : privacyPolicy;
  const other = doc === 'terms' ? 'privacy' : 'terms';
  return (
    <div className="app-main" style={{ paddingBottom: 40 }} dir="ltr">
      <h1 className="page-title">{d.title}</h1>
      <p className="page-sub">
        {t('Last updated:')} {d.updated} · {t('Master copy in English')}
      </p>
      {d.sections.map((s) => (
        <div className="card" key={s.h}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>{s.h}</div>
          {s.p.map((para, i) => (
            <p key={i} style={{ margin: i ? '8px 0 0' : 0, lineHeight: 1.55, fontSize: 14 }}>
              {para}
            </p>
          ))}
        </div>
      ))}
      <div className="btn-grid">
        <Link className="btn ghost" to={`/legal/${other}`} style={{ textDecoration: 'none' }}>
          {other === 'terms' ? termsOfUse.title : privacyPolicy.title}
        </Link>
        <Link className="btn primary" to="/" style={{ textDecoration: 'none' }}>
          {t('Back to the app')}
        </Link>
      </div>
    </div>
  );
};

export default LegalScreen;
