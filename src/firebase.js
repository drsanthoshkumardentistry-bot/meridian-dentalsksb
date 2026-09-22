import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC3VsF3fodx3Rbp9ahqrz7qSbVvay6UKk0",
  authDomain: "meridian-dental.firebaseapp.com",
  projectId: "meridian-dental",
  storageBucket: "meridian-dental.firebasestorage.app",
  messagingSenderId: "7538853494",
  appId: "1:7538853494:web:e40c424cbe8d3113fa4157",
  measurementId: "G-KXCGEMQMPH"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Export Authentication, Firestore DB, and Storage services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

// Authentication helper methods
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logoutUser = () => signOut(auth);