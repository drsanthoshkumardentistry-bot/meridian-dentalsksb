import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  signOut 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your verified web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC3VsF3Fodx3Rbp9ahqrz7qSbVvaY6Ukk0",
  authDomain: "meridian-dental.firebaseapp.com",
  projectId: "meridian-dental",
  storageBucket: "meridian-dental.firebasestorage.app",
  messagingSenderId: "7538853494",
  appId: "1:7538853494:web:e40c424cbe8d3113fa4157",
  measurementId: "G-KXCGERQMPH"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Export Authentication & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Forces the Google account chooser prompt every time
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Export Cloud Firestore Database & Storage
export const db = getFirestore(app);
export const storage = getStorage(app);

// Responsive Google login (Redirect on Mobile, Popup on Desktop)
export const loginWithGoogle = async () => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    return await signInWithRedirect(auth, googleProvider);
  } else {
    return await signInWithPopup(auth, googleProvider);
  }
};

export const logoutUser = () => signOut(auth);