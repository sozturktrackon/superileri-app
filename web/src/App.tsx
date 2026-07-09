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
import { LANGS, useT, type Lang } from './lib/i18n';
import { I18n } from 'aws-amplify/utils';

const Shell = ({ signOut }: { signOut?: () => void }) => {
  const { profile, loading } = useProfile();
  const { lang, setLang } = useT();

  // The profile's saved language wins over the device guess, so the app
  // follows the user across devices.
  useEffect(() => {
    const pl = profile?.language as Lang | null | undefined;
    if (pl && pl !== lang && LANGS.some((l) => l.code === pl)) {
      setLang(pl);
      I18n.setLanguage(pl);
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

  // First run: no profile yet -> onboarding (plan choice + first selfie).
  if (!profile) return <Onboarding />;

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
          I18n.setLanguage(l);
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

const AuthenticatedApp = () => {
  const { t } = useT();
  return (
  <>
  <Authenticator
    components={{ Header: AuthLanguageHeader }}
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
        <Route path="/tv" element={<TvDisplay />} />
        <Route path="/tv/:code" element={<TvDisplay />} />
        <Route path="*" element={<AuthenticatedApp />} />
      </Routes>
    </Router>
  </ErrorBoundary>
);

export default App;
