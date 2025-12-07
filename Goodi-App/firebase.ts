
import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
  Auth,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 立即初始化 App
const app = initializeApp(firebaseConfig);

// 將所有服務的實例先建立起來
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, "us-central1");
const googleProvider = new GoogleAuthProvider();

// ✅ 建立一個 Promise 來追蹤持久性設定的狀態
const authInitialized = setPersistence(auth, browserLocalPersistence);

// ✅ 匯出實例和初始化 Promise
export {
  app,
  auth,
  db,
  functions,
  googleProvider,
  authInitialized, // 匯出這個 Promise
};
