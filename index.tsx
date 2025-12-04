import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConfigProvider } from 'antd';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0f172a', // slate-900
          borderRadius: 8,
          fontFamily: 'Inter, sans-serif',
        },
        components: {
          Button: {
            colorPrimary: '#0f172a',
            algorithm: true,
          },
          Card: {
            borderRadiusLG: 16,
          },
          Input: {
            borderRadius: 8,
          }
        }
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);