/* ==============================================================================
 * MERIDIAN DENTAL OS - FIREBASE MODULAR SDK ENGINE
 * Exports: auth, db (Cloud Firestore), storage (Cloud Storage)
 * File: src/firebase.js
 * ============================================================================== */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Replace these placeholders with your actual project keys from the Firebase Console:
// (Project Settings -> General -> Your apps -> Web app config)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "meridian-dental-os.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "meridian-dental-os",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "meridian-dental-os.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Singleton initialization to prevent multiple re-renders/hot-reloads from throwing errors
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;