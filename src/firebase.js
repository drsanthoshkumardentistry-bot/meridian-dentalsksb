/* ==============================================================================
 * MERIDENT OS - FIREBASE CONFIGURATION & MULTI-TENANT AUTH
 * File: src/firebase.js
 * ============================================================================== */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
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

export const loginWithGoogle = async () => {
  if (!authInstance || !googleProvider) {
    throw new Error("Firebase is not configured. Add the VITE_FIREBASE_* environment variables.");
  }
  const result = await signInWithPopup(authInstance, googleProvider);
  return result.user;
};

export const logoutUser = async () => {
  if (!authInstance) return;
  await signOut(authInstance);
};
