import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import PlanApprovalRoute from './components/PlanApprovalRoute.jsx';
import BookingPageRoute from './components/BookingPageRoute.jsx';
import './index.css';

// A patient opening a treatment estimate link (?plan=<token>) sees only that page, never the clinic app.
const params = new URLSearchParams(window.location.search);
const planToken = params.get('plan');
const bookId = params.get('book');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>{planToken ? <PlanApprovalRoute token={planToken} /> : bookId ? <BookingPageRoute clinicId={bookId} /> : <App />}</ErrorBoundary>
  </React.StrictMode>
);
