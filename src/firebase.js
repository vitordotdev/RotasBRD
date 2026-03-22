// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // Para o Cloud Firestore
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

export { db, analytics };
