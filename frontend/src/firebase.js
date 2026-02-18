import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const requiredKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId'
];

let app = null;
let auth = null;
let db = null;
let firebaseInitError = null;

const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key]);
if (missingKeys.length) {
  firebaseInitError = new Error(
    `Firebase config is missing: ${missingKeys.join(', ')}. ` +
      'Set the REACT_APP_FIREBASE_* environment variables.'
  );
} else {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    firebaseInitError = err;
  }
}

if (app && firebaseConfig.measurementId && typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  });
}

if (firebaseInitError) {
  console.error('Firebase initialization failed:', firebaseInitError);
}

export { app, auth, db, firebaseInitError };
export const isFirebaseReady = Boolean(app && auth && db);
