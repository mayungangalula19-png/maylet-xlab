import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './design-system/design-system.css';
import './styles/globals.css';
// maya.css is imported only by MayaAssistantPage (deferred from initial bundle)

// Preconnect to the Supabase origin so the first API/auth request skips
// DNS + TCP + TLS setup (URL only known at build time, so injected here).
const supabaseUrl = import.meta.env.DEV ? 'http://localhost:3001' : (import.meta.env.VITE_SUPABASE_URL as string | undefined);
if (supabaseUrl) {
  try {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = new URL(supabaseUrl).origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  } catch {
    /* invalid URL — skip preconnect */
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);