import './global-helpers.css';
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { I18nProvider } from './context/I18nContext';
import { SupportedLocale } from './types';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);

const AppContainer = () => {
  // This approach is a bit of a trick to get the initial locale for the provider,
  // as the App component itself manages the locale state.
  // The provider will re-render if the App changes the locale via its state.
  const [initialLocale] = useState<SupportedLocale>(
    () => (localStorage.getItem('yans-pro-locale') || 'en') as SupportedLocale
  );

  useEffect(() => {
    // Register service worker only in production/preview builds.
    // During development the SW interferes with HMR and cached assets.
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }
  }, []);

  return (
    <I18nProvider locale={initialLocale}>
      <App />
    </I18nProvider>
  );
};


root.render(
  <React.StrictMode>
    <AppContainer />
  </React.StrictMode>
);

