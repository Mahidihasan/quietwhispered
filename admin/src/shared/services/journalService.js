import {
  addDoc,
  collection,
  deleteDoc,
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
import { resolvePostDate } from '../utils/dateUtils';

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
  const normalizedDate = data.date?.toDate?.() || data.date || null;
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

  const entryRef = doc(db, 'journalEntries', id);
  const snapshot = await getDoc(entryRef);
  if (!snapshot.exists()) return { deleted: true };

  const entry = snapshot.data();
  const content = String(entry.content || '');
  const contentUrls = [...content.matchAll(/https?:\/\/[^\s)\]"']+/g)].map(([url]) => url.replace(/[.,;]+$/, ''));
  const mediaUrls = [
    ...(Array.isArray(entry.imageUrls) ? entry.imageUrls : []),
    entry.media,
    entry.coverImage,
    ...contentUrls
  ];
  const hasCloudinaryImages = mediaUrls.some((value) => {
    if (typeof value !== 'string') return false;
    try {
      return new URL(value).hostname.endsWith('cloudinary.com');
    } catch {
      return false;
    }
  });

  // Firestore rules already authorize the admin to delete their own text-only
  // entries. Keep Cloudinary asset deletion on the trusted server function.
  if (!hasCloudinaryImages) {
    await deleteDoc(entryRef);
    return { deleted: true, imagesDeleted: 0 };
  }

  const removeEntry = httpsCallable(getFunctions(auth.app), 'deleteJournalEntry');
  try {
    return await removeEntry({ id });
  } catch (error) {
    if (error?.code === 'functions/not-found') {
      throw new Error('The image delete service is not deployed. Deploy the Firebase deleteJournalEntry function and try again.');
    }
    throw error;
  }
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
  if (!data?.isPublished && data?.privacy !== 'link') return null;
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
  const q = query(entriesCollection, where('ownerId', '==', user.uid));
  const snap = await getDocs(q);
  return snap.docs.map(normalizeEntry).sort((a, b) => {
    const aDate = resolvePostDate(a)?.getTime() || 0;
    const bDate = resolvePostDate(b)?.getTime() || 0;
    return bDate - aDate;
  });
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
