
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase Configuration
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
const db = getFirestore(app);
const auth = getAuth(app);

console.log("🔥 Firebase Initialized");

export { db, auth };
