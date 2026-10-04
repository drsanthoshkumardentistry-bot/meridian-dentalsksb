import { initializeApp } from "firebase/app";
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

const firebaseConfig = {
  apiKey: "AIzaSyC3VsF3Fodx3Rbp9ahqrz7qSbVvaY6Ukk0",
  authDomain: "meridian-dental.firebaseapp.com",
  projectId: "meridian-dental",
  storageBucket: "meridian-dental.firebasestorage.app",
  messagingSenderId: "7538853494",
  appId: "1:7538853494:web:e40c424cbe8d3113fa4157",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Google provider
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});

// --------------------------------------------------
// Set persistent authentication
// --------------------------------------------------

export const initializeAuthPersistence = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log("Firebase Auth persistence enabled");
  } catch (error) {
    console.error("Firebase Auth persistence error:", error);
  }
};

// --------------------------------------------------
// Google Login
// --------------------------------------------------

export const loginWithGoogle = async () => {
  // Make sure persistence is enabled before signing in
  await initializeAuthPersistence();

  try {
    // Try popup first
    const result = await signInWithPopup(auth, googleProvider);

    return result;
  } catch (err) {
    console.warn("Google popup login failed:", err.code);

    // On mobile browsers, popup may be blocked.
    // Use redirect as fallback.
    if (
      err.code === "auth/popup-blocked" ||
      err.code === "auth/operation-not-supported-in-this-environment" ||
      err.code === "auth/popup-closed-by-user"
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    throw err;
  }
};

// --------------------------------------------------
// Redirect result
// --------------------------------------------------

export { getRedirectResult };

// --------------------------------------------------
// Logout
// --------------------------------------------------

export const logoutUser = () => {
  return signOut(auth);
};