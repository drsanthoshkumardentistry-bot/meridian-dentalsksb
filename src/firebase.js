/* ==============================================================================
 * MERIDIAN DENTAL OS - FIREBASE CONFIGURATION & AUTH HELPERS
 * File: src/firebase.js
 * ============================================================================== */

import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyFakeKeyPlaceholder",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "meridian-dental-os.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "meridian-dental-os",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "meridian-dental-os.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef"
};

// Singleton initialization to prevent hot-reload duplicate instances
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Authentication helper exports expected by App.jsx
const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google login failed:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign-out failed:", error);
    throw error;
  }
};

// Export boolean flag expected by App.jsx
export const firebaseConfigured = true;

export default app;