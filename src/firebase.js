// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCtrnFWI1zRnZqu3Xq-orECkoeuOFDtlU",
  authDomain: "rbrd-db.firebaseapp.com",
  projectId: "rbrd-db",
  storageBucket: "rbrd-db.firebasestorage.app",
  messagingSenderId: "714490432536",
  appId: "1:714490432536:web:f4f326631bb225b382876d",
  measurementId: "G-BMSSL0YVFB",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Erro ao configurar persistência de login:", err);
});

let analytics = null;

isSupported()
  .then((ok) => {
    if (ok) {
      analytics = getAnalytics(app);
    }
  })
  .catch((err) => {
    console.warn("Analytics não suportado neste ambiente:", err);
  });

export { db, auth, analytics };
