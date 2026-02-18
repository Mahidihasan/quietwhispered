import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';

export const signInWithEmail = (email, password) => {
  if (!auth) {
    return Promise.reject(new Error('Firebase auth is not initialized. Check environment configuration.'));
  }
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
  return onAuthStateChanged(auth, callback);
};
