import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { initBrowserMockApi } from './utils/browserMockApi';

// Initialize Browser Mock API if running in browser dev mode
initBrowserMockApi();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
