import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const ensureFirebase = () => {
  if (!auth || !db) {
    throw new Error('Firebase is not initialized. Check environment configuration.');
  }
};

const getQuoteDocRef = () => {
  ensureFirebase();
  return doc(db, 'settings', 'quote');
};

const ensureUser = () => {
  ensureFirebase();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to access quote data.');
  }
  return user;
};

export const getQuote = async () => {
  ensureUser();
  const quoteDocRef = getQuoteDocRef();
  const snap = await getDoc(quoteDocRef);
  if (!snap.exists()) {
    return null;
  }
  return snap.data();
};

export const getPublicQuote = async () => {
  ensureFirebase();
  const quoteDocRef = getQuoteDocRef();
  const snap = await getDoc(quoteDocRef);
  if (!snap.exists()) {
    return null;
  }
  return snap.data();
};

export const saveQuote = async (quote) => {
  const user = ensureUser();
  const quoteDocRef = getQuoteDocRef();
  const payload = {
    text: quote.text || '',
    author: quote.author || '',
    imageUrl: quote.imageUrl || '',
    useImageCover: Boolean(quote.useImageCover),
    fontSize: Number(quote.fontSize) || 18,
    ownerId: user.uid,
    updatedAt: serverTimestamp()
  };
  return setDoc(quoteDocRef, payload, { merge: true });
};
