import React, { Suspense } from 'react';
import { lazyWithRetry } from './lazyWithRetry.js';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { legalPageFromSearch } from './legal.js';
import { seoPageForPath } from './seoPages.js';
import { shouldAutoReload } from './recover.js';
import { EARLY_ACCESS_PATH } from './earlyAccess.js';
import { installErrorReporting } from './errorReport.js';
import { startSentry } from './sentry.js';
import { registerOfflinePage } from './offlinePage.js';
import './index.css';

// Each route is its own file, so a patient opening an estimate or booking link downloads only that page,
// not the whole clinic app.
const App = lazyWithRetry(() => import('./App.jsx'));
const PlanApprovalRoute = lazyWithRetry(() => import('./components/PlanApprovalRoute.jsx'));
const BookingPageRoute = lazyWithRetry(() => import('./components/BookingPageRoute.jsx'));
const PatientPortalRoute = lazyWithRetry(() => import('./components/PatientPortalRoute.jsx'));
const LegalPage = lazyWithRetry(() => import('./components/LegalPage.jsx'));
const PayPage = lazyWithRetry(() => import('./components/PayPage.jsx'));
const SeoPage = lazyWithRetry(() => import('./components/SeoPage.jsx'));
const EarlyAccessPage = lazyWithRetry(() => import('./components/EarlyAccessPage.jsx'));

if (!import.meta.env.DEV) {
  installErrorReporting();
  window.addEventListener('load', () => { startSentry(import.meta.env.VITE_SENTRY_DSN); });
}

// After an update, a tab left open can ask for a file that is gone. Reload once to pick up the new version.
window.addEventListener('vite:preloadError', (event) => {
  if (shouldAutoReload()) { event.preventDefault(); window.location.reload(); }
});

// A patient opening a treatment estimate link (?plan=<token>) sees only that page, never the clinic app.
const params = new URLSearchParams(window.location.search);
const planToken = params.get('plan');
const bookId = params.get('book');
const portalToken = params.get('portal');
const legalPage = legalPageFromSearch(window.location.search);
const payPage = params.get('pay') === '1';
const seoPage = seoPageForPath(window.location.pathname);
const earlyAccess = window.location.pathname.replace(/\/+$/, '') === EARLY_ACCESS_PATH;

// Shimmering dashboard-shaped placeholder instead of bare text. After ~4 s it says the connection is slow,
// and it says so straight away when the device is offline.
const Loading = () => (
  <div role="status" aria-live="polite" aria-label="Loading MeriDent" data-loading="1" className="md-skel">
    <div className="md-skel-bar" />
    <div className="md-skel-grid">
      <span /><span /><span /><span />
    </div>
    <div className="md-skel-rows"><span /><span /><span /></div>
    <p className="md-skel-note md-skel-slow">Slow connection, still loading your clinic…</p>
    {typeof navigator !== 'undefined' && navigator.onLine === false && (
      <p className="md-skel-note md-skel-off">You are offline. Opening your saved data when it is available.</p>
    )}
  </div>
);


registerOfflinePage();
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        {legalPage ? <LegalPage page={legalPage} /> : seoPage ? <SeoPage page={seoPage} /> : earlyAccess ? <EarlyAccessPage /> : payPage ? <PayPage /> : planToken ? <PlanApprovalRoute token={planToken} /> : portalToken ? <PatientPortalRoute token={portalToken} /> : bookId ? <BookingPageRoute clinicId={bookId} /> : <App />}
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);
