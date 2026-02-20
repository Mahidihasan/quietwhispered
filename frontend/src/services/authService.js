import {
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase';

let persistenceInit = null;

const ensurePersistence = async () => {
  if (!auth) return;
  if (persistenceInit) return persistenceInit;

  persistenceInit = (async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (err) {
      try {
        await setPersistence(auth, browserSessionPersistence);
      } catch (err2) {
        try {
          await setPersistence(auth, inMemoryPersistence);
        } catch (err3) {
          // Persistence can fail in some browsers / privacy modes; auth still works for the session.
        }
      }
    }
  })();

  return persistenceInit;
};

export const signInWithEmail = async (email, password) => {
  if (!auth) {
    return Promise.reject(new Error('Firebase auth is not initialized. Check environment configuration.'));
  }
  await ensurePersistence();
  return signInWithEmailAndPassword(auth, email, password);
};

export const signOutUser = () => {
  if (!auth) {
    return Promise.reject(new Error('Firebase auth is not initialized. Check environment configuration.'));
  }
  return signOut(auth);
};

export const subscribeToAuth = (callback) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  ensurePersistence();
  return onAuthStateChanged(auth, callback);
};
