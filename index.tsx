import './global-helpers.css';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { I18nProvider } from './context/I18nContext';
import { SupportedLocale } from './types';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = createRoot(rootElement);

const AppContainer = () => {
  const [initialLocale] = useState<SupportedLocale>(
    () => (localStorage.getItem('yans-pro-locale') || 'en') as SupportedLocale
  );

  useEffect(() => {
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      const serviceWorkerUrl = `${import.meta.env.BASE_URL}sw.js`;

      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register(serviceWorkerUrl)
          .then((registration) => {
            console.log('SW registered:', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed:', registrationError);
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
