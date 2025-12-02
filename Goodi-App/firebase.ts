
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC7sv2rhv6SHAyDK4TXs5mpwa_cmMzka1M",
  authDomain: "goodi-5ec49.firebaseapp.com",
  databaseURL: "https://goodi-5ec49-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "goodi-5ec49",
  storageBucket: "goodi-5ec49.firebasestorage.app",
  messagingSenderId: "368247732471",
  appId: "1:368247732471:web:7880acfa0c59075cbf3bf2",
  measurementId: "G-H0TFMWY2JP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, db, googleProvider };
