// firebase.ts
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
  Auth,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
};

// 避免 HMR / 多次初始化
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const functions: Functions = getFunctions(app, "us-central1");
export const googleProvider = new GoogleAuthProvider();

// 初始化 Analytics（僅在瀏覽器環境中）
let analytics: Analytics | undefined;
let crashlytics: any | undefined;

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });

  // 初始化 Crashlytics (Note: Web SDK uses Performance Monitoring, mobile uses Crashlytics)
  // For web, we'll use console logging and Analytics
  // Real Crashlytics is Android/iOS only
  crashlytics = {
    recordError: (error: Error) => {
      console.error('[Crashlytics Mock]', error);
      // In production you'd send to a real error tracking service
      if (analytics) {
        // Log to Analytics as custom event
        try {
          import('firebase/analytics').then(({ logEvent }) => {
            logEvent(analytics!, 'exception', {
              description: error.message,
              fatal: false
            });
          });
        } catch (e) {
          console.error('Failed to log error to Analytics:', e);
        }
      }
    },
    log: (message: string) => {
      console.log('[Crashlytics Log]', message);
    }
  };
}

// ✅ 建立一個 Promise 來追蹤持久性設定的狀態
export const authInitialized = setPersistence(auth, browserLocalPersistence);

export { analytics, crashlytics };
