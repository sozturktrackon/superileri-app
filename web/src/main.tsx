import React from 'react';
import ReactDOM from 'react-dom/client';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './lib/amplify'; // configures Amplify on import
import './styles.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Authenticator.Provider>
      <App />
    </Authenticator.Provider>
  </React.StrictMode>
);
