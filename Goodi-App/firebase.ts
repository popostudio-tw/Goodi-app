<<<<<<< HEAD

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
import { getAnalytics, Analytics } from "firebase/analytics";
=======
// firebase.ts
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
// ✅ 先不要初始化 Analytics（它會觸發 Installations / webConfig 呼叫，
//    你目前環境變数不完整时会直接炸；先把登入跑稳再说）
// import { getAnalytics, isSupported } from "firebase/analytics";
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade

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
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

<<<<<<< HEAD
// 初始化 Analytics（僅在瀏覽器環境中）
let analytics: Analytics | undefined;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// ✅ 建立一個 Promise 來追蹤持久性設定的狀態
const authInitialized = setPersistence(auth, browserLocalPersistence);

// ✅ 匯出實例和初始化 Promise
export {
  app,
  auth,
  db,
  functions,
  googleProvider,
  analytics,
  authInitialized, // 匯出這個 Promise
};
=======
// 你 Functions 在 us-central1（你截图也显示 generateGrowthReport(us-central1)）
export const functions = getFunctions(app, "us-central1");

// 让 index.tsx 可以等 Auth 初始化后再 render（你现在已在用 authInitialized）
export const authInitialized = new Promise<void>((resolve) => {
  const unsub = auth.onAuthStateChanged(() => {
    unsub();
    resolve();
  });
});

// 如果你未来真的要 analytics：等你确认 env 都正确、页面稳定后再打开
// (async () => {
//   if (await isSupported()) {
//     getAnalytics(app);
//   }
// })();
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade
