import React from "react";
import LandingPage from "./landingpage";

// The landing page for a visitor with no saved sign-in. It loads without the clinic app and Firebase;
// every sign-in control opens /login, which loads the app and shows the real sign-in form.
const toLogin = () => { window.location.assign("/login"); };

export default function LandingShell() {
  return <LandingPage onLoginClick={toLogin} onEmailSignIn={toLogin} onEmailSignUp={toLogin} onResetPassword={toLogin} toLogin={toLogin} firebaseConfigured />;
}
