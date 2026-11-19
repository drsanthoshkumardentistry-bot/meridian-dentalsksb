import React from "react";
import { ShieldCheck } from "lucide-react";

export const signInMethod = (user) => {
  const ids = ((user && user.providerData) || []).map((p) => p && p.providerId);
  if (ids.includes("google.com")) return "google";
  if (ids.includes("password")) return "password";
  return "other";
};

// Owner-only. Real two-step sign-in needs Google's paid Identity Platform, so until then owners get it free through their Google account.
export default function AccountProtection({ user }) {
  const m = signInMethod(user);
  return (
    <section aria-label="Account protection" className="rounded-xl border border-rule bg-white p-4 text-sm space-y-2 text-slate-700">
      <h3 className="font-semibold flex items-center gap-2 text-slate-900"><ShieldCheck size={16} aria-hidden="true" /> Protect your clinic account</h3>
      {m === "google" ? (
        <p>You sign in with Google. Turn on <strong>2-Step Verification</strong> in your Google account (myaccount.google.com → Security) so a stolen password is not enough to open your patients' records.</p>
      ) : (
        <p>You sign in with an email and password. For stronger protection, sign out and use <strong>Continue with Google</strong> with the same email, then turn on 2-Step Verification in your Google account. Use a long, unique password until then.</p>
      )}
      <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
        <li>Set a PIN lock for this device in Settings, so a borrowed phone cannot open the app.</li>
        <li>Never share your login. Add staff from Team logins so every action is recorded under their own name.</li>
        <li>Download a full backup when the bell reminds you, and keep it somewhere safe.</li>
      </ul>
    </section>
  );
}
