<<<<<<< HEAD
import { initializeApp } from "firebase/app";

=======
import { initializeApp, getApps, getApp } from "firebase/app";
>>>>>>> ddd8c94 (Fix App.jsx syntax errors and improve state handling)
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  signOut,
} from "firebase/auth";

import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

<<<<<<< HEAD
const firebaseConfig = {
=======
const rawConfig = {
>>>>>>> ddd8c94 (Fix App.jsx syntax errors and improve state handling)
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

<<<<<<< HEAD
// Check if credentials are present in Vite env variables
export const firebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID
);

const app = initializeApp(firebaseConfig);
=======
export const firebaseConfigured = Boolean(
  rawConfig.apiKey &&
  rawConfig.projectId &&
  rawConfig.apiKey !== "undefined" &&
  rawConfig.projectId !== "undefined"
);
>>>>>>> ddd8c94 (Fix App.jsx syntax errors and improve state handling)

let app = null;
let authInstance = null;
let dbInstance = null;
let storageInstance = null;

if (firebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(rawConfig);
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
    storageInstance = getStorage(app);
  } catch (err) {
    console.error("Firebase initialization failed:", err);
  }
}

export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export const initializeAuthPersistence = async () => {
  if (!auth) return;
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    console.error("Firebase Auth persistence error:", error);
    throw error;
    console.error("Firebase persistence error:", error);(Fix App.jsx syntax errors and improve state handling)
  }
};

export const loginWithGoogle = async () => {
<<<<<<< HEAD
=======
  if (!auth) throw new Error("Firebase Auth not initialized. Check your environment variables.");
>>>>>>> ddd8c94 (Fix App.jsx syntax errors and improve state handling)
  await initializeAuthPersistence();
  try {
<<<<<<< HEAD
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (err) {
    console.warn("Google popup login failed:", err?.code);

=======
    return await signInWithPopup(auth, googleProvider);
  } catch (err) {
>>>>>>> ddd8c94 (Fix App.jsx syntax errors and improve state handling)
    if (
      err?.code === "auth/popup-blocked" ||
      err?.code === "auth/operation-not-supported-in-this-environment"
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
};

<<<<<<< HEAD
export const getGoogleRedirectResult = () => {
  return getRedirectResult(auth);
};

=======
>>>>>>> ddd8c94 (Fix App.jsx syntax errors and improve state handling)
export const logoutUser = () => {
  if (!auth) return Promise.resolve();
  return signOut(auth);
};