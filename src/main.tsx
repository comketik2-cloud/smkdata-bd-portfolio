import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupFirebaseFallback } from './utils/firebaseFallback.ts';

// Initialize direct-to-Firestore client-side fallback if Express server is missing or inaccessible
setupFirebaseFallback();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

