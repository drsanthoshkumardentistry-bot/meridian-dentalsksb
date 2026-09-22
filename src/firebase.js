import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "meridian-dental.firebaseapp.com",
  projectId: "meridian-dental",
  storageBucket: "meridian-dental.firebasestorage.app",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID",
  measurementId: "PASTE_YOUR_MEASUREMENT_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logoutUser = () => signOut(auth);// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC3VsF3Fodx3Rbp9ahqrz7qSbVvaY6Ukk0",
  authDomain: "meridian-dental.firebaseapp.com",
  projectId: "meridian-dental",
  storageBucket: "meridian-dental.firebasestorage.app",
  messagingSenderId: "7538853494",
  appId: "1:7538853494:web:e40c424cbe8d3113fa4157",
  measurementId: "G-KXCGERQMPH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);