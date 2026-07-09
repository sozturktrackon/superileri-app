import React from 'react';
import ReactDOM from 'react-dom/client';
import { Authenticator, translations } from '@aws-amplify/ui-react';
import { I18n } from 'aws-amplify/utils';
import { registerSW } from 'virtual:pwa-register';
import '@aws-amplify/ui-react/styles.css';
import './lib/amplify'; // configures Amplify on import
import './styles.css';
import { installCrashCapture } from './lib/crashLog';
import { amplifyLangCode, detectLang, I18nProvider } from './lib/i18n';
import { hiAuth } from './i18n/hi';
import { tlAuth } from './i18n/tl';
import App from './App';

// Record any uncaught error / rejection on-device (Progress → Crash reports).
installCrashCapture();

// Login/signup screen (Amplify Authenticator) speaks the user's language too.
I18n.putVocabularies(translations);
I18n.putVocabularies({ hi: hiAuth, tl: tlAuth });
I18n.setLanguage(amplifyLangCode(detectLang()));

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
    <I18nProvider>
      <Authenticator.Provider>
        <App />
      </Authenticator.Provider>
    </I18nProvider>
  </React.StrictMode>
);
