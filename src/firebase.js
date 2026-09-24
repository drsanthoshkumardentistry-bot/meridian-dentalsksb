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

const firebaseConfig = {
  apiKey: "AIzaSyC3VsF3fodx3Rbp9ahqrz7qSbVvay6UKk0",
  authDomain: "meridian-dental.firebaseapp.com",
  projectId: "meridian-dental",
  storageBucket: "meridian-dental.firebasestorage.app",
  messagingSenderId: "7538853494",
  appId: "1:7538853494:web:e40c424cbe8d3113fa4157",
  measurementId: "G-KXCGEMQMPH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const db = getFirestore(app);
export const storage = getStorage(app);

export const loginWithGoogle = async () => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    return await signInWithRedirect(auth, googleProvider);
  } else {
    return await signInWithPopup(auth, googleProvider);
  }
};

export const logoutUser = () => signOut(auth);