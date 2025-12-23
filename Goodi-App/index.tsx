import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { authInitialized } from './firebase';
import './src/index.css';

console.log('[Index] Starting app initialization...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Wait for Firebase auth persistence to be set before rendering
authInitialized
  .then(() => {
    console.log('[Index] Firebase auth initialized, rendering App...');
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
    console.log('[Index] App rendered successfully!');
  })
  .catch((error) => {
    console.error('[Index] Firebase auth initialization failed:', error);
    // Render error message
    root.render(
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>初始化失敗</h1>
        <p>Firebase 驗證初始化失敗。請檢查網路連線或稍後再試。</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
          {error.message}
        </pre>
      </div>
    );
  });
