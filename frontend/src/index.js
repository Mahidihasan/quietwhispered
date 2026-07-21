import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/theme.css';
import './styles/markdown.css';
import App from './App';
import ErrorBoundary from './shared/ErrorBoundary.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
