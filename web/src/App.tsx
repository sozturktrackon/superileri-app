import { useEffect } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import {
  Navigate,
  Route,
  HashRouter as Router,
  Routes,
} from 'react-router-dom';
import { ProfileProvider, useProfile } from './state';
import BottomNav from './components/BottomNav';
import Onboarding from './screens/Onboarding';
import Today from './screens/Today';
import WorkoutScreen from './screens/WorkoutScreen';
import CalendarScreen from './screens/CalendarScreen';
import CheckInScreen from './screens/CheckInScreen';
import ProgressScreen from './screens/ProgressScreen';
import NutritionScreen from './screens/NutritionScreen';
import AboutScreen from './screens/AboutScreen';
import TvDisplay from './screens/TvDisplay';
import ErrorBoundary from './components/ErrorBoundary';
import LegalScreen from './screens/LegalScreen';
import ConsentScreen, { type ConsentResult } from './screens/ConsentScreen';
import { TERMS_VERSION } from './content/legal';
import { updateProfile } from './lib/api';
import { amplifyLangCode, LANGS, useT, type Lang } from './lib/i18n';
import { I18n } from 'aws-amplify/utils';

// New users must consent BEFORE we collect any data (photos included), so
// their acceptance is staged locally and written into the profile at creation.
const CONSENT_STAGE_KEY = 'superileri.consentStage';
export const stagedConsent = (): ConsentResult | null => {
  try {
    return JSON.parse(sessionStorage.getItem(CONSENT_STAGE_KEY) || 'null');
  } catch {
    return null;
  }
};

const Shell = ({ signOut }: { signOut?: () => void }) => {
  const { profile, loading, refresh } = useProfile();
  const { lang, setLang } = useT();

  // The profile's saved language wins over the device guess, so the app
  // follows the user across devices.
  useEffect(() => {
    const pl = profile?.language as Lang | null | undefined;
    if (pl && pl !== lang && LANGS.some((l) => l.code === pl)) {
      setLang(pl);
      I18n.setLanguage(amplifyLangCode(pl));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.language]);

  if (loading) {
    return (
      <div className="center-screen">
        <div className="spinner" />
      </div>
    );
  }

  // First run: consent gate BEFORE onboarding (no data before agreement),
  // then onboarding (plan choice + first selfie).
  if (!profile) {
    if (!stagedConsent()) {
      return (
        <ConsentScreen
          onAccept={(c) => {
            try {
              sessionStorage.setItem(CONSENT_STAGE_KEY, JSON.stringify(c));
            } catch {
              /* ignore */
            }
            refresh();
          }}
          onDecline={() => signOut?.()}
        />
      );
    }
    return <Onboarding />;
  }

  // Existing accounts (or a terms-version bump): ask once, store on profile.
  if (!profile.termsAcceptedAt || profile.termsVersion !== TERMS_VERSION) {
    return (
      <ConsentScreen
        onAccept={async (c) => {
          await updateProfile(profile.id, {
            termsAcceptedAt: c.termsAcceptedAt,
            termsVersion: c.termsVersion,
            healthConsentAt: c.healthConsentAt,
          });
          await refresh();
        }}
        onDecline={() => signOut?.()}
      />
    );
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/workout/:planId/:day/:groupKey" element={<WorkoutScreen />} />
          <Route path="/calendar" element={<CalendarScreen />} />
          <Route path="/nutrition" element={<NutritionScreen />} />
          <Route path="/checkin" element={<CheckInScreen />} />
          <Route path="/progress" element={<ProgressScreen signOut={signOut} />} />
          <Route path="/about" element={<AboutScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
};

// Language picker rendered INSIDE the Authenticator, so it only appears on
// the sign-in / create-account screens (signed-in users change language from
// Progress settings instead).
const AuthLanguageHeader = () => {
  const { lang, setLang } = useT();
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 4px' }}>
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
  );
};

const AuthLegalFooter = () => {
  const { t } = useT();
  return (
    <p style={{ textAlign: 'center', fontSize: 12, padding: '10px 0' }} className="muted">
      <a href="#/legal/terms">{t('Terms of Use')}</a>
      {' · '}
      <a href="#/legal/privacy">{t('Privacy Policy')}</a>
    </p>
  );
};

const AuthenticatedApp = () => {
  const { t } = useT();
  return (
  <>
  <Authenticator
    components={{ Header: AuthLanguageHeader, Footer: AuthLegalFooter }}
    signUpAttributes={['preferred_username']}
    formFields={{
      signUp: {
        preferred_username: {
          label: t('Your name'),
          placeholder: t('What should we call you?'),
          order: 1,
        },
        email: { order: 2 },
        password: { order: 3 },
        confirm_password: { order: 4 },
      },
    }}
  >
    {({ signOut }) => (
      <ProfileProvider>
        <Shell signOut={signOut} />
      </ProfileProvider>
    )}
  </Authenticator>
  </>
  );
};

// Single top-level Router: /tv/:code is public (no login - it's just a
// display), everything else lives behind the Authenticator.
const App = () => (
  <ErrorBoundary>
    <Router>
      <Routes>
        <Route path="/legal/:doc" element={<LegalScreen />} />
      <Route path="/tv" element={<TvDisplay />} />
        <Route path="/tv/:code" element={<TvDisplay />} />
        <Route path="*" element={<AuthenticatedApp />} />
      </Routes>
    </Router>
  </ErrorBoundary>
);

export default App;
