import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { legalPageFromSearch } from './legal.js';
import './index.css';

// Each route is its own file, so a patient opening an estimate or booking link downloads only that page,
// not the whole clinic app.
const App = lazy(() => import('./App.jsx'));
const PlanApprovalRoute = lazy(() => import('./components/PlanApprovalRoute.jsx'));
const BookingPageRoute = lazy(() => import('./components/BookingPageRoute.jsx'));
const LegalPage = lazy(() => import('./components/LegalPage.jsx'));

// A patient opening a treatment estimate link (?plan=<token>) sees only that page, never the clinic app.
const params = new URLSearchParams(window.location.search);
const planToken = params.get('plan');
const bookId = params.get('book');
const legalPage = legalPageFromSearch(window.location.search);

const Loading = () => (
  <div role="status" aria-live="polite" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'system-ui, sans-serif', color: '#475569' }}>
    Loading MeriDent…
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        {legalPage ? <LegalPage page={legalPage} /> : planToken ? <PlanApprovalRoute token={planToken} /> : bookId ? <BookingPageRoute clinicId={bookId} /> : <App />}
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);
