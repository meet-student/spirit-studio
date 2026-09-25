import { StrictMode } from 'react';
import { I18nextProvider } from 'react-i18next';

import '@mastra/playground-ui/style.css';
import '@/index.css';
import i18n from './i18n';

import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import './index.css';

export function startStudio() {
  if (import.meta.env.DEV && import.meta.env.VITE_REACT_GRAB === 'true') {
    void import('react-grab');
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </StrictMode>,
  );
}
