import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global handler for stale build chunk loading errors (deployment cache mismatch recovery)
window.addEventListener('error', (e) => {
  const isChunkError =
    e.message?.includes('Failed to fetch dynamically imported module') ||
    e.message?.includes('Importing a module script failed') ||
    e.message?.includes('Expected a JavaScript-or-Wasm module script');

  if (isChunkError) {
    const hasReloaded = sessionStorage.getItem('chunk_reload');
    if (!hasReloaded) {
      sessionStorage.setItem('chunk_reload', 'true');
      window.location.reload();
    }
  }
});

// Reset reload flag on successful load
window.addEventListener('load', () => {
  sessionStorage.removeItem('chunk_reload');
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
