
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { authInitialized } from './firebase'; // ✅ 引入我們的初始化 Promise
import './src/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// ✅ 等待 Firebase 持久性設定完成後才渲染 App
authInitialized.then(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
