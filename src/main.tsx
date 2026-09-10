import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <HashRouter>
        <App />
      </HashRouter>
    </GoogleOAuthProvider>
  </StrictMode>
);

// Registo de Service Worker para PWA (Progressive Web App)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.log('ServiceWorker registration:', err);
    });
  });
}

