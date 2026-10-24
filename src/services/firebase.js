// src/services/firebase.js
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA4IaplFt7A2J-0etNQWSvWukJrAUNUU8I",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "teamcollab-9b857.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || "teamcollab-9b857",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "teamcollab-9b857.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "743720067076",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || "1:743720067076:web:c8bec9e21a3b70190fd551",
};

let auth = null;
let googleProvider = null;
let firestoreDb = null;

const hasConfig = firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined" && !firebaseConfig.apiKey.includes("MOCK");

if (hasConfig) {
  try {
    const app = getApps().length === 0
      ? initializeApp(firebaseConfig)
      : getApps()[0];
    auth = getAuth(app);
    firestoreDb = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
    console.log("✅ Firebase & Firestore initialized for project:", firebaseConfig.projectId);
  } catch (e) {
    console.warn("Firebase init failed — dev mode active:", e.message);
  }
} else {
  console.info("ℹ️  Firebase not configured — running in dev mode");
}

export {
  auth,
  firestoreDb,
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
};
