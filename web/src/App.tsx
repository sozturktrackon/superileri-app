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
import TvDisplay from './screens/TvDisplay';
import ErrorBoundary from './components/ErrorBoundary';

const Shell = ({ signOut }: { signOut?: () => void }) => {
  const { profile, loading } = useProfile();

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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
};

const AuthenticatedApp = () => (
  <Authenticator
    signUpAttributes={['preferred_username']}
    formFields={{
      signUp: {
        preferred_username: {
          label: 'Your name',
          placeholder: 'What should we call you?',
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
);

// Single top-level Router: /tv/:code is public (no login — it's just a
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
