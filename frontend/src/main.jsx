import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// ─── Service Worker Registration ──────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('✅ SW registered:', reg.scope);

      // Check for updates periodically
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available — could show a toast here
            console.log('🔄 New version available — refresh to update');
          }
        });
      });
    } catch (e) {
      console.warn('SW registration failed:', e);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
