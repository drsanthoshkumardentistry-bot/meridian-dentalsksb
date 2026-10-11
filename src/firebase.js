import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if all essential keys are provided in .env
export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

let app = null;
let auth = null;
let db = null;
let storage = null;

if (firebaseConfigured) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // Enable offline data caching for chair-side clinic continuity
    if (typeof window !== "undefined") {
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === "failed-precondition") {
          // Multiple tabs open simultaneously, persistence can only be enabled in one tab at a time
          console.warn("Firestore offline persistence failed: Multiple tabs open.");
        } else if (err.code === "unimplemented") {
          // Current browser lacks IndexedDB storage support
          console.warn("Firestore offline persistence not supported by browser.");
        }
      });
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

/**
 * Initiates Google OAuth Sign-in.
 * Gracefully falls back to redirect mode if mobile browsers block popup dialogs.
 */
export async function loginWithGoogle() {
  if (!auth) {
    console.warn("Firebase credentials not detected. Operating in local demo mode.");
    return null;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    // Fallback if popup is blocked on mobile screens
    if (
      error.code === "auth/popup-blocked" ||
      error.code === "auth/popup-closed-by-user"
    ) {
      console.warn("Popup blocked or closed; falling back to redirect flow...");
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    console.error("Authentication error:", error);
    throw error;
  }
}

/**
 * Signs out current user session.
 */
export async function logoutUser() {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
}

export { app, auth, db, storage };