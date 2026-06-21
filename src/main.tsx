import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupSupabaseFallback } from './utils/supabaseFallback.ts';

// Initialize direct-to-Supabase client-side fallback if Express server is missing or inaccessible
setupSupabaseFallback();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

