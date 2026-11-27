import React, { Suspense } from 'react';
import { lazyWithRetry } from './lazyWithRetry.js';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { legalPageFromSearch } from './legal.js';
import { seoPageForPath } from './seoPages.js';
import { blogPostForPath, isBlogIndex } from './blogPosts.js';
import { shouldAutoReload } from './recover.js';
import { EARLY_ACCESS_PATH } from './earlyAccess.js';
import { installErrorReporting } from './errorReport.js';
import { startSentry } from './sentry.js';
import { registerOfflinePage } from './offlinePage.js';
import { hasSavedSession } from './savedSession.js';
import { isAdminPath, prepareAdminPage } from './adminEntry.js';
import { installViewportFit } from './viewportFit.js';
import './index.css';
installViewportFit();

// Each route is its own file, so a patient opening an estimate or booking link downloads only that page,
// not the whole clinic app.
const App = lazyWithRetry(() => import('./App.jsx'));
const PlanApprovalRoute = lazyWithRetry(() => import('./components/PlanApprovalRoute.jsx'));
const BookingPageRoute = lazyWithRetry(() => import('./components/BookingPageRoute.jsx'));
const PatientPortalRoute = lazyWithRetry(() => import('./components/PatientPortalRoute.jsx'));
const LegalPage = lazyWithRetry(() => import('./components/LegalPage.jsx'));
const PayPage = lazyWithRetry(() => import('./components/PayPage.jsx'));
const SeoPage = lazyWithRetry(() => import('./components/SeoPage.jsx'));
const BlogPage = lazyWithRetry(() => import('./components/BlogPage.jsx'));
const LandingShell = lazyWithRetry(() => import('./components/LandingShell.jsx'));
const EarlyAccessPage = lazyWithRetry(() => import('./components/EarlyAccessPage.jsx'));

// Sentry client key. It is public by design (every browser sends it), so it can live in the code; VITE_SENTRY_DSN overrides it.
const SENTRY_DSN = 'https://d6c012db9e16a1d159f2582a53878adf@o4512460295438336.ingest.us.sentry.io/4512460299763712';

if (!import.meta.env.DEV) {
  installErrorReporting();
  window.addEventListener('load', () => { startSentry(import.meta.env.VITE_SENTRY_DSN || SENTRY_DSN); });
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
const blogPost = blogPostForPath(window.location.pathname);
const blogIndex = isBlogIndex(window.location.pathname);
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


// The home page for someone with no saved sign-in is the landing page alone; everyone else goes straight to the app.
function Home() {
  const eligible = window.location.pathname === '/' && !window.location.search;
  const [mode, setMode] = React.useState(eligible ? 'checking' : 'app');
  React.useEffect(() => {
    if (!eligible) return undefined;
    let live = true;
    hasSavedSession().then((saved) => { if (live) setMode(saved ? 'app' : 'landing'); });
    return () => { live = false; };
  }, [eligible]);
  if (mode === 'checking') return <Loading />;
  return mode === 'landing' ? <LandingShell /> : <App />;
}

if (isAdminPath(window.location.pathname)) prepareAdminPage();
registerOfflinePage();
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        {legalPage ? <LegalPage page={legalPage} /> : seoPage ? <SeoPage page={seoPage} /> : (blogPost || blogIndex) ? <BlogPage post={blogPost} /> : earlyAccess ? <EarlyAccessPage /> : payPage ? <PayPage /> : planToken ? <PlanApprovalRoute token={planToken} /> : portalToken ? <PatientPortalRoute token={portalToken} /> : bookId ? <BookingPageRoute clinicId={bookId} /> : <Home />}
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);
