import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { uploadImageToCloudinary } from './cloudinaryUpload';

const ensureFirebase = () => {
  if (!auth || !db) {
    throw new Error('Firebase is not initialized. Check environment configuration.');
  }
};

const getEntriesCollection = () => {
  ensureFirebase();
  return collection(db, 'journalEntries');
};

const ensureUser = () => {
  ensureFirebase();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to access journal data.');
  }
  return user;
};

const normalizeEntry = (snap) => {
  const data = snap.data();
  const createdAt = data.createdAt?.toDate?.() || null;
  const updatedAt = data.updatedAt?.toDate?.() || null;
  const normalizedDate = data.date?.toDate?.() || data.date || createdAt || null;
  return {
    _id: snap.id,
    id: snap.id,
    ...data,
    createdAt,
    updatedAt,
    date: normalizedDate
  };
};

const isMissingIndexError = (err) => {
  const code = err?.code || err?.name;
  const message = String(err?.message || '');
  return code === 'failed-precondition' && /requires an index|index/i.test(message);
};

export const uploadImage = async (file, options = {}) => {
  const folder = options.folder || 'journal-images';
  const onProgress = options.onProgress;
  return uploadImageToCloudinary(file, { folder, onProgress });
};

/**
 * Recursively remove undefined values from an object.
 * Firestore `updateDoc` throws if any field value is `undefined`.
 */
const removeUndefined = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefined);
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = removeUndefined(value);
    }
    return acc;
  }, {});
};

export const createEntry = async (entry) => {
  const user = ensureUser();
  const entriesCollection = getEntriesCollection();
  const payload = {
    ...entry,
    title: entry.title || '',
    content: entry.content || '',
    imageUrls: entry.imageUrls || [],
    youtubeEmbedUrl: entry.youtubeEmbedUrl || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ownerId: user.uid
  };
  return addDoc(entriesCollection, removeUndefined(payload));
};

export const updateEntry = async (id, updates) => {
  ensureUser();
  ensureFirebase();
  const refDoc = doc(db, 'journalEntries', id);
  const cleanUpdates = removeUndefined({
    ...updates,
    updatedAt: serverTimestamp()
  });
  return updateDoc(refDoc, cleanUpdates);
};

export const deleteEntry = async (id) => {
  ensureUser();
  ensureFirebase();
  const removeEntry = httpsCallable(getFunctions(auth.app), 'deleteJournalEntry');
  return removeEntry({ id });
};

export const getEntryById = async (id) => {
  ensureUser();
  ensureFirebase();
  const refDoc = doc(db, 'journalEntries', id);
  const snap = await getDoc(refDoc);
  if (!snap.exists()) return null;
  return normalizeEntry(snap);
};

export const getPublicEntryById = async (id) => {
  ensureFirebase();
  const refDoc = doc(db, 'journalEntries', id);
  const snap = await getDoc(refDoc);
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!data?.isPublished) return null;
  return normalizeEntry(snap);
};

export const getEntriesPage = async ({ pageSize = 5, lastDoc = null } = {}) => {
  const user = ensureUser();
  const entriesCollection = getEntriesCollection();
  try {
    const baseQuery = [where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'), limit(pageSize)];
    const q = lastDoc
      ? query(entriesCollection, ...baseQuery, startAfter(lastDoc))
      : query(entriesCollection, ...baseQuery);
    const snap = await getDocs(q);
    const entries = snap.docs.map(normalizeEntry);
    const nextLast = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
    return { entries, lastDoc: nextLast };
  } catch (err) {
    if (!isMissingIndexError(err)) throw err;

    const baseQuery = [where('ownerId', '==', user.uid), limit(pageSize)];
    const q = lastDoc
      ? query(entriesCollection, ...baseQuery, startAfter(lastDoc))
      : query(entriesCollection, ...baseQuery);
    const snap = await getDocs(q);
    const entries = snap.docs.map(normalizeEntry);
    const nextLast = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
    return { entries, lastDoc: nextLast };
  }
};

export const getAllEntries = async () => {
  const user = ensureUser();
  const entriesCollection = getEntriesCollection();
  const q = query(entriesCollection, where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(normalizeEntry);
};

export const getPublicEntriesPage = async ({ pageSize = 5, lastDoc = null } = {}) => {
  ensureFirebase();
  const entriesCollection = getEntriesCollection();
  try {
    const baseQuery = [where('isPublished', '==', true), orderBy('createdAt', 'desc'), limit(pageSize)];
    const q = lastDoc
      ? query(entriesCollection, ...baseQuery, startAfter(lastDoc))
      : query(entriesCollection, ...baseQuery);
    const snap = await getDocs(q);
    const entries = snap.docs.map(normalizeEntry);
    const nextLast = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
    return { entries, lastDoc: nextLast };
  } catch (err) {
    if (!isMissingIndexError(err)) throw err;

    const q = query(entriesCollection, where('isPublished', '==', true));
    const snap = await getDocs(q);
    const orderedDocs = [...snap.docs].sort((a, b) => {
      const aCreated = a.data().createdAt?.toMillis?.() || 0;
      const bCreated = b.data().createdAt?.toMillis?.() || 0;
      return bCreated - aCreated;
    });
    const cursorIndex = lastDoc ? orderedDocs.findIndex((entryDoc) => entryDoc.id === lastDoc.id) : -1;
    const pageDocs = orderedDocs.slice(cursorIndex + 1, cursorIndex + 1 + pageSize);
    const entries = pageDocs.map(normalizeEntry);
    const nextLast = pageDocs.length ? pageDocs[pageDocs.length - 1] : null;
    return { entries, lastDoc: nextLast };
  }
};
