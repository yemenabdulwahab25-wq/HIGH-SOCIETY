
import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAhwvFKncrFgmz_8Dw7XZRRVYhroSfWsv8",
  authDomain: "gen-lang-client-0875698677.firebaseapp.com",
  projectId: "gen-lang-client-0875698677",
  storageBucket: "gen-lang-client-0875698677.firebasestorage.app",
  messagingSenderId: "508868289480",
  appId: "1:508868289480:web:9c5b8fdfbdaf82bc45d6fd",
  measurementId: "G-B66KMX8C62"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally
let analytics: any = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch((e) => {
  console.warn("Analytics not supported:", e);
});

// Exports for app usage
const db = getFirestore(app);
const auth = getAuth(app);

console.log("🔥 Firebase Initialized");

export { db, auth, analytics };
