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
      const desiredScope = new URL(import.meta.env.BASE_URL, window.location.href).href;

      window.addEventListener('load', () => {
        void (async () => {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            const broaderRegistrations = registrations.filter(
              (registration) => desiredScope.startsWith(registration.scope) && registration.scope !== desiredScope
            );

            await Promise.all(
              broaderRegistrations.map((registration) => registration.unregister())
            );

            const registration = await navigator.serviceWorker.register(serviceWorkerUrl, {
              scope: import.meta.env.BASE_URL,
            });

            console.log('SW registered:', registration);
          } catch (registrationError) {
            console.log('SW registration failed:', registrationError);
          }
        })();
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
