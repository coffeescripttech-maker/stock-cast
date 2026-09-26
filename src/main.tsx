import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { isElectron } from './lib/electron';
import './index.css';

// Mark the document so the print CSS (named receipt @page sizes, transform
// resets) only applies inside the Electron desktop app — the browser/web
// print behavior stays exactly as it was.
if (isElectron) {
  document.documentElement.classList.add('electron');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
