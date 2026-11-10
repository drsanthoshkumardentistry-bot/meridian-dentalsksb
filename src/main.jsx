import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import PlanApprovalRoute from './components/PlanApprovalRoute.jsx';
import './index.css';

// A patient opening a treatment estimate link (?plan=<token>) sees only that page, never the clinic app.
const planToken = new URLSearchParams(window.location.search).get('plan');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>{planToken ? <PlanApprovalRoute token={planToken} /> : <App />}</ErrorBoundary>
  </React.StrictMode>
);
