/* ==============================================================================
 * MERIDENT OS - FIREBASE CONFIGURATION & MULTI-TENANT AUTH
 * File: src/firebase.js
 * ============================================================================== */

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

// The app only talks to Firebase when the real project keys are present.
// Without them the UI shows a clear "not configured" message instead of failing silently.
export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

let app = null;
let authInstance = null;
let dbInstance = null;
let storageInstance = null;
let googleProvider = null;

if (firebaseConfigured) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  authInstance = getAuth(app);

  // Offline-first: reads and writes keep working without internet and sync later.
  try {
    dbInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch (error) {
    // Already initialized (hot reload) or unsupported browser: fall back to the default instance.
    dbInstance = getFirestore(app);
  }

  storageInstance = getStorage(app);

  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });
}

export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;

const requireAuth = () => {
  if (!authInstance) {
    throw new Error("Firebase is not configured. Add the VITE_FIREBASE_* environment variables.");
  }
  return authInstance;
};

// Inside the Android app Google blocks its web sign-in page, so the phone's own Google account picker is used
const isNativeApp = () => {
  try {
    return Boolean(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  } catch (error) {
    return false;
  }
};

const loginWithGoogleNative = async (activeAuth) => {
  const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
  const result = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true });
  const idToken = result && result.credential && result.credential.idToken;
  if (!idToken) throw new Error("Google sign-in did not return a token. Try again.");
  const credential = GoogleAuthProvider.credential(idToken);
  const signedIn = await signInWithCredential(activeAuth, credential);
  return signedIn.user;
};

export const loginWithGoogle = async () => {
  const activeAuth = requireAuth();
  if (isNativeApp()) return loginWithGoogleNative(activeAuth);
  try {
    const result = await signInWithPopup(activeAuth, googleProvider);
    return result.user;
  } catch (error) {
    // Some phone browsers block pop-ups: fall back to a full-page redirect
    if (error && (error.code === "auth/popup-blocked" || error.code === "auth/operation-not-supported-in-this-environment")) {
      await signInWithRedirect(activeAuth, googleProvider);
      return null;
    }
    throw error;
  }
};

// Call once on page load to finish a redirect-based Google sign-in
export const completeRedirectLogin = async () => {
  if (!authInstance) return null;
  const result = await getRedirectResult(authInstance);
  return result ? result.user : null;
};

export const signInWithEmail = async (email, password) => {
  const credential = await signInWithEmailAndPassword(requireAuth(), email, password);
  return credential.user;
};

export const signUpWithEmail = async (name, email, password) => {
  const credential = await createUserWithEmailAndPassword(requireAuth(), email, password);
  if (name) {
    try {
      await updateProfile(credential.user, { displayName: name });
    } catch (error) {
      // The account exists; the display name can be set later
    }
  }
  await sendEmailVerification(credential.user);
  return credential.user;
};

export const resendVerificationEmail = async () => {
  const user = requireAuth().currentUser;
  if (!user) throw new Error("Please sign in again.");
  await sendEmailVerification(user);
};

// Re-reads the account from Firebase and refreshes the token so security rules see the verified email
export const refreshVerifiedStatus = async () => {
  const user = requireAuth().currentUser;
  if (!user) return false;
  await user.reload();
  if (user.emailVerified) await user.getIdToken(true);
  return Boolean(user.emailVerified);
};

export const sendPasswordReset = async (email) => {
  await sendPasswordResetEmail(requireAuth(), email);
};

export const logoutUser = async () => {
  if (!authInstance) return;
  await signOut(authInstance);
};
