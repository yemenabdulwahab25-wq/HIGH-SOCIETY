
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// --- ACTION REQUIRED: PASTE YOUR FIREBASE CONFIG HERE ---
// 1. Go to console.firebase.google.com
// 2. Create a new project
// 3. Add a Web App (</> icon)
// 4. Copy the config object below
const firebaseConfig = {
  apiKey: "API_KEY_HERE",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

// Initialize Firebase
// We wrap this in a try-catch to prevent app crash if config is missing
let app;
let db: any;
let auth: any;

try {
    if (firebaseConfig.apiKey !== "API_KEY_HERE") {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        console.log("🔥 Firebase Initialized Successfully");
    } else {
        console.warn("⚠️ Firebase Config missing in services/firebase.ts. App running in Offline Mode.");
    }
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}

export { db, auth };
