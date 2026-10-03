/** App entry: mounts React with the router, theme and toast providers. */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import './styles/base.css';

async function start() {
  // Preview mode (npm run dev:preview): answers API calls with sample data. Remove this block with src/preview.
  if (import.meta.env.VITE_PREVIEW === 'true') {
    const { installPreview } = await import('./preview/mockApi.js');
    installPreview();
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );
}

start();
