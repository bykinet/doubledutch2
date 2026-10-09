import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase configuration supporting both environment variables and project defaults
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBzEJfR4QiHyIqZmmk6j5me-rGprNcDe6Y",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "doubledutch-6cd63.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "doubledutch-6cd63",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "doubledutch-6cd63.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "26435817778",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:26435817778:web:2ee2a80535879889a8472b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-BYL985SRF9",
};

// Initialize Firebase App singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize analytics safely if supported in browser environment
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics optional in offline/restricted environments
  });
}
