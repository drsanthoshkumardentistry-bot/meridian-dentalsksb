import React from "react";

/** Plain-language reason why /admin could not open, so the founder can fix it without guessing. */
export const adminProblemText = (p = {}) => {
  const s = Number(p.status) || 0;
  if (s === 403) return "The server says this account is not on the founder list. In Cloudflare, check that the FOUNDER_EMAILS secret (Production) holds exactly this address, save it, and redeploy.";
  if (s === 404) return "The admin service was not found on the server. The latest version may still be deploying; wait two minutes and try again.";
  if (s === 401) return "Your sign-in was not accepted. Sign out, sign in again with Google, and retry. If it repeats, check that FIREBASE_API_KEY is set in Cloudflare.";
  if (s === 503) return "The server is missing a setting it needs for the admin screen. Add FIREBASE_SERVICE_ACCOUNT in Cloudflare secrets (Production) and redeploy.";
  if (s === 429) return "Too many tries. Wait a few minutes and try again.";
  if (s >= 500) return `The server could not read the numbers${p.message ? `: ${p.message}` : "."} Try again in a minute.`;
  return p.message ? `Could not reach the server: ${p.message}` : "Could not reach the server. Check your connection and retry.";
};

export default function AdminAccessProblem({ email = "", problem, onRetry, onHome }) {
  return (
    <main className="min-h-screen grid place-items-center bg-slate-900 px-4" data-testid="admin-problem">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="text-lg font-bold text-slate-900">Admin could not open</h1>
        <p className="mt-1 text-sm text-slate-600">Signed in as <strong>{email || "unknown"}</strong>{problem && problem.status ? ` · server answered ${problem.status}` : ""}</p>
        <p className="mt-3 text-sm text-slate-800" role="alert">{adminProblemText(problem)}</p>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onRetry} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white">Try again</button>
          <button type="button" onClick={onHome} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800">Go to home</button>
        </div>
      </div>
    </main>
  );
}
