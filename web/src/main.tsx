import React from 'react';
import ReactDOM from 'react-dom/client';
import { Authenticator } from '@aws-amplify/ui-react';
import { registerSW } from 'virtual:pwa-register';
import '@aws-amplify/ui-react/styles.css';
import './lib/amplify'; // configures Amplify on import
import './styles.css';
import { installCrashCapture } from './lib/crashLog';
import App from './App';

// Record any uncaught error / rejection on-device (Progress → Crash reports).
installCrashCapture();

// Installed PWAs on Android/iOS often RESUME from memory instead of
// relaunching, so the service worker's on-launch update check can be days
// stale. Check for a new version hourly and whenever the app returns to the
// foreground; autoUpdate mode then swaps it in on its own.
registerSW({
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    const check = () => registration.update().catch(() => {});
    window.setInterval(check, 60 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Authenticator.Provider>
      <App />
    </Authenticator.Provider>
  </React.StrictMode>
);
