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

export const EXPECTED_FIREBASE_PROJECT_ID = "teamcollab-9b857";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA4IaplFt7A2J-0etNQWSvWukJrAUNUU8I",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "teamcollab-9b857.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || EXPECTED_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "teamcollab-9b857.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "743720067076",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || "1:743720067076:web:c8bec9e21a3b70190fd551",
};

let auth = null;
let googleProvider = null;
let firestoreDb = null;

const hasConfig = firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined" && !firebaseConfig.apiKey.includes("MOCK") && firebaseConfig.projectId === EXPECTED_FIREBASE_PROJECT_ID;

if (hasConfig) {
  try {
    const app = getApps().length === 0
      ? initializeApp(firebaseConfig)
      : getApps()[0];
    if (app.options.projectId !== EXPECTED_FIREBASE_PROJECT_ID) {
      throw new Error("Firebase app project does not match TeamX configuration");
    }
    auth = getAuth(app);
    firestoreDb = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
    console.log("✅ Firebase & Firestore initialized for project:", firebaseConfig.projectId);
  } catch (e) {
    console.warn("Firebase init failed — dev mode active:", e.message);
  }
} else {
  console.warn("Firebase authentication unavailable: missing client config or unexpected project ID");
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
