import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './i18n/LanguageContext.tsx';
import { ArabicKeyboardProvider } from './context/ArabicKeyboardContext.tsx';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for offline capabilities
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New Kulliyyat app version available');
  },
  onOfflineReady() {
    console.log('Kulliyyat is fully cached and ready to work offline');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ArabicKeyboardProvider>
        <App />
      </ArabicKeyboardProvider>
    </LanguageProvider>
  </StrictMode>,
);
